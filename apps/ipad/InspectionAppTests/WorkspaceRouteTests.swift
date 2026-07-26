// WorkspaceRouteTests.swift
// TDD tests for WorkspaceRouter.route(for:)
// Task 11 — Phase 2/3 "Inspection Workspace + Offline"

import XCTest
@testable import InspectionApp

final class WorkspaceRouteTests: XCTestCase {

    // MARK: - Fixtures

    private func makeItem(lifecycle: InspectionLifecycle?) -> VisitListItem {
        let visit = Visit(
            id: UUID(),
            factoryId: UUID(),
            visitType: "routine",
            executionMode: .physical,
            planningStatus: .published,
            operationalState: .executing,
            windowStart: Date(),
            windowEnd: Date(),
            executionDate: nil,
            priority: nil
        )
        return VisitListItem(visit: visit, factory: nil, inspectionLifecycle: lifecycle)
    }

    // MARK: - .open cases

    func test_route_inProgress_isOpen() {
        let item = makeItem(lifecycle: .in_progress)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .open(inspectionHint: nil))
    }

    func test_route_returned_isOpen() {
        let item = makeItem(lifecycle: .returned)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .open(inspectionHint: nil))
    }

    func test_route_approved_isOpen() {
        let item = makeItem(lifecycle: .approved)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .open(inspectionHint: nil))
    }

    func test_route_rejected_isOpen() {
        let item = makeItem(lifecycle: .rejected)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .open(inspectionHint: nil))
    }

    func test_route_cancelled_isOpen() {
        let item = makeItem(lifecycle: .cancelled)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .open(inspectionHint: nil))
    }

    // MARK: - .notStarted cases

    func test_route_nilLifecycle_isNotStarted() {
        let item = makeItem(lifecycle: nil)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .notStarted)
    }

    func test_route_new_isNotStarted() {
        let item = makeItem(lifecycle: .new)
        XCTAssertEqual(WorkspaceRouter.route(for: item), .notStarted)
    }
}
