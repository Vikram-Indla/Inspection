import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type Point = { lat: number; lng: number };

function validPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") return false;
  const point = value as Point;
  return Number.isFinite(point.lat) && Number.isFinite(point.lng)
    && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
}

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ status: "unauthorized" }, { status: 401 });

  let body: { origin?: unknown; destination?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ status: "invalid_request" }, { status: 400 }); }
  if (!validPoint(body.origin) || !validPoint(body.destination)) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  // TASK-IPAD-MAPBOX-RUNTIME-004 — Mapbox Directions is server-side so the
  // browser map key never becomes a route-service dependency. Deployments may
  // use the same restricted public token only if Mapbox permits that scope.
  const key = process.env.MAPBOX_ACCESS_TOKEN;
  if (!key) {
    return NextResponse.json({ status: "provider_unavailable", provider: "mapbox_directions" }, { status: 503 });
  }

  try {
    const coordinates = `${body.origin.lng},${body.origin.lat};${body.destination.lng},${body.destination.lat}`;
    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?alternatives=false&overview=false&steps=false&access_token=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[routing eta] mapbox directions returned ${response.status}`);
      return NextResponse.json({ status: "provider_unavailable", provider: "mapbox_directions" }, { status: 503 });
    }
    const payload = await response.json() as { routes?: { duration?: number; distance?: number }[] };
    const route = payload.routes?.[0];
    if (!route || !Number.isFinite(route.duration) || !Number.isFinite(route.distance)) {
      return NextResponse.json({ status: "no_route", provider: "mapbox_directions" }, { status: 422 });
    }
    return NextResponse.json({
      status: "ok", provider: "mapbox_directions",
      etaMinutes: Math.max(1, Math.ceil(route.duration! / 60)),
      distanceMeters: Math.round(route.distance!),
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[routing eta] provider request failed", error);
    return NextResponse.json({ status: "provider_unavailable", provider: "mapbox_directions" }, { status: 503 });
  }
}
