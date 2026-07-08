# Cultivar — Product Brief, MVP Scope & Decision Log

*Consolidated from the working session. Every claim is tagged with a confidence level. "Decided" is kept separate from "unproven / open." Where something is a recommendation rather than a settled decision, it says so.*

**Confidence key:** **High** = verified this session (tested, fetched, or printed on a real COA) · **Medium** = reasoned or well-established but not verified here · **Low** = plausible, unverified, flagged for checking.

*Two audiences: the **plain-language pitch** just below is for a quick read (start here); the **numbered sections** are the detailed working spec.*

---

## The vision, in plain language

Every legal cannabis product comes with a lab report — the **COA** — that almost nobody reads. It lists the **terpenes**: the aromatic compounds that, more than the THC number, seem to shape whether a given weed leaves *you* relaxed, creative, or anxious. The catch is that *which* terpenes work for you is **personal**, and today the only way to learn it is trial, error, and a great budtender you can't always reach.

**Cultivar is a phone app that learns *your* pattern.** You scan or enter the COA for what you're using, log how it actually felt and what you were doing (biking, on the couch, at a party), and over time the app learns which chemistry works for *you* — then predicts it for your next purchase: *"this one's your kind of profile,"* or *"this is the lane that made you anxious last time."* Standing in the shop, it can hand you a short list — *"these three fit you; ask the budtender for their COAs."* And because it remembers every batch, it can warn you when *"the same product you loved in December has drifted — the terpenes changed even though the name didn't."*

**The honest part:** nobody has *proven* terpenes cause specific effects — the science is genuinely unsettled. Cultivar doesn't claim to settle it. It learns what's true *for you*, from your own logged experience. That personal record — more useful every time you use it — is the whole point, and it's the one thing a competitor can't copy.

---

## 1. One-line thesis

> Cultivar is a consumer-first mobile app that learns a person's own cannabis preferences from what they log, and predicts the *kind of high* a given product will give **them** — anchored on the product's real lab report (COA), with terpenes as the primary signal.

The value is not the lab data (anyone can get that). The value is the **personal loop**: the more you log, the better it predicts *for you*. That loop is the moat.

---

## 2. Product brief

- **Who it's for:** everyday cannabis consumers — including low-effort users — who want to reliably repeat good experiences and avoid bad ones. Primary test user: the founder (β-Myrcene-preferred, Limonene-is-an-anxiety-trigger profile). *(High — from prior project history.)*
- **The job it does:** learn your preferences → predict the experience of a purchase → help you choose well.
- **Core loop:** capture a COA → understand it → save to your shelf → log how it felt (with context) → get a personal fit/prediction that sharpens over time.
- **Primary signal:** terpene profile from the product's real COA. **MVP targets lab-tested product** (a COA exists — parsed or manually entered). When a real COA lacks a terpene panel, show what's there and mark terpenes "not reported by lab" — never faked. *(Decided; home-grown / no-COA deferred — see §9.)*
- **Truth-claim:** **personal-empirical**, not pharmacological. Cultivar does not assert "myrcene relaxes people." It observes "for *you*, this pattern holds." *(Decided — this framing is load-bearing; see §3 and §6.)*

---

## 3. What the science does and doesn't support (honest foundation)

- THC% is **not** a reliable predictor of experience quality or anxiety. Terpene profile is the differentiating variable at the personal level. *(High — founder's own logged history + reaffirmed.)*
- The **population-level** claim that terpenes predict subjective effects is **unproven / contested** in the current literature (2024 systematic reviews call the synergy "unproven"; expectancy effects are large; some monoterpenes clear too fast to plausibly accumulate). Weedmaps' own consumer-education content corroborates this — it states there are no human studies on terpenes' role in feeling high. *(High that the literature — and the industry's own educational material — says this.)*
- Therefore Cultivar's engine must be **personal-empirical**, which (a) sidesteps the unproven science and (b) reduces regulatory exposure from effect/health claims. *(Decided.)*
- The **generic effect mappings** ("myrcene → relaxing, limonene → bright/heady") are well-established, published, findable "budtender canon." Use them as the **cold-start starting voice**, then overwrite with the user's real data. Do **not** reinvent them, and do **not** let them be the whole product. *(Decided — founder's clarification.)*
- **Context (set & setting) as a first-class logged variable** is the founder's key insight: capturing activity, consumption, mood alongside each session is what could eventually let the data separate a terpene signal from confounds. Long-term, aggregated across users, this could genuinely inform the "is it placebo?" debate. **Honest ceiling:** self-logged observational data can *suggest* but never cleanly *prove* causation. *(Medium-high on the design logic; medium on the eventual scientific payoff.)*

---

## 4. Positioning & competitive landscape

The market is crowded in **separate lanes**; Cultivar's intersection is largely empty. *(Medium-high — searched the main players; can't rule out a small/new app.)*

