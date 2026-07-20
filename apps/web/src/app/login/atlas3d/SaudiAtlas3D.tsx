"use client";
// SAQEEL login atlas — raw three.js (no react-three-fiber). r3f's reconciler
// would not mount children in this Next 15 / React 19 stack, so the scene is
// built imperatively: guaranteed to render. Stage 1: desert terrain from the
// real KSA outline, 13 region tints from DS status tokens, day/night lighting,
// atmospheric fog (no ocean), free orbit. All colours read from live CSS tokens
// (theme-aware, no hardcoded values).
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  loadOutline, REGIONS, FACILITIES, ROUTES, project, nearestRegionIndex,
  type StatusRole, type GeoPoint,
} from "./ksa-atlas-geometry";

const STATUS_VAR: Record<StatusRole, string> = {
  compliant: "--status-compliant", warning: "--status-warning",
  critical: "--status-critical", info: "--status-info",
  pending: "--status-pending", major: "--status-major",
  onhold: "--status-onhold", completed: "--status-completed",
  draft: "--status-draft", disabled: "--status-disabled",
};

function color(name: string, fallback: string): THREE.Color {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try { return new THREE.Color(v || fallback); } catch { return new THREE.Color(fallback); }
}

// Story stage → where the camera settles (geo focus + orbit radius). The
// lifecycle rail (Map → Dispatch → Arrival → Inspection → Zones) flies the
// atlas to the relevant place.
const STAGE_FOCUS: Record<string, { lat: number; lng: number; r: number }> = {
  plan: { lat: 23.9, lng: 45.0, r: 17 },
  travel: { lat: 25.6, lng: 47.9, r: 13 },
  arrive: { lat: 27.0, lng: 49.6, r: 9.5 },
  inspect: { lat: 27.0, lng: 49.6, r: 8 },
  review: { lat: 27.3, lng: 41.7, r: 12 },
  decide: { lat: 23.9, lng: 45.0, r: 16 },
};

