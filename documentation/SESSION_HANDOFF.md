# Cultivar — Session Handoff: Planning → Development

*Boundary document. Per methodology: the repo is authoritative once it exists; everything below is carried context to be **confirmed from ground truth**, not trusted as canonical.*

---

## Status

- **Planning phase: complete.** Decisions locked in `Cultivar_MVP_and_Roadmap.md` (the spec).
- **No repo yet.** Artifacts produced this session live in chat, not under version control:
  - `Cultivar_MVP_and_Roadmap.md` — product brief, MVP scope, decision log, validation plan.
  - `cultivar-poc.jsx` — working POC (shelf → COA detail → personal-fit), seeded with 4 real COAs.
  - `Cultivar_Resources.xlsx` — resource inventory.
  - 4 real COA PDFs (Animal Face, Rainbow Runtz, Cosmic Cereal, Permanent Shade) — parsing test fixtures.
- **Validated this session:** COA text-extraction works on both NY lab formats (Kaycha, DRS/Confident) via `pdftotext`; `pdftotext` beat CoADoc; personal-fit read produced correct calls on the 4 COAs.
- **Not validated:** device-side acquisition, logging friction, prediction-from-logged-data.

## Methodology in effect

The pasted **Working Methodology** governs. Note one sequencing point: it opens every session with a **Phase A git audit**, which presumes a repo. This handoff is **pre-repo** — so the first action is scaffolding (below), and Phase A discipline begins the session *after* the repo exists.

---

## FIRST DECISION — RESOLVED: Supabase backend from the start

**Local-first vs. backend — resolved to *backend*.** The earlier "local-first, no server" call assumed **single-user, own-data**. That premise no longer holds: **iteration one enrolls ~10 test users across multiple markets.** Ten people breaks the lived-demand test *in favor of* a backend — you need their data to reach you to read the test, you need accounts + a way to push fixes, and losing a participant's history to a reinstall loses test signal. This is the lived-demand principle correctly applied to a changed premise, not a reversal for its own sake. *(Confidence: high.)*

- **Decision:** **Supabase from the start** (Postgres + Auth + Storage + Row-Level Security). RLS is the specific reason: it keeps ten people's consumption logs isolated from each other with minimal code.
- **Non-negotiable:** cannabis consumption data for real people on a server requires deliberate **encryption/pseudonymization + consent/terms** — now *active*, not deferred (see §Privacy below and the roadmap risk log).
- **Parser spike still independent:** whether COA text-extraction runs client-side or as a narrow Supabase edge function is a separate empirical question — resolve on its own merits (diagnose before implement).

## Step 0 (revised — Supabase backend, multi-market cohort)

1. **Repo:** GitHub repo; `CLAUDE.md` handbook; `documentation/` (with `follow-ups.md`); move the spec into `documentation/`.
2. **App skeleton:** Expo (React Native), runs on the iPhone via Expo Go. (Windows-friendly; no Mac needed.)
3. **Backend:** Supabase project — Postgres schema (users, COAs, terpenes/cannabinoids/safety, sessions), Auth, Storage (COA PDFs), **RLS from day one**. Local cache for offline reads.
4. **Parser spike:** prove/disprove client-side COA text-extraction vs. a Supabase edge function, against the 4 NY fixtures.

## Test cohort reality — multi-market from day one

Iteration-one testers are in **CT, PA, NY, and Vancouver BC (Canada)**. Because Cultivar **sells nothing**, state cannabis *sales* law does not govern it — a tracking app is not a dispensary. What actually governs: age-gating, no sales facilitation, data privacy, no medical claims. So the market spread is mostly a **technical + data** matter, not a legal blocker:

- **Legality of use** *(verify with counsel — not legal advice)*: NY/CT adult-use ✓ · **PA users hold medical cards → their use is legal → logging it is fine** ✓ · BC/Canada legal ✓. The sales-regime differences don't exclude any of these testers. (MVP is lab-tested-only, so home-grown — and its PA felony edge — is out of scope entirely.)
- **Age-gate is per-jurisdiction:** 21+ in the US states, **19+ in BC**.
- **Geo-restriction:** *prudence, not a hard sales-rule requirement* for a non-selling tracker (still confirm Apple's current cannabis-app stance for a tracker specifically). *(Medium.)*
- **Canada = cross-border data** (PIPEDA) on US-hosted Supabase — a privacy-design item, stands regardless of the sales point.
- **Automated COA parsing = NY-only at first** (Kaycha/DRS). CT/PA/BC testers **manually enter the COA** until those markets' parsers exist. The app still *works* everywhere via manual COA entry. *(The all-markets design, tested for real.)*

## Privacy — now active (not deferred)

Real people's consumption data across a US/Canada border makes these Step-1 concerns, not "later": RLS per-user isolation, encryption/pseudonymization of consumption logs, a consent flow + basic terms before enrolling anyone, and a data-deletion path. **This is where the legal item stops being deferred** — worth a lawyer before the cohort logs real data.

## `[ADAPT]` checklist — CANDIDATES (confirm from ground truth; not canonical)

1. **Stack/test/build:** Expo RN · Jest + React Native Testing Library · EAS build · npm scripts. *(candidate)*
2. **Repo path / `CLAUDE.md` / `documentation/`:** set on repo creation. *(TBD)*
3. **Source-of-truth:** the **Supabase Postgres store is canonical** (with a local cache for offline reads); COA PDFs in Supabase Storage; **no auto-transform on save**; **never fabricate terpene values** — show `ND` / "not reported by lab" only.
4. **Protected data dirs:** the COA archive + logged session data → `data:`-prefixed commits; never blanket-stage or revert. *(candidate)*
5. **Untracked dev files:** `.env`, local launchers, Expo local config. *(candidate — expand)*
6. **Warning baseline:** measure `tsc`/eslint warning count at end of Step 0; new work adds none. *(establish then)*
7. **Manual-gate:** launch via Expo Go on device; exercise capture → shelf → log → predict before any UI-visible commit.

## Build order (from the MVP plan)

Step 0 (foundations + parser spike) → 1 (ingestion service/module + normalization + confirm screen) → 2 (COA detail + shelf) → 3 (device capture flow — the second risky piece) → 4 (session logging + §8A lexicon/glossary/DEQ) → 5 (prediction) → 6 (compliance: 21+, geo-restrict, privacy, TestFlight).

Deferred past MVP: at-dispensary shortlist (needs a menu source + accumulated COAs), sharing (needs a server; Branch/branch.io relevant here — brother is a resource).

## Carry into the repo

- `Cultivar_MVP_and_Roadmap.md` → `documentation/`
- 4 COA PDFs → test fixtures (protected data)
- `cultivar-poc.jsx`, `Cultivar_Resources.xlsx` → `reference/` (design/logic reference — **not** production code)

---

## Decisions & open questions (per comms convention — surfaced here, not inline)

**Open questions, dependency order:**
1. **Existing POC** — throwaway prototype, or foundation for the RN app? (Still open.)
2. **PA testers hold medical cards → resolved** (legal use; logging fine). Residual home-grown-in-PA data sensitivity is covered by the privacy design, not a blocker.
3. **Create the repo now**, or planning left first?

*(Resolved this session: Supabase-from-start backend, driven by n=10 across CT/PA/NY/BC.)*

**First Claude Code prompt** (once #1 and #3 are settled): a Step 0 scaffold prompt (new Expo app, git init, `CLAUDE.md`, `documentation/`, `follow-ups.md`), delivered as a copyable file artifact with a "No interactive prompts" header.
