# Fable Sphere

A local-first spatial gallery built with **Vite, strict TypeScript, native DOM
components, and CSS**. There are no runtime dependencies, remote fonts, analytics,
or image services. Procedural demo covers are generated locally.

The component model is intentionally small: a typed, observable library state
feeds focused renderers; the spatial controller owns its animation frames and
DOM transforms without running a framework render loop on every pointer move.

## Development

Node **22.12+** and npm are required.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The development server binds only to localhost.

```sh
npm run typecheck
npm run build
npm run preview
```

Production output is in `dist/`; preview serves it at http://127.0.0.1:4173.
`index.html` is now the application shell, not a directly runnable standalone
file. Vite resolves and bundles its TypeScript module entry point.

## Architecture

| Module                          | Responsibility                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/main.ts`                   | Startup, storage lifecycle, subscriptions, failure recovery                                   |
| `src/core/types.ts`             | Persistent records and view-state contracts                                                   |
| `src/core/storage.ts`           | Typed IndexedDB adapter and atomic metadata/blob transactions; no UI imports                  |
| `src/core/state.ts`             | Active workspace, hierarchy queries, selection/filter state and change notifications          |
| `src/core/navigation.ts`        | Folder navigation, hash routes, browser history and saved gallery positions                   |
| `src/core/migration.ts`         | Validated, non-destructive import from the original localStorage format                       |
| `src/components/`               | Navigation tree, shell, cards, inspector, dialog focus and status UI                          |
| `src/features/`                 | Editing/moving/deleting, file import, thumbnail generation and asset previews                 |
| `src/spatial/SpatialGallery.ts` | Adaptive matrix, perspective projection, drag/touch capture, wheel handling and damped spring |
| `src/data/`                     | Offline artwork and curated demo seed                                                         |
| `src/styles/`                   | Tokens, shell, gallery, dialogs and responsive styles, in explicit cascade order              |
| `src/events.ts`                 | User interaction wiring and keyboard navigation                                               |

The spatial controller receives its viewport, controls and position state through
its constructor. It has no runtime dependency on storage or library queries.
`destroy()` releases listeners, timers and observers on view changes;
`dispose()` also removes its reduced-motion listener.

SWIPE uses the original QA calibration in `src/spatial/cylinder.ts`: curvature
32 (`R = viewportWidth / 2 × 38 / 32`, approximately 658 px at the 1108 px QA width),
300 ms momentum projection, spring stiffness 0.0002 (QA value 20), drag sensitivity
1.00 and edge resistance 0.30. CSS camera perspective is 1100 px; the QA `proj`
value describes momentum, not that camera distance. The matrix has **four fixed rows**,
178 × 128 px cards, 8 px gaps and six columns at its centred 1108 px maximum width.
Narrow screens show fewer columns; short screens compress card height to keep all
four rows inside `100dvh`. Cards travel along an inward-facing arc with depth,
tangent rotation and fading edge slivers; navigation and inspection stay flat.
The critically damped spring is solved analytically for consistent 60/120 Hz motion.
Only visible columns and edge overscan are updated during animation. The footer
**QA** toggle exposes live geometry, a curve slider and calibration reset; it does
not run an idle animation loop. Tuning is session-only.

The default Demo Space restores all **153 original QA mock items** from 24
colour-coded categories, including templates, reports, documents, images and
bookmarks. Together with the six existing collection entry points, the root has
159 cards in 40 columns. The 18 nested sample entries remain available (177 total).
Images have generated previews; other mock items open labelled sample text, not
pretend original files. A one-time additive migration upgrades the shipped demo
without replacing existing entries, personal files or custom demo spaces. Deleted
mock items are not reseeded on later reloads.

The application modules expose no mutable state or debug interfaces on `window`.
Regression tests inspect visible behavior and persisted records rather than
reaching into app internals.

## Library and originals

- **Dummy Data On / Off** switches between separate, saved Demo and Personal spaces.
- Collections nest freely. Breadcrumbs, the parent button and browser history
  retain your location. The info button supports editing, moving and deletion.
- Import or drop files into the current collection, including the library root.
  Original bytes are stored separately from lightweight browsing thumbnails.
- Images, text, PDF, audio and video have previews. Unsupported formats retain
  their originals and provide downloads. PDF/media playback depends on the browser.
- Search spans the active space, including collection paths. SWIPE, Grid and List
  share the same filtered library entries.
- `/` focuses search; arrows navigate focused cards; Home/End jump within results;
  Enter opens; Alt+Up opens the parent; Escape closes dialogs. Dialogs contain and
  restore focus. Reduced-motion settings disable spatial inertia.

### Database compatibility

The modular build deliberately preserves database **`fable-sphere-library`**, schema
version **1**, all `space:id` keys and the `initialized-v2` marker. Existing v2
libraries are opened in place without reseeding or deleting records.

| Store     | Records                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `entries` | Metadata, `parentId`, timestamps, type, thumbnail and original-file key |
| `files`   | Original `Blob` records                                                 |
| `meta`    | Initialization/migration marker                                         |

Metadata and original files commit together. Both asynchronous storage errors
and synchronous serialization failures abort the transaction. Failed imports do
not leave phantom library entries. Preview object URLs are revoked on close;
HTML/source files are displayed as text, never executed.

On first initialization, valid `fable-sphere-pass1` data is copied into
**Personal Workspace → Previous library**. All old records are retained because
that format cannot distinguish demo records from personal additions. Its original
localStorage value is never deleted. The old version did not retain original
files; migrated entries explain that limitation.

Storage belongs to the **browser profile and origin**. Keep the same production
domain when deploying this upgrade to retain access to the existing library.
Vercel preview domains, localhost ports and production domains have separate
browser storage. This is local persistence, not cloud sync or a filesystem backup;
clearing site data removes the library. The app requests persistent storage after
import where supported and offers original downloads. Stored assets can be
previewed offline while the app is open; hosted-page offline reload is not
implemented by a service worker.

## Vercel and CI

`vercel.json` explicitly configures the Vite framework, `npm ci`, `npm run build`,
and the `dist` output directory. It works with the repository's existing Vercel
Git integration: production-branch pushes deploy production, other branch pushes
produce previews according to the project's existing settings. No second CLI
deployment workflow or deployment-token secret is introduced.

`.github/workflows/ci.yml` adds checks on pushes and pull requests:

1. Install exact dependency versions from `package-lock.json`.
2. Check formatting.
3. Install Chromium and run the production-build browser suites. The build
   includes strict TypeScript validation.
4. Upload the test report and screenshots, including on failure.

This workflow reports quality checks; it does not alter Vercel's production branch
or deployment-gating settings. Configure required checks in repository/Vercel
settings if deployment must wait for the browser suite.

## Tests

```sh
npx playwright install chromium
npm test
```

Playwright builds the app, starts a localhost-only production preview, runs the
suites, then stops the server. To use an existing Chromium installation:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Coverage includes nested navigation/history, isolated workspaces, import/reload,
byte-exact downloads, safe text, mobile sheets, move/delete, keyboard/focus,
reduced motion, spring settling, real pointer/touch gestures, offline PDF/audio
previews, blocked/quota-limited storage, atomic rollback after queued metadata,
legacy migration, and v2 database compatibility.

Reports go to `playwright-report/`; screenshots go to `test-results/`. Tests use
isolated browser contexts and never access your normal browser profile.

Formatting: `npm run format` or `npm run format:check`.
