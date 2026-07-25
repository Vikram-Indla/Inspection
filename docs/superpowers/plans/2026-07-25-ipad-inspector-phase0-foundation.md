# iPad Inspector — Phase 0 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a native iPadOS SwiftUI app skeleton — Saqeel design-system tokens, core reusable components, native tab bar + header, and a working Supabase login — as the foundation for the inspector flow rebuild.

**Architecture:** Clean Architecture + MVVM stores, mirroring `catalyst-ios`. Two local SPM products (`DesignSystem`, `Components`) consumed by an XcodeGen-generated app target. Auth via Supabase Swift SDK behind a repository protocol (stub-injectable for tests). This phase delivers: login works, themed shell (tab bar + header) renders.

**Tech Stack:** Swift 5.9, SwiftUI, iPadOS 18, XcodeGen, Swift Package Manager, Supabase Swift SDK 2.0+, XCTest. Offline store (GRDB) arrives in Phase 3 — not this phase.

## Global Constraints

- Platform: iPadOS 18.0 minimum, iPad-only, all orientations. `SWIFT_VERSION: "5.9"`.
- Bundle id: `com.mim.inspection` (app), prefix `com.mim`. Display name: `MIM Inspection`.
- App root directory: `apps/ipad/` inside the `Inspection` repo. All paths below are relative to it unless absolute.
- Design tokens are canonical from `design/saqeel-v5-final/tokens/tokens.css`. Primary green `#176B52` (light) / `#64C2A1` (dark). Info blue is links/information ONLY — never an action color.
- Field density is the default: control height **52px**, touch targets **≥52px**.
- Typography font family: **IBM Plex Sans Arabic** (bundled). Status is always **glyph + label**, never color alone.
- All colors defined for BOTH light and dark schemes. RTL-safe (SwiftUI logical layout; no hardcoded `.leading`/`.trailing` assumptions that break under `.environment(\.layoutDirection, .rightToLeft)`).
- Commit after every task. Conventional commit messages.

---

## File Structure

```
apps/ipad/
├── project.yml                                  # XcodeGen app target + Supabase dep
├── Core/
│   ├── Package.swift                            # DesignSystem + Components products
│   └── Sources/
│       ├── DesignSystem/
│       │   ├── SaqeelColors.swift               # raw palette (RGB)
│       │   ├── SaqeelColorScheme.swift          # semantic light/dark schemes
│       │   ├── SaqeelTypography.swift           # font scale
│       │   ├── SaqeelSpacing.swift              # 4px grid
│       │   ├── SaqeelRadius.swift               # radii
│       │   ├── SaqeelDensity.swift              # control heights (field 52)
│       │   ├── SaqeelAdaptive.swift             # iPad scaling
│       │   └── SaqeelTheme.swift                # ObservableObject theme holder
│       └── Components/
│           ├── SaqeelButton.swift
│           ├── SaqeelField.swift
│           ├── StatusLozenge.swift
│           ├── SaqeelCard.swift
│           ├── InspectionTabBar.swift
│           └── InspectionHeader.swift
├── Core/Tests/
│   ├── DesignSystemTests/
│   │   ├── SaqeelColorSchemeTests.swift
│   │   ├── SaqeelTokenTests.swift
│   │   └── SaqeelThemeTests.swift
│   └── ComponentsTests/
│       ├── SaqeelButtonTests.swift
│       └── StatusLozengeTests.swift
├── InspectionApp/
│   ├── App/
│   │   ├── InspectionApp.swift                  # @main
│   │   ├── ThemeRoot.swift
│   │   └── AuthGate.swift
│   ├── Infrastructure/
│   │   ├── AppSecrets.swift
│   │   └── SupabaseClientProvider.swift
│   ├── Data/
│   │   └── Repositories/
│   │       ├── AuthRepository.swift             # protocol + Supabase impl
│   │       └── StubAuthRepository.swift         # test double (in test target)
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── AuthSession.swift                # @MainActor store
│   │   │   └── LoginView.swift
│   │   └── Shell/
│   │       └── RootShellView.swift              # native TabView + header
│   ├── Config/
│   │   └── Secrets.xcconfig
│   └── Resources/
│       └── Fonts/                               # IBMPlexSansArabic-*.ttf
└── InspectionAppTests/
    └── AuthSessionTests.swift
```

---

### Task 1: Core SPM package skeleton

**Files:**
- Create: `apps/ipad/Core/Package.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelPlaceholder.swift`
- Create: `apps/ipad/Core/Sources/Components/ComponentsPlaceholder.swift`
- Test: `apps/ipad/Core/Tests/DesignSystemTests/PackageBuildsTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces: two SPM library products `DesignSystem` and `Components`; `import DesignSystem` and `import Components` compile.

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/DesignSystemTests/PackageBuildsTests.swift`:
```swift
import XCTest
@testable import DesignSystem

final class PackageBuildsTests: XCTestCase {
    func test_designSystemModuleLoads() {
        XCTAssertEqual(DesignSystemMarker.name, "DesignSystem")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test`
Expected: FAIL — `Package.swift` / `DesignSystemMarker` not found (build error).

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Package.swift`:
```swift
// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "InspectionCore",
    platforms: [.iOS(.v18)],
    products: [
        .library(name: "DesignSystem", targets: ["DesignSystem"]),
        .library(name: "Components", targets: ["Components"]),
    ],
    targets: [
        .target(name: "DesignSystem"),
        .target(name: "Components", dependencies: ["DesignSystem"]),
        .testTarget(name: "DesignSystemTests", dependencies: ["DesignSystem"]),
        .testTarget(name: "ComponentsTests", dependencies: ["Components"]),
    ]
)
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelPlaceholder.swift`:
```swift
public enum DesignSystemMarker {
    public static let name = "DesignSystem"
}
```

`apps/ipad/Core/Sources/Components/ComponentsPlaceholder.swift`:
```swift
import DesignSystem

public enum ComponentsMarker {
    public static let name = "Components"
}
```

Add an empty `apps/ipad/Core/Tests/ComponentsTests/.gitkeep` so the test target has a directory.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): scaffold Core SPM package with DesignSystem and Components"
```

---

### Task 2: Saqeel color schemes (light + dark)

