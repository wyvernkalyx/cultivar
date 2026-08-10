import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddToShelfModal from '@/components/add-to-shelf-modal';
import { CompletionBloomOverlay } from '@/components/completion-bloom';
import { SessionLadder, type CloseOutcome } from '@/components/session-ladder';
import { Dash, Space, Type } from '@/constants/theme';
import { notifyDataChanged } from '@/lib/refresh';
import { supabase } from '@/lib/supabase';

// The center FAB's selector and its two flows (D138, reference screens 07
// and 08): "Scan or import a COA" opens the existing add flow -- which
// already carries manual entry as its third route (D134), so nothing
// shipped is lost -- and "Log a session" opens a strain picker, then the
// shipped ladder. This surface lives in the tab bar, outside both routes,
// so completed writes announce themselves through notifyDataChanged() and
// the routes refetch (see src/lib/refresh.ts).
//
// Chained presentation follows D49 throughout: the next modal is promoted
// only from the previous modal's onDismiss, never while it is mid-dismissal
// (the known iOS failure). onDismiss is iOS-only; Android stays banked, per
// the standing platform posture.

// The picker's row shape: what the list renders plus what the ladder needs
// (LadderCoa is structural: id, strain, brand).
type PickerCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
};

type PendingAction = 'add' | 'log' | null;

