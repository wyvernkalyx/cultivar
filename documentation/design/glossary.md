# Glossary & Lexicon v3 — design (D85)

Status: RATIFIED by the operator 2026-07-23; amended (D86, tap-surface design, 2026-07-24); erratum D86.6 and build mechanism D86.7 (2026-07-24). Lands as
`documentation/design/glossary.md` via a `docs:` commit before any code
moves.

Operator-authored vocabulary and definitions (Google Doc review pass,
2026-07-23), ratified rulings applied: `Loved` replaces `Favorite`;
`Aromatic Foods` replaces `Flavorful Foods`; `Relaxed` accepted with the
§8A effects-term collision recorded; Spark is renamed Main Goal everywhere
— UI, code, and schema. No internal/user-facing vocabulary split.

---

## Decisions

### D85.1 — Lexicon v3: the vocabulary revision
`LEXICON_VERSION` becomes `3`. Hidden rung values 5–1 are UNCHANGED — that
invariant is what keeps cross-version score averaging valid (D77), exactly
as it did across v1→v2. Every string below supersedes its v2 counterpart:

| Field | v2 | v3 |
|---|---|---|
| Rungs | Elite / Solid / Mid / Miss / Trash | **Loved / Liked / Neutral / Disliked / Hated** |
| Energy | Chill / Active / Buzzing | **Relaxed / Active / High-Energy** |
| Environment | Solo / Social | Solo / Social *(unchanged)* |
| Main Goal (né Spark) | Relief / Flow / Munchies | **Ease Tension / Deep Focus / Appetite** |
| Fit | No / Sort of / Yes | **Missed / Partly / Matched** |
| Co-consumption | Alcohol / Caffeine / Nicotine / Fatty food / Terpene-rich food | Alcohol / Caffeine / Nicotine / **Heavy Meal / Aromatic Foods** |
| Physical state | Dehydrated / Fatigued / Stressed | **Thirsty / Tired / Wound Up** |

Grounds: the operator's universality goal — plain, jargon-free,
universally understood language. The v3 set is discipline-stronger than
v2: every renamed term moves away from, not toward, medical and
pharmacological framing (`Wound Up` vs Stressed, `Ease Tension` vs Relief,
`Heavy Meal` vs Fatty food).

### D85.2 — Spark becomes Main Goal, everywhere
UI label, client identifiers, and the database column. No split between
internal and user-facing vocabulary (operator overruled the architect's
split proposal; grounds: a permanent vocabulary fork is a tax every future
session pays). Schema: `session_entries.spark` renames to
`session_entries.main_goal`.

Boundary (held): the D-registry history is not rewritten. D71–D73 and the
supersession records in `scoring-lexicon.md` keep the word "Spark" as
written — they are the ledger, not the living surface. D85 is the record
that renames it. Living docs (`session-entries-schema.md`,
`session-logging.md`, `rich-path.md`, `art-direction.md`) are amended with
a one-line D85 pointer where they say Spark; historical amendment blocks
are left verbatim.

### D85.3 — Version-branching rule (the 135-row consequence)
"Vocabularies revise freely" (D70–D76 ground) is retired: it held at zero
rows. At 135+ rows, revision is versioned. v2 rows keep their strings
forever (append-only; nothing recorded is ever destroyed or migrated).
New rows write v3 strings under `lexicon_version = 3`. Any analysis,
view, or display that reads STRINGS from `session_entries` must branch on
`lexicon_version`. Score averaging needs no branch — it rides the stable
hidden mapping.

### D85.4 — Glossary v1: 27 operator-authored entries
One-line plain definitions, shown on tap, operator's own words (D76
hand-off satisfied — the operator authored and ratified this language).
The tap-surface UI is its own later, device-gated slice; NOT designed
here. This pass ships the vocabulary and the definitions as document.

### D85.5 — Co-consumption time window
Standardized across all five entries: "right before, during, or shortly
after this session." Deliberately felt-scale, not clock-defined.

