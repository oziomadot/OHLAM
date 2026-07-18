import API from '@/src/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CustomerCreateAppointment() {
  const router = useRouter();
  const { property_id } = useLocalSearchParams();

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [customerNote, setCustomerNote] = useState('');

  const loadSlots = async () => {
    if (!selectedDate) {
      Alert.alert('Required', 'Enter appointment date e.g. 2026-06-30');
      return;
    }

    try {
      const res = await API.get(`/properties/${property_id}/available-slots`, {
        params: {
          date: selectedDate,
        },
      });

      setSlots(res.data.data);

      if (res.data.data.length === 0) {
        Alert.alert('No Slot', res.data.message || 'No available slot for this date.');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not load slots.'
      );
    }
  };

  const bookSlot = async (slot: any) => {
    try {
      const res = await API.post('/appointments', {
        property_id,
        appointment_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        customer_note: customerNote,
      });

      Alert.alert('Success', res.data.message);
      router.push('/appointments/customer/view');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not book appointment.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Property Appointment</Text>

      <Text style={styles.label}>Choose Date</Text>
      <TextInput
        value={selectedDate}
        onChangeText={setSelectedDate}
        placeholder="2026-06-30"
        style={styles.input}
      />

      <Text style={styles.label}>Note optional</Text>
      <TextInput
        value={customerNote}
        onChangeText={setCustomerNote}
        placeholder="I want to inspect this property"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={loadSlots}>
        <Text style={styles.buttonText}>Show Available Slots</Text>
      </TouchableOpacity>

      <FlatList
        data={slots}
        keyExtractor={(item, index) => `${item.date}-${item.start_time}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.slotCard} onPress={() => bookSlot(item)}>
            <Text style={styles.slotText}>
              {item.date} | {item.start_time} - {item.end_time}
            </Text>
            <Text style={styles.bookText}>Book this slot</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Select a date to view available slots.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: '#111827', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  slotCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotText: { fontWeight: '700' },
  bookText: { color: '#2563eb', marginTop: 5, fontWeight: '600' },
  empty: { marginTop: 20, color: '#64748b', textAlign: 'center' },
});