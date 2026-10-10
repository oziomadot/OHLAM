import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Protected from 'components/Protected';
import { ActionButton } from 'components/inspection/InspectionFlowCard';
import API from '@/src/services/api';
import { errorText } from '@/src/services/inspectionFlow';
import { Transaction, loadTransaction, transactionLabels } from '@/src/services/propertyTransactions';
const ink = { color: '#0f172a' };
export default function PropertyTransactionScreen() {
  const params = useLocalSearchParams<{ paymentId: string | string[] }>();
  const id = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const router = useRouter();
  const [data, setData] = useState<Transaction | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [date, setDate] = useState(''), [note, setNote] = useState('');
  const lock = useRef(false), generation = useRef(0);
  const reload = useCallback(async () => {
    const g = ++generation.current;
    try { if (!id) throw new Error('Open a property payment to view its transaction.'); const d = await loadTransaction(id); if (g === generation.current) { setData(d); setError(''); } }
    catch (e) { if (g === generation.current) setError(errorText(e)); }
  }, [id]);
  useFocusEffect(useCallback(() => { void reload(); const sub = AppState.addEventListener('change', s => { if (s === 'active') void reload(); }); return () => { generation.current++; sub.remove(); }; }, [reload]));
  async function act(path: string, payload: object) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await API.post(`/property-transactions/${encodeURIComponent(id)}/${path}`, payload); }
    catch (e) { Alert.alert('Transaction update', errorText(e)); }
    finally { await reload(); lock.current = false; setBusy(false); }
  }
  function availability(available: boolean) {
    Alert.alert(available ? 'Confirm property availability' : 'Property unavailable', available ? 'Confirm this property is available for this customer. This authorises automatic payments to the recipients below.' : 'No recipient payments will be made. A refund of the undistributed payment will be requested.', [
      { text: 'Cancel', style: 'cancel' }, { text: available ? 'Confirm and release payments' : 'Request refund', onPress: () => { void act('availability', { available, details_confirmed: true }); } },
    ]);
  }
  const handover = data?.handover;
  function propose() { const parsed = new Date(date); if (!Number.isFinite(parsed.getTime()) || parsed <= new Date()) { Alert.alert('Choose a future date', 'Enter the date and time, for example 2026-10-20T14:00+01:00.'); return; } void act('handover', { action: 'propose', revision: handover?.revision ?? 0, scheduled_at: parsed.toISOString(), note }); }
  return <Protected><ScrollView style={{ backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 70 }}>
    <Text style={{ ...ink, fontSize: 23, fontWeight: '700' }}>Property transaction</Text>
    {error ? <Text style={{ color: '#b91c1c' }}>{error}</Text> : !data ? <ActivityIndicator /> : <>
      <Text style={ink}>Property #{data.property_id} · {data.reference}</Text>
      <Text style={{ ...ink, fontSize: 18, fontWeight: '700' }}>{transactionLabels[data.status] || 'Transaction update pending'}</Text>
      {data.confirmation_due_at && !data.released_at && <Text style={ink}>Availability confirmation deadline: {new Date(data.confirmation_due_at).toLocaleString()}</Text>}
      <Text style={ink}>Recipients and agreed amounts</Text>
      {data.allocations.map(a => <View key={a.id} style={{ padding: 14, backgroundColor: '#fff', borderRadius: 10, gap: 5 }}>
        <Text style={{ ...ink, fontWeight: '700' }}>{a.label} · ₦{(a.amount_kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
        <Text style={ink}>{a.account_name} · {a.bank_name} {a.masked_account_number}</Text>
        <Text style={ink}>{({ allocation_success: 'Paid', allocation_retained: 'OHLAM fee retained', allocation_failed: 'Payment needs review', allocation_reversed: 'Payment reversed', allocation_approval_required: 'Provider approval needed' } as Record<string, string>)[a.status] || 'Awaiting payment confirmation'}</Text>
      </View>)}
      {data.can_confirm_availability && <><ActionButton title="Property is available — authorise payouts" disabled={busy} onPress={() => availability(true)} /><ActionButton title="Property is unavailable — request refund" disabled={busy} onPress={() => availability(false)} /></>}
      {data.released_at && <>
        <Text style={{ ...ink, fontWeight: '700' }}>Agree key or document handover</Text>
        {handover && <Text style={ink}>{handover.status === 'completed' ? 'Handover confirmed by both participants' : `Date ${handover.status}: ${new Date(handover.scheduled_at).toLocaleString()}`}\n{handover.note}</Text>}
        {handover?.status !== 'completed' && <>
          <TextInput style={{ ...ink, borderWidth: 1, borderColor: '#cbd5e1', padding: 12 }} placeholder="Date and time: 2026-10-20T14:00+01:00" placeholderTextColor="#64748b" value={date} onChangeText={setDate} editable={!busy} />
          <TextInput style={{ ...ink, borderWidth: 1, borderColor: '#cbd5e1', padding: 12 }} placeholder="Meeting location or handover note" placeholderTextColor="#64748b" value={note} onChangeText={setNote} editable={!busy} maxLength={1000} />
          <ActionButton title="Propose handover date" disabled={busy} onPress={propose} />
          {handover && data.can_accept_handover && <ActionButton title="Accept the other participant’s proposal" disabled={busy} onPress={() => { void act('handover', { revision: handover.revision, action: 'accept' }); }} />}
          {handover && data.can_confirm_handover && <ActionButton title="Confirm keys or documents handed over" disabled={busy} onPress={() => { void act('handover', { revision: handover.revision, action: 'complete' }); }} />}
        </>}
      </>}
      <Text style={{ color: '#475569' }}>After distribution, refunds depend on recipients returning their funds. A full refund is not guaranteed.</Text>
      <ActionButton title="View this appointment and arrange through chat" onPress={() => router.push(`/appointment/${data.appointment_id}` as never)} />
    </>}
    <ActionButton title="Refresh transaction" disabled={busy} onPress={() => { void reload(); }} />
  </ScrollView></Protected>;
}
