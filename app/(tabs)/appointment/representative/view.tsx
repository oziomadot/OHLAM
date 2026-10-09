import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Protected from 'components/Protected';
import InspectionFlowCard from 'components/inspection/InspectionFlowCard';

export default function RepresentativeInspectionScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const id = Array.isArray(params.appointmentId) ? params.appointmentId[0] : params.appointmentId;
  return <Protected><ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 50 }}>
    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>Inspection on behalf of a customer</Text>
    {id ? <InspectionFlowCard appointmentId={id} expectedRole="representative" /> : <Text>Appointment ID is missing.</Text>}
  </ScrollView></Protected>;
}