**Files:**
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelColors.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelColorScheme.swift`
- Delete: `apps/ipad/Core/Sources/DesignSystem/SaqeelPlaceholder.swift`
- Test: `apps/ipad/Core/Tests/DesignSystemTests/SaqeelColorSchemeTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SaqeelColorScheme` struct with fields: `canvas, surface, primary, primaryHover, text, textSecondary, success, warning, critical, info, border, borderControl, inverseText` (all `Color`).
  - `SaqeelColorScheme.light` and `SaqeelColorScheme.dark` static instances.

RGB values are `hex/255` (source hex in comments), from `design/saqeel-v5-final/tokens/tokens.css`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/DesignSystemTests/SaqeelColorSchemeTests.swift`:
```swift
import XCTest
import SwiftUI
@testable import DesignSystem

final class SaqeelColorSchemeTests: XCTestCase {
    // #176B52 = (23,107,82)/255
    func test_lightPrimaryIsSaqeelGreen() {
        let c = SaqeelColorScheme.light.primary.rgbaComponents()
        XCTAssertEqual(c.r, 23.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.g, 107.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.b, 82.0/255.0, accuracy: 0.002)
    }

    // #64C2A1 = (100,194,161)/255
    func test_darkPrimaryStaysGreenNotBlue() {
        let c = SaqeelColorScheme.dark.primary.rgbaComponents()
        XCTAssertEqual(c.r, 100.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.g, 194.0/255.0, accuracy: 0.002)
        XCTAssertEqual(c.b, 161.0/255.0, accuracy: 0.002)
    }

    func test_lightCanvasIsNearWhite() {
        let c = SaqeelColorScheme.light.canvas.rgbaComponents()
        XCTAssertEqual(c.r, 245.0/255.0, accuracy: 0.002) // #F5F7F8
    }
}

private extension Color {
    func rgbaComponents() -> (r: CGFloat, g: CGFloat, b: CGFloat, a: CGFloat) {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a)
        return (r, g, b, a)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter SaqeelColorSchemeTests`
Expected: FAIL — `SaqeelColorScheme` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/DesignSystem/SaqeelColors.swift`:
```swift
import SwiftUI

/// Raw Saqeel palette. Values are source-hex / 255.
/// Source: design/saqeel-v5-final/tokens/tokens.css
public enum SaqeelColors {
    static func hex(_ r: Double, _ g: Double, _ b: Double) -> Color {
        Color(red: r/255.0, green: g/255.0, blue: b/255.0)
    }

    // Light
    public static let lightPrimary        = hex(23, 107, 82)   // #176B52
    public static let lightPrimaryHover   = hex(18, 85, 65)    // #125541
    public static let lightCanvas         = hex(245, 247, 248) // #F5F7F8
    public static let lightSurface        = hex(255, 255, 255) // #FFFFFF
    public static let lightText           = hex(27, 36, 44)    // #1B242C
    public static let lightTextSecondary  = hex(73, 84, 94)    // #49545E
    public static let lightSuccess        = hex(24, 121, 78)   // #18794E
    public static let lightWarning        = hex(138, 90, 0)    // #8A5A00
    public static let lightCritical       = hex(180, 35, 24)   // #B42318
    public static let lightInfo           = hex(23, 92, 211)   // #175CD3
    public static let lightBorder         = hex(214, 221, 226) // #D6DDE2
    public static let lightBorderControl  = hex(122, 136, 148) // #7A8894
    public static let lightInverseText    = hex(255, 255, 255)

    // Dark
    public static let darkPrimary         = hex(100, 194, 161) // #64C2A1
    public static let darkPrimaryHover    = hex(127, 208, 179) // #7FD0B3
    public static let darkCanvas          = hex(16, 19, 23)    // #101317
    public static let darkSurface         = hex(25, 29, 34)    // #191D22
    public static let darkText            = hex(241, 244, 246) // #F1F4F6
    public static let darkTextSecondary   = hex(171, 180, 189) // #ABB4BD
    public static let darkSuccess         = hex(85, 184, 133)  // #55B885
    public static let darkWarning         = hex(212, 168, 79)  // #D4A84F
    public static let darkCritical        = hex(225, 119, 112) // #E17770
    public static let darkInfo            = hex(120, 174, 218) // #78AEDA
    public static let darkBorder          = hex(53, 60, 68)    // #353C44
    public static let darkBorderControl   = hex(107, 118, 128) // #6B7680
    public static let darkInverseText     = hex(16, 19, 23)    // #101317
}
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelColorScheme.swift`:
```swift
import SwiftUI

public struct SaqeelColorScheme: Sendable {
    public let canvas: Color
    public let surface: Color
    public let primary: Color
    public let primaryHover: Color
    public let text: Color
    public let textSecondary: Color
    public let success: Color
    public let warning: Color
    public let critical: Color
    public let info: Color
    public let border: Color
    public let borderControl: Color
    public let inverseText: Color

    public static let light = SaqeelColorScheme(
        canvas: SaqeelColors.lightCanvas,
        surface: SaqeelColors.lightSurface,
        primary: SaqeelColors.lightPrimary,
        primaryHover: SaqeelColors.lightPrimaryHover,
        text: SaqeelColors.lightText,
        textSecondary: SaqeelColors.lightTextSecondary,
        success: SaqeelColors.lightSuccess,
        warning: SaqeelColors.lightWarning,
        critical: SaqeelColors.lightCritical,
        info: SaqeelColors.lightInfo,
        border: SaqeelColors.lightBorder,
        borderControl: SaqeelColors.lightBorderControl,
        inverseText: SaqeelColors.lightInverseText
    )

