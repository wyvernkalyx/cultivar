# Confirm Dialog -- web-capable confirmation (Arc A of the web promotion)

Status: drafted and operator-ratified 2026-09-01 (chat: "ratified
a-g and saved the file"). Implementation is slices 2-3 of this doc.

Lived demand: operator rulings, 2026-09-01 session. First, the
web-importer promotion (dialog-first, two arcs). Second, and wider:
kalyxjournal.com becomes a real surface -- land, log in, see profile,
import from the PC. That second ruling overturns two D163 non-goals
("shipping any user-facing web build"; "kalyxjournal.com stays a
placeholder") by operator authority, recorded here so the reversal is
documented, not silent. Arc B (the public surface) gets its own
D-number and doc; nothing in this arc ships a public route.

Every path to that future runs through one defect class first:
`Alert.alert` is an empty static method on react-native-web (D163
unknown 2). The spike observed two casualties; the true surface is
wider (see Observed surface): every confirmation, error, and outcome
prompt in the app is a silent no-op in a browser, including the
retire and restock flows the restock arc just shipped.

## D164 -- rulings, a-g ratified 2026-09-01

a. Two mechanisms, chosen by what the call site is. (1) The D88
   duplicate prompt becomes an in-modal arm: the 'confirming' phase
   renders the outcome buttons inside add-to-shelf-modal's own sheet,
   the way that modal already renders its 'incremented' and
   'restocked' arms. No Alert stacked on a Modal. (2) Every other
   site swaps its import to `appAlert`, a new module
   (`src/lib/app-alert.tsx`) whose call signature is Alert.alert's
   own: on native it passes straight through to Alert.alert (native
   behavior byte-identical, zero regression surface); on web it
   renders a themed RN `Modal` dialog through a host mounted once at
   the root. The swap at 20 sites is mechanical -- import line plus
   call-name, no argument changes.

b. Android scope, stated honestly: the D88 in-modal arm erases the
   D160.1 Android button-drop for D88 only (outcome 4 reaches
   Android for the first time). All appAlert sites keep native Alert
   semantics on Android, drop included, until a later ruling says
   otherwise. This arc fixes web; it does not relitigate Android.

c. Copy is frozen. Every site keeps its ratified strings verbatim.
   This arc moves presentation, never words. Gate criteria enumerate
   the displaced construct (`Alert.alert(`), not the copy.

d. Ordering and roles in the D88 arm follow the shipped Alert array:
   outcome 4 first when present, then acknowledge, corrected-report,
   and mistake last carrying the cancel role, wired to the same
   reset.

e. Gates, typed by what changes. Slice 2 changes native presentation
   (the D88 arm): physical-iPhone device gate, duplicate import with
   all four outcomes exercised, per-step verdicts; plus the browser
   gate on the same surface (arm renders, each outcome acts; writes
   verified by MCP read-back, acknowledge and mistake by absence of
   writes). Slice 3 is native-passthrough only: device gate is a
   regression pass (one Alert site of each file class exercised,
   confirming passthrough), browser gate exercises the retire flow
   and one error path end to end. The spike branch is evidence for
   browser method, never source (D163c holds).

f. Absence gate for the arc's end state: `Alert.alert(` count in
   src/ reaches exactly 1 -- the passthrough inside app-alert.tsx --
   with a live-target control, and the `react-native` Alert import
   survives only in that file. Enumerated per file in the slice-3
   prompt.

g. app-alert.tsx is pure presentation plumbing: no Jest coverage
   owed (it imports RN, which app-code tests cannot; UI slices gate
   on device and browser, and unit tests are explicitly not evidence
   for them).

## Observed surface (2026-09-01, repo at e0b7c4e3)

21 `Alert.alert(` construct sites across 8 files, observed by sweep
this session: coa-detail.tsx (6), src/app/index.tsx (5),
coa-retire.ts (4), coa-restock.ts (2), and one each in
add-to-shelf-modal.tsx (line 283, D88), coa-editor.tsx (line 282,
D37), session-ladder.tsx (919, session discard), shelf-card.tsx
(312). The spike's "two sites" correction was true of its snapshot
(cdedfc42, pre-restock); the restock arc added most of the rest.
add-to-shelf-modal already runs a phase machine with in-modal
terminal arms; the 'confirming' phase is the one arm still delegated
to Alert.

## Slices

1. This document (Tier 1).
2. feat (Tier 2): app-alert.tsx module and root host; the D88
   in-modal arm; swaps in the two import-path files
   (add-to-shelf-modal.tsx, coa-editor.tsx). Gates per ruling e.
   This slice alone makes the web import flow whole.
3. feat (Tier 2): mechanical appAlert swap in the remaining six
   files. Gates per ruling e.

## Non-goals

No public route, hosting, deploy, or age-gate work (Arc B). No copy
changes. No change to outcome logic, restock or retire RPCs, dedupe
matching, or phase semantics -- presentation only. No Android
button-count fix beyond the D88 arm (ruling b). No QR or camera
work. No new Alert call sites.
