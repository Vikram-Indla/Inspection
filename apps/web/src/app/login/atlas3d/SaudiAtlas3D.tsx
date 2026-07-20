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
  loadOutline, REGIONS, nearestRegionIndex, type StatusRole,
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

export default function SaudiAtlas3D({ onInteractingChange }: {
  locale?: "ar" | "en";
  onInteractingChange?: (on: boolean) => void;
  activeStage?: string;
  dossierStrings?: unknown;
  onFail?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => { onInteractingChange?.(false); }, [onInteractingChange]);

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

      const top = new THREE.ShapeGeometry(shape, 20);
      const pos = top.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const region = REGIONS[nearestRegionIndex(pos.getX(i), pos.getY(i))];
        tmp.copy(sand).lerp(status[region.status], 0.4);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
      }
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

    let raf = 0;
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
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
