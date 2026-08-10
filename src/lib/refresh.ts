// A minimal data-changed tick (slice 3, D138). The quick-actions surface
// lives in the tab bar, outside both routes' component trees, so a write it
// hosts (an import, a logged session) cannot reach the shelf's load() or the
// Insights fetch through props. Subscribers refetch on notify; nothing else.
// Deliberately not an event bus: one event, no payload, no ordering claims.

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDataChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}