export default function SaudiAtlas3D({ onInteractingChange, locale = "ar", activeStage }: {
  locale?: "ar" | "en";
  onInteractingChange?: (on: boolean) => void;
  activeStage?: string;
  dossierStrings?: unknown;
  onFail?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<{ p: [number, number, number]; r: number }>({ p: [0, 0, 0], r: 16 });

  useEffect(() => { onInteractingChange?.(false); }, [onInteractingChange]);

  // Stage change → new camera focus (the loop eases toward it).
  useEffect(() => {
    const s = (activeStage && STAGE_FOCUS[activeStage]) || STAGE_FOCUS.plan;
    const [px, pz] = project({ lat: s.lat, lng: s.lng });
    focusRef.current = { p: [px, 0, -pz], r: s.r };
  }, [activeStage]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const dark = () => document.documentElement.getAttribute("data-theme") === "dark";

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 1, mount.clientHeight || 1);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40, (mount.clientWidth || 1) / (mount.clientHeight || 1), 0.1, 200);
    camera.position.set(0, 11, 13);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 7;
    controls.maxDistance = 26;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);

    // Lights (rebuilt on theme change)
    const ambient = new THREE.AmbientLight();
    const hemi = new THREE.HemisphereLight();
    const sun = new THREE.DirectionalLight();
    sun.position.set(6, 13, 5);
    scene.add(ambient, hemi, sun);

    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // World-space overlay (facilities, routes, vehicles, labels) — rebuilt on
    // theme change for colours. Geo → world: X = px, Z = -pz (project gives
    // [px, pz]; terrain is the same shape rotated flat), Y = raised height.
    const overlayGroup = new THREE.Group();
    scene.add(overlayGroup);
    const worldPos = (p: GeoPoint, y: number) => {
      const [px, pz] = project(p);
      return new THREE.Vector3(px, y, -pz);
    };
    type Vehicle = { mesh: THREE.Object3D; curve: THREE.CatmullRomCurve3; speed: number; offset: number };
    let vehicles: Vehicle[] = [];

    const labelsGroup = new THREE.Group();
    scene.add(labelsGroup);

    // Billboarded text label from a canvas texture (region names). Colour comes
    // from the DS text token so it reads in both themes.
    function makeLabel(text: string, ink: THREE.Color): THREE.Sprite {
      const dpr = 2, fs = 26 * dpr, pad = 10 * dpr;
      const cv = document.createElement("canvas");
      let ctx = cv.getContext("2d")!;
      ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
      const w = ctx.measureText(text).width;
      cv.width = Math.ceil(w + pad * 2);
      cv.height = Math.ceil(fs + pad * 2);
      ctx = cv.getContext("2d")!;
      ctx.font = `600 ${fs}px system-ui, -apple-system, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.direction = locale === "ar" ? "rtl" : "ltr";
      ctx.fillStyle = "#" + ink.getHexString();
      ctx.fillText(text, cv.width / 2, cv.height / 2);
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
      const scale = 0.0055;
      sp.scale.set(cv.width * scale, cv.height * scale, 1);
      return sp;
    }

    // Build / rebuild palette-dependent look. Called on mount + theme flip.
    let outline: [number, number][] | null = null;
    function applyTheme() {
      const d = dark();
      const canvas = color("--surface-canvas", d ? "#17191d" : "#f4f3f0");
      const sand = color(d ? "--neutral-700" : "--neutral-300", d ? "#4c5258" : "#dcdad4");
      const sandEdge = color(d ? "--neutral-800" : "--neutral-500", d ? "#2c3136" : "#a4aab0");
      const status: Record<StatusRole, THREE.Color> = {} as Record<StatusRole, THREE.Color>;
      (Object.keys(STATUS_VAR) as StatusRole[]).forEach(k => { status[k] = color(STATUS_VAR[k], "#5b6472"); });

      scene.background = canvas;
      scene.fog = new THREE.Fog(canvas.getHex(), 16, 42);
      ambient.color = canvas.clone(); ambient.intensity = d ? 1.1 : 1.6;
      hemi.color = canvas.clone(); hemi.groundColor = sandEdge.clone(); hemi.intensity = d ? 0.5 : 0.9;
      sun.color = new THREE.Color(d ? "#cfe0ff" : "#fff3dc"); sun.intensity = d ? 1.1 : 1.7;

      // Rebuild terrain with new vertex tints.
      terrainGroup.clear();
      if (!outline || outline.length < 4) return;
      const shape = new THREE.Shape();
      shape.moveTo(outline[0][0], outline[0][1]);
      for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
      shape.closePath();

      const top = new THREE.ShapeGeometry(shape, 24);
      const pos = top.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const region = REGIONS[nearestRegionIndex(x, y)];
        tmp.copy(sand).lerp(status[region.status], 0.5);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
        // Subtle deterministic dune relief (local z → world Y after rotation).
        pos.setZ(i, 0.05 * Math.sin(x * 1.5) * Math.cos(y * 1.7) + 0.03 * Math.sin((x + y) * 0.8));
      }
      pos.needsUpdate = true;
      top.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      top.computeVertexNormals();
      const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });

      const g = new THREE.Group();
      g.rotation.x = -Math.PI / 2;
      const slabMesh = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ color: sandEdge, roughness: 1 }));
      slabMesh.position.z = -0.3;
      const topMesh = new THREE.Mesh(top, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
      topMesh.position.z = 0.002;
      g.add(slabMesh, topMesh);
      terrainGroup.add(g);

      // ── overlay: facilities, routes+vehicles, region markers ──────────────
      overlayGroup.clear();
      vehicles = [];
      const emissive = (c: THREE.Color, k: number) =>
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1,
          emissive: c.clone().multiplyScalar(d ? k : 0), emissiveIntensity: d ? 1 : 0 });

      // Facilities — small low-poly industrial clusters, status-coloured, on a
      // sand pad so they read as built structures, never as terrain.
      const tankGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.26, 12);
      const stackGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
      const padGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.05, 18);
      const padMat = new THREE.MeshStandardMaterial({ color: sandEdge, roughness: 1 });
      for (const f of FACILITIES) {
        const st = status[f.status];
        const cluster = new THREE.Group();
        cluster.position.copy(worldPos(f.at, 0.1));
        const pad = new THREE.Mesh(padGeo, padMat); cluster.add(pad);
        const t1 = new THREE.Mesh(tankGeo, emissive(st, 0.35)); t1.position.set(-0.13, 0.16, 0.05); cluster.add(t1);
        const t2 = new THREE.Mesh(tankGeo, emissive(st, 0.35)); t2.position.set(0.10, 0.16, -0.08); t2.scale.y = 0.8; cluster.add(t2);
        const stack = new THREE.Mesh(stackGeo, emissive(st, 0.5)); stack.position.set(0.02, 0.28, 0.12); cluster.add(stack);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10),
          new THREE.MeshStandardMaterial({ color: st, emissive: st, emissiveIntensity: d ? 1.4 : 0.5 }));
        tip.position.set(0.02, 0.55, 0.12); cluster.add(tip);
        overlayGroup.add(cluster);
      }

      // Region markers + name labels — the 13 zones read as distinct places.
      labelsGroup.clear();
      const labelInk = color("--text-primary", d ? "#f5f6f7" : "#1a1d1f");
      for (const r of REGIONS) {
        const c = status[r.status];
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10),
          new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: d ? 1.1 : 0.35 }));
        dot.position.copy(worldPos(r.capital, 0.14));
        overlayGroup.add(dot);
        const label = makeLabel(r[locale], labelInk);
        label.position.copy(worldPos(r.capital, 0.5));
        labelsGroup.add(label);
      }

      // Winding routes (Catmull-Rom) + a vehicle gliding along each.
      for (const route of ROUTES) {
        const curve = new THREE.CatmullRomCurve3(route.points.map(p => worldPos(p, 0.16)), false, "catmullrom", 0.5);
        const col = status[route.status];
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 90, 0.028, 6, false),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.6,
            emissive: col.clone().multiplyScalar(d ? 0.5 : 0), transparent: true, opacity: 0.85 }));
        overlayGroup.add(tube);
        // Vehicle: a cone nested in a carrier so lookAt() aims the tip along
        // the direction of travel.
        const carrier = new THREE.Group();
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 8),
          new THREE.MeshStandardMaterial({ color: canvas, emissive: col, emissiveIntensity: d ? 0.9 : 0.3, roughness: 0.4 }));
        cone.rotation.x = -Math.PI / 2; // tip → carrier -Z (forward)
        carrier.add(cone);
        overlayGroup.add(carrier);
        vehicles.push({ mesh: carrier, curve, speed: 0.045 + route.points.length * 0.002, offset: ROUTES.indexOf(route) * 0.33 });
      }
    }

    // Load the outline, then build.
    loadOutline().then(o => { if (disposed) return; outline = o; applyTheme(); frameCamera(); }).catch(() => {});
    applyTheme();

    // Frame the camera on the terrain bounds so it always fills nicely.
    function frameCamera() {
      const box = new THREE.Box3().setFromObject(terrainGroup);
      if (box.isEmpty()) return;
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      const radius = Math.max(size.x, size.z) * 0.62;
      const dist = radius / Math.tan((camera.fov * Math.PI) / 360);
      controls.target.copy(center);
      camera.position.set(center.x, center.y + dist * 0.7, center.z + dist * 0.8);
      camera.updateProjectionMatrix();
    }

    // Resize
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // Theme observer
    const mo = new MutationObserver(() => applyTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Subtle idle auto-rotate; pauses while the user is dragging.
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    let raf = 0;
    const start = performance.now();
    const fwd = new THREE.Vector3();
    const focusTarget = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      for (const v of vehicles) {
        const u = (t * v.speed + v.offset) % 1;
        v.mesh.position.copy(v.curve.getPointAt(u));
        v.curve.getTangentAt(u, fwd);
        v.mesh.lookAt(fwd.add(v.mesh.position));
      }
      // Ease camera toward the active stage's focus (target + orbit radius).
      const f = focusRef.current;
      focusTarget.set(f.p[0], f.p[1], f.p[2]);
      controls.target.lerp(focusTarget, 0.035);
      offset.copy(camera.position).sub(controls.target);
      const r = offset.length();
      offset.setLength(r + (f.r - r) * 0.035);
      camera.position.copy(controls.target).add(offset);

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); mo.disconnect(); controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="lg-atlas3d-canvas" style={{ position: "absolute", inset: 0 }} />;
}
