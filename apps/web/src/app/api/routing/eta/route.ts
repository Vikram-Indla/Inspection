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

  const key = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  if (!key) {
    return NextResponse.json({ status: "provider_unavailable", provider: "google_routes" }, { status: 503 });
  }

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: body.origin.lat, longitude: body.origin.lng } } },
        destination: { location: { latLng: { latitude: body.destination.lat, longitude: body.destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[routing eta] google routes returned ${response.status}`);
      return NextResponse.json({ status: "provider_unavailable", provider: "google_routes" }, { status: 503 });
    }
    const payload = await response.json() as { routes?: { duration?: string; distanceMeters?: number }[] };
    const route = payload.routes?.[0];
    const seconds = Number.parseFloat(route?.duration?.replace(/s$/, "") ?? "");
    if (!route || !Number.isFinite(seconds) || !Number.isFinite(route.distanceMeters)) {
      return NextResponse.json({ status: "no_route", provider: "google_routes" }, { status: 422 });
    }
    return NextResponse.json({
      status: "ok",
      provider: "google_routes",
      etaMinutes: Math.max(1, Math.ceil(seconds / 60)),
      distanceMeters: Math.round(route.distanceMeters!),
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[routing eta] provider request failed", error);
    return NextResponse.json({ status: "provider_unavailable", provider: "google_routes" }, { status: 503 });
  }
}
