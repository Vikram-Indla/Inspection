# BS-1 PWA structural pixel harness

This harness reads the 24 shippable PWA cards from
`status/saqeel-status.json`. The exact `route` field is the only join key used
to associate shipped route targets with each card's `designPage` values.
Routes and designs are arrays, so the manifest is many-to-many.
Prototype pages and their runtime assets are served from the tracked canonical
tree at `designs/pwa/pwa/`.

Set these values in `apps/web/.env.local`, `apps/web/.env`, or a file selected
by `PIXEL_ENV_FILE`:

```text
PIXEL_INSPECTOR_EMAIL=inspector@mim.gov.sa
PIXEL_INSPECTOR_PASSWORD=
```

An explicitly assigned empty password is valid in the governed local test
project. A missing assignment is not; the loader distinguishes those states.

Run against the existing server on port 3000:

```sh
npm run test:pixel
```

The script sets `PIXEL_HARNESS=1`, which disables Playwright's normal
`webServer` launcher. If port 3000 is unavailable, the run fails and reports
the missing measurement; it never starts or builds another application server.

The default is dry-run. Artifacts are written through `evidenceDirectory()` to
the governed external evidence root. A route card receives `score: null` if
any required route, design, locale, or width cannot be rendered and validated.
The writer refuses null scores.

To permit a reviewed write, provide both an explicit flag and the spine
revision observed during review:

```sh
PIXEL_WRITE=1 PIXEL_CARD_ID=pwa-dashboard PIXEL_EXPECTED_REVISION=SB-r16 npm run test:pixel
```

Bitmap difference is reported as secondary evidence only. It never contributes
to the structural score. A write run requires one explicit card id so it cannot
rewrite several cards or race the spine's one-card-per-edit rule.
