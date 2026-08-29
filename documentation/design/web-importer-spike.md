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

## Findings (amended 2026-08-29, spike closed)

EXIT CRITERION MET. All Gas 7g Glass Jar (AG1126I2Q) imported from the
operator's PC through a desktop browser, saved as row 42707425-cbc5-
4e3f-b712-48c18bedcbab, MCP read-back exact: keystone, thc 30.76, terp
1.71, 20 terpene rows (6 detected, zero fabricated zeros), dominant
Limonene, CBDV null, stored pdf sha256 byte-identical to the source
document's pin. And under the publishable key -- see the headline.

HEADLINE, found by unknown 4: the client env var
EXPO_PUBLIC_SUPABASE_ANON_KEY held a SECRET (sb_secret) key. Every
request the native app ever made carried it; the native runtime has no
guard, so nothing ever said a word. supabase-js's browser guard
("Forbidden use of secret API key in browser") fired on the spike's
first sign-in attempt -- the web build is the only environment that
would ever have checked. Containment, observed: only .env.example is
tracked, zero commits in all history touch any real .env, full-history
grep for sb_secret printed no matches -- the key never entered the
public repo. Exposure was phone dev bundles, local dist/, Metro caches.
Remediated 2026-08-29: key swapped to publishable, app proven working
under it (the exit-criterion import), secret key revoked, stale dist/
deleted. Banked for road-to-store: a "client key is publishable-class"
gate. The app survived the swap with zero code changes -- no path was
leaning on the RLS bypass.

Unknowns, all five closed:
1. CLOSED, premise refuted (see Corrections). The shipped picker path
   already reads bytes via fetch(uri).arrayBuffer(); File/Paths appear
   only in the QR path, a non-goal. expo-file-system's web module is a
   warn-only stub; expo-document-picker's web asset is a blob: URI
   fetch reads natively. No edit was needed.
2. CLOSED, source plus browser. react-native-web's Alert is an empty
   static method -- a guaranteed no-op, not a suspicion. Empirically:
   the deliberate non-PDF import rendered "status: 400 / Invalid PDF
   structure." as on-screen text with the screen alive (errors never
   went through Alert; the doc's worry inverted). The real casualty,
   predicted from source and then observed: importing an
   already-stored COA leaves phase at 'confirming' with the D88
   duplicate dialog unable to appear -- Add to stash permanently
   disabled, no dialog, hard hang, nothing written (verified over
   MCP: row counts unchanged). Secondary: coa-editor's delete-row
   confirmation is a dead button on web. Fix belongs to a follow-up
   arc; the D88 dialog is the same surface the restock arc (D159-160)
   must rebuild, so one arc plausibly serves both.
3. CLOSED. react-native-webview's presence is tolerated: no browser
   field, web resolves a platform-less stub that renders a View/Text
   ("React Native WebView does not support this platform."). Export
   exits 0 on the untouched tip; no native symbols in the bundle.
4. CLOSED with one open observation. Email-OTP sign-in works on web
   end to end. First attempt was blocked by the headline finding.
   Sign-in latency was long ("Sending..." for an extended period
   before the code flow completed); cause not established, one data
   point, recorded and left open.
5. CLOSED. There is no route-level entry to redirect -- the root
   layout renders components directly -- so the gate is a component-
   level Platform.OS fork rendering an import-only surface. Spike
   commit 9c520f8 on spike/d163-web-importer, evidence only, never
   merged (ruling c). AppTabs is bypassed, which also avoids
   useSafeAreaInsets with no provider mounted.

Corrections, ledgered (architect errors, refuted by implementer
observation before any browser ran):
- "add-to-shelf-modal.tsx reads the picked PDF's bytes through the new
  File API" -- FALSE. The bytes-read is fetch(uri).arrayBuffer() in
  ingest-coa.ts and coa-pdf-storage.ts; File/Paths live only in the QR
  path. The doc's proposed fallback was already the shipped code.
- "Used twice in add-to-shelf-modal.tsx for error surfacing" -- FALSE
  twice over: once in that file, and it is the D88 duplicate
  confirmation, not error surfacing; the second Alert is coa-editor's
  D37 delete confirmation. Errors render as on-screen text and always
  did.

Follow-up arcs banked, not started: web-capable dialog replacing
Alert.alert (shared surface with restock D159-160); publishable-key
gate on the road-to-store checklist; sign-in latency if it recurs.
