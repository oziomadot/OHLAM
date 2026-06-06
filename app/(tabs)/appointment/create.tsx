import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, StyleSheet, KeyboardAvoidingView, Platform
  , TouchableOpacity
 } from 'react-native';
import { Checkbox } from 'react-native-paper';
import API from '@/src/services/api'; // adjust path as needed
import Protected from 'components/Protected'; // adjust path as needed
import { useAuth} from '@/context/AuthContext';
import Navbar from 'components/Navbar';


const AppointmentCreateScreen = () => {
  const [days, setDays] = useState([]);
  const [times, setTimes] = useState([]);
  const [booked, setBooked] = useState([]);
  const [selectedDays, setSelectedDays] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const {user} = useAuth();
  const userId = user?.id;
 console.log('user id', userId);
  useEffect(() => {

    
   
    const loadAppointmentTime = async () => {
      try {
        const res = await API.request(`/appointment/create/${userId}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        setDays(res.data.days);
        setTimes(res.data.times);
        setBooked(res.data.booked);
        console.log(res.data);
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

  const toggleSlot = (dayName, slotId) => {
    setSelectedSlots((prev) => {
      const daySlots = prev[dayName] || {};
      return {
        ...prev,
        [dayName]: {
          ...daySlots,
          [slotId]: !daySlots[slotId],
        },
      };
    });
  };

  const isSlotBooked = (dayId, timeId) => {
    return booked.some((b) => b.day_id === dayId && b.time_id === timeId);
  };

  const handleSubmit = async () => {
    const payload = Object.entries(selectedSlots).map(([dayName, slots]) => {
      const day = days.find((d) => d.name === dayName);
      return {
        day_id: day.id,
        time_ids: Object.entries(slots)
          .filter(([_, checked]) => checked)
          .map(([timeId]) => timeId),
      };
    });

    try {
      await API.request(`/appointment/store/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ appointments: payload }),
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      console.log('Submitted:', payload);
    } catch (e) {
      console.error('Submission failed', e);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <Protected>
        <KeyboardAvoidingView>
          <Navbar/>
          <View style={styles.container}>
            <Text style={styles.title}>Appointment Create Screen</Text>

            <Text style={styles.sectionTitle}>Days of the Week</Text>

            {days.map((day) => (
              <View key={day.id} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Checkbox
                    status={selectedDays[day.name] ? 'checked' : 'unchecked'}
                    onPress={() => toggleDay(day.name)}
                  />
                  <Text style={styles.dayText}>{day.name}</Text>
                </View>

                {selectedDays[day.name] && (
                  <View style={styles.slotContainer}>
                    {times.map((time) => {
                      const bookedSlot = isSlotBooked(day.id, time.id);
                      const isSelected =
                        selectedSlots[day.name]?.[time.id] || false;

                      return (
                        <TouchableOpacity
                          key={`${day.id}-${time.id}`}
                          disabled={bookedSlot}
                          onPress={() => toggleSlot(day.name, time.id)}
                          style={[
                            styles.slotItem,
                            bookedSlot
                              ? styles.slotBooked
                              : isSelected
                              ? styles.slotSelected
                              : styles.slotAvailable,
                          ]}
                        >
                          <Text style={styles.slotText}>
                            {time.name}
                            {bookedSlot ? ' (Booked)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}

            <Button title="Submit" onPress={handleSubmit} />
          </View>
        </KeyboardAvoidingView>
      </Protected>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  daySection: { marginVertical: 8 },
  dayHeader: { flexDirection: 'row', alignItems: 'center' },
  dayText: { fontSize: 16, marginLeft: 8 },
  slotContainer: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 30 },
  slotItem: {
    padding: 10,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  slotAvailable: { backgroundColor: '#fff' },
  slotSelected: { backgroundColor: '#4caf50' }, // ✅ green
  slotBooked: { backgroundColor: '#aaa' }, // ✅ grey
  slotText: { color: '#000' },
});

export default AppointmentCreateScreen;
