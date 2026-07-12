# Add to shelf — navigation primitive (D32, resolves D30's open question)

_2026-07-12. Decided against the observed routing structure at `2a513ca`, not the
remembered one._

## Decision

The "add to shelf" flow (D30: enter-finish-dismiss, never a dwelt-in destination)
is a **component-state React Native `Modal`** — `presentationStyle="pageSheet"` on
iOS — opened from Home. It is **not** a routed screen. No `Stack`, no route file,
no change to `src/app/_layout.tsx`.

## Observed structure this decision rests on

The root layout is not a navigator. `src/app/_layout.tsx` is an auth-gated
component swap: `loading` → blank view, `signedOut` → `<SignIn />`, `signedIn` →
`<AppTabs />`. The `NativeTabs` navigator lives in `src/components/app-tabs.tsx`
and is imported from `expo-router/unstable-native-tabs` — an unstable API. There
is no `Slot` and no `Stack` anywhere under `src/`.

## Grounds

1. **Lived-demand.** Nothing in D27's six slices, the confirm/edit design, or the
   product metaphor requires a routed screen. The confirm/edit flow is a single
   screen with in-screen toggles. A router-modal buys a URL for a flow with no
   deep-link story.
2. **Proportionality / blast radius.** A routed modal requires a parent `Stack`:
   restructuring `index`/`explore` into a `(tabs)` group and re-plumbing the auth
   gate — the only device-proven flow in the app. A slice whose purpose is to
   prove navigation in isolation must not have the auth gate in its blast radius.
3. **Deferral is cheap and flat.** Slices 3–6 build the screen's *contents* (a
   plain component, portable into a route file later). The expensive part — the
   `(tabs)` restructure and auth-gate re-plumb — costs the same whenever it is
   done. Waiting does not compound it.
4. **Unstable-API caution.** Nesting a `Stack` above `unstable-native-tabs` is an
   unquantified interaction; not bought for a placeholder.

## Rejected alternative

Root `Stack` wrapper + router modal route. Rejected as speculative abstraction:
the restructure is not established as inevitable, and doing it now puts the auth
gate at risk for no present need.

## Trigger to revisit

Restructure to routed navigation becomes its own slice (with its own device gate
on the auth flow) **when a designed flow requires routed or pushed navigation** —
known at design time, per document-before-implement. Not before.

## Banked

- `pageSheet` swipe-to-dismiss is a data-loss vector once slice 5 adds editing.
  Intercept or disable gesture dismissal in slice 5, not now.
