import Foundation

public protocol SafeRawEnum: RawRepresentable where RawValue == String {}
public extension SafeRawEnum {
    static func from(_ raw: String?) -> Self? {
        guard let raw else { return nil }
        return Self(rawValue: raw)
    }
}

enum ExecutionMode: String, SafeRawEnum { case physical, virtual
    var isVirtual: Bool { self == .virtual }
}
enum PlanningStatus: String, SafeRawEnum { case draft, published, returned, cancelled, expired }
enum OperationalState: String, SafeRawEnum {
    case new, prepared, on_the_way, arrived, executing, submitted, under_review
}
enum AssignmentStatus: String, SafeRawEnum { case assigned, preparing, ready, returned }
enum InspectionLifecycle: String, SafeRawEnum {
    case new, in_progress, returned, approved, rejected, cancelled
}
