# History cards collapse — design (D149)

Status: RATIFIED by operator 2026-08-19 in chat. This status line is
amended by the commit that changes its truth.

Operator grounds, verbatim: start with the History tab "since that is
where the bulk of all cards are going to be." Observed at ratification:
Active 2, History 13, and History only grows -- every retirement adds
a row.

## D149 -- History cards render collapsed by default

- **Collapsed form.** A History card renders one compact block: the
  strain line, the brand line (a missing brand renders the existing
  "Brand not reported" form), and a disclosure chevron. Nothing else
  -- no analyte columns, no fingerprint, no retirement line, no
  session footer. The whole collapsed card is one Pressable that
  EXPANDS it; it does not open the detail. 44pt minimum hit area
  (the D145 floor).
- **Expanded form.** Exactly today's History card, unchanged -- same
  card language (D101), retirement line, verdict footer -- plus a
  collapse control in the header region (the chevron, rotated;
  nested-press precedent from Log and overflow). Tapping the
  expanded card's body opens the detail, exactly as today.
- **State.** Per-card, session-local, owned by the list (keyed by COA
  id). Not persisted: a refetch or segment switch resets to
  collapsed. Named, accepted v1 cost; persistence is banked on lived
  demand.
- **Scope.** History segment only. Active cards are untouched in both
  code paths and rendered form. Search results within History follow
  the same rule (collapsed until expanded).
- **Supersession, grounds against grounds.** D101's same-card-language
  rule gets a scoped exception: the collapsed form is new language on
  the History surface only. D101's grounds were archive reachability
  and honesty -- both preserved, since one tap reaches the identical
  full card and nothing renders that was not stored. The operator's
  scroll-speed grounds govern the resting state at 13-and-growing
  rows; the expanded state remains D101's card verbatim.
- **Accessibility.** The collapsed Pressable carries
  accessibilityRole="button", a label of strain plus brand, and
  accessibilityState expanded: false; the expanded collapse control
  announces expanded: true (the Rank-4 pattern).
- **Data.** Display-only. Zero new queries, no schema, no view, no
  migration. Files: src/components/shelf-card.tsx,
  src/components/shelf-list.tsx.

## Non-goals

- The Active segment, in any respect. Persistence of expansion state.
- The COA detail's Sessions section (a different idea, unruled).
- Overflow, Log, retire, attach, sort, and search semantics.
- Any animation beyond the default (LayoutAnimation is banked -- one
  ruling at the gate if the snap grates).

Slice plan: this doc (Tier 1); D149 as one feat: commit (Tier 2,
device-gated on the physical iPhone).
