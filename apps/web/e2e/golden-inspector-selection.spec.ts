import { expect, test } from "@playwright/test";
import {
  selectAvailableControlledInspector,
  selectLeasedControlledInspector,
} from "./golden-inspector-selection";

const candidates = [
  { userId: "inspector-a", value: { label: "alternate" } },
  { userId: "inspector-b", value: { label: "primary" } },
];

test("golden Inspector selection returns the exact governed leased candidate", () => {
  expect(selectLeasedControlledInspector(candidates, [{
    lease_id: "lease-1",
    inspector_id: "inspector-b",
  }])).toEqual({
    userId: "inspector-b",
    value: { label: "primary" },
    leaseId: "lease-1",
  });
});

test("golden Inspector selection fails closed for absent, ambiguous or uncontrolled leases", () => {
  expect(() => selectLeasedControlledInspector(candidates, [])).toThrow(/exactly one governed row/);
  expect(() => selectLeasedControlledInspector(candidates, [
    { lease_id: "lease-1", inspector_id: "inspector-a" },
    { lease_id: "lease-2", inspector_id: "inspector-b" },
  ])).toThrow(/exactly one governed row/);
  expect(() => selectLeasedControlledInspector(candidates, [{
    lease_id: "lease-3",
    inspector_id: "inspector-unknown",
  }])).toThrow(/uncontrolled identity/);
  expect(() => selectLeasedControlledInspector([candidates[0], candidates[0]], [{
    lease_id: "lease-1",
    inspector_id: "inspector-a",
  }])).toThrow(/non-empty and unique/);
});

test("golden Inspector availability deterministically selects a configured credential", () => {
  expect(selectAvailableControlledInspector(candidates, ["uncontrolled", "inspector-b"]))
    .toEqual(candidates[1]);
  expect(selectAvailableControlledInspector([...candidates].reverse(), ["inspector-a", "inspector-b"]))
    .toEqual(candidates[1]);
});

test("golden Inspector availability fails closed without a controlled match", () => {
  expect(() => selectAvailableControlledInspector(candidates, [])).toThrow(/no available controlled Inspector/);
  expect(() => selectAvailableControlledInspector(candidates, ["uncontrolled"]))
    .toThrow(/no available controlled Inspector/);
  expect(() => selectAvailableControlledInspector([candidates[0], candidates[0]], ["inspector-a"]))
    .toThrow(/non-empty and unique/);
});
