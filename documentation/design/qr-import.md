# QR Import -- Design

Status: design ratified D115-D118, 2026-08-04. This line is amended
by the commit that changes its truth. Slice (b) scope amended
2026-08-04: the config plugin joins the deps commit. Slice (b)
shipped at 635ac01; the post-635ac01 EAS build passed its boot gate
2026-08-05. D117 amended (third detection prong) and provider
validation walks appended 2026-08-05; slice (c) is unblocked.

## Purpose

The largest friction named from first real usage: "I never know where to
find the COA on my iPhone." Package QR codes never land on a COA
directly -- age gates, summary pages, and per-provider landing pages sit
in between (operator-observed). Server-side URL-to-PDF resolution is
dead as a primary path: a live 1a4.com landing URL fetched during recon
(recorded in SESSION_HANDOFF, 2026-08-04) returned a JS-rendered SPA, an
empty shell server-side. This design makes the phone's camera the entry
point and the user's own click-through the resolver.

## D115 -- The flow is scan, browse, detect, one-tap import

Scan the package QR with the camera. The URL opens in an in-app WebView.
The user clicks through the age gate and landing page exactly as they
would in Safari. The app watches navigation for a PDF; when one is
detected, a one-tap "Import this COA" affordance appears, and the PDF
enters the existing ingest pipeline at the same point the file picker
does.

The user does the clicking; the app does the watching. No scraping, no
automation of landing pages. Grounds: landing flows are per-provider,
JS-rendered, and change without notice. A human click-through is the
only resolver robust to all of them. The scan entry point sits beside
the existing add-COA control on the shelf; wording is operator-owned and
lands in slice (c).

## D116 -- The client downloads the bytes; no server-side fetch

Supersedes the recon's leading design (an Edge Function fetching the PDF
URL server-side; SESSION_HANDOFF 2026-08-04, QR-import recon arc).

On detection and tap, the client fetches the PDF URL over https into the
cache directory, then runs the existing pipeline unchanged: ingest-coa
parse, D88.5 hash, dedupe lookup, confirm/edit, insert_coa, and the
D87.4 after-save Storage upload from the cache URI.

Grounds:
- D87.4's upload re-reads the client cache URI at save time, so the
  client needs the bytes locally regardless of who fetched them. A
  server-side fetch strands the bytes server-side, forcing either a
  base64 round trip or a parse-time Storage write -- and the latter
  violates D87's no-orphans-from-abandoned-parses ground.
- Zero Edge Function changes. Every downstream step is already gated.
- No SSRF surface exists: no server ever fetches a user-supplied URL.
  The client fetch is restricted to https in code.
- React Native's native fetch is not subject to browser CORS.

Named risk, shared by both designs and accepted: a PDF URL gated by
session cookies from the age-gate flow fails a bare fetch -- client or
server, and the server holds strictly fewer cookies. If D118's
validation step surfaces a cookie-gated provider, the fallback is a
WebView-native download handed to the app, landing as an amendment to
this document, never as an improvisation in code.

## D117 -- Detection is a heuristic with a manual fallback, and it never blocks

- Automatic: a navigation URL ending in .pdf (case-insensitive), or the
  WebView's file-download event.
- Manual: an always-visible "Import this page" control for when the
  heuristic misses. It attempts the current URL; a non-PDF fails the
  parse and surfaces the error, changing nothing -- fail-closed, the
  slice 5 pattern.
- The existing file-picker path remains untouched as the fallback of
  last resort.

Grounds: detection heuristics miss, and a miss must cost the user a tap,
not the feature.

Amendment (2026-08-05), operator-ratified: a third automatic prong.
On each top-frame navigation the WebView settles on, the client
issues one HEAD request to the current URL; a response content-type
of application/pdf raises the import affordance. Grounds, from the
validation walks below: the primary provider's final URLs are Azure
blob paths with no .pdf suffix, rendered inline -- both original
prongs miss, and without this prong the most common import would
ride the manual fallback. The prong is provider-agnostic (it reads
the response, not the URL), costs one small request per settled
page, and fails exactly as the other prongs fail: to the manual
control, never blocking. The suffix prong stays -- it is free and
covers providers whose HEAD is refused.

## D118 -- Slice plan, EAS split, and provider validation