    public static let dark = SaqeelColorScheme(
        canvas: SaqeelColors.darkCanvas,
        surface: SaqeelColors.darkSurface,
        primary: SaqeelColors.darkPrimary,
        primaryHover: SaqeelColors.darkPrimaryHover,
        text: SaqeelColors.darkText,
        textSecondary: SaqeelColors.darkTextSecondary,
        success: SaqeelColors.darkSuccess,
        warning: SaqeelColors.darkWarning,
        critical: SaqeelColors.darkCritical,
        info: SaqeelColors.darkInfo,
        border: SaqeelColors.darkBorder,
        borderControl: SaqeelColors.darkBorderControl,
        inverseText: SaqeelColors.darkInverseText
    )
}
```

Delete the placeholder: `rm apps/ipad/Core/Sources/DesignSystem/SaqeelPlaceholder.swift` and update `PackageBuildsTests` to reference a real symbol:
```swift
func test_designSystemModuleLoads() {
    XCTAssertNotNil(SaqeelColorScheme.light)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter SaqeelColorSchemeTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add Saqeel light/dark color schemes"
```

---

### Task 3: Scalar tokens (typography, spacing, radius, density, adaptive)

**Files:**
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelAdaptive.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelSpacing.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelRadius.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelDensity.swift`
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelTypography.swift`
- Test: `apps/ipad/Core/Tests/DesignSystemTests/SaqeelTokenTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SaqeelSpacing`: `xs=8, sm=12, md=16, lg=24, xl=32, xxl=48, hairline=4, xl20=20` (CGFloat).
  - `SaqeelRadius`: `small=4, standard=6, large=8, input=6, full=999`.
  - `SaqeelDensity`: `compact=36, admin=40, standard=44, prominent=48, field=52` and `minTouchTarget=52`.
  - `SaqeelTypography`: static `Font` values `display, title, heading, subheading, body, bodyStrong, field, caption, micro, metric, label, action` + `fontFamily = "IBMPlexSansArabic"`.
  - `SaqeelAdaptive.isIPad: Bool`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/DesignSystemTests/SaqeelTokenTests.swift`:
```swift
import XCTest
@testable import DesignSystem

final class SaqeelTokenTests: XCTestCase {
    func test_spacingGridIs4pxBased() {
        XCTAssertEqual(SaqeelSpacing.hairline, 4)
        XCTAssertEqual(SaqeelSpacing.xs, 8)
        XCTAssertEqual(SaqeelSpacing.md, 16)
        XCTAssertEqual(SaqeelSpacing.xxl, 48)
    }

    func test_fieldDensityIs52ForTouchTargets() {
        XCTAssertEqual(SaqeelDensity.field, 52)
        XCTAssertEqual(SaqeelDensity.minTouchTarget, 52)
    }

    func test_inputRadiusIs6() {
        XCTAssertEqual(SaqeelRadius.input, 6)
        XCTAssertEqual(SaqeelRadius.full, 999)
    }

    func test_fontFamilyIsIBMPlexSansArabic() {
        XCTAssertEqual(SaqeelTypography.fontFamily, "IBMPlexSansArabic")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter SaqeelTokenTests`
Expected: FAIL — symbols undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/DesignSystem/SaqeelAdaptive.swift`:
```swift
import UIKit

public enum SaqeelAdaptive {
    public static let isIPad: Bool = MainActor.assumeIsolated {
        UIDevice.current.userInterfaceIdiom == .pad
    }
}
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelSpacing.swift`:
```swift
import CoreGraphics

public enum SaqeelSpacing {
    public static let hairline: CGFloat = 4
    public static let xs: CGFloat = 8
    public static let sm: CGFloat = 12
    public static let md: CGFloat = 16
    public static let xl20: CGFloat = 20
    public static let lg: CGFloat = 24
    public static let xl: CGFloat = 32
    public static let xxl: CGFloat = 48
}
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelRadius.swift`:
```swift
import CoreGraphics

public enum SaqeelRadius {
    public static let small: CGFloat = 4
    public static let standard: CGFloat = 6
    public static let large: CGFloat = 8
    public static let input: CGFloat = 6
    public static let full: CGFloat = 999
}
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelDensity.swift`:
```swift
import CoreGraphics

/// Control-height density ladder. Field is the iPad default.
public enum SaqeelDensity {
    public static let compact: CGFloat = 36
    public static let admin: CGFloat = 40
    public static let standard: CGFloat = 44
    public static let prominent: CGFloat = 48
    public static let field: CGFloat = 52
    public static let minTouchTarget: CGFloat = 52
}
```

`apps/ipad/Core/Sources/DesignSystem/SaqeelTypography.swift`:
```swift
import SwiftUI

public enum SaqeelTypography {
    public static let fontFamily = "IBMPlexSansArabic"

    private static func plex(_ size: CGFloat, _ weight: Font.Weight) -> Font {
        // Falls back to system if the bundled font is unavailable in a test host.
        Font.custom(fontFamily, size: size).weight(weight)
    }

    public static let display     = plex(32, .medium)
    public static let title       = plex(24, .medium)
    public static let heading     = plex(19, .medium)
    public static let subheading  = plex(16, .medium)
    public static let body        = plex(16, .regular)
    public static let bodyStrong  = plex(16, .semibold)
    public static let field       = plex(17, .regular)   // iPad field input, ≥17px
    public static let caption     = plex(14, .regular)
    public static let micro       = plex(12, .medium)
    public static let metric      = plex(28, .medium)
    public static let label       = plex(14, .medium)
    public static let action      = plex(14, .medium)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter SaqeelTokenTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add Saqeel spacing, radius, density, typography tokens"
```

---

### Task 4: SaqeelTheme observable holder

**Files:**
- Create: `apps/ipad/Core/Sources/DesignSystem/SaqeelTheme.swift`
- Test: `apps/ipad/Core/Tests/DesignSystemTests/SaqeelThemeTests.swift`

**Interfaces:**
- Consumes: `SaqeelColorScheme`.
- Produces: `@MainActor final class SaqeelTheme: ObservableObject` with `@Published var colors: SaqeelColorScheme` and `func apply(dark: Bool)` that sets `colors` to `.dark`/`.light`. Default init is light.

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/DesignSystemTests/SaqeelThemeTests.swift`:
```swift
import XCTest
import SwiftUI
@testable import DesignSystem

@MainActor
final class SaqeelThemeTests: XCTestCase {
    func test_defaultsToLight() {
        let theme = SaqeelTheme()
        XCTAssertEqual(UIColor(theme.colors.canvas), UIColor(SaqeelColorScheme.light.canvas))
    }

    func test_applyDarkSwapsScheme() {
        let theme = SaqeelTheme()
        theme.apply(dark: true)
        XCTAssertEqual(UIColor(theme.colors.canvas), UIColor(SaqeelColorScheme.dark.canvas))
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter SaqeelThemeTests`
Expected: FAIL — `SaqeelTheme` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/DesignSystem/SaqeelTheme.swift`:
```swift
import SwiftUI

@MainActor
public final class SaqeelTheme: ObservableObject {
    @Published public var colors: SaqeelColorScheme

    public init(dark: Bool = false) {
        self.colors = dark ? .dark : .light
    }

    public func apply(dark: Bool) {
        colors = dark ? .dark : .light
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter SaqeelThemeTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add SaqeelTheme observable holder"
```

---

### Task 5: SaqeelButton component

**Files:**
- Create: `apps/ipad/Core/Sources/Components/SaqeelButton.swift`
- Delete: `apps/ipad/Core/Sources/Components/ComponentsPlaceholder.swift`
- Test: `apps/ipad/Core/Tests/ComponentsTests/SaqeelButtonTests.swift`

**Interfaces:**
- Consumes: `SaqeelTheme`, `SaqeelColorScheme`, `SaqeelDensity`, `SaqeelRadius`, `SaqeelTypography`.
- Produces:
  - `enum SaqeelButtonStyle { case primary, secondary, subtle, danger }`
  - `struct SaqeelButton: View` with init `(_ title: String, style: SaqeelButtonStyle = .primary, isLoading: Bool = false, isEnabled: Bool = true, action: @escaping () -> Void)`.
  - Pure helper `SaqeelButtonStyle.background(in:)` / `.foreground(in:)` returning `Color` from a scheme (so it is unit-testable without rendering).

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/ComponentsTests/SaqeelButtonTests.swift`:
```swift
import XCTest
import SwiftUI
import DesignSystem
@testable import Components

final class SaqeelButtonTests: XCTestCase {
    func test_primaryBackgroundIsSchemePrimary() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.primary.background(in: scheme)),
            UIColor(scheme.primary)
        )
    }

    func test_primaryForegroundIsInverseText() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.primary.foreground(in: scheme)),
            UIColor(scheme.inverseText)
        )
    }

    func test_dangerBackgroundIsCritical() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.danger.background(in: scheme)),
            UIColor(scheme.critical)
        )
    }

    func test_secondaryBackgroundIsSurface() {
        let scheme = SaqeelColorScheme.light
        XCTAssertEqual(
            UIColor(SaqeelButtonStyle.secondary.background(in: scheme)),
            UIColor(scheme.surface)
        )
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter SaqeelButtonTests`
Expected: FAIL — `SaqeelButtonStyle` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/Components/SaqeelButton.swift`:
```swift
import SwiftUI
import DesignSystem

public enum SaqeelButtonStyle {
    case primary, secondary, subtle, danger

    public func background(in scheme: SaqeelColorScheme) -> Color {
        switch self {
        case .primary:   return scheme.primary
        case .secondary: return scheme.surface
        case .subtle:    return .clear
        case .danger:    return scheme.critical
        }
    }

    public func foreground(in scheme: SaqeelColorScheme) -> Color {
        switch self {
        case .primary, .danger: return scheme.inverseText
        case .secondary:        return scheme.text
        case .subtle:           return scheme.primary
        }
    }

    public func border(in scheme: SaqeelColorScheme) -> Color {
        self == .secondary ? scheme.borderControl : .clear
    }
}

public struct SaqeelButton: View {
    private let title: String
    private let style: SaqeelButtonStyle
    private let isLoading: Bool
    private let isEnabled: Bool
    private let action: () -> Void

    @EnvironmentObject private var theme: SaqeelTheme

    public init(_ title: String,
                style: SaqeelButtonStyle = .primary,
                isLoading: Bool = false,
                isEnabled: Bool = true,
                action: @escaping () -> Void) {
        self.title = title
        self.style = style
        self.isLoading = isLoading
        self.isEnabled = isEnabled
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: SaqeelSpacing.xs) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(style.foreground(in: theme.colors))
                }
                Text(title).font(SaqeelTypography.action)
            }
            .frame(maxWidth: .infinity)
            .frame(height: SaqeelDensity.field)
            .padding(.horizontal, SaqeelSpacing.md)
            .background(style.background(in: theme.colors))
            .foregroundColor(style.foreground(in: theme.colors))
            .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.small))
            .overlay(
                RoundedRectangle(cornerRadius: SaqeelRadius.small)
                    .stroke(style.border(in: theme.colors), lineWidth: 1)
            )
        }
        .disabled(!isEnabled || isLoading)
        .opacity(isEnabled ? 1.0 : 0.5)
    }
}
```

Delete `ComponentsPlaceholder.swift`; if `PackageBuildsTests`/any test referenced `ComponentsMarker`, none do — safe to remove.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter SaqeelButtonTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add SaqeelButton with field-density styling"
```

