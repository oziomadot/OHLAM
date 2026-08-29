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

type AvailabilitySlot = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BlockedDate = {
  id: number;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
};

export default function ListerAvailabilityView() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const [deletingAvailabilityId, setDeletingAvailabilityId] =
    useState<number | null>(null);

  const [deletingBlockedDateId, setDeletingBlockedDateId] =
    useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const availabilityRes = await API.get<AvailabilitySlot[]>('/lister/availability');
      const blockedRes = await API.get<BlockedDate[]>('/lister/unavailable-dates');

      setAvailability(availabilityRes.data || []);
      setBlockedDates(blockedRes.data || []);
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
        reason: reason || null,
      });

      setDate('');
      setStartTime('');
      setEndTime('');
      setReason('');

      Alert.alert('Success', 'Date blocked.');

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Could not block date.'
      );
    }
  };

  const confirmRemoveAvailability = (item: any) => {
    Alert.alert(
      'Remove Availability',
      `Remove your ${dayNames[item.day_of_week]} availability from ${
        item.start_time
      } to ${item.end_time}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeAvailability(item.id),
        },
      ]
    );
  };

  const removeAvailability = async (id: number) => {
    if (deletingAvailabilityId) {
      return;
    }

    try {
      setDeletingAvailabilityId(id);

      await API.delete(`/lister/availability/${id}`);

      setAvailability((current) =>
        current.filter((item) => item.id !== id)
      );

      Alert.alert('Success', 'Availability removed.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Could not remove availability.'
      );
    } finally {
      setDeletingAvailabilityId(null);
    }
  };

  const confirmRemoveBlockedDate = (item: any) => {
    Alert.alert(
      'Remove Blocked Date',
      `Remove the block for ${item.date}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeBlockedDate(item.id),
        },
      ]
    );
  };

  const removeBlockedDate = async (id: number) => {
    if (deletingBlockedDateId) {
      return;
    }

    try {
      setDeletingBlockedDateId(id);

      await API.delete(`/lister/unavailable-dates/${id}`);

      setBlockedDates((current) =>
        current.filter((item) => item.id !== id)
      );

      Alert.alert('Success', 'Blocked date removed.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Could not remove blocked date.'
      );
    } finally {
      setDeletingBlockedDateId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>My Availability</Text>

      <Text style={styles.sectionTitle}>Weekly Availability</Text>

      {availability.length === 0 ? (
        <Text style={styles.empty}>
          No weekly availability created yet.
        </Text>
      ) : (
        availability.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {dayNames[item.day_of_week] ?? 'Unknown day'}
                </Text>

                <Text style={styles.timeText}>
                  {item.start_time} - {item.end_time}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deletingAvailabilityId === item.id &&
                    styles.disabledButton,
                ]}
                disabled={deletingAvailabilityId === item.id}
                onPress={() => confirmRemoveAvailability(item)}
              >
                <Text style={styles.deleteText}>
                  {deletingAvailabilityId === item.id
                    ? 'Removing...'
                    : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>
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

        <TouchableOpacity
          style={styles.button}
          onPress={blockDate}
        >
          <Text style={styles.buttonText}>
            Block Date
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Blocked Dates</Text>

      {blockedDates.length === 0 ? (
        <Text style={styles.empty}>
          No blocked dates.
        </Text>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={blockedDates}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.date}
              </Text>

              <Text style={styles.timeText}>
                {item.start_time && item.end_time
                  ? `${item.start_time} - ${item.end_time}`
                  : 'Whole day blocked'}
              </Text>

              {item.reason ? (
                <Text style={styles.reasonText}>
                  {item.reason}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.deleteButtonBottom,
                  deletingBlockedDateId === item.id &&
                    styles.disabledButton,
                ]}
                disabled={deletingBlockedDateId === item.id}
                onPress={() =>
                  confirmRemoveBlockedDate(item)
                }
              >
                <Text style={styles.deleteText}>
                  {deletingBlockedDateId === item.id
                    ? 'Removing...'
                    : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },

  empty: {
    color: '#64748b',
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  cardInfo: {
    flex: 1,
  },

  formCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },

  timeText: {
    color: '#475569',
  },

  reasonText: {
    color: '#475569',
    marginTop: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },

  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },

  deleteButtonBottom: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },

  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },
});