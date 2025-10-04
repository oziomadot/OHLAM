import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Share,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

import MapViewWrapper from "@/src/components/MapViewWrapper";

const { width } = Dimensions.get('window');

const PropertyDetailScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(property.isFavorite || false);

  const propertyImages = [
    property.image,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
  ];

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Update favorite status in the backend
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.title} - $${property.price}/month`,
        url: property.image,
        title: property.title,
      });
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  const handleCallAgent = () => {
    // TODO: Replace with actual agent phone number
    const phoneNumber = '1234567890';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMessageAgent = () => {
    // TODO: Implement messaging functionality
    console.log('Message agent');
  };

  const handleScheduleTour = () => {
    navigation.navigate('ScheduleTour', { propertyId: property.id });
  };

  const handleViewOnMap = () => {
    // TODO: Open in maps app with property coordinates
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}${property.location}`,
      android: `${scheme}${property.location}(${property.location})`,
    });
    
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { marginRight: 15 }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={isFavorite ? '#ff3b30' : '#333'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Images Carousel */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: propertyImages[activeImageIndex] }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imagePagination}>
            {propertyImages.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeImageIndex && styles.paginationDotActive
                ]} 
              />
            ))}
          </View>
          <View style={styles.imageThumbnails}>
            {propertyImages.map((img, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => setActiveImageIndex(index)}
                style={[
                  styles.thumbnail,
                  index === activeImageIndex && styles.activeThumbnail
                ]}
              >
                <Image 
                  source={{ uri: img }} 
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.infoContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${property.price.toLocaleString()}/mo</Text>
            <View style={styles.propertyType}>
              <Text style={styles.propertyTypeText}>{property.type}</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location}>{property.location}</Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Property Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <MaterialIcons name="hotel" size={24} color="#3498db" />
              <Text style={styles.featureText}>{property.beds} {property.beds === 1 ? 'Bed' : 'Beds'}</Text>
            </View>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="shower" size={24} color="#3498db" />
              <Text style={styles.featureText}>{property.baths} {property.baths === 1 ? 'Bath' : 'Baths'}</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="straighten" size={24} color="#3498db" />
              <Text style={styles.featureText}>{property.sqft} sqft</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            This beautiful {property.type.toLowerCase()} is located in the heart of {property.location.split(',')[0]}. 
            It features {property.beds} spacious bedrooms and {property.baths} modern bathrooms. 
            The property is in excellent condition and ready for immediate move-in.
          </Text>
          
          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {['Air Conditioning', 'Heating', 'Washer', 'Dryer', 'Parking', 'Gym', 'Pool', 'WiFi'].map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
          
          {/* Location Map */}
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity onPress={handleViewOnMap}>
            <MapViewWrapper latitude={40.7128} longitude={-74.0060} />
            <View style={styles.mapOverlay}>
              <Text style={styles.mapText}>View on Map</Text>
              <Ionicons name="navigate-circle-outline" size={24} color="#3498db" />
            </View>
          </TouchableOpacity>
          
          {/* Contact Agent */}
          <View style={styles.agentContainer}>
            <View style={styles.agentInfo}>
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                style={styles.agentImage}
              />
              <View>
                <Text style={styles.agentName}>John Smith</Text>
                <Text style={styles.agentRole}>Real Estate Agent</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name="star" 
                      size={16} 
                      color="#FFD700" 
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={styles.ratingText}>(24 reviews)</Text>
                </View>
              </View>
            </View>
            <View style={styles.agentActions}>
              <TouchableOpacity 
                style={[styles.agentButton, { backgroundColor: '#f0f0f0' }]}
                onPress={handleMessageAgent}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.agentButton, { backgroundColor: '#f0f0f0', marginHorizontal: 10 }]}
                onPress={handleCallAgent}
              >
                <Ionicons name="call-outline" size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.agentButton, { backgroundColor: '#3498db' }]}
                onPress={handleScheduleTour}
              >
                <Text style={styles.scheduleTourText}>Schedule a Tour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.footerPrice}>${property.price.toLocaleString()}</Text>
          <Text style={styles.footerPriceLabel}>per month</Text>
        </View>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleScheduleTour}
        >
          <Text style={styles.contactButtonText}>Schedule a Tour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  imageThumbnails: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#3498db',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  propertyType: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  propertyTypeText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  amenityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  agentContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  agentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  agentRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  agentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentButton: {
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  scheduleTourText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  contactButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;
