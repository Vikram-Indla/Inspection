import { test, expect } from "@playwright/test";
import { distanceMeters, isCheckinAccuracyAcceptable, evaluateGeofence, canViewPrecise, type GisPolicy } from "../src/lib/gis/spatial";

// TASK-MVP2-M2-06-SPATIAL-GIS-001 · MVP2-REQ-0087..0108 · CD-045.
// Policy values are the accepted engine_settings.gis numbers, passed in (DEC-002).
const POLICY: GisPolicy = { gps_accuracy_checkin_max_m: 25, geofence_default_radius_m: 150, arrival_detection_radius_m: 200 };
const RIYADH = { lat: 24.7136, lng: 46.6753 };

test("haversine distance is ~0 for identical points and positive otherwise", () => {
  expect(distanceMeters(RIYADH, RIYADH)).toBeCloseTo(0, 1);
  expect(distanceMeters(RIYADH, { lat: 24.72, lng: 46.6753 })).toBeGreaterThan(500);
});

test("check-in accuracy honours the accepted threshold", () => {
  expect(isCheckinAccuracyAcceptable(20, POLICY)).toBe(true);
  expect(isCheckinAccuracyAcceptable(25, POLICY)).toBe(true);
  expect(isCheckinAccuracyAcceptable(26, POLICY)).toBe(false);
  expect(isCheckinAccuracyAcceptable(-1, POLICY)).toBe(false);
});

test("geofence never false-passes on missing geometry", () => {
  expect(evaluateGeofence(null, RIYADH, null, POLICY)).toBe("unknown");
  expect(evaluateGeofence(RIYADH, null, null, POLICY)).toBe("unknown");
  expect(evaluateGeofence(RIYADH, RIYADH, null, POLICY)).toBe("inside");
  expect(evaluateGeofence({ lat: 24.72, lng: 46.6753 }, RIYADH, 150, POLICY)).toBe("outside");
});

test("precise-location visibility is matrix-gated", () => {
  const matrix = [{ sensitivityClass: "high", roleKey: "gis_admin", canViewPrecise: true }];
  expect(canViewPrecise(matrix, "high", ["gis_admin"])).toBe(true);
  expect(canViewPrecise(matrix, "high", ["planner"])).toBe(false);
});