---

### Task 6: StatusLozenge, SaqeelField, SaqeelCard components

**Files:**
- Create: `apps/ipad/Core/Sources/Components/StatusLozenge.swift`
- Create: `apps/ipad/Core/Sources/Components/SaqeelField.swift`
- Create: `apps/ipad/Core/Sources/Components/SaqeelCard.swift`
- Test: `apps/ipad/Core/Tests/ComponentsTests/StatusLozengeTests.swift`

**Interfaces:**
- Consumes: `SaqeelTheme`, `SaqeelColorScheme`, tokens.
- Produces:
  - `enum LozengeTone { case success, warning, critical, info, neutral }` with `func tint(in:) -> Color`.
  - `enum LozengeDomain { case plan, ops, review, virtual, sync }` with `var glyph: String` (`▣ ● ◆ ▲ ⟳`).
  - `struct StatusLozenge: View` init `(_ label: String, tone: LozengeTone, domain: LozengeDomain?)` — renders `glyph + label` (never color alone).
  - `struct SaqeelField<Content: View>: View` — labeled field wrapper (label + content + optional hint/error).
  - `struct SaqeelCard<Content: View>: View` — surface + border + `SaqeelRadius.standard`, no shadow (flat).

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/ComponentsTests/StatusLozengeTests.swift`:
```swift
import XCTest
import SwiftUI
import DesignSystem
@testable import Components

final class StatusLozengeTests: XCTestCase {
    func test_domainGlyphsMatchSaqeelSymbols() {
        XCTAssertEqual(LozengeDomain.plan.glyph, "▣")
        XCTAssertEqual(LozengeDomain.ops.glyph, "●")
        XCTAssertEqual(LozengeDomain.review.glyph, "◆")
        XCTAssertEqual(LozengeDomain.virtual.glyph, "▲")
        XCTAssertEqual(LozengeDomain.sync.glyph, "⟳")
    }

    func test_criticalToneUsesSchemeCritical() {
        XCTAssertEqual(
            UIColor(LozengeTone.critical.tint(in: .light)),
            UIColor(SaqeelColorScheme.light.critical)
        )
    }

