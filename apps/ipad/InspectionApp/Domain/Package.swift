import Foundation

// MARK: - PackageDefinition

/// The `definition` jsonb column of `package_versions`.
/// Shape: { sections:[Section], item_rules:{code: {requirement, scoring_enabled, conditional, ...}} }
struct PackageDefinition: Codable {
    let sections: [Section]
    /// Maps item code → ItemRule object (e.g. {requirement, scoring_enabled, conditional, ...}).
    /// Stored as JSONValue so arbitrary rule shapes round-trip without breaking decoding.
    let itemRules: [String: JSONValue]?

    enum CodingKeys: String, CodingKey {
        case sections
        case itemRules = "item_rules"
    }
}

// MARK: - Section

struct Section: Codable {
    let key: String
    let titleEn: String
    let titleAr: String
    /// Ordered list of item codes that belong to this section.
    let items: [String]

    enum CodingKeys: String, CodingKey {
        case key
        case titleEn = "title_en"
        case titleAr = "title_ar"
        case items
    }
}
