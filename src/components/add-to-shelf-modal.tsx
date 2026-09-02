import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CoaEditor, type CoaParseResult } from '@/components/coa-editor';
import QrImportBrowser from '@/components/qr-import-browser';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  findCoaDuplicates,
  pickDedupeTarget,
  type DuplicateMatch,
} from '@/lib/coa-dedupe';
import { uploadCoaPdf, type UploadStage } from '@/lib/coa-pdf-storage';
import { restockCoa } from '@/lib/coa-restock';
import { MANUAL_CANNABINOID_NAMES, MANUAL_TERPENE_NAMES } from '@/lib/manual-coa';
import { ingestCoaPdf, type IngestResult } from '@/lib/ingest-coa';
import { supabase } from '@/lib/supabase';

// 'incremented' is a second terminal state beside 'saved', not a variant of
// it (D88 outcome 1): nothing was inserted and nothing was uploaded, so the
// saved arm's id and retention notice would both be lies. Separate phase,
// separate copy.
type Phase =
  | 'idle'
  | 'scanning'
  | 'picking'
  | 'sending'
  | 'done'
  | 'confirming'
  | 'saved'
  | 'incremented'
  // D160.3: the fourth D88 outcome's own terminal, beside 'incremented' for
  // the same reason it exists -- nothing inserted, nothing uploaded, so the
  // saved arm's copy would lie. Carries the name the success line echoes.
  | 'restocked';

// D164 ruling a-1: what the 'confirming' arm needs in order to render the
// D88 outcomes in the sheet. Built by promptDuplicate from the same values
// that used to be the dialog's arguments; every field is presentation or a
// handler argument, never new logic.
type DuplicatePrompt = {
  identity: string;
  summary: string;
  everyMatchRetired: boolean;
  target: DuplicateMatch;
  payload: CoaParseResult;
};

// Retention failure is reported, never recovered from (slice 4). The stage is
// in the copy on purpose: the gate is the device, where this notice is the
// only evidence anyone gets.
function retentionMessage(stage: UploadStage, detail?: string): string {
  return [
    `Added to your stash, but the source PDF was not retained (${stage}).`,
    detail,
  ]
    .filter(Boolean)
    .join('\n');
}

// D135: the row an attach targets. Identity fields ride here so the prefill
// rule can apply them; the id is what attach_coa updates in place.
export type AttachTarget = { id: string; strain: string | null; brand: string | null };