- **Journaling/tracking apps** (Strainprint, Releaf, Tetragram, DankLog, Cannabis Journal, Stash Journal): strain-centric, generic or AI-generated data, **no per-batch COA**. Users explicitly ask for real terpene data these don't provide.
- **COA infrastructure** (Metrc Retail ID, Confident Cannabis, GS1): B2B, single-batch viewers, **no personal layer**.
- **Marketplaces** (Leafly, Weedmaps, Jane, Wikileaf): ad-driven, strain-level, not per-batch.
- **Social apps** (High There!, Duby, MassRoots): social-first, not data-driven.

**White space Cultivar occupies:** the COA/batch as the unit of truth *in a consumer app* + terpenes from *measured* data + *personal* prediction.

**The moat, stated honestly:** "COA-centric" is a feature incumbents could copy. The defensible moat is the **compounding personal dataset** — your logged outcomes tied to real lab panels — which gets better with use and can't be bought. *(Medium — strategic judgment.)*

**OpenCOA** (opencoa.org) is the closest adjacent thing: a NY-only third-party COA database (~45k COAs, ~97.6% NY producer coverage), a $4.20 lifetime "Your Stash," and a $29/mo JSON API. It is **validation, a possible data shortcut, and a potential competitor at once** (it already has a save-your-products feature; a third party, TerpStack, already builds terpene recommendations on it). *(High — fetched.)* **It is NY-only, which makes it a non-starter for an all-markets product — Cultivar does not use it.** It stays in this doc only as competitive/landscape context (a signal the space is real, and a potential competitor to watch). *(Founder decision: out.)*

