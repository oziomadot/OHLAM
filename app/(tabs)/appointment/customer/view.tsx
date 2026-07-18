import API from '@/src/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CustomerAppointmentView() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await API.get('/customer/interested-appointments');
      setAppointments(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load appointments.');
    }
  };

  const statusColor = (status: string) => {
    if (status === 'accepted') return '#16a34a';
    if (status === 'pending') return '#ca8a04';
    if (status === 'rejected') return '#dc2626';
    if (status === 'cancelled') return '#64748b';
    return '#334155';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Property Appointments</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.propertyTitle}>
              {item.property?.title || item.property?.name || 'Property'}
            </Text>

            <Text>Date: {item.appointment_date}</Text>
            <Text>
              Time: {item.start_time} - {item.end_time}
            </Text>

            <Text style={[styles.status, { color: statusColor(item.status) }]}>
              Status: {item.status}
            </Text>

            {item.status === 'pending' && (
              <Text style={styles.note}>Waiting for lister confirmation.</Text>
            )}

            {item.status === 'accepted' && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  Alert.alert('SecureChat', 'Open SecureChat conversation here.');
                }}
              >
                <Text style={styles.chatText}>Chat with Lister</Text>
              </TouchableOpacity>
            )}

            {['rejected', 'cancelled', 'expired', 'rescheduled'].includes(item.status) && (
              <TouchableOpacity
                style={styles.bookAgainButton}
                onPress={() =>
                  router.push({
                    pathname: '/appointments/customer/create',
                    params: {
                      property_id: item.property_id,
                    },
                  })
                }
              >
                <Text style={styles.bookAgainText}>Choose New Time</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>You have no appointments yet.</Text>
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
  status: { fontWeight: '700', marginTop: 8 },
  note: { color: '#64748b', marginTop: 6 },
  chatButton: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  chatText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  bookAgainButton: {
    borderWidth: 1,
    borderColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  bookAgainText: {
    color: '#111827',
    textAlign: 'center',
    fontWeight: '700',
  },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 30 },
});