---

## The 27 entries (ratified language)

### Overall score — the ladder (hidden 5–1)
| Term | Definition |
|---|---|
| **Loved** | Top tier — an absolute go-to experience you'd want every time. |
| **Liked** | Good — a positive experience you'd happily repeat. |
| **Neutral** | Middle ground — unremarkable either way; neither good nor bad. |
| **Disliked** | Disappointing — fell short of what you were hoping for. |
| **Hated** | Poor — a terrible experience you'd actively avoid repeating. |

### Target Energy (axis)
| Term | Definition |
|---|---|
| **Target Energy** | The physical or mental pace you were hoping to set for the session. |
| **Relaxed** | Unwinding — wanting to slow down, ease off, and take it easy. |
| **Active** | Up and moving — wanting to stay physically or mentally engaged. |
| **High-Energy** | Upbeat — wanting a lively, fast-paced, or animated feel. |

### Setting (axis)
| Term | Definition |
|---|---|
| **Setting** | Who was around you and the environment you were in. |
| **Solo** | Flying solo — spending time on your own. |
| **Social** | With others — hanging out, sharing, or being around people. |

### Main Goal (axis; the intent anchor)
| Term | Definition |
|---|---|
| **Main Goal** | What made you reach for it — your primary intention for the session. |
| **Ease Tension** | Wanting to loosen up and let go of what was weighing on you. |
| **Deep Focus** | Getting in the zone — wanting to lock into an activity without distraction. |
| **Appetite** | Wanting to enjoy food more or boost your appetite. |

### Fit (Main-Goal-relative, D72 semantics unchanged)
| Term | Definition |
|---|---|
| **Missed** | It didn't give you the feeling or outcome you were going for. |
| **Partly** | It got you partway there, but didn't fully deliver. |
| **Matched** | It hit the spot — delivered exactly what you were hoping for. |

### Co-consumption panel (presence-only)
| Term | Definition |
|---|---|
| **Alcohol** | Drank alcohol right before, during, or shortly after this session. |
| **Caffeine** | Had coffee, tea, or an energy drink around this session. |
| **Nicotine** | Smoked, vaped, or used nicotine around this session. |
| **Heavy Meal** | Ate a heavy or high-fat meal right around this session. |
| **Aromatic Foods** | Ate strongly aromatic foods — citrus, mango, or fresh herbs — around this session. |

### Physical state panel (felt transient states going in)
| Term | Definition |
|---|---|
| **Thirsty** | Went in feeling dry, thirsty, or needing water. |
| **Tired** | Went in feeling worn out or low on energy. |
| **Wound Up** | Went in feeling tense, rushed, or under pressure. |

Discipline notes carried from ratification: `Ease Tension` is strictly
emotional/mental unburdening, never symptom relief. `Wound Up` holds the
felt-state reading; the D76 anxiety line and the medications-exclusion
revisit bar stand behind it. `Heavy Meal` and `Aromatic Foods` make no
interaction or bioavailability claims — examples select, mechanisms never
appear. `Relaxed` collides with the banked §8A effects term of the same
name; the effects slice, if built, inherits that conflict knowingly.

---

## Implementation plan (after the docs: commit)

Observed baseline (2026-07-23, HEAD `3182393`): the only CHECK on
`session_entries` is `overall_score` 1–5 — no string constraints, so v3
needs no constraint migration. `spark` appears in `supabase/` only in the
D77 migration (history). Client surface: `src/lib/lexicon.ts` and
`src/components/session-ladder.tsx` only.

**Slice 1 — schema (`feat:`).** RESOLVED by observation (2026-07-23):
`session_current` selects `spark` explicitly; `coa_session_stats` does not
reference it but reads FROM `session_current`, so both views fall in the
dependency chain. A bare column rename would leave `session_current`
functionally correct but with an output column still NAMED `spark`
(Postgres freezes view output names at creation; `CREATE OR REPLACE`
cannot rename them) — the rename must go through drop/recreate.

