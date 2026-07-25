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
