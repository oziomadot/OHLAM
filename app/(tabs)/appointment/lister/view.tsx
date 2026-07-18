import API from '@/src/services/api';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const dayNames: any = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export default function ListerAvailabilityView() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const availabilityRes = await API.get('/lister/availability');
      const blockedRes = await API.get('/lister/unavailable-dates');

      setAvailability(availabilityRes.data.data);
      setBlockedDates(blockedRes.data.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load availability.');
    }
  };

  const blockDate = async () => {
    if (!date) {
      Alert.alert('Required', 'Enter date like 2026-09-14');
      return;
    }

    try {
      await API.post('/lister/unavailable-dates', {
        date,
        start_time: startTime || null,
        end_time: endTime || null,
        reason,
      });

      setDate('');
      setStartTime('');
      setEndTime('');
      setReason('');

      Alert.alert('Success', 'Date blocked.');
      loadData();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not block date.'
      );
    }
  };

  const removeBlockedDate = async (id: number) => {
    try {
      await API.delete(`/lister/unavailable-dates/${id}`);
      Alert.alert('Success', 'Blocked date removed.');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Could not remove blocked date.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Availability</Text>

      <Text style={styles.sectionTitle}>Weekly Availability</Text>

      {availability.length === 0 ? (
        <Text style={styles.empty}>No weekly availability created yet.</Text>
      ) : (
        availability.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{dayNames[item.day_of_week]}</Text>
            <Text>
              {item.start_time} - {item.end_time}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Block Specific Date</Text>

      <View style={styles.formCard}>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="Date e.g. 2026-09-14"
          style={styles.input}
        />

        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="Start time optional e.g. 10:00"
          style={styles.input}
        />

        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="End time optional e.g. 12:00"
          style={styles.input}
        />

        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Reason optional"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={blockDate}>
          <Text style={styles.buttonText}>Block Date</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Blocked Dates</Text>

      {blockedDates.length === 0 ? (
        <Text style={styles.empty}>No blocked dates.</Text>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={blockedDates}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.date}</Text>
              <Text>
                {item.start_time && item.end_time
                  ? `${item.start_time} - ${item.end_time}`
                  : 'Whole day blocked'}
              </Text>
              {item.reason ? <Text>{item.reason}</Text> : null}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeBlockedDate(item.id)}
              >
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 18, marginBottom: 10 },
  empty: { color: '#64748b', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  button: { backgroundColor: '#111827', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  deleteButton: { marginTop: 10 },
  deleteText: { color: '#dc2626', fontWeight: '700' },
});