- Slice (a), docs: this document.
- Slice (b), chore: dependency manifest and config-plugin registration.
  expo-camera is the new native module (verified 2026-08-04 against SDK
  56's bundledNativeModules.json and its shipped type declarations:
  CameraView/onBarcodeScanned is the current barcode API, and
  expo-barcode-scanner is absent from the SDK manifest);
  react-native-webview was already pinned at HEAD, so the manifest
  delta is one package. The expo-camera config plugin is registered in
  app.json in the same commit, with the operator-ratified camera
  permission copy, the iOS microphone string suppressed, and the
  Android record-audio manifest permission suppressed
  (no platform records audio) -- iOS embeds usage-description strings
  at build time, and shipping the plugin now means one EAS build
  serves slice (c). The operator runs the EAS build; the gate is the
  app booting on the new binary.
- Slice (c), feat: scan screen, WebView browser, detection, hand-off to
  the ingest modal. Gate: device, one real package QR end to end through
  confirm/edit to a saved row with pdf_object_path populated, with MCP
  read-back.

Validation precedes slice (c): the operator scans one real package QR
per lab provider in use and records the click path and final PDF URL.
Those observations are appended to this document before slice (c) is
prompted. Grounds: the design shape was chosen against one provider's
landing behavior; every other provider is an assumption until observed.

## Non-goals

- No Edge Function or parser changes.
- No automation or headless resolution of landing pages.
- No source-URL persistence on coas. Banked, with grounds: D87 already
  retains the document itself, which is the ground truth a URL would
  point at, so the recover-later asymmetry that justified other captures
  is defused by retention.
- No multi-QR batch scanning.
- No Android claims.

## Provider validation walks -- observed 2026-08-05 (D118)

The validation D118 required before slice (c). Operator walks on
real package QRs, architect fetches where noted. Providers observed:
Kaycha (three jars), Green Analytics (one jar). The parser-fixture
labs are not the shelf: Moby appears in the fixtures and on no
scanned jar.

**Kaycha (via 1a4).** The QR encodes
`https://app.1a4.com/landingpage/<metrc-package-tag>/<n>` -- the
same 1a4.com host whose server-side emptiness produced this design
(Purpose, above). One tap from landing to the COA on screen
(operator; detail recorded for one jar of three, finals observed
for all three). The final URL is an Azure blob object --
`https://midncustorage01.blob.core.windows.net/<container>/<guid>`
with a read-only SAS token (`sr=b&sp=r`), no `.pdf` suffix --
rendered inline. Observed properties:

- Fetchable by a cookie-less client: the architect fetched one
  final URL from a session holding no cookies and received the full
  COA PDF (`application/pdf`). D116's named cookie-gated risk is
  observed-false for this provider.
- Tokens live roughly 24 hours (`se` expiry vs issuance) and are
  minted per visit: two walks of the same jar produced two
  different tokens on the same container. Consequence, recorded so
  it is not optimized away later: a Kaycha final URL is never
  persistable or shareable; the import fetch happens in the walk's
  own session, and a retry is a re-scan, never a stored URL. This
  is D116's fetch-on-detect confirmed by observation, and a
  second, independent ground for the source-URL non-goal.
- Detection: no `.pdf` suffix and an inline render -- the two
  original D117 prongs are predicted to miss in the app's WebView.
  The 2026-08-05 amendment (D117, above) is the response. The
  prediction is falsified or confirmed at the slice (c) device
  gate.

**Green Analytics (via the brand site).** The QR encodes
`https://aeternacannabis.com/lab-results/` -- the brand's own index
page, not a per-package deep link; the user locates their batch on
the page (tap detail not recorded; low stakes, since detection here
does not depend on the path). The final URL is durable and
`.pdf`-suffixed (`/media/<strain-batch>.pdf`), rendered inline. The
original suffix prong fires as ratified. Untested by the architect:
both aeterna URLs refuse automated access by robots policy, so
cookie-free fetchability for this provider is observed at the slice
(c) device gate, not before.

**Honesty flags, carried to the gate:**

- The operator's walks ran in Safari with standing cookies; no age
  gate appeared, and the operator flagged that cookies may have
  suppressed one. The app's WebView starts fresh and may surface a
  gate these walks did not. D115 already has the user clicking
  through whatever appears; the first in-app walk observes the
  true fresh-state path.
- Every "rendered inline" above is a Safari observation. The
  app-WebView prediction (inline render, no file-download event) is
  stated as a prediction and gated on device.
