import SwiftUI
import DesignSystem

/// A status pill: a colored dot + label in a soft tinted capsule, matching the
/// Saqeel field cards (e.g. "● Pending review", "● Critical"). Status is always
/// carried by the dot colour AND the label text — never colour alone.
public struct StatusPill: View {
    private let label: String
    private let tone: LozengeTone
    @EnvironmentObject private var theme: SaqeelTheme

    public init(_ label: String, tone: LozengeTone) {
        self.label = label
        self.tone = tone
    }

    public var body: some View {
        let color = tone.tint(in: theme.colors)
        HStack(spacing: SaqeelSpacing.xs) {
            Circle()
                .fill(color)
                .frame(width: 7, height: 7)
            Text(label)
                .font(SaqeelTypography.micro)
                .foregroundColor(theme.colors.text)
        }
        .padding(.vertical, 5)
        .padding(.horizontal, SaqeelSpacing.sm)
        .background(
            Capsule().fill(color.opacity(0.12))
        )
    }
}
