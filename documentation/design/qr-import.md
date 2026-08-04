# QR Import -- Design

Status: design ratified D115-D118, 2026-08-04. No code. This line is
amended by the commit that changes its truth. Slice (b) scope amended
2026-08-04: the config plugin joins the deps commit.

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
