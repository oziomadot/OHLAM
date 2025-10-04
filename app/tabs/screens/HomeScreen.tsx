import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const featuredProperties = [
  {
    id: '1',
    title: 'Modern Apartment',
    location: 'New York, NY',
    price: '$1,500/mo',
    beds: 2,
    baths: 1,
    sqft: 950,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: '2',
    title: 'Luxury Villa',
    location: 'Miami, FL',
    price: '$3,200/mo',
    beds: 4,
    baths: 3,
    sqft: 2200,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80',
  },
];

const announcements = [
  'New properties added in your area',
  'Special discount for first-time renters',
  'Virtual tours now available',
];

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>John Doe</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Properties')}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <Text style={styles.searchText}>Search properties, locations...'</Text>
      </TouchableOpacity>

      {/* Featured Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredProperties.map((property) => (
            <TouchableOpacity 
              key={property.id} 
              style={styles.propertyCard}
              onPress={() => navigation.navigate('PropertyDetail', { property })}
            >
              <Image 
                source={{ uri: property.image }} 
                style={styles.propertyImage}
                resizeMode="cover"
              />
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyPrice}>{property.price}</Text>
                <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  <Ionicons name="location-outline" size={14} color="#666" /> {property.location}
                </Text>
                <View style={styles.propertyDetails}>
                  <Text style={styles.propertyDetail}>
                    <Ionicons name="bed-outline" size={14} color="#666" /> {property.beds}
                  </Text>
                  <Text style={styles.propertyDetail}>
                    <Ionicons name="water-outline" size={14} color="#666" /> {property.baths}
                  </Text>
                  <Text style={styles.propertyDetail}>
                    <Ionicons name="square-outline" size={14} color="#666" /> {property.sqft} sqft
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="calendar-outline" size={24} color="#1976d2" />
            </View>
            <Text style={styles.actionText}>Schedule a Tour</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="document-text-outline" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.actionText}>My Documents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff8e1' }]}>
              <Ionicons name="heart-outline" size={24} color="#ff8f00" />
            </View>
            <Text style={styles.actionText}>Saved</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Announcements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Announcements</Text>
        <View style={styles.announcementContainer}>
          {announcements.map((announcement, index) => (
            <View key={index} style={styles.announcementItem}>
              <View style={styles.announcementDot} />
              <Text style={styles.announcementText} numberOfLines={2}>{announcement}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    color: '#999',
    fontSize: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#3498db',
    fontSize: 14,
  },
  featuredContainer: {
    paddingBottom: 10,
  },
  propertyCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 160,
  },
  propertyInfo: {
    padding: 15,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  propertyLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyDetail: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  announcementContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginRight: 10,
  },
  announcementText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
});

export default HomeScreen;
