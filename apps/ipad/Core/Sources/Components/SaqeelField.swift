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
