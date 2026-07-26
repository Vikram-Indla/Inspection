// ChecklistItemView.swift
// Checklist item response control for the inspection workspace.
// Task 8 — Phase 2/3 "Inspection Workspace + Offline"
// Task 9 — Photo evidence capture wired via EvidenceCaptureButton.

import SwiftUI
import DesignSystem
import Components

// MARK: - ResponseControlKind

/// Determines which response control to render for a given InspectionItemDef.
/// Rules (in priority order):
///   1. If responses contains "value_date" → .date
///   2. If responses is non-empty → .choice([...])
///   3. Otherwise (nil or empty) → .text
enum ResponseControlKind: Equatable {
    case choice([String])
    case text
    case date

    /// Pure mapping from an item definition to its response control kind.
    static func control(for item: InspectionItemDef) -> ResponseControlKind {
        guard let responses = item.responseModel.responses, !responses.isEmpty else {
            return .text
        }
        if responses.contains("value_date") {
            return .date
        }
        return .choice(responses)
    }
}

// MARK: - ChecklistItemView

/// Renders a single inspection checklist item with its response control.
/// - Shows item code (monospaced), title, optional "required" marker.
/// - Collapsible guidance (guidanceEn).
/// - Response control: segmented choice / text field / date picker, bound through store.answer().
/// - Evidence capture: Task 9 — `EvidenceCaptureButton` wired into `store.attachPhoto`.
struct ChecklistItemView: View {

    let item: InspectionItemDef
    let answer: Answer?

    /// Called whenever the user changes the response value.
    let onAnswer: (Answer) async -> Void

    /// WorkspaceStore injected so EvidenceCaptureButton can call attachPhoto
    /// and read evidenceCounts. Task 9.
    @ObservedObject var store: WorkspaceStore

    @EnvironmentObject private var theme: SaqeelTheme
    @State private var isGuidanceExpanded = false
    @State private var noteText: String = ""
    @State private var selectedDate: Date = Date()

    // Track whether the date picker state is initialised from existing answer
    @State private var dateInitialised = false

    var body: some View {
        SaqeelCard {
            // MARK: Header row
            HStack(alignment: .top, spacing: SaqeelSpacing.sm) {
                VStack(alignment: .leading, spacing: SaqeelSpacing.xs) {
                    // Code in monospaced style
                    Text(item.code)
                        .font(.system(.caption, design: .monospaced).weight(.medium))
                        .foregroundColor(theme.colors.textSecondary)

                    // Title
                    Text(item.title)
                        .font(SaqeelTypography.subheading)
                        .foregroundColor(theme.colors.text)
                }

                Spacer(minLength: 0)

                // Required marker
                if item.responseModel.requirement == "required" {
                    Text("Required")
                        .font(SaqeelTypography.micro)
                        .foregroundColor(theme.colors.critical)
                        .padding(.vertical, SaqeelSpacing.hairline)
                        .padding(.horizontal, SaqeelSpacing.xs)
                        .overlay(
                            RoundedRectangle(cornerRadius: SaqeelRadius.small)
                                .stroke(theme.colors.critical.opacity(0.4), lineWidth: 1)
                        )
                }
            }

            // MARK: Guidance (collapsible)
            if let guidance = item.guidanceEn, !guidance.isEmpty {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isGuidanceExpanded.toggle()
                    }
                } label: {
                    HStack(spacing: SaqeelSpacing.xs) {
                        Image(systemName: isGuidanceExpanded ? "chevron.up" : "chevron.down")
                            .font(SaqeelTypography.micro)
                        Text("Guidance")
                            .font(SaqeelTypography.caption)
                    }
                    .foregroundColor(theme.colors.info)
                }
                .buttonStyle(.plain)

                if isGuidanceExpanded {
                    Text(guidance)
                        .font(SaqeelTypography.caption)
                        .foregroundColor(theme.colors.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }

            // MARK: Response control
            responseControl

            // MARK: Evidence capture — Task 9
            EvidenceCaptureButton(itemId: item.id.uuidString, store: store)
        }
        .onAppear {
            // Initialise local state from existing answer (once)
            if let existing = answer?.note {
                noteText = existing
            }
            if !dateInitialised, let dateStr = answer?.date,
               let parsed = ISO8601DateFormatter().date(from: dateStr) {
                selectedDate = parsed
                dateInitialised = true
            }
        }
    }

    // MARK: - Response control switcher

    @ViewBuilder
    private var responseControl: some View {
        let kind = ResponseControlKind.control(for: item)
        switch kind {
        case .choice(let options):
            choiceControl(options: options)
        case .text:
            textControl
        case .date:
            dateControl
        }
    }

    // MARK: Choice control (SaqeelSegmented)

    private func choiceControl(options: [String]) -> some View {
        let segments = options.map { opt in
            SaqeelSegmented<String>.Segment(
                value: opt,
                title: opt.replacingOccurrences(of: "_", with: " ").capitalized
            )
        }
        // Use a local binding that mirrors the answer value
        let selectedBinding = Binding<String>(
            get: { answer?.value ?? options[0] },
            set: { newVal in
                Task { await onAnswer(Answer(value: newVal, note: answer?.note, date: answer?.date)) }
            }
        )
        return SaqeelSegmented(segments, selection: selectedBinding)
    }

    // MARK: Text control (SaqeelField)

    private var textControl: some View {
        SaqeelField("Response") {
            TextField("Enter response", text: $noteText, axis: .vertical)
                .font(SaqeelTypography.field)
                .foregroundColor(theme.colors.text)
                .lineLimit(2...5)
                .padding(SaqeelSpacing.sm)
                .background(theme.colors.canvas)
                .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.small))
                .overlay(
                    RoundedRectangle(cornerRadius: SaqeelRadius.small)
                        .stroke(theme.colors.border, lineWidth: 1)
                )
                .onChange(of: noteText) { _, newVal in
                    Task {
                        await onAnswer(Answer(value: newVal.isEmpty ? nil : newVal,
                                             note: nil,
                                             date: answer?.date))
                    }
                }
        }
    }

    // MARK: Date control (DatePicker)

    private var dateControl: some View {
        SaqeelField("Date") {
            DatePicker("", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
                .onChange(of: selectedDate) { _, newDate in
                    let iso = ISO8601DateFormatter().string(from: newDate)
                    Task {
                        await onAnswer(Answer(value: iso, note: answer?.note, date: iso))
                    }
                }
        }
    }
}
