# Cultivar — Design Reference v2 (Stash, Insights, detail & survey)

Final converged direction after four review rounds. Target: React Native (Expo), iOS, ~390pt viewport, dark theme.
Type: Sora (UI) + Newsreader italic (explainer voice). Visual reference, not production code.
Screens: `01–08` PNGs; flows `09`; tokens `10`. Full styling source: `cultivar-reference.html`.

## Architecture

3-tab bottom nav:
- **Stash** (default) — Active/History segment toggle, sort pills, strain cards.
- **+ (center FAB)** — selector sheet: "Scan or import a COA" (primary) / "Log a session" (secondary).
- **Insights** — the dispensary buyer's guide: Target profile, Would Buy Again, Profiles to avoid, plus full-screen Counter view.

## Terminology

"My Stash" / Active / History. Never "shelf". Never "batch" in consumer copy: "2× purchased", "8 strains".

## Non-negotiables

- **Personal-empirical, never pharmacological.** No effect claims about compounds anywhere. Self-reported feeling chips (Head Space / Body Feel / Off-Key) are fine — they describe the user's own session, not the product.
- Verdict vocabulary, fixed order + emoji: **Loved 😍, Liked 👍, Neutral 😐, Disliked 👎, Hated 🚫** (green→red band identity, never a score).
- ND renders as "ND" (never 0). Null brand → "Brand not reported". Missing PDF → truthful absent state. Unanswered repurchase visibly unset (never "No").
- All percentages 2 decimal places (24.30%, 0.04%).
- Terpenes always labeled as concentrations ("ranked by concentration"); terpene hues are identity-only.
- Session summary is all-time, including History.

## Survey mechanics

- Step 1 (verdict): five 56pt rungs, left color band, emoji; **tapping a rung saves the record instantly** (background write). No bottom Skip — ✕ Close covers pre-verdict exit.
- Step 2 (optional): "Loved · saved" indicator top bar; plain-text **Done** (top-right) and green **Save Session** (bottom) run the same commit. Chips in strict 2-col grids per section; selected = solid green + ✓. Note field below.
- Would-buy-again is asked inside the log flow — never a standalone toggle on the detail screen.

## Interaction spec (RN)

- Light haptic (expo-haptics ImpactFeedbackStyle.Light) on every rung/chip tap.
- Rungs press-scale 0.98 (~80ms ease-out, spring back), then slide to step 2.
- KeyboardAvoidingView docks Save Session above the active keyboard.
- Detail ScrollView paddingBottom ≥ 96 so Lab info clears the sticky Log bar.
- Search icon expands leftward into a full-width bar over the title (~220ms); collapse on cancel/blur-empty.
- Counter view pins screen brightness to max while open.
- Detail gear sheet: Edit strain name/brand · Re-parse COA PDF · Delete from stash (destructive, confirm; distinct from Retire, which keeps history).

## Tokens

### Surfaces & text
bg #0B0F0C · surface #131A15 · surface-2 #171C19 · text #F2F5F1 · text-body #AEBBB1 · text-muted #8FA093 · text-faint #5E6B61 · accent #7ED99B

### Verdict band (fixed order)
Loved #7ED99B · Liked #C9D96E · Neutral #E8C86E · Disliked #E89A62 · Hated #E0685E

### Terpene identity hues
Caryophyllene #DBA96F · Limonene #E4D07A · Bisabolol #B4A8DC · β-Pinene #8FC79B · Terpinolene #8FBFD6 · Ocimene #D68FA8 · Linalool #C7A8D6 · Myrcene #9BCF8E · Humulene #C79BB8

### Type roles
display Sora 800 26/1.1 · title Sora 700 13 · label Sora 700 10 tracking .12em uppercase · body Sora 400 11.5 (tabular numerals for lab values) · serif Newsreader italic 400 14.5

### Spacing (4pt base) & radii
4 inline · 8 chips · 12 in-card rows · 16 card padding · 18 gutter · 24 sections. Radii: 8 badges · 12 nested rows · 16 cards · pill buttons/chips.

## Screen notes

### 01 Stash
Consolidated 3-row header: CULTIVAR brand mark stacked over "My Stash" (left), top-terpene fact subline (taps to Insights), search + settings icons top-right. Active/History toggle; sort pills (active = solid green ✓ Recent). Cards: title owns its line, brand below muted, badges stacked upper-right ("2× purchased", "✓ buy again"); THC/CBD/TERPENES columns; terpene fingerprint bar + top-2 legend; ND-terpene state = muted amber pill ("Terpenes not reported by lab."); footer verdict dots + "+ Log Session" pill bottom-right. Bottom nav with center + FAB.

### 02 Insights
Subtitle "Based on 12 logged sessions across 8 strains." Order: **Target profile** (hero, green-bordered: terpene ranges of Loved batches + THC/CBD ranges — the dispensary cheat sheet) → **Would Buy Again** (Share + Counter view actions; rows show strain, brand, stats, in-stash/finished state dot) → **Profiles to avoid** (red-bordered mirror: compounds frequent in Disliked/Hated sessions, stated as facts).

### 03 COA detail
Header: strain + brand only. Order: Totals + stacked terpene bar + per-terpene progress bars (2dp, "Show all 32") → Sessions (actionable empty copy) → Cannabinoids ("Not detected · 8 analytes · Show") → Safety: "✓ Assays passed" green badge + "8 passed · 1 not tested" + "View official lab COA" secondary button → Lab info card (lab, sampled, added) at bottom. Sticky "Log a session" bar; gear menu top-right.

### 04–05 Survey
Step 1: brand eyebrow, display strain, "Rate this session", stash-vocabulary explainer, emoji rungs, "saves instantly" microcopy. Step 2: "Anything else? (optional)", saved indicator, plain Done, 2-col chip grids (HEAD SPACE / BODY FEEL / OFF-KEY), note, Save Session.

### 06 Counter view
Full-screen inverted (light bg), huge type: TARGET PROFILE block (dark card) + BUY AGAIN strain cards, readable from two feet. Brightness pinned.

### 07–08 Sheets
Central + selector (Scan COA primary / Log Session secondary); Log sheet with strain pre-selected when opened from a card.

## Flows (09)
1. **Log from a stash card:** card + Log Session → step 1 → tap rung (saves instantly) → optional step 2 → Save Session/Done → stash updated. Bailing at any point keeps the verdict.
2. **Central +:** selector → Scan COA or Log Session (pick strain → step 1).
3. **Add a COA:** scan/import (QR/PDF/camera) → parse → confirm fields → new Active card.
4. **Detail gear:** Edit name/brand · Re-parse PDF · Delete (confirm). Retire keeps history in the History segment.

## Sample-data note
Orangutang Cookies (THC 22.27%, CBD 0.04%, terps 1.87%, Green Analytics NY, sampled 6/17/2024) is from the user's real COA; Rainbow Runtz and Cosmic Cereal values are real; other strains are plausible stand-ins exercising degraded states (ND terpenes, null brand, missing PDF, unanswered repurchase).
