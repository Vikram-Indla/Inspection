import SwiftUI
import DesignSystem

public struct InspectionHeader: View {
    private let title: String
    private let subtitle: String?
    private let sync: SyncState
    private let onBack: (() -> Void)?
    private let onBell: (() -> Void)?

    @EnvironmentObject private var theme: SaqeelTheme

    public init(title: String,
                subtitle: String? = nil,
                sync: SyncState = .synced,
                onBack: (() -> Void)? = nil,
                onBell: (() -> Void)? = nil) {
        self.title = title
        self.subtitle = subtitle
        self.sync = sync
        self.onBack = onBack
        self.onBell = onBell
    }

    public var body: some View {
        HStack(alignment: .center, spacing: SaqeelSpacing.md) {
            if let onBack {
                Button(action: onBack) {
                    Image(systemName: "chevron.backward")
                        .foregroundColor(theme.colors.text)
                }
                .frame(minWidth: SaqeelDensity.minTouchTarget,
                       minHeight: SaqeelDensity.minTouchTarget)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(SaqeelTypography.title)
                    .foregroundColor(theme.colors.text)
                if let subtitle {
                    Text(subtitle)
                        .font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                }
            }
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
        .frame(minHeight: 76)
        .padding(.vertical, SaqeelSpacing.sm)
        .background(theme.colors.surface)
    }
}
