"use client";
// SAQEEL login atlas — real 3D scene (stage 1: desert terrain + 13 regions +
// day/night lighting + free orbit). Renders on the deterministic geometry in
// ksa-atlas-geometry.ts. All colours are read from the live DS CSS tokens at
// runtime (GLOBAL COLOR LAW) so the scene is theme-aware and never hardcodes a
// value. Dark mode is composed (dim ambient + low sun), not neon — per the DS
// DARK_MODE_SPECIFICATION. Desert, not ocean: the background is the DS canvas
// with atmospheric fog; there is no water plane.
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
// three's built-in controls addon — far lighter to compile than @react-three/drei
// (drei's dependency graph OOM-crashes next dev). No drei anywhere in the scene.
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import {
  loadOutline, REGIONS, nearestRegionIndex, type StatusRole,
} from "./ksa-atlas-geometry";

// DS status role → CSS custom property (base tone). Resolved from the live
// stylesheet so light/dark values come straight from tokens.
const STATUS_VAR: Record<StatusRole, string> = {
  compliant: "--status-compliant", warning: "--status-warning",
  critical: "--status-critical", info: "--status-info",
  pending: "--status-pending", major: "--status-major",
  onhold: "--status-onhold", completed: "--status-completed",
  draft: "--status-draft", disabled: "--status-disabled",
};

type Palette = {
  dark: boolean;
  canvas: THREE.Color;      // scene background / fog (DS canvas)
  sand: THREE.Color;        // terrain base
  sandEdge: THREE.Color;    // slab sidewall
  status: Record<StatusRole, THREE.Color>;
};

function readColor(name: string, fallback: string): THREE.Color {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try { return new THREE.Color(v || fallback); } catch { return new THREE.Color(fallback); }
}

function readPalette(): Palette {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const status = {} as Record<StatusRole, THREE.Color>;
  (Object.keys(STATUS_VAR) as StatusRole[]).forEach(k => {
    status[k] = readColor(STATUS_VAR[k], "#5b6472");
  });
  return {
    dark,
    canvas: readColor("--surface-canvas", dark ? "#17191d" : "#f4f3f0"),
    // Warm sand from the neutral ramp; distinct in each theme.
    sand: readColor(dark ? "--neutral-700" : "--neutral-300", dark ? "#4c5258" : "#dcdad4"),
    sandEdge: readColor(dark ? "--neutral-800" : "--neutral-500", dark ? "#2c3136" : "#a4aab0"),
    status,
  };
}

// Build the terrain from the outline ring (local coords x = px, y = pz). Top
// surface is vertex-tinted by nearest region (soft zone tiling); a thin dark
// slab underneath gives it physical depth. Returns geometries + the shape.
function useTerrain(outline: [number, number][] | null, palette: Palette) {
  return useMemo(() => {
    if (!outline || outline.length < 4) return null;
    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
    shape.closePath();

    // Top surface — flat, densely tessellated so region tints read smoothly.
    const top = new THREE.ShapeGeometry(shape, 24);
    const pos = top.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const region = REGIONS[nearestRegionIndex(x, y)];
      // Region tint = status tone gently mixed into sand → coloured but not
      // garish; the sand still reads as desert.
      tmp.copy(palette.sand).lerp(palette.status[region.status], 0.34);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    top.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    top.computeVertexNormals();

    // Depth slab — extrude the same shape a little; solid sand-edge tone.
    const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: false });

    return { top, slab };
  }, [outline, palette]);
}

function Scene({ palette }: { palette: Palette }) {
  const { scene } = useThree();
  const [outline, setOutline] = useState<[number, number][] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    loadOutline(ac.signal).then(setOutline).catch(() => {});
    return () => ac.abort();
  }, []);

  useEffect(() => {
    scene.background = palette.canvas;
    scene.fog = new THREE.Fog(palette.canvas.getHex(), 14, 34);
  }, [scene, palette]);

  const terrain = useTerrain(outline, palette);

  return (
    <>
      {/* Day = warm high sun + soft sky fill. Night = dim cool ambient + low
          sun; composed darkness, no glow. */}
      <ambientLight intensity={palette.dark ? 0.55 : 0.95} />
      <hemisphereLight intensity={palette.dark ? 0.25 : 0.55}
        color={palette.canvas} groundColor={palette.sandEdge} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={palette.dark ? 0.75 : 1.25}
        color={palette.dark ? "#cfe3ff" : "#fff4e0"}
        castShadow />

      {terrain && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* slab sits below the top surface for thickness */}
          <mesh geometry={terrain.slab} position={[0, 0, -0.28]}>
            <meshStandardMaterial color={palette.sandEdge} roughness={1} metalness={0} />
          </mesh>
          <mesh geometry={terrain.top} position={[0, 0, 0.001]}>
            <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
          </mesh>
        </group>
      )}

      <Controls />
    </>
  );
}

// Free-orbit camera (rotate any direction, zoom) via the three addon.
function Controls() {
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enablePan = false;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 6;
    c.maxDistance = 22;
    c.minPolarAngle = 0.15;
    c.maxPolarAngle = Math.PI / 2.15;
    c.target.set(0, 0, 0);
    ref.current = c;
    return () => c.dispose();
  }, [camera, gl]);
  useFrame(() => ref.current?.update());
  return null;
}

export default function SaudiAtlas3D({ onInteractingChange }: {
  locale?: "ar" | "en";
  onInteractingChange?: (on: boolean) => void;
  // Accepted for interface parity with the raster atlas; wired in later stages.
  activeStage?: string;
  dossierStrings?: unknown;
  onFail?: () => void;
}) {
  const [palette, setPalette] = useState<Palette | null>(null);

  // Resolve tokens on mount and whenever the theme flips (no reload).
  useEffect(() => {
    const sync = () => setPalette(readPalette());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // The atlas is decorative for stage 1 — keep the credential motion loop free.
  useEffect(() => { onInteractingChange?.(false); }, [onInteractingChange]);

  if (!palette) return null;
  return (
    <div className="lg-atlas3d-canvas" style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: [0, 10, 11], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}>
        <Scene palette={palette} />
      </Canvas>
    </div>
  );
}
