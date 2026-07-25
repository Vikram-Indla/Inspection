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
