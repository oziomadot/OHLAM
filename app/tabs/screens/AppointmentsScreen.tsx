import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for appointments
const upcomingAppointments = [
  {
    id: '1',
    propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    title: 'Modern Apartment Tour',
    date: '2023-06-15',
    time: '10:00 AM',
    status: 'confirmed',
    address: '123 Main St, New York, NY',
    agent: {
      name: 'Sarah Johnson',
      phone: '(555) 123-4567',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg'
    }
  },
  {
    id: '2',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
    title: 'Luxury Villa Viewing',
    date: '2023-06-18',
    time: '2:30 PM',
    status: 'pending',
    address: '456 Ocean Dr, Miami, FL',
    agent: {
      name: 'Michael Brown',
      phone: '(555) 987-6543',
      avatar: 'https://randomuser.me/api/portraits/men/44.jpg'
    }
  },
];

const pastAppointments = [
  {
    id: '3',
    propertyImage: 'https://images.unsplash.com/photo-1502672260266-37e1f6d6bfef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    title: 'Cozy Studio Visit',
    date: '2023-05-28',
    time: '11:00 AM',
    status: 'completed',
    address: '789 Market St, San Francisco, CA',
    agent: {
      name: 'Emily Davis',
      phone: '(555) 456-7890',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
    },
    rating: 4
  },
];

const AppointmentsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const renderAppointmentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}
    >
      <Image 
        source={{ uri: item.propertyImage }} 
        style={styles.propertyImage}
        resizeMode="cover"
      />
      <View style={styles.appointmentInfo}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'confirmed' && styles.statusConfirmed,
            item.status === 'pending' && styles.statusPending,
            item.status === 'completed' && styles.statusCompleted,
          ]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.detailSeparator}>•</Text>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        
        <View style={[styles.detailRow, { marginTop: 5 }]}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        
        <View style={styles.agentContainer}>
          <Image 
            source={{ uri: item.agent.avatar }} 
            style={styles.agentImage}
          />
          <View style={styles.agentInfo}>
            <Text style={styles.agentName} numberOfLines={1}>
              {item.agent.name}
            </Text>
            <Text style={styles.agentPhone} numberOfLines={1}>
              {item.agent.phone}
            </Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {activeTab === 'past' && item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star} 
                  name={star <= item.rating ? 'star' : 'star-outline'} 
                  size={18} 
                  color="#FFD700" 
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
          </View>
        )}
        
        {activeTab === 'upcoming' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#f0f0f0' }]}
              onPress={() => {}}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#333" />
              <Text style={[styles.actionButtonText, { color: '#333' }]}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ff3b30' }]}
              onPress={() => {}}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#3498db' }]}
              onPress={() => navigation.navigate('RescheduleAppointment', { appointment: item })}
            >
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
          {activeTab === 'upcoming' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
          {activeTab === 'past' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      
      {/* Appointments List */}
      <FlatList
        data={activeTab === 'upcoming' ? upcomingAppointments : pastAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ddd" />
            <Text style={styles.emptyTitle}>No {activeTab} appointments</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming appointments. Browse properties to schedule a viewing."
                : "Your past appointments will appear here."}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Properties')}
              >
                <Text style={styles.browseButtonText}>Browse Properties</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styles
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#3498db',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    padding: 15,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: '100%',
    height: 160,
  },
  appointmentInfo: {
    padding: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#e3f2fd',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusCompleted: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusConfirmedText: {
    color: '#1976d2',
  },
  statusPendingText: {
    color: '#ef6c00',
  },
  statusCompletedText: {
    color: '#2e7d32',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
    marginRight: 10,
  },
  detailSeparator: {
    color: '#999',
    marginHorizontal: 5,
  },
  agentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  agentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  agentInfo: {
    flex: 1,
    marginRight: 10,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  agentPhone: {
    fontSize: 12,
    color: '#666',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default AppointmentsScreen;