Migration, in order: drop `coa_session_stats`; drop `session_current`;
`alter table session_entries rename column spark to main_goal;`; recreate
`session_current` (observed definition, `main_goal` substituted);
recreate `coa_session_stats` (observed definition, unchanged); set
`security_invoker = true` on both; restore view grants to the
pre-migration observed set. Data untouched at any row count.
- Phase A preconditions RESOLVED by observation (2026-07-23): (a) view
  grants: `anon`, `authenticated`, `postgres`, `service_role` each hold
  ALL seven privileges on both views — the Supabase default-privilege
  posture. FINDING, recorded: `anon` ALL contradicts the project's
  expressed posture (`insert_coa` deliberately excludes `anon`); latent,
  not live (security-invoker + RLS zeroes anon reads; the DISTINCT-ON
  view is not auto-updatable). Slice 1 restores the observed set exactly
  (recreation under default privileges reproduces it; gate on match);
  grant-tightening is BANKED as its own decided slice, never a side
  effect. (b) insert path: direct `.from('session_entries').insert` at
  `session-ladder.tsx:723`; no session RPC exists — the migration
  carries no function work.
- Gate: observed SQL — `session_entries` column list shows `main_goal`,
  no `spark`; `pg_get_viewdef` of `session_current` shows `main_goal` in
  both inner and outer lists; reloptions show `security_invoker=true` on
  BOTH recreated views (re-observed, never assumed — standing rule);
  view grants match the pre-migration observation; row count unchanged
  (135+); `coa_session_stats` returns the same rows as pre-migration for
  a spot-checked `coa_id`.

**Slice 2 — client (`feat:`), same arc, gated together.** `lexicon.ts`:
v3 strings, `SPARK` → `MAIN_GOAL`, `LEXICON_VERSION = 3`, comment pass.
`session-ladder.tsx`: `AxisKey`/phase/label/payload-key rename, v3 labels
throughout. Sequencing note: after slice 1 applies, the live client's
`spark` payload key targets a renamed column — inserts fail until slice 2
loads. Acceptable for a single-user device; both slices land in one
session, and the device gate runs only after both. The gate walk must
write one full v3 row and read it back: `lexicon_version = 3`, v3 strings
in `main_goal` and friends, and a pre-existing v2 row observed intact
beside it (the version-branching control case).

**Slice 3 — glossary tap-surface UI.** Designed: see Amendment (D86) below.

## Supersession scope
Retires the v2 strings of D70 (rungs), D71 (axis values), D64 (fit
strings), D75/D76 (panel item strings), and the name "Spark" in D71–D73's
living role (D85.2). Structures, semantics, hidden values, screen order
(D79), nulling rules (D72/D73 as renamed), and panel mechanics (D78) are
all UNCHANGED. §8A-a/b/c effects/aroma glossary stays banked.

## Amendment (D86) — glossary tap-surface, 2026-07-24

Operator-ratified in chat, four explicit rulings. Designs the surface
D85.4 held out. Behavior only; visual treatment (trigger glyph, sheet
styling, placement) defers to art-direction.md at build time.

### D86.1 — One info trigger per term-bearing screen
A single per-screen info trigger on each of the six term-bearing screens
(ladder, energy, environment, main goal, fit, panels); none on closing.
Ruled over tappable titles and per-term targets. Grounds: tap-on-pill
already means select; per-term gestures would foreclose the banked
ladder-drop / pill-tap unification pass, and long-press is
undiscoverable and collides with drag initiation on the ladder. A
screen-level trigger touches neither gesture system.

