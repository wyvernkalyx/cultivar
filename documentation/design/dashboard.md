# Dashboard, Cards, and the Reference Conversion — design (D98–D104)

Status: RATIFIED by operator 2026-08-01 in chat, per-decision. This
status line is amended by the commit that changes its truth.

North stars: `reference/handoff/design-brief.md` and
`reference/handoff/cultivar-reference.md` (the ratified visual
authority; PNGs 01–07 alongside), `scoring-read.md` (D59–D63 — the
view semantics this consumes), `survey-cut.md` (D92–D96 — the survey
this must not touch), `coa-retention-and-possession.md` (D87–D91),
`product-metaphor.md` (disciplines 1–3).

## Purpose

The operator's gripe list named three things: a dashboard with
preference info and richer cards, no way to open the stored COA PDF,
and a design pass. The design pass shipped as reference (de5b71b).
This document converts it into an implementation contract and slice
plan. It writes no schema: every datum below was observed live in
the catalog on 2026-08-01, and the repo is authoritative over this
document.

## Data contract (observed 2026-08-01)

- `session_current`: id, entry_no, session_id, created_by, coa_id,
  lexicon_version, overall_word, overall_score, notes, deleted,
  created_at. security_invoker=true; RLS scopes to owner.
- `coa_session_stats`: coa_id, created_by, session_count,
  average_score, band.
- `coas`: strain, brand (nullable), type (nullable), total_thc,
  total_cbd, total_terpenes, sampled_on/tested_on (nullable),
  on_shelf_count, favorite (nullable boolean), pdf_object_path
  (nullable), pdf_sha256.
- `coa_terpenes`: coa_id, name, pct. `coa_retirements`: coa_id,
  reason, created_at (INSERT+SELECT only).

Every card and module renders only from this list. A render that
needs a field not on it is a flagged question, never an invention.

## D98 — Preference summary, client-side over session_current

The dashboard's summary card computes in the client from one
user-scoped `session_current` select merged with the existing shelf
reads. No new view, no migration.

Grounds: D59 already designates `session_current` as the one source
of per-session grain; this is that consumer. At current scale the
aggregation is trivial, and a `preference_summary` view would be
speculative scaffolding that additionally walks into the D87.4
default-ACL territory for no present need. Revisit trigger:
measured render cost, not taste.

Contents (reference 01): all-time session count including off-shelf
history (operator-ratified 2026-07-30); five-band verdict
distribution by `overall_word`, bar height proportional to count,
empty rungs dimmed, never hidden; would-buy-again count from
`coas.favorite = true`; "In Loved sessions · lab concentrations
only" — top terpene chips and THC/CBD ranges across COAs of
Loved-verdict sessions, top-3-by-concentration (the ratified v1
relevant-terpenes definition).

**Binding, verbatim from the 2026-07-30 amendment: preference-summary
ranges compute over reported values only — ND is annotated
alongside, never folded in as a zero lower bound.**

