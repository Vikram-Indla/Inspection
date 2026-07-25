# Phase 0 → Phase 1 carried-over items

From the Phase 0 final whole-branch review. None block Phase 0; address these in/before Phase 1.

## Important

- **A. Secrets / launch ergonomics.** `SupabaseClientProvider.shared` (a `static let`) reads
  `AppSecrets`, which `fatalError`s on missing/empty keys. `AuthSession()`'s default init
  constructs `SupabaseAuthRepository()` eagerly at `@main` startup, so a fresh clone without
  `Secrets.local.xcconfig` hard-crashes at launch. Documented in `README.md` for now. Phase 1:
  consider a graceful "not configured" state or a clearer developer-facing precondition message,
  and/or lazy client construction.

- **B. Real font bundling is a three-part coupling.** To make IBM Plex Sans Arabic actually
  render (system fallback is used today), land all three together:
  1. Convert `design/saqeel-v5-final/assets/fonts/ibm-plex-sans-arabic/*.woff2` → `.ttf`/`.otf`
     (iOS can't load woff2) and add to `InspectionApp/Resources/Fonts/`.
  2. Restore the `UIAppFonts` array in `apps/ipad/project.yml`.
  3. Correct `SaqeelTypography.fontFamily` from `"IBMPlexSansArabic"` to the real family name
     `"IBM Plex Sans Arabic"` (PostScript faces are `IBMPlexSansArabic-Regular/Medium/SemiBold/Bold`).
     Update `SaqeelTokenTests.test_fontFamilyIsIBMPlexSansArabic` in lockstep — it currently
     asserts the fallback string and would otherwise lock in the mismatch.
  Also bundle Arabic-script faces (not just Latin subset) for RTL fidelity.

## Minor cleanups

- **C.** `SaqeelAdaptive.isIPad` is currently dead code (app is iPad-only via
  `TARGETED_DEVICE_FAMILY: "2"`). Its `MainActor.assumeIsolated` in a `static let` would trap if
  first touched off-main. Wire it (iPad scaling) or remove.
- **D.** `project.yml`: `GENERATE_INFOPLIST_FILE: YES` is redundant with the explicit `info:`
  block; `SUPABASE_URL`/`SUPABASE_ANON_KEY` are declared in both `settings.base` and
  `info.properties`. Clean up when revisiting the file for fonts.
- **E.** `SaqeelColors.lightInverseText` lacks its `// #FFFFFF` source-hex comment (all others have one).
- **F.** `SaqeelSpacing` source order isn't monotonic (`xl20 = 20` sits between `md` and `lg`).
  Values are correct; readability nit.

## Component previews / snapshot tests

Components use `@EnvironmentObject var theme: SaqeelTheme` with no default, so any SwiftUI preview
or snapshot test must inject a `SaqeelTheme()` or it crashes. Provide a preview helper in Phase 1.
