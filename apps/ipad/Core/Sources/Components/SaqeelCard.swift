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
