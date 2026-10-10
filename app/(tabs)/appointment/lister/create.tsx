import API from '@/src/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const days = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export default function CreateListerAvailability() {
  const router = useRouter();
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const [availability, setAvailability] = useState(
    days.map((day) => ({
      ...day,
      enabled: false,
      start_time: '10:00',
      end_time: '14:00',
    }))
  );

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
  try {
    const res = await API.canCreateAvailability();

    setCanCreate(
      res.can_create
    );
  } catch (error: any) {
    console.log(
      'CAN CREATE AVAILABILITY ERROR:',
      error.response?.data ||
        error.message
    );

    Alert.alert(
      'Error',
      error.response?.data?.message ||
        'Could not check availability permission.'
    );
  } finally {
    setLoading(false);
  }
};

  const updateDay = (index: number, field: string, value: any) => {
    const updated = [...availability];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setAvailability(updated);
  };



const normalizeTime = (time: string): string | null => {
  if (!time) {
    return null;
  }

  const cleaned = time.trim().replace('.', ':');

  const match = cleaned.match(/^(\d{1,2}):(\d{1,2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}`;
};

const saveAvailability = async () => {
  const enabledDays = availability.filter((item) => item.enabled);

  if (enabledDays.length === 0) {
    Alert.alert(
      'Required',
      'Please select at least one available day.'
    );

    return;
  }

  const selected = [];

  for (const item of enabledDays) {
    const startTime = normalizeTime(item.start_time);
    const endTime = normalizeTime(item.end_time);

    if (!startTime) {
      Alert.alert(
        'Invalid Start Time',
        `Please enter a valid start time for ${item.label}.\n\nExample: 09:00`
      );

      return;
    }

    if (!endTime) {
      Alert.alert(
        'Invalid End Time',
        `Please enter a valid end time for ${item.label}.\n\nExample: 14:00`
      );

      return;
    }

    const startMinutes =
      Number(startTime.split(':')[0]) * 60 +
      Number(startTime.split(':')[1]);

    const endMinutes =
      Number(endTime.split(':')[0]) * 60 +
      Number(endTime.split(':')[1]);

    if (endMinutes <= startMinutes) {
      Alert.alert(
        'Invalid Time Range',
        `The end time for ${item.label} must be later than the start time.`
      );

      return;
    }

    selected.push({
      day_of_week: item.value,
      start_time: startTime,
      end_time: endTime,
    });
  }

  console.log(
    'CREATE AVAILABILITY PAYLOAD:',
    JSON.stringify(
      {
        availability: selected,
      },
      null,
      2
    )
  );

  try {
    const res = await API.createAvailability({
      availability: selected,
    });

    Alert.alert(
      'Success',
      res.message || 'Availability saved successfully.'
    );

    router.push('/appointment/lister/view');
  } catch (error: any) {
    console.log(
      'CREATE AVAILABILITY ERROR:',
      error.response?.data ||
        error.message ||
        error
    );

    const responseData = error.response?.data;

    const validationErrors = responseData?.errors;

    const firstError = validationErrors
      ? Object.values(validationErrors).flat()[0]
      : null;

    Alert.alert(
      'Error',
      String(
        firstError ||
          responseData?.message ||
          'Could not save availability.'
      )
    );
  }
};


  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Checking access...</Text>
      </View>
    );
  }

  if (!canCreate) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Availability Not Available</Text>
        <Text style={styles.text}>
          You must list at least one property before creating appointment
          availability.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Weekly Availability</Text>
      <Text style={styles.subtitle}>
        Select the days and time you are normally available for property
        inspection.
      </Text>

      {availability.map((item, index) => (
        <View key={item.value} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.day}>{item.label}</Text>
            <Switch
              value={item.enabled}
              onValueChange={(value) => updateDay(index, 'enabled', value)}
            />
          </View>

          {item.enabled && (
            <View style={styles.timeRow}>
              <View style={styles.inputGroup}>
                <Text>Start</Text>
                <TextInput
                  value={item.start_time}
                      onChangeText={(text) =>
                      updateDay(index, 'start_time', text)
                        }
                        onBlur={() => {
                          const normalized = normalizeTime(item.start_time);

                          if (normalized) {
                            updateDay(index, 'start_time', normalized);
                          }
                        }}
                        placeholder="10:00"
                        maxLength={5}
                        keyboardType="numbers-and-punctuation"
                        style={styles.input}
                      />
              </View>

              <View style={styles.inputGroup}>
                <Text>End</Text>
                <TextInput
                    value={item.end_time}
                    onChangeText={(text) =>
                      updateDay(index, 'end_time', text)
                    }
                    onBlur={() => {
                      const normalized = normalizeTime(item.end_time);

                      if (normalized) {
                        updateDay(index, 'end_time', normalized);
                      }
                    }}
                    placeholder="14:00"
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                    style={styles.input}
                  />
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={saveAvailability}>
        <Text style={styles.buttonText}>Save Availability</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/appointment/lister/view')}
      >
        <Text style={styles.secondaryText}>View Availability Calendar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  text: { textAlign: 'center', color: '#64748b', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  day: { fontSize: 16, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  inputGroup: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  secondaryButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  secondaryText: { color: '#111827', textAlign: 'center', fontWeight: '600' },
});