export default function AddToShelfModal({
  visible,
  onClose,
  attachTarget,
}: {
  visible: boolean;
  onClose: () => void;
  // D135: when set, this flow attaches to an existing row instead of
  // inserting a new one. Same pipeline; the fork points are the idle
  // buttons, the guard affordance, the prefill, the dedup outcome, and
  // which RPC commits.
  attachTarget?: AttachTarget | null;
}) {
  const attaching = attachTarget != null;
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<IngestResult | null>(null);
  // Pick identity (D38): remount-keys ReviewOrGuard so a repick — including
  // the same file — mounts a fresh editor draft rather than leaking a stale one.
  const [pickId, setPickId] = useState(0);
  // Insert failure lives in its own state, NOT in `result`: overwriting the
  // result would tear down the editor and lose the draft. The editor stays
  // mounted; retry is just pressing Confirm again.
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  // The picked file URI, held from pick() to confirm() (D87.4): retention
  // uploads in the same user action that commits the row, and nothing else in
  // the flow keeps a handle on the PDF once the parse call returns.
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  // Transport metadata, never a reviewable parse field (D88.5): held here as a
  // sibling of pickedUri rather than threaded through CoaParseResult, so the
  // editor neither renders it nor can edit it. Null when the deployed Edge
  // Function did not supply one -- that disables the hash arm of the lookup
  // and leaves the natural key doing the work, which is the live case today.
  const [pdfSha256, setPdfSha256] = useState<string | null>(null);
  // Non-blocking: the COA is saved whether or not this is set.
  const [retentionNotice, setRetentionNotice] = useState<string | null>(null);
  // D134 manual entry, both routes: set by the idle-screen button (no file
  // exists) and by the guard affordance (a picked file exists and pickedUri /
  // pdfSha256 stay live, so retention and the dedup hash ride as usual).
  const [manualEntry, setManualEntry] = useState(false);
  // D160.3: the strain the restocked terminal names. Set with the phase,
  // cleared by reset.
  const [restockedStrain, setRestockedStrain] = useState<string | null>(null);
  // D164 ruling a-1: non-null exactly while the D88 outcomes are on screen.
  // Armed by promptDuplicate, cleared by whichever outcome is chosen.
  const [duplicate, setDuplicate] = useState<DuplicatePrompt | null>(null);

  // The component stays mounted while the Modal is hidden, so state would
  // survive a close; resetting here (not in an effect) keeps reopen-at-idle
  // without a setState-in-effect.
  const close = () => {
    reset();
    onClose();
  };

  // Pre-pick state. Also the D88 outcome-2 discard ("I uploaded this by
  // mistake"): nothing was written, so returning to idle IS the whole action.
  const reset = () => {
    setPhase('idle');
    setResult(null);
    setConfirmError(null);
    setSavedId(null);
    setPickedUri(null);
    setPdfSha256(null);
    setRetentionNotice(null);
    setManualEntry(false);
    setRestockedStrain(null);
    setDuplicate(null);
  };

  const pickAnother = reset;

  /**
   * Everything downstream of a cache-local file URI, shared verbatim by the
   * picker and the QR path rather than copied: once the bytes are on disk the
   * two entry points ARE the same pipeline, and two copies of it would drift.
   */
  const ingestFromUri = async (uri: string) => {
    // Retained for the save step. The URI is cache-local either way — the
    // picker copies there, the QR path downloads there — which is what makes a
    // second read at confirm time possible at all.
    setPickedUri(uri);
    setPhase('sending');
    const ingested = await ingestCoaPdf(uri);
    setResult(ingested);
    // Read off the transport envelope, not the parse: the field is optional
    // because the hashing function is committed but not deployed, and a
    // client that required it would break against the live deployment.
    setPdfSha256(
      ingested.ok
        ? ((ingested.json as { data?: { pdfSha256?: string } }).data?.pdfSha256 ?? null)
        : null,
    );
    setPickId((n) => n + 1);
    setPhase('done');
  };

  const pick = async () => {
    setConfirmError(null);
    setPhase('picking');
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (picked.canceled) {
        setPhase('idle');
        return;
      }
      await ingestFromUri(picked.assets[0].uri);
    } catch (err) {
      setResult({
        ok: false,
        status: null,
        body: '',
        message: `Picker failed: ${err instanceof Error ? err.message : String(err)}`,
      });
      setPickId((n) => n + 1);
      setPhase('done');
    }
  };

  /**
   * The QR path's entry into that same pipeline (D116): the client fetches the
   * bytes itself, and hands a cache-local URI to the helper above. The remote
   * URL is used for the download and then dropped — `pickedUri` holds only the
   * local file, which is what retention uploads, and no URL is stored anywhere
   * (qr-import.md non-goal, reinforced by the validation walks' finding that
   * the primary provider mints a fresh token per visit).
   */
  const importFromUrl = async (url: string) => {
    setConfirmError(null);
    // The error arm the parse failures already use, reached the same way.
    const fail = (message: string) => {
      setResult({ ok: false, status: null, body: '', message });
      setPickId((n) => n + 1);
      setPhase('done');
    };

    // D116 restricts the client fetch to https in code. The WebView may
    // traverse http on the way there; only this download is gated.
    if (!/^https:\/\//i.test(url)) {
      fail('This page is not served over https, so Kalyx will not download it.');
      return;
    }

    setPhase('sending');
    let downloaded: File;
    try {
      // A fresh name per import. The primary provider's finals repeat GUID
      // basenames across jars, and a collision throws rather than overwriting
      // — which would fail an import that should have succeeded.
      const destination = new File(Paths.cache, `qr-import-${Date.now()}.pdf`);
      downloaded = await File.downloadFileAsync(url, destination);
    } catch (err) {
      fail(`Could not download this page: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    await ingestFromUri(downloaded.uri);
  };

  const confirm = async (payload: CoaParseResult) => {
    setConfirmError(null);
    setRetentionNotice(null);
    setPhase('confirming');

    // Dedupe runs before the insert and FAILS CLOSED (D88): a lookup error
    // stops the save rather than falling through to it. A check that silently
    // fails re-opens the exact hole it exists to close, and the failure is the
    // user's to see -- surfaced, never swallowed.
    //
    // lab and batch come from the payload, so they are post-edit values, never
    // raw parse output (the design doc's slice 5 constraints). The user may
    // have corrected the very fields the natural key is built from.
    const found = await findCoaDuplicates(pdfSha256, payload.lab, payload.batch);
    if (!found.ok) {
      setConfirmError(found.message);
      setPhase('done');
      return;
    }
    // D135: a match on the target row itself is not a conflict -- re-attach
    // is legal. Only rows OTHER than the target count.
    const matches =
      attachTarget != null
        ? found.rows.filter((r) => r.id !== attachTarget.id)
        : found.rows;
    if (matches.length > 0) {
      if (attachTarget != null) {
        // D135: a cross-row match is a STOP, never the three-outcome prompt.
        // Attach must never touch a row other than its target, and every one
        // of D88's outcomes would.
        const name = pickDedupeTarget(matches).strain?.trim();
        setConfirmError(
          `This document already lives on another stash item${name ? ` (${name})` : ''}. Nothing was changed.`,
        );
        setPhase('done');
        return;
      }
      // Never a silent merge (D88): every match is the user's call. The phase
      // stays 'confirming' while the dialog is up, which keeps the editor's
      // button disabled until an outcome is chosen.
      promptDuplicate(matches, payload);
      return;
    }
    await save(payload);
  };

  /**
   * The three-outcome prompt (D88), armed rather than raised (D164 ruling
   * a-1): the outcomes render in this modal's own sheet, the way its
   * terminal arms already do, because the platform popup is a silent no-op
   * in a browser and left the import hung at 'confirming' there. The
   * identity echo is D44/D45 reused -- name the row before saying what will
   * happen to it, and never render a blank where a name should be.
   */
  const promptDuplicate = (rows: DuplicateMatch[], payload: CoaParseResult) => {
    const target = pickDedupeTarget(rows);
    const strain = target.strain?.trim() ? target.strain.trim() : 'this COA';
    const brand = target.brand?.trim();
    const identity = [strain, ...(brand ? [brand] : [])].join('\n');
    const summary =
      rows.length === 1
        ? 'This document matches a COA already in your stash.'
        : `This document matches ${rows.length} COAs in your stash; the strongest match is shown.`;
    // Outcome 4 (D160): only when EVERY match is off-shelf. If any match is
    // still shelved the lot is present and outcome 1 is the true answer.
    // First in the arm, as it was first in the array: when everything matched
    // is retired, the re-buy is the likely answer. Rendering it in the sheet
    // also lands it on Android for the first time (D164 ruling b).
    const everyMatchRetired = rows.every((r) => r.on_shelf_count === 0);
    setDuplicate({ identity, summary, everyMatchRetired, target, payload });
  };

  /**
   * D139 outcome 1: nothing is written. Possession is have-it or don't;
   * the same document arriving again changes no state, and the phase
   * exists only so the modal can say so.
   */
  const acknowledge = () => {
    setPhase('incremented');
  };

  /**
   * D160 outcome 4: the same row returns. One RPC, no insert, no upload --
   * the scanned bytes already live on the target row. A failure is
   * surfaced on the editor exactly as an insert failure is, and the phase
   * returns to 'done' so the user can choose again.
   */
  const restock = async (target: DuplicateMatch) => {
    const result = await restockCoa(target.id);
    if (!result.ok) {
      setConfirmError(result.message);
      setPhase('done');
      return;
    }
    setRestockedStrain(target.strain?.trim() ? target.strain.trim() : null);
    setPhase('restocked');
  };

  /**
   * The save path, unchanged in substance from the pre-dedupe flow. Reached
   * two ways now: no match at all, and D88 outcome 3.
   */
  const save = async (payload: CoaParseResult) => {
    setConfirmError(null);
    setPhase('confirming');
    // pdfSha256 rides the payload (D88.5). insert_coa itself is unchanged: it
    // reads payload->>'pdfSha256', and both a JSON null and a missing key
    // arrive as SQL NULL, so an undeployed hasher needs no special case here.
    // D135: attach commits through attach_coa against the target's own id --
    // update-in-place, children replaced transactionally, sessions untouched.
    // Both RPCs return the row's uuid, so the arms converge immediately.
    const { data, error } =
      attachTarget != null
        ? await supabase.rpc('attach_coa', {
            p_coa_id: attachTarget.id,
            payload: { ...payload, pdfSha256 },
          })
        : await supabase.rpc('insert_coa', {
            payload: { ...payload, pdfSha256 },
          });
    if (error) {
      setConfirmError(error.message);
      setPhase('done');
      return;
    }
    const id = String(data);
    setSavedId(id);
    // Past this line the row is committed and the save is NEVER unwound
    // (D87.4). Retention runs after it, and every outcome below — including a
    // missing URI, which can only mean the picked file was never readable —
    // lands on 'saved' with a notice rather than an error arm.
    if (pickedUri === null) {
      // Direct manual entry has no source document: nothing existed to
      // retain, so the "not retained" warning would be false (D134). The
      // notice is reserved for a file that existed and failed to store.
      if (!manualEntry) setRetentionNotice(retentionMessage('read'));
    } else {
      const stored = await uploadCoaPdf(pickedUri, id);
      if (!stored.ok) {
        setRetentionNotice(retentionMessage(stored.stage, stored.message));
      }
    }
    setPhase('saved');
  };

  const busy = phase === 'picking' || phase === 'sending';

  return (
    // presentationStyle is iOS-only; Android falls back to a standard modal and
    // the hardware back button fires onRequestClose. Acceptable — the gate
    // device is the iPhone.
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
      // iOS gesture dismissal of a pageSheet does not reliably route through
      // onRequestClose; wiring both keeps `visible` in sync, and calling
      // onClose twice is idempotent.
      onDismiss={close}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={styles.centered}>
            {attaching ? 'Attach COA document' : 'Add to stash'}
          </ThemedText>

          {/* D164 ruling a-1: the D88 outcomes render here, in the sheet,
              instead of through the platform popup. Above the editor so the
              question is what the user sees; the editor stays mounted and
              busy beneath it, exactly as it was while the popup was up. Order
              and roles are the shipped array's (ruling d), and every button
              calls the handler it called before -- clearing the arm first is
              the dismissal the popup did for us. */}
          {duplicate !== null && (
            <View style={styles.duplicate}>
              <ThemedText type="smallBold" style={styles.centered}>
                Already in your stash?
              </ThemedText>
              <ThemedText type="small" style={styles.centered}>
                {duplicate.identity}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                {duplicate.summary}
              </ThemedText>
              {duplicate.everyMatchRetired && (
                <Pressable
                  onPress={() => {
                    setDuplicate(null);
                    void restock(duplicate.target);
                  }}
                  accessibilityRole="button"
                  style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">I bought another package</ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setDuplicate(null);
                  acknowledge();
                }}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">I already have this</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDuplicate(null);
                  void save(duplicate.payload);
                }}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">This is a corrected report</ThemedText>
              </Pressable>
              {/* The cancel role: quiet, and wired to the same reset. */}
              <Pressable
                onPress={reset}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  I uploaded this by mistake
                </ThemedText>
              </Pressable>
            </View>
          )}

          {phase === 'restocked' ? (
            <>
              <ScrollView style={styles.resultScroll}>
                <ThemedText type="smallBold" style={styles.centered}>
                  {`${restockedStrain ?? 'This COA'} is back in your stash.`}
                </ThemedText>
              </ScrollView>
              <Pressable
                onPress={pickAnother}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Pick another</ThemedText>
              </Pressable>
            </>
          ) : phase === 'incremented' ? (
            <>
              <ScrollView style={styles.resultScroll}>
                <ThemedText type="smallBold" style={styles.centered}>
                  Already in your stash
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                  Nothing was changed.
                </ThemedText>
              </ScrollView>
              <Pressable
                onPress={pickAnother}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Pick another</ThemedText>
              </Pressable>
            </>
          ) : phase === 'saved' ? (
            <>
              <ScrollView style={styles.resultScroll}>
                <ThemedText type="smallBold" style={styles.centered}>
                  {attaching ? 'Attached to your stash item' : 'Added to your stash'}
                </ThemedText>
                {savedId && (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                    {savedId}
                  </ThemedText>
                )}
                {/* Same display pattern as confirmError, different meaning:
                    this one reports on something that already succeeded. */}
                {retentionNotice && (
                  <ThemedText type="small" style={[styles.centered, styles.confirmError]}>
                    {retentionNotice}
                  </ThemedText>
                )}
              </ScrollView>
              <Pressable
                onPress={pickAnother}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Pick another</ThemedText>
              </Pressable>
            </>
          ) : manualEntry ? (
            <>
              <View style={styles.resultBody}>
                <CoaEditor
                  coa={manualSeed()}
                  manual
                  onConfirm={confirm}
                  busy={phase === 'confirming'}
                />
              </View>
              {confirmError && (
                <ThemedText type="small" style={[styles.centered, styles.confirmError]}>
                  {confirmError}
                </ThemedText>
              )}
              <Pressable
                onPress={pickAnother}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Start over</ThemedText>
              </Pressable>
            </>
          ) : (phase === 'done' || phase === 'confirming') && result ? (
            <>
              {result.ok ? (
                // No ScrollView on this arm (D43): the editor scrolls itself,
                // and a flex child inside a ScrollView cannot fill the
                // viewport — the plain View gives it real height. The guard
                // arm renders bare, a short fixed block.
                //
                // The 200 body is the transport envelope { data: <parse> },
                // so this cast asserts two things: the envelope shape and
                // the parse shape. Both are produced server-side; runtime
                // validation remains the accepted debt this slice.
                <View style={styles.resultBody}>
                  <ReviewOrGuard
                    key={pickId}
                    coa={attachPrefill(
                      (result.json as { data: CoaParseResult }).data,
                      attachTarget,
                    )}
                    onConfirm={confirm}
                    // D135: suppressed in attach context -- the guard's
                    // manual route creates a new row, the one thing attach
                    // must never do. The guard shows its error only.
                    onManual={attaching ? undefined : () => setManualEntry(true)}
                    busy={phase === 'confirming'}
                  />
                </View>
              ) : (
                <ScrollView style={styles.resultScroll}>
                  <ThemedText type="code">
                    {[
                      `status: ${result.status ?? 'network error'}`,
                      result.message,
                      result.body,
                    ]
                      .filter(Boolean)
                      .join('\n')}
                  </ThemedText>
                </ScrollView>
              )}
              {confirmError && (
                <ThemedText type="small" style={[styles.centered, styles.confirmError]}>
                  {confirmError}
                </ThemedText>
              )}
              <Pressable
                onPress={pickAnother}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Pick another</ThemedText>
              </Pressable>
            </>
          ) : phase === 'scanning' ? (
            // Fills the content area in place of the button stack. Cancel
            // returns to idle; nothing has been fetched or written yet.
            <View style={styles.resultBody}>
              <QrImportBrowser onImport={importFromUrl} onCancel={() => setPhase('idle')} />
            </View>
          ) : (
            <>
              <Pressable
                onPress={pick}
                disabled={busy}
                accessibilityRole="button"
                style={[
                  styles.button,
                  { backgroundColor: theme.backgroundElement },
                  busy && styles.buttonDisabled,
                ]}>
                <ThemedText type="smallBold">
                  {phase === 'sending' ? 'Sending…' : 'Pick COA PDF'}
                </ThemedText>
              </Pressable>
              {/* The second entry point sits inside the Add flow beside the
                  picker, not on the shelf header: both produce the same
                  cache-local URI, so they belong at the same fork.
                  D135: attach is pick-only, per the ratified flow -- the QR
                  and direct-manual entries render on the add flow alone. */}
              {!attaching && (
              <Pressable
                onPress={() => setPhase('scanning')}
                disabled={busy}
                accessibilityRole="button"
                style={[
                  styles.button,
                  { backgroundColor: theme.backgroundElement },
                  busy && styles.buttonDisabled,
                ]}>
                <ThemedText type="smallBold">Scan package QR</ThemedText>
              </Pressable>
              )}
              {/* The no-file route (D134, operator ruling 2026-08-08): no
                  pick, no pdfSha256, no retention -- the seed is the form. */}
              {!attaching && (
              <Pressable
                onPress={() => {
                  setConfirmError(null);
                  setManualEntry(true);
                }}
                disabled={busy}
                accessibilityRole="button"
                style={[
                  styles.button,
                  { backgroundColor: theme.backgroundElement },
                  busy && styles.buttonDisabled,
                ]}>
                <ThemedText type="smallBold">Enter a COA manually</ThemedText>
              </Pressable>
              )}
            </>
          )}

          <Pressable
            onPress={close}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Close</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

// D135 prefill rule: identity fields -- strain, brand -- keep the target
// row's values when the row has them; the parse fills blanks only. Document
// fields are the parse's own. A compliance form's "Whole Flower" must not
// overwrite the name the shelf item already carries.
function attachPrefill(
  parsed: CoaParseResult,
  target: AttachTarget | null | undefined,
): CoaParseResult {
  if (target == null) return parsed;
  return {
    ...parsed,
    strain: target.strain?.trim() ? target.strain : parsed.strain,
    brand: target.brand?.trim() ? target.brand : parsed.brand,
  };
}

// The manual seed (D134): a synthetic parse whose analyte rows are the
// pre-populated form names. The editor's manual mode inits every row Not
// Available, so none of these names is data until the user gives it a value.
// sourceLab 'manual' is the provenance marker and rides the emission into
// insert_coa unchanged; safety is empty by design (no manual transcription).
function manualSeed(): CoaParseResult {
  const rows = (names: readonly string[]): { name: string; pct: null }[] =>
    names.map((name) => ({ name, pct: null }));
  return {
    lab: null,
    brand: null,
    strain: null,
    batch: null,
    sampledDate: null,
    testedDate: null,
    totalThcPct: null,
    totalCbdPct: null,
    totalTerpenesPct: null,
    terpenes: rows(MANUAL_TERPENE_NAMES),
    cannabinoids: rows(MANUAL_CANNABINOID_NAMES),
    safety: [],
    sourceLab: 'manual',
  };
}

function ReviewOrGuard({
  coa,
  onConfirm,
  onManual,
  busy,
}: {
  coa: CoaParseResult;
  onConfirm: (coa: CoaParseResult) => void;
  // D134: manual state lives in the modal (both routes render one arm there);
  // the guard affordance only reports the choice upward. Optional since
  // D135: an absent handler suppresses the affordance entirely.
  onManual?: () => void;
  busy: boolean;
}) {
  const theme = useTheme();

  // Slice 5a guard. An unreadable or non-COA PDF comes back as HTTP 200 with
  // an all-empty parse -- and a known lab tag is no evidence against that
  // (lab identification is presence-of-string). The guarded class is the
  // empty parse itself; see documentation/design/confirm-edit-screen.md,
  // "Empty-parse guard (slice 5a)".
  if (coa.terpenes.length === 0 && coa.cannabinoids.length === 0) {
    return (
      <ThemedView style={styles.guard}>
        <ThemedText type="smallBold" style={styles.centered}>
          {"Couldn't read this COA"}
        </ThemedText>
        <ThemedText style={styles.centered}>
          {"Kalyx doesn't support this lab's reports yet."}
        </ThemedText>
        {onManual !== undefined && (
          <Pressable
            onPress={onManual}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Enter this COA manually</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    );
  }
  return <CoaEditor coa={coa} onConfirm={onConfirm} busy={busy} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  centered: {
    textAlign: 'center',
  },
  resultScroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  resultBody: {
    flex: 1,
    alignSelf: 'stretch',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmError: {
    // No error token exists in Colors; literal color follows the sign-in
    // precedent. Legible on both light and dark backgrounds.
    color: '#e5484d',
  },
  guard: {
    gap: Spacing.three,
  },
  duplicate: {
    gap: Spacing.three,
  },
});