*(Correction on record: earlier in the session I claimed NY had "no canonical public COA source." OpenCOA substantially falsifies that. It's third-party, not the state, and its data authority is mixed, but a usable queryable DB exists.)*

---

## 5. Regulatory & COA reality (New York first market)

- **COAs are not stored in one place.** The lab generates and retains; the **processor** must keep the COA 5 years; the **dispensary** must keep it available and show consumers on request; the consumer accesses it via the **QR/label**. No public statewide database (the third-party OpenCOA aside). *(High — NY OCM + NY regs.)*
- **QR codes resolve inconsistently** — PDF, lab portal, brand page, Metrc Retail ID, or Confident Cannabis — with no mandated format and spotty real-world reliability. *(High.)*
- **Terpene reporting is frequently optional** (explicitly "optional" in NJ; NY completeness varies), so the app **cannot assume** a terpene panel is present. *(Medium-high.)*
- **NY prohibits health/medical claims** on cannabis labeling. Whether that binds a third-party app is unclear (I'm not a lawyer), but making effect claims carries real liability risk regardless — another reason for the personal-empirical framing. *(Medium — needs legal review.)*

**Hard requirements that follow (all Decided):**
- **21+ age-gating** and **geo-restriction to legal jurisdictions** (also required for app-store approval — see §7).
- **A review/confirm screen** after any automated COA parse — never silent trust (re-confirmed three times this session).
- **Personal-empirical wording** for all predictions; no medical/health claims.
- **Consumption data private by default.**

---

## 6. Distribution & platform (decided)

- **Consumer-first, app-store-first.** The addressable base of low-effort cannabis users in the Apple/Google stores is far larger than the set of people who install/configure an MCP server in ChatGPT/Claude today. MCP-as-consumer-distribution is "an idea before its time." *(High on direction; market sizes not quantified.)*
- **App-store gatekeeping is no longer the barrier it once was.** Apple now permits cannabis apps — including sales-facilitation for licensed dispensaries — with geo-restriction + age-gating (loosened June 2021; a further change in March 2026 I have not read). A **tracking/education app that sells nothing sits on even safer ground.** *(High for Apple.)* **Google Play** was historically stricter; its current 2026 stance I did **not** confirm. *(Low — verify before Android.)*
- **Platform:** React Native / Expo, with the COA ingestion service as the one server-side seam. *(Medium — from prior specs; sensible, not re-litigated.)*
- **Sequencing:** POC → MVP. Validate the risky thing before building the rest. *(Decided.)*

---

## 7. Ingestion — the central gambit, tested this session

**Finding: extraction is the easy part.** All four real COAs (Kaycha ×3 in two sub-formats, DRS/Confident LIMS ×1) are **born-digital text PDFs — no OCR needed** — and `pdftotext -layout` pulled full terpene + cannabinoid panels from **both** lab formats cleanly. *(High — run directly.)*

**The founder does not yet have a parser.** What exists is a *proven technique*, not built code. The real deliverable is a **server-side ingestion service** (it cannot live on the phone): app captures/uploads COA → server extracts text → per-lab parse rules → normalize fields → return JSON → **confirm screen** → save. *(High on architecture; the service is unbuilt.)*

**Where the real remaining risk is** (all still unproven):
- **Device-side acquisition/routing** — QR → browser → download → into the app. Untested. Likely the true friction (iOS can't background-watch a folder; a Share Extension or document-picker + scan-on-open is the realistic pattern; Safari's download destination is the sticky point). *(Medium.)*
- **Per-lab normalization** — `β-Myrcene` vs `BETA-MYRCENE`, `ND` vs `<LOQ` vs value, multi-page layouts. Bounded (few NY labs), not solved. *(High that it's needed.)*
- **Image-only COAs** — none of the four were, but can't assume; would need OCR. *(Medium.)*

**CoADoc (Cannlytics' open parser) — tested, does not drop in.** It's bit-rotted (needed dependency pins to run); on the four COAs via its supported entrypoint it fully parsed **0 of 4**, got potency-only on 1, and extracted terpenes on **none**; it failed to even identify the DRS/Confident format. The simple `pdftotext` approach **beat it** on these COAs. **Reuse it for parts** — its QR-URL extraction, LIMS-identification pattern, standardized schema, and 17-lab parser library (valuable when leaving NY) — not as a turnkey NY parser. *(High — run directly.)*

**Third-party data sources: evaluated and set aside — Cultivar owns ingestion + prediction.** *(Founder decision. These are NOT dependencies of the solution.)*
- **OpenCOA** — **out.** NY-only; the effort/cost is a non-starter for an all-markets product.
- **CannMenus** (cannmenus.com) — **role narrowed to an *optional* live-availability source; not the terpene brain.** *(Correction on record: an earlier draft said it has "no terpene data" — that was wrong, and I'd stated it at high then medium confidence. I hadn't read the API docs.)* The API **does** expose a per-product `terpene_profile` and per-dispensary menus (`retailers` filter). The real limits: terpene coverage is only **~13–20% of products**, the data is **menu-reported (not COA-batch-traceable)**, and it's a **paid B2B feed**. *(High — read the API docs.)* So it could supply the "what's on my dispensary's shelf right now" signal behind the at-dispensary shortlist (§8), but the *terpene truth* still comes from your owned COA history. **Sourcing decision open:** CannMenus vs. another menu source vs. defer. NY-specific coverage unknown. *(Low.)*
- **Cannlytics / CoADoc** — **out as a dependency.** CoADoc failed the real test (§7 above); the open datasets aren't something the product needs to lean on. Reuse *ideas* only (QR-URL extraction, LIMS-ID pattern, schema) if convenient — not the code or data.

**All-markets requirement (Decided).** The product must be usable in **every** market, not tied to any one state's data source. This is achievable *without* external dependencies: the ingestion technique is market-agnostic (a COA is a COA), and the **manual + aroma-proxy entry path makes the app usable in any market from day one**, before that market's automated parser exists. Automated COA parsing then expands **lab-by-lab**. Honest consequence: "all markets + own everything" is a real, ongoing per-lab parser-maintenance burden — accepted knowingly. *(High on the logic.)*

---

## 8. MVP scope

**Core loop (build first):** capture a COA → understand it → shelf → log a session (with context) → personal fit/prediction.

### MUST
- COA capture with **two paths**: assisted scan/photo *and* manual entry — with a **review/confirm screen**. *(Manual path is not optional.)*
- **Server-side ingestion service** (text extract → per-lab parse → normalize) for NY's labs (Kaycha, DRS/Confident to start).
- **COA detail view**: cannabinoids, terpene chart (annotated with the user's favor/avoid markers), safety/compliance, batch/lab, and terpenes shown only when present ("not reported by lab" otherwise — never faked).
- **Personal shelf.**
- **Session logging**: effects + a **DEQ-style intensity/liking scale** + a **closed context survey** (activity, setting, consumption, intent — no freetext) + optional note. Vocabularies specified in **§8A**.
- **In-app glossary** for every effect/aroma term — users conflate terms like *energetic* vs *uplifted*, so each is defined in-app (§8A).
- **Personal fit/prediction** with **explicit confidence** (generic prior early, personal model as data accrues).
- **MVP targets lab-tested product only.** Every product has a COA (parsed where a parser exists, else manually entered). If a COA lacks a terpene panel, show cannabinoids/safety and mark terpenes "not reported" — no aroma substitute in MVP.
- **At-dispensary decision support (core requirement).** A ranked *best-guess* shortlist of in-stock products at the user's selected dispensary that fit their profile — narrowing the counter ask to ~3: *"ask the budtender for the COA on these three."* When live terpene data isn't available, best-guess = inference from the product's historic COAs + the user's logged history. **Depends on** a menu/availability source (§7 CannMenus note — open) + accumulated COA history, so the full version realistically lands right after the core loop ships. *(Core to the vision; sequencing + data dependency flagged honestly.)*
- **21+ age-gating + geo-restriction.**

### SHOULD (v1.1)
- **Terpene-shift tracker (signature differentiator).** For a saved favorite, show how its COA has changed across batches over time — *"same product name, terpenes drifted since December."* Requires accumulated own-COA history; as far as we've seen, nobody does this. *(Novel — medium-high; high value.)*
- Sharing a COA to a friend via link (one-tap add). *(High value, deferrable — sharing is just links, no friend graph needed.)*
- Profile preferences computed from history.

### COULD (later)
- Friend graph + activity feed.
- Strain/COA comparison.
- Recommendations surfaced proactively.

### WON'T (v1)
- In-app purchasing / dispensary ordering.
- Public/discoverable social feed.
- Web app.
- MCP server distribution (revisit later — §9).

*Note on markets: the app is designed **market-agnostic** and must be usable everywhere from launch (manual/aroma entry always works). NY is only the **first test market** for automated COA parsing because that's where the founder and the sample COAs are — it is **not** a market limit. Automated parsing coverage expands lab-by-lab.*

---

## 8A. Session lexicon, survey & in-app glossary (with examples)

**Design principle:** everything the user taps is a **closed, standardized vocabulary — no freetext** (freetext note optional as an escape valve). Closed vocab is what makes sessions comparable and reportable. **Adopt existing standards where they exist; build only what doesn't.** Everything below is a **starter set to edit by using it**, not a final list.

### a. Effects vocabulary — *adopt* (Leafly-style is the de facto standard)
Researchers have built work on 887 strains from 100k+ Leafly reviews using its structured effect tags — it's the closest thing to an industry standard, and it's language users already know. *(High that it's de facto.)* **IP caveat:** use the *generic* effect words, don't copy a proprietary curated taxonomy wholesale — confirm with counsel. *(Low-medium — not a lawyer.)* Split effects into two axes (per Weedmaps' framing): **mood** (how you feel) and **function/abilities** (how you're working). Capturing both catches the half that pure mood words miss.

- **Mood — positive:** Relaxed · Happy · Euphoric · Uplifted · Energetic · Creative · Focused · Giggly · Talkative · Sleepy · Hungry
- **Mood — adverse (equally important — anxiety is the founder's key trigger):** Anxious · Paranoid · Dizzy · Dry mouth · Dry eyes · Headache
- **Function / abilities:** Foggy · Forgetful · Slowed reactions · Time feels distorted · Couch-locked · Sharp/clear

### b. In-app glossary — *build* (users conflate these)
Every term gets a one-line plain definition, shown on tap, so "energetic" and "uplifted" don't get logged interchangeably. Starter definitions:

- **Energetic** — *physically* activated; you want to move or do things.
- **Uplifted** — your *mood* lifts; lighter and more positive, without necessarily wanting to move.
- **Euphoric** — a distinct rush of intense wellbeing/pleasure (stronger than "happy").
- **Focused** — narrowed, task-locked attention.
- **Creative** — ideas flow, associative thinking (not the same as focused).
- **Relaxed** — bodily ease; tension gone.
- **Sleepy** — drowsy, heading toward sleep (past relaxed).
- **Couch-locked** — so heavy/relaxed you don't want to move.

### c. Aroma / flavor vocabulary — *optional in MVP; proxy engine deferred*
Kept as an **optional flavor descriptor** when logging a session (people like noting taste; some COAs list primary aromas). The **aroma-as-terpene-proxy engine is deferred with home-grown / no-COA** (§9) — it's not load-bearing once the MVP is lab-tested-only. If included, adapt a standardized cannabis aroma lexicon / flavor wheel (active academic work exists). *(High they exist; medium on a canonical pick.)* Starter descriptors, with the loose terpene lean they hint at:

- Earthy/Musky → *myrcene* · Citrus/Lemon → *limonene* · Pine → *pinene* · Pepper/Spicy → *caryophyllene* · Floral/Lavender → *linalool* · Diesel/Gas · Sweet · Berry · Tropical · Herbal · Mint · Cheese · Skunky *(note: research finds consumers disagree whether "skunky" is positive or negative — keep it neutral)*

### d. Context / activity survey — *build* (no standard exists) *(Medium-high — not aware of one.)*
Fitness-tracker-style, all tap-to-select, all reportable:

- **Before this session (baseline):** captured *pre-consumption* — mood before (Calm · Neutral · Stressed · Low) — so the engine can separate the product's effect from how you already felt. *(Per Weedmaps: baseline mood is a named driver of the high.)*
- **Activity:** Resting · Watching/Gaming · Chores · Creative work · Socializing · Exercise/Active · Out & about
- **Social setting:** Solo · With partner · Small group · Party/crowd
- **Consumption method + alongside:** method (flower/vape/edible/…) · Empty stomach · Ate · Alcohol · Caffeine
- **Time of day:** Morning · Afternoon · Evening · Late night
- **Physical/mental state:** Rested · Tired · Stressed · In pain
- **Intent:** Wind down · Focus · Energy · Creative · Social · Symptom/pain · Sleep

### e. Intensity/liking scale — *adopt* a validated instrument (the credibility layer)
Rather than invent an intensity measure, borrow the **Drug Effects Questionnaire (DEQ-style)** structure used in research — short slider items, comparable across sessions:

1. Do you feel any effect? 2. Do you feel high? 3. Do you *like* the effects? 4. Do you *dislike* any effects? 5. Do you want more?

*(Medium — DEQ-5 is a real validated instrument from the research literature; confirm the exact items/wording before shipping.)* This keeps the session survey honestly "structured self-report," while borrowing rigor where rigor exists.

---

## 9. Stretch goals / later bets

- **Home-grown / no-COA support** — aroma-as-terpene-proxy entry for products without a lab report. Deferred out of the MVP (which is lab-tested-only); returns once the core loop is proven. *(Deferred.)*
- **Aggregate cross-user insights** — "people like you liked this profile"; the flywheel once a user base exists. Requires §6 distribution first.
- **The "terpene debate" instrument** — with enough consented, context-tagged logs, surface whether patterns survive context controls. Contribution, not clinical proof.
- **Optional blind-rating mode** — withhold the terpene profile until after the user rates, reducing expectancy contamination; power-user / research layer.
- **Dispensary B2B** — verified-COA / loyalty / education tooling; a later monetization path (consumer willingness-to-pay is low; who-pays is unresolved).
- **Broader automated-parsing coverage** — expanding owned per-lab parsers market-by-market. (All-markets *usability* is a core requirement from day one via manual/aroma entry — see §7/§8; this stretch item is about growing *automated* COA coverage, not about enabling new markets.)
- **MCP server** — a plausible *additional* channel when that audience grows; not v1, and not a substitute for the personal loop.

---

## 10. Decision log

1. **Consumer-first, personal-empirical prediction app** — not a data-service or reference tool. *(Decided.)*
2. **Terpenes primary; MVP is lab-tested-only.** Graceful when a real COA lacks a terpene panel (show what's there, mark "not reported"). Home-grown / no-COA deferred (item 18). *(Decided.)*
3. **Truth-claim is personal, not pharmacological** — protects against unproven science + effect-claim regulation. *(Decided.)*
4. **Generic mappings = cold-start prior only; personal data = the moat.** *(Decided.)*
5. **Context is a first-class logged variable.** *(Decided.)*
6. **Ingestion is required and is a server-side service we own** — no third-party COA feed as a backbone. *(Decided.)*
7. **Extraction proven on real NY COAs; `pdftotext` beat CoADoc.** Own the NY parser; reuse CoADoc for parts. *(Decided, evidence-based.)*
8. **App-store-first over MCP.** *(Decided.)*
9. **Age-gating + geo-restriction + confirm-screen + no medical claims = hard requirements.** *(Decided.)*
10. **Own ingestion AND prediction.** OpenCOA (NY-only) and Cannlytics/CoADoc set aside as dependencies; **CannMenus narrowed to an *optional, still-undecided* live-availability source** (not the terpene brain). Product usable in **ALL markets** via an owned market-agnostic parser + manual/aroma fallback. *(Founder decision — corrected twice: "rent the aggregate" was wrongly labeled decided (it was my rejected recommendation), and CannMenus was wrongly said to lack terpene data — it exposes terpenes for ~13–20% of products.)*
11. **POC-first, fail-fast sequencing.** *(Decided.)*
12. **David's MCP proposal:** take the tool leads + keep it as a later channel; reject "emulate user-experience data" as it guts the moat. *(Decided.)*
13. **At-dispensary decision support is a core requirement** — best-guess shortlist → ask for ~3 COAs. *(Decided; sourcing + sequencing flagged.)*
14. **Lexicon strategy:** adopt effects (Leafly-style) + an aroma lexicon; **build** the context/activity survey; adopt a **DEQ-style** intensity scale; ship an **in-app glossary**. *(Decided — see §8A.)*
15. **Terpene-shift-over-time tracker** = a named signature feature. *(Decided.)*
16. **Supabase backend from the start** (Postgres + Auth + Storage + RLS). Trigger: iteration one enrolls **~10 test users**, which breaks the single-user premise that made local-first correct earlier — collecting their data, accounts, and durability are now *established* demand. *(Decided — supersedes the earlier "local-first, no server" call, which was correct only for n=1.)*
17. **Multi-market test cohort from day one** (CT, PA, NY, Vancouver BC). Because Cultivar sells nothing, state *sales* law doesn't govern it — the spread is mainly technical + data, not a legal blocker. Consequences: age-gate is per-jurisdiction (21+ US / 19+ BC); **PA users hold medical cards so their use is legal**; **Canada = cross-border data (PIPEDA)**; geo-restriction is prudence not a hard rule for a non-seller; automated COA parsing is **NY-first**, others use manual COA entry until built. *(Decided; privacy items active — see §11.)*
18. **Home-grown / no-COA deferred out of MVP.** MVP is **lab-tested product only**. This also moots the PA home-grown-felony data concern. Home-grown + aroma-as-terpene-proxy return as a later bet (§9). *(Decided.)*

---

## 11. Assumptions & risks

- **Logging friction is unproven.** If capturing a session isn't fast enough to actually do, nothing above works. *This is the #1 risk.* *(High that it's the key risk; untested.)*
- **Device-side acquisition friction unproven** (§7).
- **Prediction usefulness unproven** beyond the hardcoded rule — needs the real logging loop running. *(High.)*
- **Moat is copyable early** — until the personal dataset compounds, an incumbent could add COA features. *(Medium.)*
- **Monetization unclear** — consumer WTP is low; dispensary B2B is a later, unvalidated path. *(Medium.)*
- **Data & privacy exposure — ACTIVE (Step 1).** ~10 real users' consumption data on a server across a US/Canada border makes these live: per-user RLS isolation, encryption/pseudonymization, a consent flow + terms before enrollment, and a deletion path. Cannabis *sales* law does not govern a non-selling tracker, so PA (medical-only) etc. don't exclude users — but **home-grown-in-PA logs data on a felony** (privacy-design nuance) and **Canada adds cross-border data (PIPEDA)**. Effect-claims risk remains (personal-empirical wording only). **A lawyer should review consent/terms + the privacy design before the cohort logs real data.** *(High that the privacy items are active; legal specifics need counsel.)*
- **Third-party availability source** — if CannMenus (or similar) powers live dispensary stock, its paid B2B terms + ~13–20% terpene coverage must be checked; Cannlytics data is CC BY with a commercial caveat. Neither is required for the core loop or the POC. *(Medium.)*
- **Google Play cannabis policy 2026** unconfirmed. *(Low.)*
- **Cannabis funding climate** (if raising) historically hard; may have shifted with rescheduling — unverified. *(Low.)*

---

## 12. Validation plan (what proves or kills this)

The POC exists to answer two questions cheaply, on the founder as first user:

1. **Is logging low-friction enough that you'll actually do it?** Bar: a normal session logged in ~15 seconds, done repeatedly without dread.
2. **Is the prediction useful?** Bar: at least one genuine "huh, that's useful" recall ("you were anxious the last two couch sessions on this profile").

**Already validated this session:** COA extraction works on real NY COAs (both lab formats), and the personal-fit read produced correct calls against the founder's known profile (Animal Face = match; the two limonene-dominant strains = avoid). *(High.)*

**Not yet validated:** device-side acquisition, real logging friction, and whether the prediction holds once it's learning from logged data rather than a hardcoded rule. **These are the POC's job.**

If logging is painful or the prediction feels hollow, that's a cheap, early signal to rethink or stop — the fail-fast the founder has applied well throughout.

---

## 13. Documents & tooling — what's next, and when

**Documents:** this file *is* the consolidated one (brief + scope + stretch + decision log + validation plan). For a solo founder pre-validation, that's the right amount. A formal long-form business plan is largely obsolete for consumer tech — skip it. A **PRD** and **architecture doc** come *if/when you build* (your DESIGN_SPEC and BACKEND are their seeds). A **pitch deck + financial model** come *only if you choose the raise path* — a real fork, not an inevitability, and cannabis funding has historically been hard. *(High on the doc guidance; Low on current funding climate.)*

**Tooling, in order of value:**
1. **A Git repo** — put this doc + your specs + prototype in one versioned place. Highest-leverage change to the workflow; it becomes the source of truth. *(High.)*
2. **Claude Code** — the tool that turns these specs into the actual app, in that repo. The natural next step *the day validation says go.* *(High.)*
3. **Connectors** (e.g., Google Drive) — only once your working files live in one service. *(Medium, situational.)*

**Not yet:** heavier agent tooling; OpenCOA (NY-only, out); a paid availability feed (CannMenus/other) is an open *later* decision for the at-dispensary feature — not needed for the core loop or the POC. Adding tools before the test is a common way to feel productive while avoiding it.

---

*Prepared as a working founder document. Nothing here is legal, financial, or medical advice; the legal and licensing items in §11 need a qualified attorney.*