### D86.2 — Screen-scoped bottom sheet, read-only
The trigger opens a dismissible bottom sheet listing the current
screen's entries with their ratified one-line definitions. Axis screens
lead with the axis-title entry (Target Energy, Setting, Main Goal are
themselves glossary entries). The panels screen gets one sheet with two
labeled sections (co-consumption, physical state); ruled over one
trigger per panel. The sheet is read-only: it never selects, writes, or
navigates, and touches no database path — deliberate while the
intermittent-freeze defect stays open; this slice adds zero insert-path
surface. Coverage property, stated for the gate: the 27 entries
partition across the six sheets as 5 / 4 / 3 / 4 / 3 / 8, every entry
in exactly one sheet, zero orphans, closing carrying none.

### D86.3 — Verbatim content rule
Definitions render character-identical to this document's ratified
language: no truncation, no paraphrase, no supplements, no generated
copy. Single client source: a GLOSSARY structure in src/lib/lexicon.ts
beside the v3 strings; the build slice must gate on verbatim identity
between that structure and this document. Grounds: the Wound Up and
Ease Tension discipline guardrails live in their exact ratified words —
a summarizing surface is how drift starts.

### D86.4 — v3-only scope
The sheet shows the live lexicon's terms only and never branches on
lexicon_version: the survey always writes the live lexicon, so its
glossary needs no D85.3 branch. Displaying v2 strings belongs to a
future read/detail surface, not this one.

### D86.5 — Non-goals, held or banked
A full-27 standalone glossary screen stays banked (lived demand may
never ask). Survey helper copy is untouched (its own bank item). No
change to pill or rung gestures. No affordance on the closing screen.

### Gate (UI slice, device)
Per term-bearing screen: open the sheet, verify every entry present and
character-identical to this document, dismiss, and confirm selection
state unchanged. Then one full logged walk with read-back — which also
extends the freeze-watch count.

## Erratum (D86.6) — trigger placement corrected against observed structure, 2026-07-24

Operator-ratified in chat (Option B). D86.1's "six term-bearing screens"
and D86.2's "one panels sheet, two labeled sections" were designed
against a false premise: the architect's carried pre-D82 layout, in
which the two multi-select panels were one screen hanging off closing.
The Phase A diagnostic at de41390 observed eight phases — the panels
are two sequenced phases, physical_state then co_consumption, before
closing (D82). D86.1–D86.5 above are ledger and stand as written; this
erratum is the correcting record.

Correction, applying the ratified grounds (screen-scoping) to observed
reality: SEVEN term-bearing phases each carry the single info trigger —
ladder, energy, environment, main_goal, fit, physical_state,
co_consumption — and closing carries none, unchanged. Each sheet is
scoped to exactly its own phase's entries; the two-section combined
panels sheet is retired as decided against a false premise. The
partition, in phase order, becomes 5 / 4 / 3 / 4 / 3 / 3 / 5 = 27,
every entry in exactly one sheet, zero orphans. Every other D86.2
property — dismissible, read-only, never selects, writes, or navigates,
zero insert-path surface, verbatim ratified language — survives
unchanged and governs all seven sheets. D86.3, D86.4, and D86.5 are
untouched. The gate restates over seven phases: open, verify every
entry present and character-identical to this document, dismiss,
confirm selection state unchanged; then one full logged walk with
read-back, extending the freeze-watch count.

### D86.7 — Sheet mechanism and GLOSSARY shape (architect-decided, recorded)

Mechanism: core React Native Modal (pageSheet), matching the app's
three existing Modal overlays. Grounds: zero new dependency and no
native module, so the EAS-rebuild split rule is never triggered; the
@expo/ui native sheet is rejected for this slice — its presence in the
current dev-client binary is unestablished, and establishing it buys
nothing over Modal for a read-only list. Reanimated stays excluded.
GLOSSARY shape: entries of term plus definition, grouped by phase, in
src/lib/lexicon.ts beside the v3 arrays (D86.3), including as new data
the three axis-title entries (Target Energy, Setting, Main Goal) —
which exist today only as component labels — with every definition
character-identical to this document. The ladder heading is not a
glossary entry; the ladder sheet is the five rungs.
