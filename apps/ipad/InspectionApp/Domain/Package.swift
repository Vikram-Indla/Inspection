import Foundation

// MARK: - PackageDefinition

/// The `definition` jsonb column of `package_versions`.
/// Shape: { sections:[Section], item_rules:{code:uuid} }
struct PackageDefinition: Codable {
    let sections: [Section]
    /// Maps item code → inspection_items.id.  Kept generic so new rules don't break decoding.
    let itemRules: [String: String]?

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