    func test_renderedTextIncludesGlyphAndLabel() {
        // Never color alone: the displayed string carries glyph + label.
        let text = StatusLozenge.displayText(glyph: LozengeDomain.review.glyph, label: "Under review")
        XCTAssertEqual(text, "◆ Under review")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter StatusLozengeTests`
Expected: FAIL — symbols undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/Components/StatusLozenge.swift`:
```swift
import SwiftUI
import DesignSystem

public enum LozengeTone {
    case success, warning, critical, info, neutral

    public func tint(in scheme: SaqeelColorScheme) -> Color {
        switch self {
        case .success:  return scheme.success
        case .warning:  return scheme.warning
        case .critical: return scheme.critical
        case .info:     return scheme.info
        case .neutral:  return scheme.textSecondary
        }
    }
}

public enum LozengeDomain {
    case plan, ops, review, virtual, sync

    public var glyph: String {
        switch self {
        case .plan:    return "▣"
        case .ops:     return "●"
        case .review:  return "◆"
        case .virtual: return "▲"
        case .sync:    return "⟳"
        }
    }
}

public struct StatusLozenge: View {
    private let label: String
    private let tone: LozengeTone
    private let domain: LozengeDomain?

    @EnvironmentObject private var theme: SaqeelTheme

    public init(_ label: String, tone: LozengeTone, domain: LozengeDomain? = nil) {
        self.label = label
        self.tone = tone
        self.domain = domain
    }

    public static func displayText(glyph: String, label: String) -> String {
        "\(glyph) \(label)"
    }

    public var body: some View {
        let text = domain.map { Self.displayText(glyph: $0.glyph, label: label) } ?? label
        Text(text)
            .font(SaqeelTypography.micro)
            .foregroundColor(tone.tint(in: theme.colors))
            .padding(.vertical, 3)
            .padding(.horizontal, SaqeelSpacing.xs)
            .overlay(
                RoundedRectangle(cornerRadius: SaqeelRadius.small)
                    .stroke(tone.tint(in: theme.colors).opacity(0.5), lineWidth: 1)
            )
    }
}
```

`apps/ipad/Core/Sources/Components/SaqeelField.swift`:
```swift
import SwiftUI
import DesignSystem

public struct SaqeelField<Content: View>: View {
    private let label: String
    private let hint: String?
    private let error: String?
    private let content: () -> Content

    @EnvironmentObject private var theme: SaqeelTheme

    public init(_ label: String,
                hint: String? = nil,
                error: String? = nil,
                @ViewBuilder content: @escaping () -> Content) {
        self.label = label
        self.hint = hint
        self.error = error
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.xs) {
            Text(label)
                .font(SaqeelTypography.label)
                .foregroundColor(theme.colors.textSecondary)
            content()
            if let error {
                Text(error).font(SaqeelTypography.caption).foregroundColor(theme.colors.critical)
            } else if let hint {
                Text(hint).font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
            }
        }
    }
}
```

`apps/ipad/Core/Sources/Components/SaqeelCard.swift`:
```swift
import SwiftUI
import DesignSystem

public struct SaqeelCard<Content: View>: View {
    private let content: () -> Content
    @EnvironmentObject private var theme: SaqeelTheme

    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: SaqeelSpacing.sm) {
            content()
        }
        .padding(SaqeelSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.standard))
        .overlay(
            RoundedRectangle(cornerRadius: SaqeelRadius.standard)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter StatusLozengeTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add StatusLozenge, SaqeelField, SaqeelCard components"
```

---

### Task 7: Native tab bar + header components

**Files:**
- Create: `apps/ipad/Core/Sources/Components/InspectionTabBar.swift`
- Create: `apps/ipad/Core/Sources/Components/InspectionHeader.swift`
- Test: `apps/ipad/Core/Tests/ComponentsTests/InspectionTabBarTests.swift`

**Interfaces:**
- Consumes: `SaqeelTheme`, tokens.
- Produces:
  - `enum InspectionTab: Int, CaseIterable { case dashboard, visits, virtual, profile }` with `var title: String` and `var systemImage: String`.
  - `enum SyncState { case synced, offline, pending, syncing, conflict, failed }` with `var label: String` and `var domain: LozengeDomain` (`.sync`).
  - `struct InspectionHeader: View` init `(title: String, sync: SyncState, onBack: (() -> Void)?, onBell: (() -> Void)?)`.
  - Note: the actual `TabView` container is assembled in the app target (Task 11) using native SwiftUI `TabView`; `InspectionTab` supplies its data. This keeps native tab semantics while the enum stays testable in the package.

- [ ] **Step 1: Write the failing test**

`apps/ipad/Core/Tests/ComponentsTests/InspectionTabBarTests.swift`:
```swift
import XCTest
import DesignSystem
@testable import Components

final class InspectionTabBarTests: XCTestCase {
    func test_fourTabsInOrder() {
        XCTAssertEqual(InspectionTab.allCases,
                       [.dashboard, .visits, .virtual, .profile])
    }

    func test_tabTitlesAndIcons() {
        XCTAssertEqual(InspectionTab.dashboard.title, "Dashboard")
        XCTAssertEqual(InspectionTab.visits.title, "Visits")
        XCTAssertEqual(InspectionTab.virtual.systemImage, "video.fill")
        XCTAssertEqual(InspectionTab.profile.systemImage, "person.crop.circle")
    }

    func test_syncStateUsesSyncDomain() {
        XCTAssertEqual(SyncState.conflict.domain, .sync)
        XCTAssertEqual(SyncState.offline.label, "Offline")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad/Core && swift test --filter InspectionTabBarTests`
Expected: FAIL — symbols undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/Core/Sources/Components/InspectionTabBar.swift`:
```swift
import SwiftUI
import DesignSystem

public enum InspectionTab: Int, CaseIterable {
    case dashboard, visits, virtual, profile

    public var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .visits:    return "Visits"
        case .virtual:   return "Virtual"
        case .profile:   return "Profile"
        }
    }

    public var systemImage: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .visits:    return "list.bullet.rectangle.fill"
        case .virtual:   return "video.fill"
        case .profile:   return "person.crop.circle"
        }
    }
}

public enum SyncState {
    case synced, offline, pending, syncing, conflict, failed

    public var label: String {
        switch self {
        case .synced:   return "Synced"
        case .offline:  return "Offline"
        case .pending:  return "Pending"
        case .syncing:  return "Syncing"
        case .conflict: return "Conflict"
        case .failed:   return "Failed"
        }
    }

    public var domain: LozengeDomain { .sync }

    public var tone: LozengeTone {
        switch self {
        case .synced:            return .success
        case .offline, .pending, .syncing: return .warning
        case .conflict, .failed: return .critical
        }
    }
}
```

`apps/ipad/Core/Sources/Components/InspectionHeader.swift`:
```swift
import SwiftUI
import DesignSystem

public struct InspectionHeader: View {
    private let title: String
    private let sync: SyncState
    private let onBack: (() -> Void)?
    private let onBell: (() -> Void)?

    @EnvironmentObject private var theme: SaqeelTheme

    public init(title: String,
                sync: SyncState = .synced,
                onBack: (() -> Void)? = nil,
                onBell: (() -> Void)? = nil) {
        self.title = title
        self.sync = sync
        self.onBack = onBack
        self.onBell = onBell
    }

