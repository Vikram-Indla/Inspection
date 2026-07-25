// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "InspectionCore",
    platforms: [.iOS(.v18)],
    products: [
        .library(name: "DesignSystem", targets: ["DesignSystem"]),
        .library(name: "Components", targets: ["Components"]),
    ],
    targets: [
        .target(name: "DesignSystem", swiftSettings: [.swiftLanguageMode(.v5)]),
        .target(name: "Components", dependencies: ["DesignSystem"], swiftSettings: [.swiftLanguageMode(.v5)]),
        .testTarget(name: "DesignSystemTests", dependencies: ["DesignSystem"], swiftSettings: [.swiftLanguageMode(.v5)]),
        .testTarget(name: "ComponentsTests", dependencies: ["Components"], swiftSettings: [.swiftLanguageMode(.v5)]),
    ]
)
