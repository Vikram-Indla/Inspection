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
