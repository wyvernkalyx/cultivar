# Road to the App Store -- ordered steps to completion

Status: drafted 2026-08-24; ratified by the operator 2026-08-24
(recorded in SESSION_HANDOFF.md). Amended by the commit that changes
its truth. Companion to Cultivar_MVP_and_Roadmap.md (the what) --
this doc is the in-what-order. One phase at a time; each session
opens with the next unchecked box, architect holds state, operator
rules.

## Already done (the part that argues against "lost cause")

Shipped and observed at HEAD: COA capture, both paths, confirm
screen; server-side ingestion with FIVE lab parsers (plan asked for
two); 179-test suite; personal shelf; session logging with closed
context survey and DEQ-style scale; fit/scoring reads; Insights
through D152; custom icon/splash; EAS production profile. The core
loop exists. What follows is completion, not construction.

## Phase 0 -- decisions (couch work; no code)

- [x] Name: RULED 2026-08-24. The app is KALYX. Display name and
      store listing become Kalyx; the store subtitle carries
      "journal" for search; domain kalyxjournal.com registered
      (Cloudflare, 2026-08-24) as the privacy-policy host and the
      future web-view surface. The repo slug and bundle ID
      (com.wyvernkalyx.cultivar) are retained -- invisible to
      users, no migration. Knockout search on record: App Store
      search clean (operator, on device); USPTO TESS export
      2026-08-24 shows four live KALYX marks, none in class 9 or
      42. Banked for the Phase 4 attorney pass: C-spelling
      phonetic twins (Calyx) were outside the search string.
- [x] At-dispensary shortlist: RULED 2026-08-24 -- v1.1. Out of v1;
      the non-goals line stands (no at-dispensary build work in
      v1). "MVP done" no longer waits on this hole.
- [ ] Apple account: confirm whether the developer account is
      individual or organization. Cannabis-adjacent apps should
      ship from a legal entity; if individual, entity formation +
      D-U-N-S + re-enrollment is the longest lead item in this
      whole document -- start the clock early.
- [ ] Stopwatch test: log one real session, timed. The MVP's #1
      risk has a 15-second bar and has never been measured. One
      evening, no code.

## Phase 1 -- name adoption (one small slice)

- [ ] Display-name sweep: app.json name "cultivar" -> "Kalyx"; any
      in-app wordmark; splash if it carries the word. Bundle ID
      stays.
- [ ] kalyxjournal.com live with a placeholder page (the privacy
      policy needs this home in Phase 4 anyway).

## Phase 2 -- compliance build (the real remaining engineering)

- [ ] 21+ age gate + jurisdiction attestation at onboarding
      (design doc first; MVP MUST and store requirement).
- [ ] Consent flow + terms screen before any cohort enrollment
      (MVP section 11, active; lawyer reviews the text, not the
      code).
- [ ] Account deletion (design doc first: must not quietly break
      the RESTRICT FKs or the append-only session chain; export
      already exists and helps).

## Phase 3 -- quality and accessibility (mostly already ranked)

- [ ] impeccable design-review arc: one run per core screen,
      findings triaged into the ranked backlog, operator
      screenshots as the gate instrument.
- [ ] 44pt hit-area audit (backlog item, unchanged).
- [ ] Owed VoiceOver passes (D152 legend; D149 residuals).
- [ ] Raw-error copy slice; unsupported-lab vs unreadable-document
      UX.
- [ ] MVP verification odds and ends: favor/avoid markers on the
      detail chart; effects glossary in-app; fit read at capture
      for a new product.

## Phase 4 -- store mechanics (checklist work)

- [ ] Privacy policy + support page hosted on the new domain.
- [ ] App Store Connect record under the new name; nutrition
      labels; age-rating questionnaire (expect 18+); US-only
      availability at launch.
- [ ] Reviewer path: decide the demo-account mechanism (auth is
      OTP-only; a reviewer needs a way in) and the clearly-labeled
      sample-data answer to the empty-shelf review problem --
      design doc, because it touches the no-fabricated-data
      invariant.
- [ ] Screenshots + description + keywords (no trademarked strain
      or brand names in metadata).

## Phase 5 -- proof (the banked arcs, now on the critical path)

- [ ] TestFlight internal, then the rescheduled tester event.
- [ ] Import-coverage tally (D153 -- printed and ready).
- [ ] Watch-one-person-use-it session.
- [ ] Triage what the tally and the watch session surface; fix
      only what blocks the loop.

## Phase 6 -- submit

- [ ] Final copy sweep against "encourages consumption" framing
      (the personal-empirical discipline is the defense; verify it
      held everywhere).
- [ ] Submit. Expect the possibility of a 1.4.3 first-pass
      rejection and an appeal -- common for cannabis-adjacent apps
      that sell nothing, and survivable.

## Non-goals of this document

- No Android/Google Play planning (policy unverified; later).
- No monetization decisions.
- No at-dispensary build work unless Phase 0 rules it back in.
