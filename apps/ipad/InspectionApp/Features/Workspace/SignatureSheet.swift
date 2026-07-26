// SignatureSheet.swift
// Signature capture sheet (PencilKit) + submission snapshot builder.
// Task 10 — Phase 2/3 "Inspection Workspace + Offline"

import SwiftUI
import PencilKit
import DesignSystem
import Components

// MARK: - SnapshotBuilder

/// Pure, stateless builder for submission snapshot and acknowledgement payloads.
/// All functions are `static` so they can be unit-tested without a live store.
enum SnapshotBuilder {

    // MARK: - buildSnapshot

    /// Builds the submission snapshot keyed by item CODE (not UUID).
    ///
    /// - Parameters:
    ///   - inspectionId: The UUID string of the inspection.
    ///   - answers: Dictionary keyed by `item.id.uuidString` → `Answer`.
    ///   - items: Flat list of all `InspectionItemDef` for this workspace.
    ///   - capturedAt: ISO-8601 timestamp string.
    /// - Returns: A `JSONValue.object` with `inspectionId`, `capturedAt`,
    ///   `submitted_offline: true`, and `answers` keyed by item code.
    static func buildSnapshot(
        inspectionId: String,
        answers: [String: Answer],
        items: [InspectionItemDef],
        capturedAt: String
    ) -> JSONValue {
        // Build a UUID-string → code lookup for fast resolution
        let codeByItemId: [String: String] = Dictionary(
            uniqueKeysWithValues: items.map { ($0.id.uuidString, $0.code) }
        )

        var answersMap: [String: JSONValue] = [:]
        for (itemId, answer) in answers {
            // Only include items whose code we can resolve and whose value is set
            guard let code = codeByItemId[itemId],
                  answer.value != nil else { continue }

            var fields: [String: JSONValue] = [:]
            if let v = answer.value { fields["value"] = .string(v) }
            if let n = answer.note  { fields["note"]  = .string(n) }
            if let d = answer.date  { fields["date"]  = .string(d) }
            answersMap[code] = .object(fields)
        }

        return .object([
            "inspectionId":      .string(inspectionId),
            "capturedAt":        .string(capturedAt),
            "submitted_offline": .bool(true),
            "answers":           .object(answersMap)
        ])
    }

    // MARK: - buildAcknowledgement

    /// Builds the signer acknowledgement payload.
    ///
    /// - Parameters:
    ///   - name: The signer's full name.
    ///   - signedAt: ISO-8601 timestamp string.
    ///   - pngBase64: Base64-encoded PNG data (no prefix).
    /// - Returns: A `JSONValue.object` with `name`, `signed`, `signed_at`,
    ///   and `signature_data_url` (data-URL form: `data:image/png;base64,<data>`).
    static func buildAcknowledgement(
        name: String,
        signedAt: String,
        pngBase64: String
    ) -> JSONValue {
        return .object([
            "name":               .string(name),
            "signed":             .bool(true),
            "signed_at":          .string(signedAt),
            "signature_data_url": .string("data:image/png;base64,\(pngBase64)")
        ])
    }
}

// MARK: - PKCanvasRepresentable

/// UIViewRepresentable wrapping PencilKit's `PKCanvasView` for SwiftUI.
private struct PKCanvasRepresentable: UIViewRepresentable {

    @Binding var canvasView: PKCanvasView

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.tool = PKInkingTool(.pen, color: .label, width: 2)
        canvasView.drawingPolicy = .anyInput   // Accept finger and Apple Pencil
        canvasView.backgroundColor = .systemBackground
        canvasView.isOpaque = false
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        // Nothing to update from SwiftUI state — mutations go through canvasView binding.
    }
}

// MARK: - SignatureSheet

/// Full-screen sheet that collects a signer name + PencilKit signature, then
/// calls `store.submit(ack:)` with a real acknowledgement payload on confirm.
struct SignatureSheet: View {

    @ObservedObject var store: WorkspaceStore

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var theme: SaqeelTheme

    // MARK: - Local state

    @State private var canvasView = PKCanvasView()
    @State private var signerName: String = ""
    @State private var isSubmitting = false
    @State private var canvasIsEmpty = true
    @State private var nameError: String? = nil

    // MARK: - Computed

