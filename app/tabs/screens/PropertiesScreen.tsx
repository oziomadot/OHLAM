import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for properties
const propertiesData = [
  {
    id: '1',
    title: 'Modern Apartment',
    type: 'Apartment',
    location: 'New York, NY',
    price: 1500,
    beds: 2,
    baths: 1,
    sqft: 950,
    isFavorite: false,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: '2',
    title: 'Luxury Villa',
    type: 'House',
    location: 'Miami, FL',
    price: 3200,
    beds: 4,
    baths: 3,
    sqft: 2200,
    isFavorite: true,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80',
  },
  {
    id: '3',
    title: 'Cozy Studio',
    type: 'Studio',
    location: 'San Francisco, CA',
    price: 1800,
    beds: 1,
    baths: 1,
    sqft: 650,
    isFavorite: false,
    image: 'https://images.unsplash.com/photo-1502672260266-37e1f6d6bfef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  },
  {
    id: '4',
    title: 'Downtown Loft',
    type: 'Loft',
    location: 'Chicago, IL',
    price: 2100,
    beds: 1,
    baths: 1,
    sqft: 1200,
    isFavorite: true,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  },
];

const propertyTypes = ['All', 'House', 'Apartment', 'Condo', 'Townhouse', 'Loft', 'Studio'];

const PropertiesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [properties, setProperties] = useState(propertiesData);

  const toggleFavorite = (id) => {
    setProperties(properties.map(property => 
      property.id === id 
        ? { ...property, isFavorite: !property.isFavorite } 
        : property
    ));
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || property.type === selectedType;
    return matchesSearch && matchesType;
  });

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { property: item })}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.propertyImage}
        resizeMode="cover"
      />
      <View style={styles.propertyInfo}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyPrice}>${item.price.toLocaleString()}/mo</Text>
          <TouchableOpacity 
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons 
              name={item.isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={item.isFavorite ? '#ff3b30' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.propertyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.propertyLocation} numberOfLines={1}>
          <Ionicons name="location-outline" size={14} color="#666" /> {item.location}
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>
            <Ionicons name="bed-outline" size={14} color="#666" /> {item.beds} {item.beds === 1 ? 'Bed' : 'Beds'}
          </Text>
          <Text style={styles.propertyDetail}>
            <Ionicons name="water-outline" size={14} color="#666" /> {item.baths} {item.baths === 1 ? 'Bath' : 'Baths'}
          </Text>
          <Text style={styles.propertyDetail}>
            <Ionicons name="square-outline" size={14} color="#666" /> {item.sqft} sqft
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Perfect Home</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location, property, or address..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Property Type Filter */}
      <View style={styles.typeFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={propertyTypes}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === item && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(item)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === item && styles.typeButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.typeFilterList}
        />
      </View>

      {/* Properties List */}
      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.propertiesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  searchContainer: {
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
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  typeFilterContainer: {
    marginBottom: 20,
  },
  typeFilterList: {
    paddingRight: 15,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    elevation: 1,
  },
  typeButtonActive: {
    backgroundColor: '#3498db',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  propertiesList: {
    paddingBottom: 20,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  propertyInfo: {
    padding: 15,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  favoriteButton: {
    padding: 5,
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  propertyDetail: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PropertiesScreen;
