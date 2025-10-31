import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import API from '@/config'; // adjust path as needed
import Protected from 'components/Protected'; // adjust path as needed

const AppointmentCreateScreen = () => {
  const [days, setDays] = useState([]);
  const [times, setTimes] = useState([]);
  const [selectedDays, setSelectedDays] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});

  useEffect(() => {
    const loadAppointmentTime = async () => {
      try {
        const res = await API.get('/appointment/create');
        setDays(res.data.days); // expected format: [{ name: 'Monday' }, ...]
        setTimes(res.data.times); // expected format: ['06:00', '07:30', ...]
      } catch (e) {
        console.error('Failed to load appointment times', e);
      }
    };

    loadAppointmentTime();
  }, []);

  const toggleDay = (dayName) => {
    setSelectedDays((prev) => ({
      ...prev,
      [dayName]: !prev[dayName],
    }));
  };

  const toggleSlot = (dayName, time) => {
    setSelectedSlots((prev) => {
      const daySlots = prev[dayName] || {};
      return {
        ...prev,
        [dayName]: {
          ...daySlots,
          [time]: !daySlots[time],
        },
      };
    });
  };

  const handleSubmit = async () => {
    const payload = Object.entries(selectedSlots).map(([day, slots]) => ({
      day,
      times: Object.entries(slots)
        .filter(([_, checked]) => checked)
        .map(([time]) => time),
    }));

    try {
      await API.post('/appointment/store', { appointments: payload });
      console.log('Submitted:', payload);
    } catch (e) {
      console.error('Submission failed', e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Protected>
        <Text style={styles.title}>Appointment Create Screen</Text>

        <Text style={styles.sectionTitle}>Days of the Week</Text>
        {days.map((day, index) => (
          <View key={index} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Checkbox
                status={selectedDays[day.name] ? 'checked' : 'unchecked'}
                onPress={() => toggleDay(day.name)}
              />
              <Text style={styles.dayText}>{day.name}</Text>
            </View>

            {selectedDays[day.name] && (
              <View style={styles.slotContainer}>
                {times.map((time, idx) => (
                  <View key={`${day.name}-${time}`} style={styles.slotItem}>
                    <Checkbox
                      status={
                        selectedSlots[day.name]?.[time] ? 'checked' : 'unchecked'
                      }
                      onPress={() => toggleSlot(day.name, time)}
                    />
                    <Text>{time}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <Button title="Submit" onPress={handleSubmit} />
      </Protected>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    marginLeft: 8,
  },
  slotContainer: {
    marginLeft: 32,
    marginTop: 8,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export default AppointmentCreateScreen;
