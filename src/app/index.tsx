import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddToShelfModal from '@/components/add-to-shelf-modal';
import { ShelfList } from '@/components/shelf-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [addToShelfVisible, setAddToShelfVisible] = useState(false);
  // Bumped on every modal close and used as ShelfList's key, so closing
  // after a save remounts the list and refetches (the pickId pattern). A
  // close without a save refetching too is accepted.
  const [shelfVersion, setShelfVersion] = useState(0);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, []);

  const signOut = async () => {
    // The root-layout gate observes the auth change and swaps to sign-in on
    // its own — no navigation here.
    await supabase.auth.signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView type="backgroundElement" style={styles.accountRow}>
          <ThemedText type="small" numberOfLines={1} style={styles.accountEmail}>
            {email ?? '…'}
          </ThemedText>
          <Pressable onPress={signOut}>
            <ThemedText type="smallBold">Sign out</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable style={styles.addToShelfPressable} onPress={() => setAddToShelfVisible(true)}>
          <ThemedView type="backgroundElement" style={styles.addToShelfRow}>
            <ThemedText type="smallBold">Add to shelf</ThemedText>
          </ThemedView>
        </Pressable>

        <AddToShelfModal
          visible={addToShelfVisible}
          onClose={() => {
            setAddToShelfVisible(false);
            setShelfVersion((n) => n + 1);
          }}
        />

        <ThemedText type="subtitle" style={styles.shelfHeading}>
          Your shelf
        </ThemedText>
        <ShelfList key={shelfVersion} />

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  accountRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  accountEmail: {
    flexShrink: 1,
  },
  addToShelfPressable: {
    alignSelf: 'stretch',
  },
  addToShelfRow: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  shelfHeading: {
    alignSelf: 'stretch',
  },
});
