import RemoteImage from '@/components/remote-image';
import { auth, db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons, Entypo } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { createFavorite, checkIfFavorited, removeFavorite } from '@/services/favoriteService';

type Property = {
  id: string;
  title?: string;
  location?: string | { latitude: number | string; longitude: number | string; type?: string };
  price?: string | number;
  type?: string;
  imageUrl?: string | null;
  photo?: string;
  samplePhotos?: string[];
  cities?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  description?: string;
  descriptions?: string;
  bedrooms?: string | number;
  bedroomCount?: number;
  bathrooms?: string | number;
  BathRoomCount?: number;
  amenities?: string[];
  preferences?: string[];
  latitude?: number | string;
  longitude?: number | string;
  createdby?: string;
  address?: string;
  rating?: number;
};

type Review = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
};

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  // Helper function to format location display
  const getLocationDisplay = (property: Property): string => {
    // Always prioritize cities if available
    if (property.cities && property.cities.trim() !== '') {
      return property.cities;
    }

    // If location is a string, use it
    if (typeof property.location === 'string') {
      return property.location;
    }

    // Fall back to address if available
    if (property.address) {
      return property.address;
    }
    
    // Last resort - if location is an object with coordinates, don't show raw coordinates
    if (property.location && typeof property.location === 'object' && 'latitude' in property.location) {
      return 'Location available on map';
    }
    
    return 'Location not available';
  };

  // Helper function to get icon for amenity
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const accentColor = '#3c95a6';
    
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Ionicons name="wifi" size={20} color={accentColor} />;
    } else if (amenityLower.includes('kitchen')) {
      return <Ionicons name="restaurant-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('parking') || amenityLower.includes('garage')) {
      return <Ionicons name="car-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('pet')) {
      return <MaterialIcons name="pets" size={20} color={accentColor} />;
    } else if (amenityLower.includes('tv')) {
      return <Ionicons name="tv-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('washer') || amenityLower.includes('dryer') || amenityLower.includes('laundry')) {
      return <MaterialIcons name="local-laundry-service" size={20} color={accentColor} />;
    } else if (amenityLower.includes('air') || amenityLower.includes('ac') || amenityLower.includes('conditioning')) {
      return <FontAwesome name="snowflake-o" size={20} color={accentColor} />;
    } else if (amenityLower.includes('heat') || amenityLower.includes('heating')) {
      return <MaterialCommunityIcons name="radiator" size={20} color={accentColor} />;
    } else if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
      return <MaterialIcons name="fitness-center" size={20} color={accentColor} />;
    } else if (amenityLower.includes('pool') || amenityLower.includes('swimming')) {
      return <MaterialIcons name="pool" size={20} color={accentColor} />;
    } else if (amenityLower.includes('security') || amenityLower.includes('camera')) {
      return <MaterialIcons name="security" size={20} color={accentColor} />;
    } else {
      return <Ionicons name="checkmark-circle-outline" size={20} color={accentColor} />;
    }
  };

  // Handle chat button press
  const handleChatPress = async () => {
    if (!auth.currentUser || !property?.createdby) {
      Alert.alert('Sign In Required', 'Please sign in to start a chat with the property owner.');
      return;
    }

    try {
      // Check if chat already exists between these users
      const chatRef = collection(db, 'chat');
      
      // Create a new chat document
      const newChatRef = await addDoc(chatRef, {
        userAuth: auth.currentUser.uid,
        otherUser: property.createdby,
        lastMessage: `Inquiry about ${property.title}`,
        messageTime: serverTimestamp(),
        user: auth.currentUser.uid,
        propertyCreatedBy: property.createdby
      });
      
      // Navigate to the chat screen
      router.push(`/conversation/${newChatRef.id}`);
      
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  // Handle rent button press
  const handleRentPress = () => {
    Alert.alert(
      'Proceed to Payment',
      `Would you like to rent "${property?.title}" for ${typeof property?.price === 'number' ? `$${property?.price}` : property?.price} per month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => {
            // Here you would integrate with Stripe
            Alert.alert('Stripe Integration', 'Stripe payment would launch here.');
            // When you have Stripe SDK integrated:
            // router.push('/payment/checkout?propertyId=' + property?.id);
          }
        }
      ]
    );
  };

  // Generate sample reviews
  const generateSampleReviews = () => {
    return [
      {
        id: '1',
        userName: 'Sarah Johnson',
        rating: 5,
        comment: 'Absolutely loved this place! Great location, clean, and the host was very responsive. Would definitely stay here again.',
        date: '2 weeks ago'
      },
      {
        id: '2',
        userName: 'Michael Chen',
        rating: 4,
        comment: 'Nice property with good amenities. The neighborhood is quiet and safe. Only issue was the slow WiFi.',
        date: '1 month ago'
      },
      {
        id: '3',
        userName: 'Jessica Williams',
        rating: 5,
        comment: 'Perfect for my needs. Close to public transportation and restaurants. Very clean and well-maintained.',
        date: '2 months ago'
      }
    ];
  };

  // Handle see all reviews
  const handleSeeAllReviews = () => {
    // Navigate to the reviews page with the property ID
    router.push(`/property/reviews?id=${property?.id}`);
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color="#FFD700" />);
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={16} color="#FFD700" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-star-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }
    
    return stars;
  };

  // Function to toggle favorite status
  const toggleFavorite = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to add this property to your favorites.');
      return;
    }
    
    try {
      setFavoriteLoading(true);
      const userId = auth.currentUser.uid;
      
      if (isFavorite && favoriteDocId) {
        // Remove from favorites
        await removeFavorite(favoriteDocId);
        setIsFavorite(false);
        setFavoriteDocId(null);
        Alert.alert('Success', 'Property removed from favorites');
      } else {
        // Add to favorites
        const favoriteData: any = {
          userId,
          propertyId: id as string,
          title: property?.title || 'Untitled Property',
          location: property ? getLocationDisplay(property) : 'Unknown location',
          imageUrl: property?.imageUrl || null,
          price: property?.price || 0
        };
        
        // Only add type if it exists to avoid undefined field error
        if (property?.type) {
          favoriteData.type = property.type;
        }
        
        const favoriteId = await createFavorite(favoriteData);
        setIsFavorite(true);
        setFavoriteDocId(favoriteId);
        
        // Show success message with option to navigate to favorites
        Alert.alert(
          'Added to Favorites!', 
          'Property has been added to your favorites.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'View Favorites', 
              onPress: () => router.push('/(tabs)/favorites')
            }
          ]
        );
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // Check if property is in favorites
  const checkIfFavorite = async () => {
    if (!auth.currentUser || !id) return;
    
    try {
      const userId = auth.currentUser.uid;
      const favoriteId = await checkIfFavorited(userId, id as string);
      
      if (favoriteId) {
        setIsFavorite(true);
        setFavoriteDocId(favoriteId);
      } else {
        setIsFavorite(false);
        setFavoriteDocId(null);
      }
      
      console.log(`Property ${id} favorite status:`, !!favoriteId);
    } catch (err) {
      console.error('Error checking favorite status:', err);
      setIsFavorite(false);
      setFavoriteDocId(null);
    }
  };

  // Load property data
  useEffect(() => {
    async function fetchProperty() {
      if (!id) {
        setError('No property ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Use the same collection name as homepage ("property")
        const propertyRef = doc(db, 'property', id as string);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
          const data = propertySnap.data();
          // Prepare all available photos
          const mainPhoto = data.imageUrl ?? data.photo ?? data.image ?? null;
          const samplePhotos = data.samplePhotos ?? [];
          const allAvailablePhotos = [mainPhoto, ...samplePhotos].filter(Boolean);
          
          // Set the current image to the main photo
          setCurrentImage(mainPhoto);
          
          // Store all photos for the gallery
          setAllPhotos(allAvailablePhotos);
          
          // Extract latitude and longitude from data
          let latitude = data.latitude;
          let longitude = data.longitude;
          
          // If location is an object with lat/lng, use those values
          if (data.location && typeof data.location === 'object' && 'latitude' in data.location && 'longitude' in data.location) {
            latitude = data.location.latitude;
            longitude = data.location.longitude;
          }
          
          setProperty({
            id: propertySnap.id,
            title: data.title ?? data.name ?? 'Untitled',
            location: data.location ?? data.address ?? 'Unknown',
            price: data.price ?? data.rent ?? 'Price not available',
            type: data.type ?? data.category ?? undefined,
            imageUrl: mainPhoto,
            photo: data.photo,
            samplePhotos: samplePhotos,
            cities: data.city ?? data.cities ?? undefined,
            state: data.state ?? undefined,
            description: data.description ?? data.descriptions ?? undefined,
            descriptions: data.descriptions,
            bedrooms: data.bedrooms ?? data.bedroomCount ?? data.beds ?? '3',
            bedroomCount: data.bedroomCount,
            bathrooms: data.bathrooms ?? data.BathRoomCount ?? data.baths ?? '2',
            BathRoomCount: data.BathRoomCount,
            amenities: data.amenities ?? [],
            preferences: data.preferences ?? [],
            latitude: latitude,
            longitude: longitude,
            createdby: data.createdby ?? data.userId ?? undefined,
            rating: data.rating ?? 4.7,
          });
          
          // Set sample reviews
          setReviews(generateSampleReviews());
          
          // Check if this property is in user's favorites
          checkIfFavorite();
        } else {
          setError('Property not found');
        }
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3c95a6" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          {error || 'Property not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: C.tint }]} 
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Property Image with Back Button and Type Badge */}
      <View style={styles.imageContainer}>
        <RemoteImage 
          uri={currentImage || property.imageUrl} 
          style={styles.propertyImage}
        >
          {/* Back button */}
          <View style={styles.imageOverlayTop}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: C.surfaceSoft }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#3c95a6" />
            </TouchableOpacity>
            
            {/* Right side buttons */}
            <View style={styles.imageTopRightButtons}>
              
              
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: favoriteLoading ? C.surfaceSoft : 'transparent' }]}
                onPress={toggleFavorite}
                disabled={favoriteLoading}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color="#3c95a6" />
                ) : (
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorite ? "#3c95a6" : "#3c95a6"} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Type badge */}
          {property.type && (
            <View style={[styles.propertyTypeContainer, { backgroundColor: '#3c95a6' }]}>
              <Text style={styles.propertyType}>{property.type}</Text>
            </View>
          )}
          
          {/* Photo count indicator */}
          {allPhotos.length > 1 && (
            <View style={[styles.photoCountContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={styles.photoCountText}>{allPhotos.length}</Text>
            </View>
          )}
        </RemoteImage>
      </View>

      {/* Photo Gallery */}
      {allPhotos.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoGallery}
        >
          {allPhotos.map((photo, index) => (
            <TouchableOpacity 
              key={`photo-${index}`} 
              style={[styles.thumbnailContainer, currentImage === photo ? { borderColor: '#3c95a6' } : null]}
              onPress={() => setCurrentImage(photo)}
            >
              <RemoteImage 
                uri={photo} 
                style={styles.thumbnail}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Property Details */}
      <View style={styles.detailsContainer}>
        {/* Title and Price */}
        <View style={styles.titlePriceRow}>
          <Text style={[styles.propertyTitle, { color: C.text }]}>{property.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: '#3c95a6' }]}>
              ${typeof property.price === 'number' ? property.price : property.price}
            </Text>
            <Text style={[styles.perMonth, { color: C.textMuted }]}>per month</Text>
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={C.textMuted} />
          <Text style={[styles.locationText, { color: C.textMuted }]}>
            {getLocationDisplay(property)}
          </Text>
        </View>
        
       
        
        {/* Host info */}
        <View style={styles.hostContainer}>
          <View style={styles.hostAvatarContainer}>
            <View style={[styles.hostAvatar, { backgroundColor: C.tint }]}>
              <Text style={styles.hostAvatarText}>L</Text>
            </View>
            <View>
              <Text style={[styles.hostName, { color: C.text }]}>Lincoln Smith</Text>
              <Text style={[styles.hostLocation, { color: C.textMuted }]}>{getLocationDisplay(property)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amenitiesContainer}>
          <View style={styles.amenityItem}>
            <Ionicons name="bed-outline" size={20} color={C.text} />
            <Text style={[styles.amenityText, { color: C.text }]}>{property.bedrooms} Bedroom</Text>
          </View>
          <View style={styles.amenityItem}>
            <MaterialIcons name="bathroom" size={20} color={C.text} />
            <Text style={[styles.amenityText, { color: C.text }]}>{property.bathrooms} Bathroom</Text>
          </View>
        </View>

        {(property.description || property.descriptions) && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: C.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: C.textMuted }]}>{property.description || property.descriptions}</Text>
          </View>
        )}

        {/* Amenities */}
        <View style={styles.amenitiesSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(property.amenities && property.amenities.length > 0 ? property.amenities : [
              'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Parking', 'TV', 'Washer/Dryer'
            ]).map((amenity, index) => (
              <View key={index} style={styles.amenityGridItem}>
                {getAmenityIcon(amenity)}
                <Text style={[styles.amenityGridText, { color: C.text }]}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Preferences */}
        {property.preferences && property.preferences.length > 0 && (
          <View style={styles.preferencesSection}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Host Preferences</Text>
            <View style={styles.preferencesContainer}>
              {property.preferences.map((preference, index) => (
                <View key={index} style={[styles.preferenceItem, { borderColor: '#3c95a6', backgroundColor: 'rgba(60, 149, 166, 0.05)' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#3c95a6" />
                  <Text style={[styles.preferenceText, { color: C.text }]}>{preference}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Location</Text>
          <TouchableOpacity 
            style={styles.mapContainer}
            onPress={() => {
              // Extract latitude and longitude
              let latitude, longitude;
              
              if (property.location && typeof property.location === 'object' && 'latitude' in property.location && 'longitude' in property.location) {
                latitude = property.location.latitude;
                longitude = property.location.longitude;
              } else if (property.latitude !== undefined && property.longitude !== undefined) {
                latitude = property.latitude;
                longitude = property.longitude;
              }
              
              if (latitude && longitude) {
                // Convert to string if they're numbers
                const lat = typeof latitude === 'number' ? latitude.toString() : latitude;
                const lng = typeof longitude === 'number' ? longitude.toString() : longitude;
                
                // Create Google Maps URL
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                
                // Open URL in browser
                Linking.openURL(url).catch(err => {
                  console.error('Error opening map:', err);
                  Alert.alert('Error', 'Could not open map. Please try again.');
                });
              } else {
                Alert.alert('Location Unavailable', 'Map coordinates are not available for this property.');
              }
            }}
          >
            <View style={styles.mapImagePlaceholder}>
              <Entypo name="location-pin" size={40} color="#3c95a6" />
              <Text style={[styles.mapText, { color: C.text }]}>View on Google Maps</Text>
            </View>
            <View style={styles.mapOverlay}>
              <View style={styles.mapButtonContainer}>
                <View style={[styles.mapButton, { backgroundColor: '#3c95a6' }]}>
                  <Text style={styles.mapButtonText}>Open Map</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.mapAddress, { color: C.textMuted }]}>{getLocationDisplay(property)}</Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Reviews</Text>
            <View style={styles.ratingContainer}>
              {renderStars(property.rating || 4.7)}
              <Text style={[styles.ratingText, { color: C.text }]}>
                {property.rating?.toFixed(1) || '4.7'} ({reviews.length})
              </Text>
            </View>
          </View>
          
          {reviews.slice(0, 2).map((review) => (
            <View key={review.id} style={[styles.reviewItem, { borderBottomColor: C.surfaceBorder }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <View style={[styles.reviewAvatar, { backgroundColor: '#3c95a6' }]}>
                    <Text style={styles.reviewAvatarText}>{review.userName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.reviewUserName, { color: C.text }]}>{review.userName}</Text>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                      <Text style={[styles.reviewDate, { color: C.textMuted }]}>{review.date}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={[styles.reviewComment, { color: C.textMuted }]}>{review.comment}</Text>
            </View>
          ))}
          
          {reviews.length > 2 && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={handleSeeAllReviews}
            >
              <Text style={[styles.seeAllText, { color: '#3c95a6' }]}>See All Reviews</Text>
              <Ionicons name="chevron-forward" size={16} color="#3c95a6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.chatButton, { backgroundColor: C.surface, borderColor: C.tint }]}
          onPress={handleChatPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color={C.tint} />
          <Text style={[styles.chatButtonText, { color: C.tint }]}>Chat & Inquire</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.rentButton, { backgroundColor: C.tint }]}
          onPress={handleRentPress}
        >
          <MaterialIcons name="payment" size={20} color="#fff" />
          <Text style={styles.rentButtonText}>Rent Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  photoCountContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoGallery: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#3c95a6',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  imageTopRightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  propertyTypeContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  propertyType: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsContainer: {
    padding: 16,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  perMonth: {
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  hostContainer: {
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hostAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
  },
  hostLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  amenityText: {
    marginLeft: 8,
    fontSize: 14,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  preferencesSection: {
    marginBottom: 24,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  mapImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  mapButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  mapAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityGridItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 8,
  },
  amenityGridText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 10,
  },
  chatButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rentButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});
