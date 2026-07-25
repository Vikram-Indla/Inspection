import Foundation

enum VisitScheduling {
    /// Returns the Asia/Riyadh calendar date-string (yyyy-MM-dd) for a given Date.
    static func riyadhDateString(_ date: Date) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// Returns true if the item is scheduled on todayISODate.
    /// Primary: executionDate == todayISODate.
    /// Fallback (when executionDate is nil): Asia/Riyadh calendar date of windowStart == todayISODate.
    static func isScheduledToday(_ item: VisitListItem, todayISODate: String) -> Bool {
        if let d = item.visit.executionDate { return d == todayISODate }
        return riyadhDateString(item.visit.windowStart) == todayISODate
    }
}
