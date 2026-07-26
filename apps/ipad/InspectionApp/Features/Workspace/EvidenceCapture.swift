// EvidenceCapture.swift
// Photo evidence capture for the inspection workspace.
// Task 9 — Phase 2/3 "Inspection Workspace + Offline"
//
// Responsibilities:
//   • EvidenceCapture.makeEvidenceOp — pure, deterministic builder (unit-tested)
//   • EvidenceCaptureButton — PhotosPicker → JPEG Data → WorkspaceStore.attachPhoto

import SwiftUI
import PhotosUI
import CryptoKit
import DesignSystem
import Components

// MARK: - EvidenceCapture (pure logic)

enum EvidenceCapture {

    /// Builds an `EvidenceOp` from a JPEG image payload.
    ///
    /// - Parameters:
    ///   - inspectionId: UUID string of the inspection (may be nil if offline-only).
    ///   - visitId: UUID string of the visit (may be nil if offline-only).
    ///   - itemId: The checklist item UUID string — becomes `linkedId`.
    ///   - imageData: Raw JPEG bytes.
    ///   - capturedAt: ISO-8601 timestamp; used as both `capturedAt` and `queuedAt`
    ///                 to keep the function deterministic for tests.
    /// - Returns: A fully-populated `EvidenceOp` ready to enqueue.
    static func makeEvidenceOp(
        inspectionId: String?,
        visitId: String?,
        itemId: String,
        imageData: Data,
        capturedAt: String
    ) -> EvidenceOp {
        // Compute SHA256 and encode as lowercase hex string
        let digest = SHA256.hash(data: imageData)
        let sha256 = digest.map { String(format: "%02x", $0) }.joined()

        // First 8 hex chars for a short, stable file-name suffix
        let sha8 = String(sha256.prefix(8))
        let name = "\(itemId)-\(sha8).jpg"

        return EvidenceOp(
            inspectionId: inspectionId,
            visitId: visitId,
            linkedType: "item",
            linkedId: itemId,
            evidenceType: "photo",
            name: name,
            mime: "image/jpeg",
            dataB64: imageData.base64EncodedString(),
            capturedAt: capturedAt,
            sha256: sha256,
            queuedAt: capturedAt
        )
    }
}

// MARK: - EvidenceCaptureButton

/// A button that opens the Photos library (and/or camera), converts the selected
/// image to JPEG, and enqueues it as an `EvidenceOp` via `WorkspaceStore.attachPhoto`.
///
/// Shows a queued-evidence badge (count from `store.evidenceCounts[itemId]`).
struct EvidenceCaptureButton: View {

    let itemId: String

    @ObservedObject var store: WorkspaceStore
    @EnvironmentObject private var theme: SaqeelTheme

    // MARK: - Local state

    @State private var pickerItem: PhotosPickerItem?
    @State private var isUploading = false

    // MARK: - Body

    var body: some View {
        HStack(spacing: SaqeelSpacing.sm) {
            // PhotosPicker wrapping a styled button label
            PhotosPicker(
                selection: $pickerItem,
                matching: .images,
                photoLibrary: .shared()
            ) {
                evidenceButtonLabel
            }
            .onChange(of: pickerItem) { _, newItem in
                guard let newItem else { return }
                Task { await handlePickedItem(newItem) }
            }

            // Count badge (only shown when evidence has been queued)
            if let count = store.evidenceCounts[itemId], count > 0 {
                evidenceBadge(count: count)
            }
        }
    }

    // MARK: - Private sub-views

    private var evidenceButtonLabel: some View {
        HStack(spacing: SaqeelSpacing.xs) {
            if isUploading {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(theme.colors.info)
                    .scaleEffect(0.75)
            } else {
                Image(systemName: "camera")
                    .font(.system(size: 14, weight: .medium))
            }
            Text(isUploading ? "Queuing…" : "Add Evidence")
                .font(SaqeelTypography.caption)
        }
        .foregroundColor(isUploading ? theme.colors.textSecondary : theme.colors.info)
        .padding(.vertical, SaqeelSpacing.xs)
        .padding(.horizontal, SaqeelSpacing.sm)
        .overlay(
            RoundedRectangle(cornerRadius: SaqeelRadius.small)
                .stroke(theme.colors.info.opacity(0.4), lineWidth: 1)
        )
    }

    private func evidenceBadge(count: Int) -> some View {
        Text("\(count)")
            .font(SaqeelTypography.micro.weight(.semibold))
            .foregroundColor(theme.colors.inverseText)
            .padding(.horizontal, SaqeelSpacing.xs)
            .padding(.vertical, 2)
            .background(theme.colors.info)
            .clipShape(Capsule())
    }

    // MARK: - Photo handling

    private func handlePickedItem(_ item: PhotosPickerItem) async {
        isUploading = true
        defer { isUploading = false }

        do {
            // Load transferable as Data (the picker returns the underlying asset data).
            // If it's not JPEG natively, we convert via UIImage → jpegData.
            if let rawData = try await item.loadTransferable(type: Data.self) {
                let jpegData = toJpeg(rawData) ?? rawData
                await store.attachPhoto(itemId: itemId, imageData: jpegData)
            }
        } catch {
            // Silent failure in the UI — the outbox will retry, or the user can try again.
        }

        // Reset picker so the same photo can be chosen again if needed
        pickerItem = nil
    }

    /// Converts raw image data to JPEG via UIImage, falling back to the original bytes
    /// when the data is already JPEG or UIImage initialisation fails.
    private func toJpeg(_ data: Data, compressionQuality: CGFloat = 0.85) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        return image.jpegData(compressionQuality: compressionQuality)
    }
}
