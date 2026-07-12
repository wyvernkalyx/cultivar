# COA ingest transport — slice 3 (D33, amends D27's wording)

_2026-07-12. Decided against the observed function contract at `7d11904`, not a
recalled one._

## The observed contract (from `supabase/functions/ingest-coa/index.ts`)

POST, `Content-Type: application/pdf`, raw PDF bytes in the body. A user JWT is
enforced in code by `withSupabase({ auth: 'user' })`. Success: 200 with
`{ data: <parsed COA> }`. Failures: `{ error: <message> }` with 405 (method),
415 (content type), 400 (empty body or parse failure). The function is
parse-and-return only — nothing is persisted.

## Decision (D33)

Slice 3's transport is a **raw authenticated `fetch`** to
`<SUPABASE_URL>/functions/v1/ingest-coa`, with `Authorization: Bearer
<session access token>`, `apikey: <anon key>`, and an explicit
`Content-Type: application/pdf`. This amends D27's literal wording
("client authenticated `invoke('ingest-coa')`"): "invoke" is the verb, the
`supabase.functions.invoke` method is not used.

Grounds:
1. **It mirrors the only proven path.** The one confirmed invoke was
   operator-run: shell + bearer token + raw bytes. Raw fetch is byte-for-byte
   that request from the app.
2. **Maximum observability for the riskiest slice.** The slice's purpose is raw
   JSON on screen, including error bodies. Raw fetch exposes `status` and the
   body directly; `functions.invoke` throws wrapped errors on non-2xx and adds a
   body-serialization layer whose binary behavior in React Native is unverified
   on this stack. An opaque layer is a cost with no benefit here.
3. **Reversible.** The seam is one function in `src/lib/`; migrating to
   `functions.invoke` later, once the path is proven, is trivial.

## Byte acquisition

`expo-document-picker` (`getDocumentAsync`, `type: 'application/pdf'`,
`copyToCacheDirectory: true`) returns a file URI, not bytes. The
zero-new-native-module path: `fetch(uri)` → `arrayBuffer()` → request body,
with the Content-Type header set explicitly.

**Refuted in the first device gate (2026-07-12):** the original design read the
bytes via `.blob()`. On this stack the `fetch(file://)` read itself succeeds,
but React Native's `Blob` cannot be constructed from an ArrayBuffer — the
polyfill's `.blob()` throws `Creating blobs from 'ArrayBuffer' and
'ArrayBufferView' are not supported`. The ArrayBuffer is therefore passed as
the request body directly; RN networking converts it to base64 internally and
transmits raw bytes, lossless. Do not reintroduce a Blob at this seam.

Remaining unknown for the gate: byte integrity end-to-end. The parser is the
detector — real analyte values on screen means the bytes survived; a parse
error on a known-good PDF means corruption in transit.

**Fallback ladder if the ArrayBuffer body also fails,** each rung one Metro
reload to test: (1) `XMLHttpRequest` directly with the same ArrayBuffer, still
zero new modules; (2) `expo-file-system` + base64 body — a new native module,
therefore an EAS build, therefore a re-typed gate.

## Banked

- Migrate to `supabase.functions.invoke` (or not) once the raw path is proven —
  revisit after slice 6, low priority.
- D28 empty-shell UX (unknown lab → 200 with mostly-empty data) renders as raw
  JSON in this slice; the honest blocking state is its own later slice.
