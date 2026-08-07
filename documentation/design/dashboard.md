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
   The quiet footer link is superseded 2026-08-03 by D108 (the shelf
   section row; see the D107-D109 amendments below).
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

## Amendments -- 2026-08-03 (D107-D109: header, shelf row, compact summary)

Ratified by the operator 2026-08-03 in chat, per-decision, against the
annotated reference mock (header + summary + section row) as the visual
spec. Three UI slices behind this one docs commit; no schema, no native
modules, no EAS cycle. Named non-goal: the mock's status-bar chrome
(9:41, full battery) is mock furniture, never spec.

- **D107 -- compact header.** The email row and the full-width "Add to
  shelf" button are deleted. One row replaces them: CULTIVAR wordmark
  left (letter-spaced caps, accent green per the Dash tokens), a
  "+ Add" pill right. Rejected labels, with grounds: "Add COA"
  (operator ruling, 2026-08-03 -- jargon in chrome); "Add Flower"
  (bakes a product-type claim into chrome; other ingest classes are
  conceivable). The label is one string and revisable at the gate.
- **D107.1 -- sign-out relocates behind the settings gear.** The gear
  (already rendered, bottom right) gains a small surface -- sheet or
  menu -- holding the signed-in email and Sign out. Nothing ratified
  specifies the gear today; the slice's recon observes its current
  behavior before writing it.
- **D108 -- shelf section row.** "ON SHELF - N" left, "Off-shelf (N) >"
  right, directly below the preference summary and above the first
  card. Off-shelf count is COAs with on_shelf_count = 0; the shelf's
  .gt('on_shelf_count', 0) filter is untouched. Supersedes the quiet
  footer link recorded in Amendment 1 (2026-08-02); the footer link is
  deleted in this slice, and the pointer sentence added to Amendment 1
  is the supersession's record.
- **D109 -- compact preference summary.** Display-only restyle of the
  D98 card per the reference: "N SESSIONS - ALL-TIME" left; mini
  verdict bars with counts beneath, all five rungs rendered, empty
  rungs dimmed never hidden (the D98 rule stands); "N BUY AGAIN"
  right; terpene chips keep identity dots and drop their percentages;
  THC/CBD collapse to one line. The dashboard subtitle reads
  "N sessions logged, on and off the shelf. Verdicts build your
  picture here." All D98 computation rules are unchanged.
- **D109.1 -- reference defect, named: the mock renders CBD as
  "ND-0.08%".** ND as a range endpoint folds ND in as a zero lower
  bound, which the binding D98 rule forbids -- ND != 0, applied to
  display. The ratified rule governs (the Amendment 4 precedent): the
  compact card renders the reported-values range with ND annotated
  alongside (register: "CBD 0.08% / 2 ND"). Exact string is
  operator-owned at the gate.

Slice order: D107 -> D108 -> D109, each its own feat: commit, Tier 2,
device-gated on the physical iPhone.

### Post-implementation record -- 2026-08-03 (D107-D109 shipped)

Shipped: 108f934 (D107/D107.1), 234fe8e (D108), df0eb62 (D109).
Corrections, each the Amendment 3 form -- a ratified premise refuted
by observation, recorded rather than silently repaired:

1. D107.1's parenthetical "(already rendered, bottom right)" was
   false: no gear existed anywhere in app code. The control the
   operator saw on device was the Expo dev-client's floating
   dev-menu button, which a production build will not carry --
   confirmed at the device gate. The gear was built net-new in the
   header row per operator ruling (option 1a); the sheet carries the
   signed-in email and Sign out.
2. D109's "display-only restyle" of "the D98 card" undersold the
   ratified mock-faithful subtitle placement (option a): the slice
   touched three files. ShelfList gained an optional onSummary
   callback fired from the same load() as the card -- no second
   query -- with a useCallback-stable handler in HomeScreen so
   load()'s dependency on it cannot refetch the shelf on unrelated
   renders. Computation was untouched: formatRange, truncate2,
   analyteRange, and buildSummary shipped byte-identical to their
   pre-slice blobs, diff-gated.
3. Gate rulings absorbed as shipped state: both D108 section-row
   labels render Dash.accent (the muted default was overruled on
   device); the D109 mini bars drop the rung words, with hue and
   dimming carrying identity.

## Amendments -- 2026-08-04 (D113-D114: card-surface favorite, retire discoverability)

Grounds: first real usage (2026-08-03, operator). The operator looked for
both actions on the shelf card and found neither. Phase A (2026-08-04, at
cdecc16) established: the retire control exists at the bottom of the COA
detail, styled as the PDF link's twin beneath the dominant Log bar -- a
discoverability defect, not a gap; the favorite chip renders on the card
but is display-only and absent when unanswered.