Empty state: honest and inviting, no placeholder stats ("3 sessions
logged. Verdicts will build your picture here." register). Zero
sessions renders the frame, not fake content.

## D99 — Card redesign and one-tap log

Shelf cards per reference 01: strain, xN badge (only above 1,
standing rule), would-buy-again chip only when answered (null is
visibly unset, never "No"), brand line or "Brand not reported",
THC/CBD/terpene columns with ND muted, terpene fingerprint bar
(top-3 segments proportional to share of total terpenes) with hue
legend, footer verdict dots + "N sessions · last X" or "No sessions
yet", and a circular Log button.

**One tap on Log lands directly on the survey verdict screen for
that COA** (ratified 2026-07-30). The survey itself is untouched
(D103). Shelf refetches on survey close — D63's rule, already live.

Supersessions, named:
- **D62's v1 display is superseded**: the band word gives way to
  verdict dots and a session count; `session_count` is now rendered.
  D59/D61 *semantics* are untouched — latest-then-filter, absence is
  no row.
- **D61's display corollary is superseded in copy only**: untried
  cards say "No sessions yet" (brief §6 honesty) instead of
  rendering nothing. Still no word, no band, no placeholder stats.

Terpene hues are identity-only, consistent per terpene, no meaning.
ND-terpene cards replace the fingerprint with the italic
"Terpenes not reported by lab." line.

## D100 — Open original COA PDF, v1 is a signed URL

Detail gains an "Open original COA (PDF)" row. v1: create a
short-lived signed URL for `coas.pdf_object_path` in the private
`coa-pdfs` bucket, `Linking.openURL` to Safari. Zero new
dependencies, zero native modules, no EAS rebuild.

Null `pdf_object_path` renders the truthful absent state ("Original
COA PDF wasn't retained"), never a dead button. Banked: in-app
viewer (react-native-webview or a PDF module — either trips the
native-module/EAS split rule; lived demand decides).

## D101 — Off-shelf surface

The 2026-07-29 off-shelf ruling's named cost — off-shelf COAs
unreachable until a history surface exists — is discharged: an
"Off-shelf (N)" link on the dashboard opens the archived list
(reference 03). Same card language, visibly archived, no Log button.
Each card opens detail; history and PDF stay reachable. Retirement
reason renders verbatim from `coa_retirements` — the first client
read of that table; SELECT policy already scopes it.

The shelf's `.gt('on_shelf_count', 0)` filter is unchanged.

**Ruling: off-shelf detail carries no sticky Log bar.** A session
against a finished package is more often a data-entry error than an
event. Revisable at the gate; the cost of being wrong is one
conditional.

## D102 — COA detail redesign

Order per reference 02: header (strain, brand, lab, dates, xN) →
totals + full terpene list at full lab precision with "Show all" →
**Sessions, promoted above Cannabinoids** (operator-ratified
2026-07-30) → Cannabinoids with "Not detected (n) · Show" collapse →
Safety as one line ("9 passed · 1 not tested", verbatim lab states
only) + "Show assays" + the D100 PDF row → Would buy again
(three-state) → Retire a package. Sticky bottom "Log a session" bar
(absolute view over ScrollView), on-shelf only per D101.

Cards truncate percentages to two decimals; detail shows full lab
precision. Truncation never rounds into false precision claims.

## D103 — Survey restyle fence, restated

Survey screens (verdict, closing/bloom) may be re-themed: colors,
type, spacing, surfaces, motion styling within the core-Animated
budget. May NOT change: two-screen mechanics, tap-is-the-save, the
five rungs and their order, the green→red band identity, the note
field's D95 semantics, the D96 glossary sheet. D92–D96 govern; a
restyle that needs a mechanics change is a wrong restyle.

## D104 — No Delete COA in v1

No delete affordance ships. Grounds: `coas` carries an ALL policy so
a client delete is *possible*, and D53's cascade makes it
*destructive* — it takes logged session history with it, which is
the product. Retention (D87–D91) is the designed path off the shelf.
Bad ingests are rare, guarded by the confirm/edit screen, and
operator-SQL at current scale. Revisit trigger: a real bad-ingest
event the operator cannot reasonably fix in SQL.

## Slice plan (order operator-ratified 2026-08-01)

Each slice: one `feat:` commit, Tier 2, device-gated on the physical
iPhone. No slice touches schema.

1. **Preference summary** (D98). Recon first: if no shared token
   module exists, this slice carries `src/lib/theme.ts` from
   reference 07 (tokens land with their first consumer, not as a
   speculative chore).
2. **Card redesign + one-tap log** (D99).
3. **PDF open on existing detail** (D100) — small; ships the gripe
   before the detail redesign rebuilds around it.
4. **Off-shelf surface** (D101).
5. **Detail redesign** (D102).
6. **Survey restyle** (D103).

## Non-goals

- Schema, migrations, views, grants — nothing in this arc. The
  anon-grants durable fix stays its own banked slice and must not
  ride in here.
- Recommendation or prediction UI. Store inventory. Onboarding.
- Survey mechanics, vocabulary, rung order (D103's fence).
- Retirement flow changes; the last-log step stays banked.
- `never_again`. Android layouts.

## Banked

- In-app PDF viewer: UNBANKED 2026-08-03, ratified as D106 (see
  Amendments); the native-module split rule governs its slices.
- Log on off-shelf detail, if the gate argues for it (D101).
- `preference_summary` view, on measured render cost only (D98).

## Amendments — 2026-08-02

All six slices shipped: dae626b (D98), bf8e213 (D99), 8686729
(D100), 165eff4 (D101), 00a6e9c (D102/D104), 814eaef (D103).
Corrections recorded after implementation, each ratified in chat:

1. D101, archive treatment: reference 03's dashed-border/translucent
   card styling is superseded. The archive marker is the retirement
   line plus the surface's own header, operator-ratified at the
   device gate 2026-08-02. The quiet footer link likewise stands.
2. Slice plan item 1 named `src/lib/theme.ts` as the conditional
   token path. False as written: a shared token module already
   existed at `src/constants/theme.ts`, and the reference tokens
   landed there as the `Dash` export (slice 1). The `Survey` set
   was deleted in slice 6 with its last consumer restyled.
3. D104's premise was wrong as authored: a Delete COA affordance
   already existed on the detail view (D42/D45 lineage), and the
   2026-07-30 open ruling referred to it. The operator ruled remove
   on 2026-08-02; slice 5 removed the flow. `removeCoaPdf` remains
   in the retention module as the documented deletion path with no
   client caller. `onDeleted` is a vestigial prop pending a
   two-line retirement in both callers.
4. Reference 04's "Skip below" is a reference defect: D92 ratified
   the survey with no Skip, and D103's fence forbids adding one.
   Not added; ratified mechanics govern the reference here.
5. The verdict screen title is "Rate this session" (lowercase s),
   per reference 04; the prior capital-S string was corrected in
   slice 6.

## Amendments -- 2026-08-03 (D106, in-app PDF viewer)

D106 ratified by the operator 2026-08-03, unbanking D100's viewer.
Confirmed platform target is the iPhone; Android stays banked.

- **D106.1 -- module.** react-native-webview, installed with npx expo
  install. iOS WKWebView renders PDFs natively, so no PDF-specific
  library is needed for the confirmed iPhone target. Named costs:
  Android WebView does not render PDFs natively (the banked Android
  arc pays more here), and WKWebView offers no page search or
  thumbnails -- acceptable for 2-4 page COAs.
- **D106.2 -- presentation.** Full-screen React Native Modal, the
  app's established pattern, with a header row (title, Done) over a
  WebView loading the same signed URL the Safari path used.
  src/lib/coa-pdf-storage.ts is untouched; the viewer consumes the
  existing signed-URL creation at the detail call site.
- **D106.3 -- the Safari hop is deleted.** The detail row opens the
  viewer in-app. No open-in-browser affordance in v1; banked on lived
  demand. The null pdf_object_path absent state is unchanged.
- **D106.4 -- split slices per the standing native-module rule.**
  Slice A is the dependency manifest alone as chore:, pushed before
  the operator's EAS build; its gate is the new binary loading and the
  app working. Slice B is the viewer component plus the one call-site
  change as feat:, device-gated on the new binary rendering a PDF
  in-app. If WKWebView shows a blank surface at the gate, the named
  fallback is react-native-pdf as a second EAS cycle -- the risk the
  split rule exists to contain.
