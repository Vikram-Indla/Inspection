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