**D113 -- favorite is a card control, always rendered.** The card's
favorite chip becomes a Pressable on both surfaces (shelf and archive),
per the settable-at-any-time ruling in
documentation/design/coa-retention-and-possession.md (D91 section).
Unanswered renders a prompt-state chip (Buy again?) instead of nothing.
Reconciliation with D48: a question-affordance is not a displayed answer
-- the card still shows no answer that was not given; it shows the
question. Tap raises the question as an alert titled the same way the
retirement prompt asks it -- "Would you buy it again?" -- with Yes, No,
Clear answer (present only when an answer exists), and Cancel (operator
copy ruling 2026-08-04: one question, one wording, both prompts;
retirement Q2 keeps Skip because skipping a question and clearing an
answer are different operations). The single-writer property is preserved
by extraction: writeFavorite moves from coa-detail.tsx to a shared module
(src/lib/coa-favorite.ts); the detail imports it; both lists wire the
card's new optional onFavorite prop through it and refetch via their own
load(). The nested-press precedent (the Log button) governs: tapping the
chip does not open the detail.

**D114 -- retire is visually distinct and reachable from the shelf
card.** Two halves, one concern (discoverability):
(a) In place: the detail's retire row drops the actionRow twinning --
destructive-tinted label, separated from the PDF row, so it reads as an
action rather than a second document link.
(b) On the card: an overflow button (horizontal ellipsis glyph) on the
shelf card, raising an alert listing Retire a package and Cancel, then
the identical reason and favorite prompt sequence as the detail. The
archive is excluded by the optional-prop precedent: the shelf list passes
the card's new onRetire prop, the archive omits it (the onLog form;
exclusion is the prop, not the count). The card additionally renders the
overflow only at on_shelf_count > 0 as defense-in-depth. The ritual is
shared, not duplicated: the imperative alert sequence extracts to a
module both surfaces call, keeping retire_coa's single client call site
in coa-retire.ts and the survey untouched (the reset ruling D110.1 in
documentation/design/profile-reset-and-export.md is unaffected).

Slice plan: this amendment (Tier 1); D113 as one feat (Tier 2, device
gate); D114 as one feat (Tier 2, device gate). Non-goals: un-retire
(banked 2026-08-04, no lived instance); any change to retire_coa or the
RPC surface; any change to the survey's two user-facing reasons;
session-ladder.tsx; any schema change.

## Amendments -- 2026-08-07 (D131-D132: card analyte percentages)

Ratified by the operator 2026-08-07 in chat, per-decision. Grounds:
operator request to surface per-analyte percentages on the shelf
card, audited against the ratified visual authority
(reference/handoff/cultivar-reference.html) this session.

- **D131 -- terpene legend percentages, per the reference.** The
  card legend renders each top-3 terpene as dot + name + percentage
  in the faint tabular style. This closes a shipped-vs-mock gap,
  not new design: the mock's card legend template renders name and
  pct, while the prose spec (cultivar-reference.md, the "legend
  with hue dots" card line) under-described its own mock, and the
  implementation followed the prose. Precision: truncate2 governs
  -- cards truncate to two decimals, never round (D102). The mock's
  toFixed(2) rounds; the ratified rule wins over a reference
  defect (the D109.1 precedent). No ND case arises in the legend:
  null-pct analytes are excluded upstream, so every legend entry
  is a lab-reported value.
- **D132 -- cannabinoid line, top-3 reported, text only.** Operator
  ruling 2026-08-07: per-cannabinoid values join the card.
  Architect recommended detail-only (the reference card carries no
  per-cannabinoid list); dissent recorded, ruling followed.
  Presentation ratified as option A, a single text line of the
  top-3 reported cannabinoids (register: THCA 25.10 - D9-THC 0.56
  - CBGA 0.38) in the legend's faint tabular style, placed after
  the terpene fingerprint per the detail's terpenes-before-
  cannabinoids order. Rejected: a second fingerprint bar (no
  honest denominator exists -- coas carries no total-cannabinoids
  column, so segment shares would divide by a computed sum, and
  the terpene track's remainder-is-unclaimed-lab-total property
  has no analog; the bar would imply a whole the lab never
  reported, and it invents a cannabinoid hue system); the full
  reported list (2-10 reported cannabinoids per COA observed live
  2026-08-07 -- up to ten rows is a wall, and the detail already
  does this job).
  - Ranking: the groupTopTerpenesByCoa convention exactly -- null
    pct excluded outright (absence never ranks as a zero), pct
    descending, name tiebreak, top 3. Precision: truncate2.
  - Absence state: zero reported cannabinoids renders the italic
    "Cannabinoids not reported by lab." line, symmetric with the
    terpene treatment. No live instance (observed minimum is 2).
  - Data: one parallel coa_cannabinoids select (coa_id, name, pct)
    joining the D98 parallel-select family in shelf-list.tsx, and
    a groupTopCannabinoidsByCoa sibling in card-data.ts. No
    schema, no view, no migration.
  - Casing variance across labs (THCa/THCA, CBGa/CBGA) is real but
    per-card rows come from one lab, so nothing collides on a
    card. Canonicalize-at-read stays banked, untouched.

Slice plan: this amendment (Tier 1); D131 as one feat (Tier 2,
device gate); D132 as one feat (Tier 2, device gate, with a
read-back comparing one card's rendered top-3 against a direct
coa_cannabinoids query for that COA). Both display-only.
