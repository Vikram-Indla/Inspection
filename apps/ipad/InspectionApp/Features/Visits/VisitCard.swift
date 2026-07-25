import SwiftUI
import DesignSystem
import Components

struct VisitCard: View {
    let item: VisitListItem
    let onOpen: () -> Void
    @EnvironmentObject private var theme: SaqeelTheme

    private static let dateFmt: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "d MMM"; return f
    }()

    private var subtitle: String {
        [item.visit.visitType.capitalized,
         item.visit.executionMode.rawValue.capitalized,
         item.factory?.city].compactMap { $0 }.joined(separator: " · ")
    }

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: SaqeelSpacing.xs) {
                HStack(alignment: .firstTextBaseline) {
                    Text(item.factory?.factoryCode ?? item.visit.visitType.uppercased())
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .foregroundColor(theme.colors.textSecondary)
                    Spacer(minLength: SaqeelSpacing.sm)
                    StatusPill(VisitStatusPresentation.lifecycleLabel(item.inspectionLifecycle),
                               tone: VisitStatusPresentation.lifecycleTone(item.inspectionLifecycle))
                }

                Text(item.factory?.name ?? "Unknown factory")
                    .font(SaqeelTypography.subheading)
                    .foregroundColor(theme.colors.text)
                    .lineLimit(1)

                Text(subtitle)
                    .font(SaqeelTypography.caption)
                    .foregroundColor(theme.colors.textSecondary)
                    .lineLimit(1)

                HStack(spacing: SaqeelSpacing.xs) {
                    StatusPill(item.visit.planningStatus.rawValue.capitalized,
                               tone: VisitStatusPresentation.planningTone(item.visit.planningStatus))
                    Spacer(minLength: 0)
                    Text("\(Self.dateFmt.string(from: item.visit.windowStart)) – \(Self.dateFmt.string(from: item.visit.windowEnd))")
                        .font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                }
                .padding(.top, SaqeelSpacing.hairline)
            }
            .padding(SaqeelSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.large))
            .overlay(
                RoundedRectangle(cornerRadius: SaqeelRadius.large)
                    .stroke(theme.colors.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
