# MIM Inspection — iPad app (native SwiftUI)

Native iPadOS rebuild of the inspector flow (currently the `apps/web` PWA). Mirrors the
`catalyst-ios` architecture, uses the Saqeel V5.1 design system, talks to the same Supabase
backend, and is offline-first (GRDB, arriving in Phase 3).

- Design spec: `docs/superpowers/specs/2026-07-25-ipad-inspector-native-design.md`
- Phase 0 plan: `docs/superpowers/plans/2026-07-25-ipad-inspector-phase0-foundation.md`

## Requirements

- Xcode 26 (Swift 6 toolchain), iOS 18 simulator runtime
- [XcodeGen](https://github.com/yonlu/XcodeGen): `brew install xcodegen`

## Setup

1. **Provide Supabase secrets (mandatory — the app `fatalError`s on launch without them).**
   Copy `InspectionApp/Config/Secrets.xcconfig` to `InspectionApp/Config/Secrets.local.xcconfig`
   (gitignored) and set the real values used by `apps/web`:
   ```
   SUPABASE_URL = https:/$()/YOUR-PROJECT.supabase.co
   SUPABASE_ANON_KEY = <anon key>
   ```
   Then point the target at it, or edit `Secrets.xcconfig` locally (do NOT commit real keys).
   Note the `https:/$()/` escape — it stops the xcconfig parser treating `//` as a comment.

2. **Generate the Xcode project** (the `.xcodeproj` is gitignored — regenerate after any
   `project.yml` change or when new source files are added):
   ```bash
   cd apps/ipad && xcodegen generate
   ```

## Build & test

The Core package imports UIKit, so tests run on an **iPad simulator**, not the macOS host.

```bash
# Core design-system + components package
cd apps/ipad/Core && xcodebuild test -scheme InspectionCore-Package \
  -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)'

# App target (auth, shell)
cd apps/ipad && xcodebuild test -project InspectionApp.xcodeproj -scheme InspectionApp \
  -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)' CODE_SIGNING_ALLOWED=NO
```

Use any available iOS-18 iPad simulator (`xcrun simctl list devices available | grep -i ipad`).

## Structure

```
Core/                 SPM package: DesignSystem (Saqeel tokens) + Components (UI)
InspectionApp/
  App/                @main, ThemeRoot, AuthGate
  Infrastructure/     AppSecrets, SupabaseClientProvider
  Data/Repositories/  AuthRepository (+ Supabase impl)
  Features/           Auth (Login, AuthSession), Shell (RootShellView)
InspectionAppTests/   stub-repo unit tests
```

## Status

**Phase 0 (Foundation) — complete.** Design tokens, core components, native 4-tab shell,
Supabase login. See `PHASE1-FOLLOWUPS.md` for carried-over items before Phase 1.
