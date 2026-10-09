import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  Decision, FlowAction, Id, INSPECTION_FLOW_ENABLED, InspectionFlow, Outcome,
  errorText, loadInspectionFlow, mutateInspectionFlow, prepareInspectionSettlement,
} from '@/src/services/inspectionFlow';

type Props = { appointmentId: Id; expectedRole?: 'customer' | 'lister' | 'representative' };
export function ActionButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[s.button, disabled && s.disabled]}><Text style={s.buttonText}>{title}</Text></TouchableOpacity>;
}
export function Rating({ label, value, onChange, disabled = false }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return <View><Text style={s.label}>{label}</Text><View style={s.row}>
    {[1, 2, 3, 4, 5].map(n => <TouchableOpacity key={n} disabled={disabled} accessibilityRole="button"
      accessibilityLabel={`${label}: ${n} out of 5`} accessibilityState={{ selected: value === n, disabled }}
      onPress={() => onChange(n)} style={s.rating}><Text style={{ color: value >= n ? '#a16207' : '#64748b' }}>{n} ★</Text></TouchableOpacity>)}
  </View></View>;
}
function safeGoogleUrl(raw: string): string {
  const u = new URL(raw);
  if (u.protocol !== 'https:' || !['g.page', 'search.google.com', 'www.google.com', 'maps.google.com'].includes(u.hostname)) {
    throw new Error('The Google review link is not configured correctly.');
  }
  return u.toString();
}
export default function InspectionFlowCard({ appointmentId, expectedRole }: Props) {
  const router = useRouter();
  const [flow, setFlow] = useState<InspectionFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const [type, setType] = useState<'registered' | 'guest'>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [permission, setPermission] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>('completed');
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [propertyRating, setPropertyRating] = useState(0);
  const [listerRating, setListerRating] = useState(0);
  const [propertyReview, setPropertyReview] = useState('');
  const [listerReview, setListerReview] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceReview, setServiceReview] = useState('');

  const reload = useCallback(async () => {
    const g = ++generation.current;
    setLoading(true); setError(''); setFlow(null);
    try {
      const result = await loadInspectionFlow(appointmentId);
      if (String(result.appointment_id) !== String(appointmentId)) throw new Error('The server returned a different appointment.');
      if (expectedRole && result.viewer_role !== expectedRole) throw new Error('You do not have access to this appointment view.');
      if (g === generation.current) setFlow(result);
    } catch (e) { if (g === generation.current) setError(errorText(e)); }
    finally { if (g === generation.current) setLoading(false); }
  }, [appointmentId, expectedRole]);
  useFocusEffect(useCallback(() => {
    if (INSPECTION_FLOW_ENABLED) void reload();
    return () => { generation.current += 1; };
  }, [reload]));

  // Ref lock closes the double-tap window before React commits busy=true.
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await work(); }
    catch (e) { Alert.alert('Unable to continue', errorText(e)); }
    finally { await reload(); lock.current = false; setBusy(false); }
  }
  const send = (action: FlowAction) => run(() => mutateInspectionFlow(appointmentId, action));
  const confirm = (title: string, message: string, work: () => Promise<void>) => Alert.alert(title, message,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => { void work(); } }]);

  if (!INSPECTION_FLOW_ENABLED) return <View style={s.card}><Text style={s.title}>Inspection and payment</Text>
    <Text style={s.text}>The updated inspection flow is being prepared. Delegation and payment are not enabled on this screen yet.</Text></View>;
  if (loading) return <View style={s.card}><ActivityIndicator /><Text style={s.text}>Loading inspection status…</Text></View>;
  if (error || !flow) return <View style={s.card}><Text style={s.error}>{error || 'Inspection status unavailable.'}</Text>
    <ActionButton title="Reload inspection status" onPress={() => { void reload(); }} disabled={busy} /></View>;
  const c = flow.capabilities;
  const disabled = busy || loading;
  const input = { editable: !disabled, placeholderTextColor: '#64748b', style: s.input };

  async function arrival() {
    await run(async () => {
      const grant = await Location.requestForegroundPermissionsAsync();
      if (grant.status !== 'granted') throw new Error('Location permission is required to record arrival. You can still report a location problem.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude, accuracy } = position.coords;
      if (accuracy == null || !Number.isFinite(accuracy)) throw new Error('Location accuracy is unavailable. Try again outside or report a problem.');
      if (Date.now() - position.timestamp > 120000) throw new Error('Location reading is too old. Please try again.');
      if (position.mocked === true) throw new Error('A simulated location cannot be used to verify attendance.');
      await mutateInspectionFlow(appointmentId, { kind: 'arrival', payload: {
        revision: flow!.revision, captured_latitude: latitude, captured_longitude: longitude,
        accuracy_metres: accuracy, captured_at: new Date(position.timestamp).toISOString(), mocked: position.mocked ?? null,
      } });
      // Only Laravel decides distance and location_verified. Never set success locally.
    });
  }
  async function submitReport() {
    if (!c.can_submit_report || flow!.viewer_report_submitted) return;
    if (!explanation.trim()) { Alert.alert('Findings required', 'Describe what happened during the visit.'); return; }
    if (outcome === 'completed' && !flow!.attendance) { Alert.alert('Record arrival first', 'Record attendance at the property, or choose Problem if this is not possible.'); return; }
    if (outcome === 'completed' && (!propertyRating || !listerRating)) { Alert.alert('Ratings required', 'Rate the property and lister separately.'); return; }
    if (outcome !== 'completed' && !reason.trim()) { Alert.alert('Reason required', 'Choose why the inspection failed or needs review.'); return; }
    confirm('Submit inspection report?', 'This saves your findings. You cannot submit another report; corrections go through management.', () => send({ kind: 'report', payload: {
      revision: flow!.revision, attendance_id: flow!.attendance?.id ?? null, outcome,
      reason_code: outcome === 'completed' ? null : reason, explanation: explanation.trim(),
      property_rating: outcome === 'completed' ? propertyRating : null,
      lister_rating: outcome === 'completed' ? listerRating : null,
      property_review: outcome === 'completed' ? propertyReview.trim() || null : null,
      lister_review: outcome === 'completed' ? listerReview.trim() || null : null,
    } }));
  }
  function decide(decision: Decision) {
    if (!flow!.report || !c.can_make_decision) return;
    if (['clarification', 'problem'].includes(decision) && !decisionNote.trim()) {
      Alert.alert('Explanation required', 'Explain the question or problem so OHLAM can follow up.'); return;
    }
    confirm('Confirm your decision?', decision === 'proceed' ? 'You have read the inspection report and want to review the payment terms. This does not charge your wallet.' : 'Your decision will be recorded and the relevant people notified.',
      () => send({ kind: 'decision', payload: { revision: flow!.revision, report_id: flow!.report!.id, decision, note: decisionNote.trim() || null } }));
  }
  async function payment() {
    if (flow!.viewer_role !== 'customer' || !flow!.can_proceed_to_payment) return;
    await run(async () => {
      const settlement = await prepareInspectionSettlement(appointmentId, flow!.revision);
      if (settlement.state !== 'ready') {
        Alert.alert('Payment status', settlement.state === 'awaiting_account_details' ? 'Beneficiary details are not yet ready. Request account details below.' : settlement.state === 'paid' ? 'This transaction has already been paid. Open your payment history for the receipt.' : 'An existing payment is being verified. Please do not make another payment.');
        return;
      }
      router.push({ pathname: '/(tabs)/property-payment/[settlementId]' as never,
        params: { settlementId: String(settlement.settlement_id), appointmentId: String(appointmentId) } });
    });
  }
  return <View style={s.card}>
    <Text style={s.title}>Inspection and payment</Text>
    <Text style={s.text}>{flow.message}</Text>
    <Text style={s.label}>Inspection: {flow.inspection_method === 'personal' ? 'Customer attends' : 'Authorised representative attends'}</Text>
    {flow.delegation && <Text style={s.text}>{flow.delegation.representative_name} — {flow.delegation.status}</Text>}

    {flow.viewer_role === 'customer' && c.can_manage_delegation && <View style={s.section}>
      <Text style={s.title}>Authorise a representative</Text>
      <Text style={s.text}>Your representative can inspect and report. Only you can decide to proceed or pay.</Text>
      <View style={s.row}>{(['guest', 'registered'] as const).map(t => <ActionButton key={t}
        title={`${type === t ? '✓ ' : ''}${t === 'guest' ? 'Guest / relative' : 'OHLAM user'}`} onPress={() => setType(t)} disabled={disabled} />)}</View>
      <TextInput {...input} value={name} onChangeText={setName} placeholder="Representative name" maxLength={120} />
      <TextInput {...input} value={phone} onChangeText={setPhone} placeholder="Phone including country code, e.g. +234…" keyboardType="phone-pad" maxLength={16} />
      {type === 'registered' && <TextInput {...input} value={userId} onChangeText={setUserId} placeholder="Representative OHLAM user ID" keyboardType="number-pad" maxLength={20} />}
      <ActionButton title={`${permission ? '✓ ' : ''}I have permission to share these contact details`} disabled={disabled} onPress={() => setPermission(v => !v)} />
      <ActionButton title={flow.delegation ? 'Replace representative and send invitation' : 'Send representative invitation'} disabled={disabled}
        onPress={() => {
          if (!name.trim() || !/^\+[1-9]\d{7,14}$/.test(phone.trim()) || !permission || (type === 'registered' && !/^\d+$/.test(userId.trim()))) {
            Alert.alert('Check representative details', 'Enter a name, a phone number with country code, the user ID where required, and confirm contact permission.'); return;
          }
          confirm('Authorise representative?', 'Any previous invitation will be revoked. OHLAM will send a restricted invitation and notify the lister.',
            () => send({ kind: 'delegation', payload: { revision: flow.revision, representative_type: type, representative_name: name.trim(), representative_phone: phone.trim(), representative_user_id: type === 'registered' ? userId.trim() : null, contact_permission_confirmed: true } }));
        }} />
      {flow.delegation && <ActionButton title="Revoke representative" disabled={disabled} onPress={() => confirm('Revoke representative?', 'They will lose access to this inspection.',
        () => send({ kind: 'revoke-delegation', payload: { revision: flow.revision, delegation_id: flow.delegation!.id } }))} />}
      {flow.inspection_method === 'delegated' && <ActionButton title="I will inspect personally instead" disabled={disabled}
        onPress={() => confirm('Inspect personally?', 'The representative’s access will be revoked. You will need to record your own attendance.', () => send({ kind: 'personal', payload: { revision: flow.revision } }))} />}
    </View>}

    {flow.delegation && c.can_accept_delegation && <ActionButton title="Accept inspection delegation" disabled={disabled}
      onPress={() => { void send({ kind: 'accept-delegation', payload: { revision: flow.revision, delegation_id: flow.delegation!.id } }); }} />}
    {flow.delegation && c.can_decline_delegation && <ActionButton title="Decline inspection delegation" disabled={disabled}
      onPress={() => confirm('Decline delegation?', 'The customer will be notified.', () => send({ kind: 'decline-delegation', payload: { revision: flow.revision, delegation_id: flow.delegation!.id } }))} />}

    {flow.attendance && <Text style={s.text}>{flow.attendance.location_verified ? 'Location verified' : 'Location not verified — management review may be required'}. {flow.attendance.message}</Text>}
    {c.can_record_arrival && <ActionButton title="Record my arrival at the property" disabled={disabled} onPress={() => { void arrival(); }} />}

    {flow.viewer_report_submitted ? <ActionButton title="Inspection report submitted" disabled onPress={() => {}} /> :
      c.can_submit_report && <View style={s.section}>
        <Text style={s.title}>Submit inspection report</Text>
        <Text style={s.text}>Record arrival at the property. You can finish these findings later using your saved attendance record.</Text>
        {(['completed', 'not_completed', 'problem'] as const).map(o => <ActionButton key={o} disabled={disabled}
          title={`${outcome === o ? '✓ ' : ''}${o.replace(/_/g, ' ')}`} onPress={() => { setOutcome(o); setReason(''); }} />)}
        {outcome !== 'completed' && <View>
          <Text style={s.label}>Reason</Text>
          {['lister_absent', 'access_denied', 'incorrect_address', 'unsafe_location', 'location_problem', 'other'].map(r =>
            <ActionButton key={r} title={`${reason === r ? '✓ ' : ''}${r.replace(/_/g, ' ')}`} disabled={disabled} onPress={() => setReason(r)} />)}
        </View>}
        <TextInput {...input} value={explanation} onChangeText={setExplanation} placeholder="Inspection findings / explanation" multiline maxLength={3000} />
        {outcome === 'completed' && <>
          <Rating label="Property rating" value={propertyRating} onChange={setPropertyRating} disabled={disabled} />
          <TextInput {...input} value={propertyReview} onChangeText={setPropertyReview} placeholder="Condition, listing accuracy and concerns" multiline maxLength={2000} />
          <Rating label="Lister rating" value={listerRating} onChange={setListerRating} disabled={disabled} />
          <TextInput {...input} value={listerReview} onChangeText={setListerReview} placeholder="Communication, punctuality and conduct" multiline maxLength={2000} />
        </>}
        <ActionButton title="Submit inspection report" disabled={disabled} onPress={() => { void submitReport(); }} />
      </View>}

    {flow.report && <View style={s.section}>
      <Text style={s.title}>Inspection report</Text>
      <Text style={s.text}>By {flow.report.inspector_name}{flow.report.on_behalf_of_customer ? ' on behalf of the customer' : ''}</Text>
      <Text style={s.label}>Outcome: {flow.report.outcome.replace(/_/g, ' ')}</Text>
      <Text style={s.text}>Verification: {flow.report.claim_status.replace('inspection_claim_', '')}</Text>
      <Text style={s.text} selectable>{flow.report.explanation}</Text>
      <Text style={s.text}>Property: {flow.report.property_rating ?? '—'}/5 {flow.report.property_review}</Text>
      <Text style={s.text}>Lister: {flow.report.lister_rating ?? '—'}/5 {flow.report.lister_review}</Text>
      <Text style={s.text}>Inspection verification does not certify title, ownership or property condition.</Text>
      {c.can_request_correction && <>
        <TextInput {...input} value={decisionNote} onChangeText={setDecisionNote} placeholder="Explain the correction required" multiline maxLength={2000} />
        <ActionButton title="Request a report correction" disabled={disabled} onPress={() => {
          if (!decisionNote.trim()) { Alert.alert('Explanation required', 'Describe the correction.'); return; }
          void send({ kind: 'correction', payload: { revision: flow.revision, report_id: flow.report!.id, explanation: decisionNote.trim() } });
        }} />
      </>}
    </View>}

    {flow.viewer_role === 'customer' && flow.report && c.can_make_decision && <View style={s.section}>
      <Text style={s.title}>Your decision</Text>
      <TextInput {...input} value={decisionNote} onChangeText={setDecisionNote} placeholder="Question or concern (required for clarification/problem)" multiline maxLength={2000} />
      <ActionButton title="I have reviewed the report and want to proceed" disabled={disabled} onPress={() => decide('proceed')} />
      <ActionButton title="Ask for clarification" disabled={disabled} onPress={() => decide('clarification')} />
      <ActionButton title="I do not want this property" disabled={disabled} onPress={() => decide('decline')} />
      <ActionButton title="Report a problem" disabled={disabled} onPress={() => decide('problem')} />
    </View>}
    {flow.customer_decision && <Text style={s.text}>Customer decision: {flow.customer_decision.decision}. {flow.customer_decision.note}</Text>}
    {flow.viewer_role === 'customer' && flow.can_proceed_to_payment && <ActionButton title="Proceed to Payment" disabled={disabled} onPress={() => { void payment(); }} />}
    {flow.viewer_role === 'customer' && c.can_request_account_details && <ActionButton title="Request Account Details" disabled={disabled}
      onPress={() => { void send({ kind: 'request-account-details', payload: { revision: flow.revision } }); }} />}
    {flow.payment_status && <Text style={s.text}>Payment: {flow.payment_status}</Text>}

    {c.can_submit_service_review && !flow.service_review_submitted && <View style={s.section}>
      <Text style={s.title}>Review OHLAM’s service (optional)</Text>
      <Rating label="OHLAM service rating" value={serviceRating} onChange={setServiceRating} disabled={disabled} />
      <TextInput {...input} value={serviceReview} onChangeText={setServiceReview} placeholder="Your booking, support or app experience" multiline maxLength={2000} />
      <ActionButton title="Send service review to OHLAM management" disabled={disabled} onPress={() => {
        if (!serviceRating) { Alert.alert('Choose a rating', 'Select a rating from 1 to 5.'); return; }
        void send({ kind: 'service-review', payload: { rating: serviceRating, review: serviceReview.trim() } });
      }} />
    </View>}
    {flow.service_review_submitted && <Text style={s.text}>Your OHLAM service review has been submitted.</Text>}
    {flow.public_review && <View style={s.section}>
      <Text style={s.title}>Share your experience (optional)</Text>
      <Text style={s.text}>Public reviews do not affect inspection verification or payment. Choose what you want to publish.</Text>
      <ActionButton title="Review OHLAM on Google" disabled={disabled} onPress={() => {
        try { const url = safeGoogleUrl(flow.public_review!.google_review_url); void Linking.openURL(url).catch(e => Alert.alert('Unable to open review page', errorText(e))); }
        catch (e) { Alert.alert('Review link unavailable', errorText(e)); }
      }} />
      <ActionButton title="Share your experience" disabled={disabled} onPress={() => {
        // Explicit user action; generic text supplied by the server, never GPS/report data.
        void Share.share({ message: flow.public_review!.share_text }).catch(e => Alert.alert('Unable to share', errorText(e)));
      }} />
    </View>}
    {busy && <ActivityIndicator />}
    <ActionButton title="Refresh inspection status" disabled={disabled} onPress={() => { void reload(); }} />
  </View>;
}
const s = StyleSheet.create({
  card: { padding: 16, marginTop: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  section: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  label: { fontWeight: '700', color: '#334155', marginVertical: 8 },
  text: { color: '#475569', lineHeight: 21, marginVertical: 5 }, error: { color: '#b91c1c', lineHeight: 21 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, color: '#0f172a', marginVertical: 6, backgroundColor: '#f8fafc' },
  button: { backgroundColor: '#147d64', borderRadius: 10, padding: 13, marginVertical: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' }, disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, rating: { padding: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8 },
});