    public var body: some View {
        HStack(spacing: SaqeelSpacing.md) {
            if let onBack {
                Button(action: onBack) {
                    Image(systemName: "chevron.backward")
                        .foregroundColor(theme.colors.text)
                }
                .frame(minWidth: SaqeelDensity.minTouchTarget,
                       minHeight: SaqeelDensity.minTouchTarget)
            }
            Text(title)
                .font(SaqeelTypography.title)
                .foregroundColor(theme.colors.text)
            Spacer(minLength: 0)
            StatusLozenge(sync.label, tone: sync.tone, domain: sync.domain)
            if let onBell {
                Button(action: onBell) {
                    Image(systemName: "bell")
                        .foregroundColor(theme.colors.text)
                }
                .frame(minWidth: SaqeelDensity.minTouchTarget,
                       minHeight: SaqeelDensity.minTouchTarget)
            }
        }
        .padding(.horizontal, SaqeelSpacing.lg)
        .frame(height: 72)
        .background(theme.colors.surface)
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad/Core && swift test --filter InspectionTabBarTests`
Expected: PASS. Also run full `swift test` to confirm the whole Core package is green.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/Core
git commit -m "feat(ipad): add native InspectionTabBar data + InspectionHeader with sync badge"
```

---

### Task 8: XcodeGen app target + Supabase dependency

**Files:**
- Create: `apps/ipad/project.yml`
- Create: `apps/ipad/InspectionApp/Config/Secrets.xcconfig`
- Create: `apps/ipad/InspectionApp/App/InspectionApp.swift` (temporary minimal `@main` to make the project generate/build)
- Create: `apps/ipad/.gitignore` (ignore `*.xcodeproj`, `.build/`, `DerivedData/`)

**Interfaces:**
- Consumes: Core package products `DesignSystem`, `Components`.
- Produces: a generatable Xcode project named `InspectionApp` with Supabase + local Core package linked; bundle id `com.mim.inspection`.

- [ ] **Step 1: Write the project config**

`apps/ipad/project.yml`:
```yaml
name: InspectionApp
options:
  bundleIdPrefix: com.mim
  deploymentTarget:
    iOS: "18.0"
packages:
  InspectionCore:
    path: Core
  Supabase:
    url: https://github.com/supabase/supabase-swift
    from: "2.0.0"
targets:
  InspectionApp:
    type: application
    platform: iOS
    sources:
      - InspectionApp
    dependencies:
      - package: InspectionCore
        product: DesignSystem
      - package: InspectionCore
        product: Components
      - package: Supabase
        product: Supabase
    configFiles:
      Debug: InspectionApp/Config/Secrets.xcconfig
      Release: InspectionApp/Config/Secrets.xcconfig
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.mim.inspection
        MARKETING_VERSION: "1.0.0"
        CURRENT_PROJECT_VERSION: 1
        CODE_SIGN_STYLE: Automatic
        GENERATE_INFOPLIST_FILE: YES
        SWIFT_VERSION: "5.9"
        TARGETED_DEVICE_FAMILY: "2"
        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad: "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight"
        SUPABASE_URL: "$(SUPABASE_URL)"
        SUPABASE_ANON_KEY: "$(SUPABASE_ANON_KEY)"
    info:
      path: InspectionApp/Info.plist
      properties:
        CFBundleDisplayName: MIM Inspection
        CFBundleName: MIM Inspection
        ITSAppUsesNonExemptEncryption: false
        UIAppFonts:
          - IBMPlexSansArabic-Regular.ttf
          - IBMPlexSansArabic-Medium.ttf
          - IBMPlexSansArabic-SemiBold.ttf
          - IBMPlexSansArabic-Bold.ttf
        SUPABASE_URL: $(SUPABASE_URL)
        SUPABASE_ANON_KEY: $(SUPABASE_ANON_KEY)
        NSCameraUsageDescription: Capture inspection evidence photos and videos.
        NSPhotoLibraryUsageDescription: Attach photos and documents to inspections.
        NSLocationWhenInUseUsageDescription: Confirm you are on-site at the factory for the inspection geofence.
  InspectionAppTests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - InspectionAppTests
    dependencies:
      - target: InspectionApp
    settings:
      base:
        GENERATE_INFOPLIST_FILE: YES
        BUNDLE_LOADER: "$(TEST_HOST)"
        TEST_HOST: "$(BUILT_PRODUCTS_DIR)/InspectionApp.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/InspectionApp"
        SWIFT_VERSION: "5.9"
schemes:
  InspectionApp:
    build:
      targets:
        InspectionApp: all
        InspectionAppTests: [test]
    run:
      config: Debug
    test:
      targets:
        - InspectionAppTests
```

`apps/ipad/InspectionApp/Config/Secrets.xcconfig`:
```
// Fill with the same project values used by apps/web (.env). Do NOT commit real keys.
SUPABASE_URL = https:/$()/YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY = YOUR-ANON-KEY
```

`apps/ipad/InspectionApp/App/InspectionApp.swift` (temporary, replaced in Task 11):
```swift
import SwiftUI

@main
struct InspectionApp: App {
    var body: some Scene {
        WindowGroup { Text("Bootstrapping…") }
    }
}
```

`apps/ipad/.gitignore`:
```
*.xcodeproj
.build/
DerivedData/
InspectionApp/Config/Secrets.local.xcconfig
```

- [ ] **Step 2: Generate and build to verify**

Run:
```bash
cd apps/ipad && xcodegen generate && \
xcodebuild -project InspectionApp.xcodeproj -scheme InspectionApp \
  -destination 'generic/platform=iOS' -configuration Debug build CODE_SIGNING_ALLOWED=NO
```
Expected: BUILD SUCCEEDED (Supabase + Core resolve; temporary `@main` compiles).
If `xcodegen` is missing: `brew install xcodegen`.

- [ ] **Step 3: Commit**

```bash
git add apps/ipad/project.yml apps/ipad/InspectionApp/Config/Secrets.xcconfig \
        apps/ipad/InspectionApp/App/InspectionApp.swift apps/ipad/.gitignore
git commit -m "feat(ipad): add XcodeGen app target with Supabase and Core packages"
```

---

### Task 9: Supabase client, secrets, AuthRepository

**Files:**
- Create: `apps/ipad/InspectionApp/Infrastructure/AppSecrets.swift`
- Create: `apps/ipad/InspectionApp/Infrastructure/SupabaseClientProvider.swift`
- Create: `apps/ipad/InspectionApp/Data/Repositories/AuthRepository.swift`
- Create: `apps/ipad/InspectionAppTests/StubAuthRepository.swift`
- Test: `apps/ipad/InspectionAppTests/AuthRepositoryContractTests.swift`

**Interfaces:**
- Consumes: Supabase SDK, `Info.plist` `SUPABASE_URL`/`SUPABASE_ANON_KEY`.
- Produces:
  - `enum AppSecrets { static var supabaseURL: URL; static var supabaseAnonKey: String }` (reads from `Bundle.main`).
  - `enum SupabaseClientProvider { static let shared: SupabaseClient }`.
  - `protocol AuthRepository { func hasValidSession() async -> Bool; func signIn(email: String, password: String) async throws; func signOut() async }`.
  - `final class SupabaseAuthRepository: AuthRepository`.
  - `StubAuthRepository` (test target) conforming to `AuthRepository`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/StubAuthRepository.swift`:
```swift
import Foundation
@testable import InspectionApp

final class StubAuthRepository: AuthRepository {
    var validSession = false
    var signInError: Error?
    private(set) var signInCalls: [(email: String, password: String)] = []
    private(set) var signOutCalled = false

    func hasValidSession() async -> Bool { validSession }

    func signIn(email: String, password: String) async throws {
        signInCalls.append((email, password))
        if let signInError { throw signInError }
        validSession = true
    }

    func signOut() async {
        signOutCalled = true
        validSession = false
    }
}
```

`apps/ipad/InspectionAppTests/AuthRepositoryContractTests.swift`:
```swift
import XCTest
@testable import InspectionApp

final class AuthRepositoryContractTests: XCTestCase {
    func test_stubSignInRecordsCredentialsAndOpensSession() async throws {
        let repo = StubAuthRepository()
        try await repo.signIn(email: "a@b.com", password: "pw")
        let valid = await repo.hasValidSession()
        XCTAssertTrue(valid)
        XCTAssertEqual(repo.signInCalls.first?.email, "a@b.com")
    }

    func test_stubSignOutClosesSession() async {
        let repo = StubAuthRepository()
        repo.validSession = true
        await repo.signOut()
        let valid = await repo.hasValidSession()
        XCTAssertFalse(valid)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `AuthRepository` undefined (won't compile).

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Infrastructure/AppSecrets.swift`:
```swift
import Foundation

public enum AppSecrets {
    public static var supabaseURL: URL {
        guard let s = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let url = URL(string: s) else {
            fatalError("SUPABASE_URL missing from Info.plist")
        }
        return url
    }

    public static var supabaseAnonKey: String {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
              !key.isEmpty else {
            fatalError("SUPABASE_ANON_KEY missing from Info.plist")
        }
        return key
    }
}
```

`apps/ipad/InspectionApp/Infrastructure/SupabaseClientProvider.swift`:
```swift
import Foundation
import Supabase

enum SupabaseClientProvider {
    static let shared = SupabaseClient(
        supabaseURL: AppSecrets.supabaseURL,
        supabaseKey: AppSecrets.supabaseAnonKey
    )
}
```

`apps/ipad/InspectionApp/Data/Repositories/AuthRepository.swift`:
```swift
import Foundation
import Supabase

protocol AuthRepository {
    func hasValidSession() async -> Bool
    func signIn(email: String, password: String) async throws
    func signOut() async
}

final class SupabaseAuthRepository: AuthRepository {
    private let client: SupabaseClient

    init(client: SupabaseClient = SupabaseClientProvider.shared) {
        self.client = client
    }

    func hasValidSession() async -> Bool {
        (try? await client.auth.session) != nil
    }

    func signIn(email: String, password: String) async throws {
        _ = try await client.auth.signIn(email: email, password: password)
    }

    func signOut() async {
        try? await client.auth.signOut()
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS (both contract tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Infrastructure apps/ipad/InspectionApp/Data apps/ipad/InspectionAppTests
git commit -m "feat(ipad): add Supabase client, AppSecrets, AuthRepository + stub"
```

---

### Task 10: AuthSession store

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Auth/AuthSession.swift`
- Test: `apps/ipad/InspectionAppTests/AuthSessionTests.swift`

**Interfaces:**
- Consumes: `AuthRepository`, `StubAuthRepository`.
- Produces:
  - `enum AuthState: Equatable { case checking, signedOut, signedIn }`.
  - `@MainActor final class AuthSession: ObservableObject` with `@Published private(set) var state: AuthState`, `init(repository:)`, `func restore() async`, `func signIn(email:password:) async`, `func signOut() async`, and `@Published var errorMessage: String?`.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/AuthSessionTests.swift`:
```swift
import XCTest
@testable import InspectionApp

@MainActor
final class AuthSessionTests: XCTestCase {
    func test_restoreWithValidSessionMovesToSignedIn() async {
        let repo = StubAuthRepository(); repo.validSession = true
        let session = AuthSession(repository: repo)
        await session.restore()
        XCTAssertEqual(session.state, .signedIn)
    }

    func test_restoreWithoutSessionMovesToSignedOut() async {
        let session = AuthSession(repository: StubAuthRepository())
        await session.restore()
        XCTAssertEqual(session.state, .signedOut)
    }

    func test_signInSuccessMovesToSignedIn() async {
        let session = AuthSession(repository: StubAuthRepository())
        await session.signIn(email: "a@b.com", password: "pw")
        XCTAssertEqual(session.state, .signedIn)
        XCTAssertNil(session.errorMessage)
    }

    func test_signInFailureSetsErrorAndStaysSignedOut() async {
        let repo = StubAuthRepository()
        repo.signInError = NSError(domain: "auth", code: 401,
                                   userInfo: [NSLocalizedDescriptionKey: "Invalid login"])
        let session = AuthSession(repository: repo)
        await session.signIn(email: "a@b.com", password: "bad")
        XCTAssertEqual(session.state, .signedOut)
        XCTAssertEqual(session.errorMessage, "Invalid login")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `AuthSession` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Auth/AuthSession.swift`:
```swift
import Foundation

enum AuthState: Equatable { case checking, signedOut, signedIn }

@MainActor
final class AuthSession: ObservableObject {
    @Published private(set) var state: AuthState = .checking
    @Published var errorMessage: String?

    private let repository: AuthRepository

    init(repository: AuthRepository = SupabaseAuthRepository()) {
        self.repository = repository
    }

    func restore() async {
        state = await repository.hasValidSession() ? .signedIn : .signedOut
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            try await repository.signIn(email: email, password: password)
            state = .signedIn
        } catch {
            errorMessage = error.localizedDescription
            state = .signedOut
        }
    }

    func signOut() async {
        await repository.signOut()
        state = .signedOut
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO`
Expected: PASS (4 tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp/Features/Auth/AuthSession.swift apps/ipad/InspectionAppTests/AuthSessionTests.swift
git commit -m "feat(ipad): add AuthSession store with sign-in/out state"
```

---

### Task 11: Login + AuthGate + themed shell (@main)

**Files:**
- Create: `apps/ipad/InspectionApp/Features/Auth/LoginView.swift`
- Create: `apps/ipad/InspectionApp/Features/Shell/RootShellView.swift`
- Create: `apps/ipad/InspectionApp/App/AuthGate.swift`
- Create: `apps/ipad/InspectionApp/App/ThemeRoot.swift`
- Modify: `apps/ipad/InspectionApp/App/InspectionApp.swift` (replace temporary `@main`)
- Add fonts: `apps/ipad/InspectionApp/Resources/Fonts/IBMPlexSansArabic-{Regular,Medium,SemiBold,Bold}.ttf` (copy from `design/saqeel-v5-final/assets/fonts/`)

**Interfaces:**
- Consumes: `SaqeelTheme` (DesignSystem), `InspectionTab`, `InspectionHeader`, `SaqeelButton`, `SaqeelField` (Components), `AuthSession`.
- Produces: `InspectionApp` scene that shows `LoginView` when `signedOut`, and `RootShellView` (native `TabView` with the 4 tabs) when `signedIn`. This is the phase deliverable.

- [ ] **Step 1: Write the failing test**

`apps/ipad/InspectionAppTests/RootShellTabsTests.swift`:
```swift
import XCTest
import Components
@testable import InspectionApp

final class RootShellTabsTests: XCTestCase {
    // The shell must expose exactly the four inspector tabs, in order.
    func test_shellUsesFourInspectorTabs() {
        XCTAssertEqual(RootShellView.tabs, InspectionTab.allCases)
        XCTAssertEqual(RootShellView.tabs.count, 4)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO`
Expected: FAIL — `RootShellView` undefined.

- [ ] **Step 3: Write minimal implementation**

`apps/ipad/InspectionApp/Features/Shell/RootShellView.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct RootShellView: View {
    static let tabs = InspectionTab.allCases

    @State private var selection: InspectionTab = .dashboard
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        TabView(selection: $selection) {
            ForEach(Self.tabs, id: \.self) { tab in
                tabContent(tab)
                    .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                    .tag(tab)
            }
        }
        .tint(theme.colors.primary)
    }

    @ViewBuilder
    private func tabContent(_ tab: InspectionTab) -> some View {
        VStack(spacing: 0) {
            InspectionHeader(title: tab.title, sync: .synced)
            Spacer()
            Text("\(tab.title) — coming in a later phase")
                .font(SaqeelTypography.body)
                .foregroundColor(theme.colors.textSecondary)
            Spacer()
        }
        .background(theme.colors.canvas)
    }
}
```

`apps/ipad/InspectionApp/Features/Auth/LoginView.swift`:
```swift
import SwiftUI
import DesignSystem
import Components

struct LoginView: View {
    @EnvironmentObject private var session: AuthSession
    @EnvironmentObject private var theme: SaqeelTheme

    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false

    var body: some View {
        VStack(spacing: SaqeelSpacing.lg) {
            Text("MIM Inspection")
                .font(SaqeelTypography.display)
                .foregroundColor(theme.colors.text)

            SaqeelField("Email") {
                TextField("", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .padding(SaqeelSpacing.sm)
                    .frame(height: SaqeelDensity.field)
                    .background(theme.colors.surface)
                    .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                        .stroke(theme.colors.borderControl, lineWidth: 1))
            }

            SaqeelField("Password", error: session.errorMessage) {
                SecureField("", text: $password)
                    .padding(SaqeelSpacing.sm)
                    .frame(height: SaqeelDensity.field)
                    .background(theme.colors.surface)
                    .overlay(RoundedRectangle(cornerRadius: SaqeelRadius.input)
                        .stroke(theme.colors.borderControl, lineWidth: 1))
            }

            SaqeelButton("Sign in", isLoading: isSubmitting,
                         isEnabled: !email.isEmpty && !password.isEmpty) {
                Task {
                    isSubmitting = true
                    await session.signIn(email: email, password: password)
                    isSubmitting = false
                }
            }
        }
        .padding(SaqeelSpacing.xl)
        .frame(maxWidth: 480)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.colors.canvas)
    }
}
```

`apps/ipad/InspectionApp/App/AuthGate.swift`:
```swift
import SwiftUI

struct AuthGate<SignedIn: View>: View {
    @EnvironmentObject private var session: AuthSession
    private let signedIn: () -> SignedIn

    init(@ViewBuilder signedIn: @escaping () -> SignedIn) {
        self.signedIn = signedIn
    }

    var body: some View {
        Group {
            switch session.state {
            case .checking: ProgressView()
            case .signedOut: LoginView()
            case .signedIn: signedIn()
            }
        }
        .task { if session.state == .checking { await session.restore() } }
    }
}
```

`apps/ipad/InspectionApp/App/ThemeRoot.swift`:
```swift
import SwiftUI
import DesignSystem

struct ThemeRoot: View {
    @Environment(\.colorScheme) private var systemScheme
    @EnvironmentObject private var theme: SaqeelTheme

    var body: some View {
        AuthGate { RootShellView() }
            .onAppear { theme.apply(dark: systemScheme == .dark) }
            .onChange(of: systemScheme) { _, new in theme.apply(dark: new == .dark) }
    }
}
```

`apps/ipad/InspectionApp/App/InspectionApp.swift` (replace temporary):
```swift
import SwiftUI
import DesignSystem

@main
struct InspectionApp: App {
    @StateObject private var theme = SaqeelTheme()
    @StateObject private var session = AuthSession()

    var body: some Scene {
        WindowGroup {
            ThemeRoot()
                .environmentObject(theme)
                .environmentObject(session)
        }
    }
}
```

Copy the four IBM Plex Sans Arabic TTFs into `apps/ipad/InspectionApp/Resources/Fonts/` from `design/saqeel-v5-final/assets/fonts/` and confirm the filenames match the `UIAppFonts` list in `project.yml` (rename if needed). Re-run `xcodegen generate` so the resources are bundled.

- [ ] **Step 4: Run tests + build to verify**

Run:
```bash
cd apps/ipad && xcodegen generate && \
xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp \
  -destination 'platform=iOS Simulator,name=iPad Pro (11-inch)' CODE_SIGNING_ALLOWED=NO
```
Expected: BUILD SUCCEEDED and `RootShellTabsTests` PASS. Launch in the iPad simulator: login screen renders in Saqeel green; on valid Supabase credentials the four-tab shell appears with a native tab bar and header sync badge.

- [ ] **Step 5: Commit**

```bash
git add apps/ipad/InspectionApp apps/ipad/InspectionAppTests
git commit -m "feat(ipad): wire Login, AuthGate, and themed native tab shell"
```

---

## Self-Review

**Spec coverage (Phase 0 slice of the design spec §10):**
- XcodeGen project → Task 1, 8. ✅
- DesignSystem port (colors, typography, spacing, radius, density, RTL-safe) → Tasks 2–4. ✅
- Core Components (TabBar data, Header, Button, Field, Lozenge, Card) → Tasks 5–7. ✅
- Supabase client + Auth + Login → Tasks 8–11. ✅
- "Shell runs, login works" deliverable → Task 11. ✅
- Out-of-phase (correctly deferred): GRDB offline (Phase 3), Dashboard/Visits data (Phase 1), geofence (Phase 4). ✅

**Placeholder scan:** No "TBD"/"handle errors"/"similar to". Every code step shows full code. The temporary `@main` in Task 8 is explicitly replaced in Task 11. ✅

**Type consistency:** `SaqeelColorScheme` fields used identically across Tasks 2/5/6/7. `AuthRepository` signature identical in Tasks 9/10. `InspectionTab.allCases` used in Task 7 and Task 11. `SaqeelDensity.field`/`minTouchTarget`, `SaqeelRadius.input`, `SaqeelTypography.action` referenced consistently. `AuthState` cases match between store (Task 10) and AuthGate (Task 11). ✅

**Note for executor:** IBM Plex Sans Arabic filenames must match `UIAppFonts` exactly; `Font.custom` falls back to system in the test host, so token font tests assert the family name string, not glyph metrics.

---

## Subsequent phases (separate plans, written when we reach them)

- **Phase 1** — Dashboard + Visits (domain models, repositories, list/filter UI, KPI cards).
- **Phase 2** — Inspection Workspace (checklist, evidence, violations, action forms, factory verify, signature, submit online).
- **Phase 3** — Offline-first (GRDB outbox, drafts, sync-state, conflict resolution).
- **Phase 4** — Startup / Geofence / Journey (MapKit, CoreLocation).
- **Phase 5** — Factory 360 + Virtual + Profile.

Each gets its own `docs/superpowers/plans/YYYY-MM-DD-ipad-inspector-phaseN-*.md`.