    private var canConfirm: Bool {
        !signerName.trimmingCharacters(in: .whitespaces).isEmpty && !canvasIsEmpty
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
                .overlay(theme.colors.border)
            content
            Divider()
                .overlay(theme.colors.border)
            actionBar
        }
        .background(theme.colors.canvas)
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Sign & Submit")
                .font(SaqeelTypography.heading)
                .foregroundColor(theme.colors.text)
            Spacer()
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(theme.colors.textSecondary)
            }
            .accessibilityLabel("Close")
        }
        .padding(.horizontal, SaqeelSpacing.lg)
        .padding(.vertical, SaqeelSpacing.md)
        .background(theme.colors.surface)
    }

    // MARK: - Content

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: SaqeelSpacing.lg) {

                // Signer name field
                SaqeelField(
                    "Signer Name",
                    hint: "Enter the full name of the person signing",
                    error: nameError
                ) {
                    TextField("Full name", text: $signerName)
                        .font(SaqeelTypography.body)
                        .foregroundColor(theme.colors.text)
                        .padding(SaqeelSpacing.sm)
                        .background(theme.colors.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: SaqeelRadius.small)
                                .stroke(nameError != nil ? theme.colors.critical : theme.colors.borderControl, lineWidth: 1)
                        )
                        .onChange(of: signerName) { _, newName in
                            // Clear error once the user starts typing
                            if !newName.isEmpty { nameError = nil }
                        }
                }

                // Signature canvas
                VStack(alignment: .leading, spacing: SaqeelSpacing.xs) {
                    Text("Signature")
                        .font(SaqeelTypography.label)
                        .foregroundColor(theme.colors.textSecondary)

                    ZStack(alignment: .center) {
                        RoundedRectangle(cornerRadius: SaqeelRadius.large)
                            .stroke(theme.colors.borderControl, lineWidth: 1)
                            .background(
                                RoundedRectangle(cornerRadius: SaqeelRadius.large)
                                    .fill(theme.colors.surface)
                            )

                        if canvasIsEmpty {
                            Text("Draw your signature here")
                                .font(SaqeelTypography.caption)
                                .foregroundColor(theme.colors.textSecondary)
                                .allowsHitTesting(false)
                        }

                        PKCanvasRepresentable(canvasView: $canvasView)
                            .clipShape(RoundedRectangle(cornerRadius: SaqeelRadius.large))
                            .onChange(of: canvasView.drawing) { _, newDrawing in
                                canvasIsEmpty = newDrawing.strokes.isEmpty
                            }
                    }
                    .frame(height: 220)
                }
            }
            .padding(SaqeelSpacing.lg)
        }
    }

    // MARK: - Action bar

    private var actionBar: some View {
        HStack(spacing: SaqeelSpacing.md) {
            SaqeelButton("Clear", style: .secondary) {
                canvasView.drawing = PKDrawing()
                canvasIsEmpty = true
            }

            SaqeelButton(
                isSubmitting ? "Submitting…" : "Confirm & Submit",
                style: .primary,
                isLoading: isSubmitting,
                isEnabled: canConfirm && !isSubmitting
            ) {
                Task { await handleConfirm() }
            }
        }
        .padding(.horizontal, SaqeelSpacing.lg)
        .padding(.vertical, SaqeelSpacing.md)
        .background(theme.colors.surface)
    }

    // MARK: - Confirm action

    @MainActor
    private func handleConfirm() async {
        let trimmedName = signerName.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else {
            nameError = "Name is required"
            return
        }
        guard !canvasIsEmpty else { return }

        isSubmitting = true

        // Rasterize the canvas drawing to PNG
        let bounds = canvasView.drawing.bounds.isEmpty
            ? CGRect(x: 0, y: 0, width: canvasView.bounds.width, height: 220)
            : canvasView.drawing.bounds

        let image = canvasView.drawing.image(from: bounds, scale: UIScreen.main.scale)
        let pngBase64: String
        if let pngData = image.pngData() {
            pngBase64 = pngData.base64EncodedString()
        } else {
            pngBase64 = ""
        }

        let signedAt = ISO8601DateFormatter().string(from: Date())
        let ack = SnapshotBuilder.buildAcknowledgement(
            name: trimmedName,
            signedAt: signedAt,
            pngBase64: pngBase64
        )

        await store.submit(ack: ack)

        isSubmitting = false
        dismiss()
    }
}
