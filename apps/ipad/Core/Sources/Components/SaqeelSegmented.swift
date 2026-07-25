import SwiftUI
import DesignSystem

/// A Saqeel-styled segmented control: a light track with a white raised
/// "selected" segment, matching the design system's field patterns (not the
/// default iOS segmented control). Each segment shows a title and optional count.
public struct SaqeelSegmented<Value: Hashable>: View {
    public struct Segment: Identifiable {
        public let value: Value
        public let title: String
        public let count: Int?
        public var id: Value { value }
        public init(value: Value, title: String, count: Int? = nil) {
            self.value = value; self.title = title; self.count = count
        }
    }

    private let segments: [Segment]
    @Binding private var selection: Value
    @EnvironmentObject private var theme: SaqeelTheme
    @Namespace private var ns

    public init(_ segments: [Segment], selection: Binding<Value>) {
        self.segments = segments
        self._selection = selection
    }

    public var body: some View {
        HStack(spacing: SaqeelSpacing.hairline) {
            ForEach(segments) { seg in
                let selected = seg.value == selection
                Button {
                    withAnimation(.easeOut(duration: 0.18)) { selection = seg.value }
                } label: {
                    HStack(spacing: SaqeelSpacing.xs) {
                        Text(seg.title)
                            .font(SaqeelTypography.action)
                        if let count = seg.count {
                            Text("\(count)")
                                .font(SaqeelTypography.micro)
                                .foregroundColor(selected ? theme.colors.primary : theme.colors.textSecondary)
                        }
                    }
                    .foregroundColor(selected ? theme.colors.text : theme.colors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background {
                        if selected {
                            RoundedRectangle(cornerRadius: SaqeelRadius.standard)
                                .fill(theme.colors.surface)
                                .shadow(color: theme.colors.text.opacity(0.10), radius: 3, y: 1)
                                .matchedGeometryEffect(id: "seg", in: ns)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(SaqeelSpacing.hairline)
        .background(
            RoundedRectangle(cornerRadius: SaqeelRadius.large)
                .fill(theme.colors.canvas)
        )
        .overlay(
            RoundedRectangle(cornerRadius: SaqeelRadius.large)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }
}
