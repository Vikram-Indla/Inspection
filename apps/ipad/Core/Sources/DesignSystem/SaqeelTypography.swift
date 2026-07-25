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
