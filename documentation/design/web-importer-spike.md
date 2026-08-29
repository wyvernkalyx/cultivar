# Web-Importer Spike

Status: drafted 2026-08-29; D163 rulings a-d operator-ratified 2026-08-29
(chat: "ratify a-d"). Findings section UNFILLED by design -- the spike's
closing commit amends this document; until then, no claim below the
Findings heading exists. Spike arc; the follow-up implementation arc, if
any, gets its own D-number and doc.

Lived demand: operator demand, twice expressed, promoted by the
2026-08-27 handoff. COA PDFs arrive and live on the PC; the only import
path is the phone. The desired shape is a desktop browser serving ONLY
the import flow -- not the app on web.

## D163 -- The spike, ratified a-d

a. Goal and exit criterion. Prove or refute: the existing import flow
   can run in a desktop browser against production Supabase, serving
   ONLY import. Exit = one real COA imported from the operator's PC
   through the browser and read back over MCP. Same gate class as
   device gates, no softer. A refutation with observed grounds also
   satisfies the spike.

b. Enumerated unknowns. Each is closed by observation in a running
   browser, none by reading documentation:
   1. expo-file-system File/Paths on web. add-to-shelf-modal.tsx reads
      the picked PDF's bytes through the new File API. Suspected
      absent or broken on web; the candidate fallback is a
      Platform-branched fetch(uri) -> ArrayBuffer path.
   2. Alert.alert on web. Used twice in add-to-shelf-modal.tsx for
      error surfacing. Suspected silent no-op. THE SPIKE MUST INCLUDE
      A DELIBERATELY FAILING IMPORT (a non-PDF file) to prove errors
      surface; a spike that only exercises the happy path can look
      green while failures vanish.
   3. Build tolerance of react-native-webview. qr-import-browser.tsx
      imports it unconditionally and it has no web implementation.
      QR scanning on web is a NON-GOAL; the question is only whether
      the import's presence breaks the static web build or the page
      at runtime.
   4. Login flow on web. src/lib/supabase.ts already forks auth
      storage on Platform.OS !== 'web' (observed 2026-08-29); the
      screen flow itself is untested in a browser.
   5. Router gating. The web entry must render import-only; native
      routes and behavior untouched. app.json already declares
      web.output "static" (observed).

c. Output discipline. The spike produces a findings amendment to this
   document and at most throwaway branch work. NO feat commit ships
   from the spike. Anything worth shipping is re-derived in a
   follow-up arc under its own D-number, with the spike branch as
   evidence, not as source.

d. Timebox: one session slice. Unknowns still open at the end of the
   slice are recorded as open, and the arc is re-scoped rather than
   silently extended.

## Observed surface (2026-08-29, repo at cdedfc42)

Dependencies already present: expo-camera ~56.0.8, expo-document-picker
~56.0.4, expo-file-system ~56.0.8, expo-web-browser ~56.0.5,
react-native-web ~0.21.0, react-native-webview 13.16.1. The import flow
is two components: add-to-shelf-modal.tsx (DocumentPicker, File/Paths,
Alert, the CoaEditor confirm screen, uploadCoaPdf, ingestCoaPdf) and
qr-import-browser.tsx (CameraView barcode scanning, WebView). Neither
contains a single Platform fork. expo-document-picker has a real web
implementation (file input), so the picker itself is expected to work;
the bytes-reading path behind it is where the break is expected.
Ingestion and storage are network calls to production Supabase and are
platform-indifferent.

## Method

On a throwaway branch, implementer-side (needs a live browser and the
operator's login): npx expo start --web, or npx expo export --platform
web plus a static server if dev-serve behaves differently from the
static output. Exercise, in order: login; pick a real Keystone or
Kaycha PDF from disk; confirm screen renders parsed values; save; MCP
read-back by the architect. Then the deliberate failure: pick a
non-PDF, observe whether any error surfaces (unknown 2). Record every
break verbatim -- console, screen, or build output -- in the Findings
amendment.

## Non-goals

QR scanning on web. Camera on web. Shipping any user-facing web build.
Serving any route beyond the import flow. Changing native behavior.
Legal-entity or hosting decisions (kalyxjournal.com stays a
placeholder).

## Findings

UNFILLED. Amended by the spike's closing commit.
