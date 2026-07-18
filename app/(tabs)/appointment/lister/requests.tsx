import API from '@/src/services/api';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ListerAppointmentRequests() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await API.get('/lister/appointments');
      setAppointments(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load appointment requests.');
    }
  };

  const acceptAppointment = async (id: number) => {
    try {
      await API.post(`/appointments/${id}/accept`);
      Alert.alert('Success', 'Appointment accepted.');
      loadAppointments();
    } catch (error) {
      Alert.alert('Error', 'Could not accept appointment.');
    }
  };

  const rejectAppointment = async (id: number) => {
    try {
      await API.post(`/appointments/${id}/reject`, {
        lister_note: 'I am not available at this time.',
      });
      Alert.alert('Success', 'Appointment rejected.');
      loadAppointments();
    } catch (error) {
      Alert.alert('Error', 'Could not reject appointment.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Requests</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.propertyTitle}>
              {item.property?.title || item.property?.name || 'Property'}
            </Text>

            <Text>Customer: {item.customer?.name || 'Customer'}</Text>
            <Text>Date: {item.appointment_date}</Text>
            <Text>
              Time: {item.start_time} - {item.end_time}
            </Text>
            <Text>Status: {item.status}</Text>

            {item.customer_note ? (
              <Text style={styles.note}>Note: {item.customer_note}</Text>
            ) : null}

            {item.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => acceptAppointment(item.id)}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => rejectAppointment(item.id)}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No appointment requests.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  propertyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  note: { marginTop: 8, color: '#64748b' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 30 },
});