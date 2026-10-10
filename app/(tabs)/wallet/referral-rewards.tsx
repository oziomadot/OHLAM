import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Protected from 'components/Protected';
import { ActionButton } from 'components/inspection/InspectionFlowCard';
import API from '@/src/services/api';
import { errorText } from '@/src/services/inspectionFlow';
type Data = {
  reward_limit: number; reward_rate: string; total_credited: string;
  pairs: { referee_id: number; referee_name: string; rewards_earned: number; remaining: number }[];
  rewards: { id: number; referee_name: string; sequence: number; limit_snapshot: number; amount_kobo: number; status: string; credited_at: string | null }[];
  next_pairs_page: string | null; next_rewards_page: string | null;
};
const text = { color: '#0f172a' };
export default function ReferralRewardsScreen() {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState('');
  const [pairPage, setPairPage] = useState(1), [rewardPage, setRewardPage] = useState(1);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const g = ++generation.current;
    try { const r = await API.get<{ data: Data }>(`/wallet/referral-rewards?page=${pairPage}&rewards_page=${rewardPage}`); if (g === generation.current) { setData(r.data.data); setError(''); } }
    catch (e) { if (g === generation.current) setError(errorText(e)); }
  }, [pairPage, rewardPage]);
  useFocusEffect(useCallback(() => { void reload(); return () => { generation.current++; }; }, [reload]));
  return <Protected><ScrollView style={{ backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}>
    <Text style={{ ...text, fontSize: 24, fontWeight: '700' }}>Property referral rewards</Text>
    {error ? <Text style={{ color: '#b91c1c' }}>{error}</Text> : !data ? <ActivityIndicator /> : <>
      <Text style={text}>Earn {data.reward_rate} for up to {data.reward_limit} eligible completed property transactions per referee. A referee is an agent you referred to OHLAM.</Text>
      <Text style={{ ...text, fontSize: 20, fontWeight: '700' }}>Credited to your wallet: ₦{Number(data.total_credited).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
      <Text style={{ ...text, fontWeight: '700' }}>Rewards used per referee</Text>
      {data.pairs.length === 0 && <Text style={text}>No eligible completed property transactions yet.</Text>}
      {data.pairs.map(p => <View key={p.referee_id} style={{ backgroundColor: '#fff', padding: 14, borderRadius: 10 }}>
        <Text style={{ ...text, fontWeight: '700' }}>{p.referee_name}</Text>
        <Text style={text}>{p.rewards_earned} rewards earned · {p.remaining} remaining</Text>
        {p.remaining === 0 && <Text style={text}>The reward limit for this referee has been reached.</Text>}
      </View>)}
      {pairPage > 1 && <ActionButton title="Previous referees" onPress={() => setPairPage(p => p - 1)} />}
      {data.next_pairs_page && <ActionButton title="More referees" onPress={() => setPairPage(p => p + 1)} />}
      <Text style={{ ...text, fontWeight: '700' }}>Reward history</Text>
      {data.rewards.map(r => <View key={r.id} style={{ backgroundColor: '#fff', padding: 14, borderRadius: 10 }}>
        <Text style={text}>{r.referee_name} · reward {r.sequence} of {r.limit_snapshot}</Text>
        <Text style={text}>₦{(Number(r.amount_kobo) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} · {r.status === 'credited' ? 'Added to wallet' : 'Wallet credit pending'}</Text>
        {r.credited_at && <Text style={text}>{new Date(r.credited_at).toLocaleString()}</Text>}
      </View>)}
      {rewardPage > 1 && <ActionButton title="Previous rewards" onPress={() => setRewardPage(p => p - 1)} />}
      {data.next_rewards_page && <ActionButton title="More rewards" onPress={() => setRewardPage(p => p + 1)} />}
    </>}
    <ActionButton title="Refresh referral rewards" onPress={() => { void reload(); }} />
  </ScrollView></Protected>;
}
