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

    var body: some View {
        SaqeelCard {
            VStack(alignment: .leading, spacing: SaqeelSpacing.sm) {
                Text(item.factory?.name ?? "Unknown factory")
                    .font(SaqeelTypography.subheading)
                    .foregroundColor(theme.colors.text)
                if let code = item.factory?.factoryCode {
                    Text(code).font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                }
                Text("\(item.visit.visitType) · \(item.visit.executionMode.rawValue)")
                    .font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                HStack(spacing: SaqeelSpacing.xs) {
                    StatusLozenge(item.visit.planningStatus.rawValue,
                                  tone: VisitStatusPresentation.planningTone(item.visit.planningStatus),
                                  domain: .plan)
                    StatusLozenge(VisitStatusPresentation.lifecycleLabel(item.inspectionLifecycle),
                                  tone: VisitStatusPresentation.lifecycleTone(item.inspectionLifecycle),
                                  domain: .review)
                }
                Text("\(Self.dateFmt.string(from: item.visit.windowStart)) – \(Self.dateFmt.string(from: item.visit.windowEnd))")
                    .font(SaqeelTypography.caption).foregroundColor(theme.colors.textSecondary)
                SaqeelButton("Open", style: .secondary, action: onOpen)
            }
        }
    }
}
