# Cultivar — Design Reference (dashboard, shelf & survey)

Converged direction: **"Fingerprint"** — terpene composition bar as each card's signature.
Target: React Native (Expo), iOS, ~390pt viewport, dark theme first.
This is a visual reference, not production code. Screens: `01–05` PNGs; flows `06`; tokens `07`.

## Non-negotiables

- **Personal-empirical, never pharmacological.** No effect claims, no wellness language, no "good for X" — anywhere, including microcopy and empty states. The only outcome language is the user's own verdicts.
- Verdict vocabulary, fixed order: **Loved, Liked, Neutral, Disliked, Hated** (green→red band identity).
- Terpenes are always labeled as concentrations ("top terpenes", "ranked by concentration"), never effects. Terpene hues are identity-only, consistent per terpene, no meaning.
- **ND and null are first-class:** ND renders as "ND" (never 0, never estimated). Null brand → "Brand not reported". Null dates → "Dates not reported". Missing PDF → truthful absent state ("Original COA PDF wasn't retained"), never a dead button.
- Unanswered repurchase is visibly unset — never rendered as "No". States: Yes / No / not answered yet.
- Cards truncate percentages to 2 decimal places; detail shows full lab precision (e.g. 22.7326%).
- Session summary on the dashboard is **all-time**, including off-shelf history.
- Survey mechanics fixed: single verdict screen — five full-width rungs with left color band, tap-to-advance, first-class Skip — straight to the bloom confirmation. No other questions.
- **Log a session is one tap from every shelf card**, landing directly on the verdict screen.

## Tokens

### Surfaces & text
| token | hex |
|---|---|
| bg | #0B0F0C |
| surface | #131A15 |
| surface-2 | #171C19 |
| text | #F2F5F1 |
| text-body | #AEBBB1 |
| text-muted | #8FA093 |
| text-faint | #5E6B61 |
| accent | #7ED99B |

### Verdict band (fixed order, semantic green→red, never a score)
| verdict | hex |
|---|---|
| Loved | #7ED99B |
| Liked | #C9D96E |
| Neutral | #E8C86E |
| Disliked | #E89A62 |
| Hated | #E0685E |

### Terpene identity hues
Caryophyllene #DBA96F · Limonene #E4D07A · Bisabolol #B4A8DC · β-Pinene #8FC79B · Terpinolene #8FBFD6 · Ocimene #D68FA8 · Linalool #C7A8D6 · Myrcene #9BCF8E · α-Pinene #7AB8A0 · Camphene #B8C78F

### Type roles (Sora + Newsreader italic)
- display — Sora 800, 28pt, line-height 1.1 (strain names, uppercase)
- title — Sora 700, 15pt (card titles)
- label — Sora 700, 10pt, letter-spacing 0.12em, uppercase (section labels)
- body — Sora 400, 11.5pt; **tabular numerals for all lab values**
- serif — Newsreader italic 400, 14.5pt (explainer voice: "Gut call…")

### Spacing (4pt base)
4 inline gaps · 8 chip gaps · 12 in-card rows · 16 card padding · 18 screen gutter · 24 section breaks

### Radii
8 (badges) · 12 (nested rows) · 16 (cards) · pill (buttons, chips)

## Screen notes

### Dashboard / shelf (01)
- Header: wordmark + "+ Add COA" pill. Title "Your shelf" + Newsreader italic honesty line ("12 sessions logged, on and off the shelf…").
- Preference summary card: all-time session count, 5-band verdict distribution (bar height ∝ count, empty rungs dim at 15%), would-buy-again count; "In Loved sessions · lab concentrations only" — top terpene chips + THC/CBD ranges of Loved COAs.
- Shelf cards: strain, ×N multi-package badge, would-buy-again chip (only when answered), brand line (or "Brand not reported"), type + date; THC/CBD/Total terpenes columns (ND muted); **terpene fingerprint bar** (top-3 segments proportional to share of total terpenes, remainder track at 5% white) + legend with hue dots; footer: verdict dots + "N sessions · last X" or "No sessions yet"; circular **Log** button (48pt, one tap → survey).
- ND-terpene card (Blue Lobster): fingerprint replaced by italic "Terpenes not reported by lab."
- "Off-shelf (N) ›" link in the shelf section header.

### COA detail (02)
- Order: header (batch, lab, dates, ×N badge) → Totals + full terpene list (full precision, "Show all" affordance) → **Sessions** (promoted above cannabinoids) → Cannabinoids (with "Not detected · 9 analytes · Show") → Safety as ONE line ("9 passed · 1 not tested · verbatim lab states" + "Show assays") + "Open original COA (PDF)" row → Would buy again (3-state) → Retire a package (with package-count context).
- **Sticky bottom "Log a session" bar** (RN: absolute view over ScrollView, gradient scrim).

### Off-shelf (03)
- Same card language, visibly archived: dashed border, translucent surface, muted text, no Log button.
- Retirement reason verbatim: "Smoked it all" / "Gave up on it". Each card opens detail; history and PDF stay reachable. PDF-missing state shown in italic where applicable.

### Survey verdict (04) — restyle only
Close/Info pills, brand eyebrow, display strain, accent "Rate this session", Newsreader explainer, five 56pt rungs (surface cards, 5pt left color band, radius 15), Skip below.

### Logged confirmation (05)
Bloom mark (three rotated rounded bars + center dot, accent green on 14% accent circle), "Logged." + italic "On the shelf with the rest.", note field, accent Close button.

## Flows (06)
1. **Log from shelf (one tap):** Dashboard card → tap Log → Survey verdict → tap rung / Skip → Logged (bloom + note) → Close → Dashboard (verdict lands on card immediately).
2. **Log from detail:** Dashboard → tap card → COA detail → Log a session → Survey verdict → Logged → Close → detail (history +1). Back from survey returns without logging.
3. **Add a COA:** Dashboard → + Add COA → pick PDF → parse/confirm extracted fields → new card on shelf.
4. **Retire a package:** COA detail → retire (reason: smoked it all / gave up) → optional last log via survey → shelf (count −1, or batch moves off-shelf). Nothing is deleted by retiring.

## Sample-data note
Rainbow Runtz (THC 22.7326%, CBD ND, terpenes 1.53%, batch S01-RARU, Kaycha Labs) and Cosmic Cereal (31.8081% / 0.0852% / 1.85%) are real COA values. Animal Face, Gush Mintz, Blue Lobster, and the off-shelf items are plausible stand-ins exercising degraded states (ND terpenes, null brand/dates, missing PDF, unanswered repurchase).
