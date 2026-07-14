import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// DB shape (D41): exactly the selected columns, snake_case, as the coas
// table stores them — not the parser shape.
type ShelfCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
  lab: string | null;
  total_thc: number | null;
  total_cbd: number | null;
  total_terpenes: number | null;
  created_at: string;
};

// Three-state invariant, same as the editor: a null total is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank.
function totalLabel(value: number | null) {
  return value === null ? 'ND' : `${value}%`;
}

function Total({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.total}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{totalLabel(value)}</ThemedText>
    </View>
  );
}

// Neutral by construction (D41): every card is the same themed surface — no
// mood, no color coding, no per-card visual variance. One interaction (D42):
// long-press to delete.
function ShelfCard({ coa, onDelete }: { coa: ShelfCoa; onDelete: () => void }) {
  return (
    // Long-press only (D42), with no press feedback: the card stays
    // visually neutral (discipline 2). Tap does nothing.
    <Pressable onLongPress={onDelete}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{coa.strain}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {coa.brand}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Added {new Date(coa.created_at).toLocaleDateString()}
        </ThemedText>
        <View style={styles.totalsRow}>
          <Total label="THC" value={coa.total_thc} />
          <Total label="CBD" value={coa.total_cbd} />
          <Total label="Total terpenes" value={coa.total_terpenes} />
        </View>
      </ThemedView>
    </Pressable>
  );
}

export function ShelfList() {
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Promise-callback form, not an async body: setState stays out of the
  // synchronous effect path (react-hooks/set-state-in-effect), matching the
  // getSession().then() pattern on the home screen.
  const load = useCallback(
    () =>
      supabase
        .from('coas')
        .select('id, strain, brand, lab, total_thc, total_cbd, total_terpenes, created_at')
        .order('created_at', { ascending: false })
        .then(({ data, error: queryError }) => {
          if (queryError) {
            setError(queryError.message);
            return;
          }
          setError(null);
          // The client is untyped (no generated DB types); this cast asserts
          // the selected-columns shape. Runtime validation remains the
          // accepted debt.
          setRows(data as ShelfCoa[]);
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Client delete, no RPC (D42): the child analyte rows are the schema's
  // on-delete-cascade concern, not the client's; RLS scopes the delete.
  const deleteCoa = (id: string) =>
    supabase
      .from('coas')
      .delete()
      .eq('id', id)
      .then(({ error: deleteError }) => {
        if (deleteError) {
          Alert.alert('Delete failed', deleteError.message);
          return;
        }
        // Honest state over optimistic removal: refetch through load.
        return load();
      });

  const confirmDelete = (coa: ShelfCoa) => {
    // D44 line-echo body: echo the pressed card's displayed identity
    // (strain, brand, added date), then the destruction sentence. Never
    // render a blank where a name should be: strain falls back to
    // "this COA"; a null/blank brand omits its line entirely.
    const strain = coa.strain?.trim() ? coa.strain.trim() : 'this COA';
    const brand = coa.brand?.trim();
    const identity = [
      strain,
      ...(brand ? [brand] : []),
      `Added ${new Date(coa.created_at).toLocaleDateString()}`,
    ].join('\n');
    Alert.alert(
      'Delete COA?',
      `${identity}\n\nDeletes this COA and all of its lab data (terpene, cannabinoid, and safety rows). This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCoa(coa.id) },
      ]
    );
  };

  if (error) {
    return (
      <View style={styles.messageContainer}>
        <ThemedText type="small" style={styles.centered}>
          {error}
        </ThemedText>
        <Pressable onPress={load}>
          <ThemedText type="smallBold" style={styles.centered}>
            Retry
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  if (rows === null) {
    return (
      <View style={styles.messageContainer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          Loading…
        </ThemedText>
      </View>
    );
  }

  return (
    // created_at desc comes from the query ONLY — no client-side sorting or
    // filtering; RLS scopes the rows, the DB orders them.
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={rows}
      keyExtractor={(coa) => coa.id}
      renderItem={({ item }) => <ShelfCard coa={item} onDelete={() => confirmDelete(item)} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListEmptyComponent={
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          Nothing on your shelf yet
        </ThemedText>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  messageContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  total: {
    gap: Spacing.half,
  },
});