export function QuickActions({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  // Which flow the selector handed off to, promoted at its onDismiss (D49).
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerRows, setPickerRows] = useState<PickerCoa[] | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  // The ladder handoff pair, exactly the shelf's pattern: pending holds the
  // row across the picker's dismissal, logging mounts the ladder.
  const [pendingLogCoa, setPendingLogCoa] = useState<PickerCoa | null>(null);
  const [loggingCoa, setLoggingCoa] = useState<PickerCoa | null>(null);
  // D54's guard pair, read by the fullScreen modal's onRequestClose.
  const [logBusy, setLogBusy] = useState(false);
  const [logHasEntry, setLogHasEntry] = useState(false);
  const [bloomVisible, setBloomVisible] = useState(false);

  const loadPicker = () => {
    setPickerRows(null);
    setPickerError(null);
    void supabase
      .from('coas')
      .select('id, strain, brand')
      .gt('on_shelf_count', 0)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setPickerError(error.message);
          return;
        }
        setPickerRows(data as PickerCoa[]);
      });
  };

  const pick = (action: Exclude<PendingAction, null>) => {
    setPendingAction(action);
    onClose();
  };

  // The selector's dismissal completes; promote whichever flow was picked.
  const onSelectorDismissed = () => {
    if (pendingAction === 'add') {
      setAddVisible(true);
    } else if (pendingAction === 'log') {
      loadPicker();
      setPickerVisible(true);
    }
    setPendingAction(null);
  };

  const closeLadder = (outcome: CloseOutcome) => {
    setLoggingCoa(null);
    setLogHasEntry(false);
    if (outcome === 'logged') {
      setBloomVisible(true);
      notifyDataChanged();
    }
  };

  return (
    <>
      {/* The selector sheet (reference 07): transparent backdrop, bottom
          card. Cancel and backdrop both just close. */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        onDismiss={onSelectorDismissed}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss">
          <View />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Space.card }]}>
          <View style={styles.grabber} />
          <Pressable
            style={[styles.action, styles.actionPrimary]}
            onPress={() => pick('add')}
            accessibilityRole="button"
            accessibilityLabel="Scan or import a COA">
            <Text style={styles.actionTitle}>Scan or import a COA</Text>
            <Text style={styles.actionSub}>QR code, PDF, camera, or manual entry</Text>
          </Pressable>
          <Pressable
            style={styles.action}
            onPress={() => pick('log')}
            accessibilityRole="button"
            accessibilityLabel="Log a session">
            <Text style={styles.actionTitle}>Log a session</Text>
            <Text style={styles.actionSub}>Pick a strain, then rate it</Text>
          </Pressable>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* The add flow, whole: scan, import, manual entry (D134). Its close
          announces a possible write; a no-op close refetching too is the
          same accepted cost the shelf's remount pattern carries. */}
      <AddToShelfModal
        visible={addVisible}
        onClose={() => {
          setAddVisible(false);
          notifyDataChanged();
        }}
      />

      {/* The strain picker (reference 08): active items only, newest first,
          same ordering the Stash list shows. */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
        onDismiss={() => {
          if (pendingLogCoa !== null) {
            setLoggingCoa(pendingLogCoa);
            setPendingLogCoa(null);
          }
        }}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Log a session</Text>
            <Pressable
              onPress={() => setPickerVisible(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close picker">
              <Text style={styles.pickerClose}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.pickerSub}>Which strain?</Text>
          {pickerError !== null && <Text style={styles.pickerMessage}>{pickerError}</Text>}
          {pickerError === null && pickerRows === null && (
            <Text style={styles.pickerMessage}>Loading…</Text>
          )}
          {pickerError === null && pickerRows !== null && (
            <FlatList
              data={pickerRows}
              keyExtractor={(row) => row.id}
              contentContainerStyle={styles.pickerList}
              ListEmptyComponent={
                <Text style={styles.pickerMessage}>
                  Nothing in your stash yet. Add a COA first.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.pickerRow}
                  onPress={() => {
                    setPendingLogCoa(item);
                    setPickerVisible(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Log a session for ${item.strain ?? 'this item'}`}>
                  <Text style={styles.pickerStrain}>{item.strain ?? 'Unnamed'}</Text>
                  <Text style={styles.pickerBrand}>{item.brand ?? 'Brand not reported'}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>

      {/* The ladder, hosted exactly as the shelf hosts it (D50/D51, D54). */}
      <Modal
        visible={loggingCoa !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          if (!logBusy) {
            closeLadder(logHasEntry ? 'logged' : 'cancelled');
          }
        }}>
        {loggingCoa !== null && (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <SessionLadder
              coa={loggingCoa}
              onClose={closeLadder}
              onBusyChange={setLogBusy}
              onLoggedChange={setLogHasEntry}
            />
          </GestureHandlerRootView>
        )}
      </Modal>

      {bloomVisible && <CompletionBloomOverlay onDone={() => setBloomVisible(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: Dash.surface,
    borderTopLeftRadius: Dash.radius.card,
    borderTopRightRadius: Dash.radius.card,
    paddingHorizontal: Space.gutter,
    paddingTop: Space.chip,
    gap: Space.row,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Dash.radius.badge,
    backgroundColor: Dash.textFaint,
  },
  action: {
    backgroundColor: Dash.surface2,
    borderRadius: Dash.radius.card,
    padding: Space.card,
    gap: 2,
  },
  actionPrimary: {
    borderWidth: 1,
    borderColor: Dash.accent,
  },
  actionTitle: {
    fontFamily: Type.family.bold,
    fontSize: 14,
    color: Dash.text,
  },
  actionSub: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  cancel: {
    fontFamily: Type.family.semibold,
    fontSize: 13,
    color: Dash.textBody,
    textAlign: 'center',
    paddingVertical: Space.chip,
  },
  pickerSheet: {
    flex: 1,
    backgroundColor: Dash.bg,
    paddingHorizontal: Space.gutter,
    paddingTop: Space.card,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    fontFamily: Type.family.display,
    fontSize: 20,
    color: Dash.text,
  },
  pickerClose: {
    fontFamily: Type.family.semibold,
    fontSize: 13,
    color: Dash.accent,
  },
  pickerSub: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
    marginTop: 2,
    marginBottom: Space.row,
  },
  pickerList: {
    gap: Space.chip,
    paddingBottom: Space.section,
  },
  pickerMessage: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
    textAlign: 'center',
    paddingVertical: Space.section,
  },
  pickerRow: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.row,
    padding: Space.card,
    gap: 2,
  },
  pickerStrain: {
    fontFamily: Type.family.bold,
    fontSize: 13,
    color: Dash.text,
  },
  pickerBrand: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  gestureRoot: {
    flex: 1,
  },
});
