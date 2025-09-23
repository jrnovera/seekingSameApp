import RemoteImage from '@/components/remote-image';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type Property = {
  id: string;
  title?: string;
  location?: string;
  price?: string | number;
  type?: string;
  imageUrl?: string | null;
  cities?: string;
  createdAt?: Date;
  createdby?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  address?: string;
};

export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  // Simple error handler
  const handleError = (err: any, context: string) => {
    console.error(`PropertyDetails ${context}:`, err);
    setError(`Error ${context}: ${err.message || 'Unknown error'}`);
    setLoading(false);
  };

  useEffect(() => {
    async function fetchProperty() {
      if (!id) {
        setError('No property ID provided');
        setLoading(false);
        return;
      }

      console.log('PropertyDetails: Fetching property with ID:', id);

      try {
        const propertyRef = doc(db, 'property', id as string);
        const propertySnap = await getDoc(propertyRef);

        if (propertySnap.exists()) {
          const data = propertySnap.data() as any;
          
          // Debug logging for cities data
          console.log('Property data:', {
            id: propertySnap.id,
            city: data.city,
            cities: data.cities,
            location: data.location
          });
          
          // Safely handle lat/long to prevent errors
          let latitude: number | undefined;
          let longitude: number | undefined;
          
          try {
            // Check if location is an object with coordinates
            if (data.location && typeof data.location === 'object' && 'latitude' in data.location && 'longitude' in data.location) {
              latitude = Number(data.location.latitude);
              longitude = Number(data.location.longitude);
              console.log('Found coordinates in location object:', latitude, longitude);
            }
            
            // Also check for direct lat/long properties
            if (data.latitude !== undefined && data.latitude !== null && !isNaN(Number(data.latitude))) {
              latitude = Number(data.latitude);
            }
            if (data.longitude !== undefined && data.longitude !== null && !isNaN(Number(data.longitude))) {
              longitude = Number(data.longitude);
            }
          } catch (error) {
            console.warn('Invalid lat/long data for property:', propertySnap.id, error);
          }
          
          // Handle createdAt timestamp if it exists
          let createdAt: Date | undefined;
          if (data.createdAt) {
            createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          }
          
          setProperty({
            id: propertySnap.id,
            title: data.title ?? data.name ?? 'Untitled',
            // Handle location data - don't use coordinates for display
            location: typeof data.location === 'string' ? data.location : 
                     (data.address ? data.address : 'Unknown'),
            price: data.price ?? data.rent ?? undefined,
            type: data.type ?? data.category ?? undefined,
            imageUrl: data.imageUrl ?? data.imageURL ?? data.photoUrl ?? data.photoURL ?? null,
            // Make sure we prioritize cities data
            cities: data.city ?? data.cities ?? data.location?.city ?? undefined,
            createdby: data.createdby ?? data.createdBy ?? data.created_by ?? data.owner ?? undefined,
            createdAt: createdAt,
            state: data.state ?? undefined,
            zipCode: data.zipCode ?? data.zip ?? undefined,
            category: data.category ?? data.type ?? undefined,
            latitude,
            longitude,
            description: data.description ?? undefined,
            bedrooms: data.bedrooms ?? data.beds ?? undefined,
            bathrooms: data.bathrooms ?? data.baths ?? undefined,
            amenities: data.amenities ?? [],
            address: data.address ?? data.fullAddress ?? undefined,
          });
        } else {
          setError('Property not found');
        }
      } catch (err) {
        handleError(err, 'fetching property');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty().catch(err => handleError(err, 'in fetchProperty'));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.error || '#ef4444' }}>{error || 'Property not found'}</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: C.tint, marginTop: 20 }]} 
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Property Image */}
      <View style={styles.imageContainer}>
        <RemoteImage 
          uri={property.imageUrl} 
          style={styles.propertyImage}
        >
        <View style={styles.imageOverlay}>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.propertyTypeContainer}>
            <Text style={styles.propertyType}>{property.type || property.category || 'Apartment'}</Text>
          </View>
        </View>
      </RemoteImage>
    </View>

    {/* Property Details */}
    <View style={styles.detailsContainer}>
      <Text style={[styles.propertyTitle, { color: C.text }]}>{property.title}</Text>
      
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color={C.textMuted} />
        <Text style={[styles.locationText, { color: C.textMuted }]}>
          {property.cities || (typeof property.location === 'string' ? property.location : 'Location not available')}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: C.text }]}>
          {typeof property.price === 'number' ? `$${property.price}` : property.price}
        </Text>
        <Text style={[styles.perMonth, { color: C.textMuted }]}>per month</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: C.surfaceSoft }]}>
          <Text style={[styles.actionButtonText, { color: C.text }]}>Inquire</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: C.surfaceSoft }]}>
          <Text style={[styles.actionButtonText, { color: C.text }]}>Chat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amenitiesContainer}>
        <View style={styles.amenityItem}>
          <Ionicons name="bed-outline" size={20} color={C.text} />
          <Text style={[styles.amenityText, { color: C.text }]}>{property.bedrooms || '3'} Bedroom</Text>
        </View>
        <View style={styles.amenityItem}>
          <MaterialIcons name="bathroom" size={20} color={C.text} />
          <Text style={[styles.amenityText, { color: C.text }]}>{property.bathrooms || '2'} Bathroom</Text>
        </View>
      </View>

      <View style={styles.locationDetailContainer}>
        <Text style={[styles.locationDetailTitle, { color: C.text }]}>Location</Text>
        <Text style={[styles.locationDetailText, { color: C.textMuted }]}>
          {property.cities ? 
            `${property.cities}${property.state ? `, ${property.state}` : ''}${property.zipCode ? ` ${property.zipCode}` : ''}` : 
            property.address || (typeof property.location === 'string' ? property.location : 'Location not available')}
        </Text>
      </View>

      {property.description && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionTitle, { color: C.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: C.textMuted }]}>{property.description}</Text>
        </View>
      )}

      {/* Created By and Created At Information */}
      <View style={[styles.createdInfoContainer, { 
        backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderColor: C.surfaceBorder,
        borderWidth: 1
      }]}>
        {property.createdby && (
          <View style={styles.createdInfoItem}>
            <Text style={[styles.createdInfoLabel, { color: C.text }]}>Listed by:</Text>
            <Text style={[styles.createdInfoValue, { color: C.textMuted }]}>{property.createdby}</Text>
          </View>
        )}
        {property.createdAt && (
          <View style={styles.createdInfoItem}>
            <Text style={[styles.createdInfoLabel, { color: C.text }]}>Listed on:</Text>
            <Text style={[styles.createdInfoValue, { color: C.textMuted }]}>
              {property.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        )}
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsContainer}>
        <View style={styles.reviewsHeader}>
          <Text style={[styles.reviewsTitle, { color: C.text }]}>Reviews</Text>
          <TouchableOpacity style={[styles.addReviewButton, { backgroundColor: C.tint }]}>
            <Text style={styles.addReviewText}>Add Reviews</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.reviewCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <View style={styles.reviewStars}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star" size={20} color="#FFD700" />
            <Ionicons name="star-outline" size={20} color="#FFD700" />
          </View>
          <Text style={[styles.reviewCount, { color: C.textMuted }]}>From 1123 reviewers</Text>
        </View>

        {/* Sample Reviews */}
        <View style={[styles.reviewItem, { borderBottomColor: C.surfaceBorder }]}>
          <View style={styles.reviewerInfo}>
            <View style={styles.reviewerAvatar} />
            <Text style={[styles.reviewerName, { color: C.text }]}>Lincoln Smith</Text>
            <View style={styles.reviewItemStars}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          </View>
          <Text style={[styles.reviewText, { color: C.textMuted }]}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>

        <View style={[styles.reviewItem, { borderBottomColor: C.surfaceBorder }]}>
          <View style={styles.reviewerInfo}>
            <View style={styles.reviewerAvatar} />
            <Text style={[styles.reviewerName, { color: C.text }]}>Lincoln Smith</Text>
            <View style={styles.reviewItemStars}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star" size={16} color="#FFD700" />
              <Ionicons name="star-outline" size={16} color="#FFD700" />
              <Ionicons name="star-outline" size={16} color="#FFD700" />
            </View>
          </View>
          <Text style={[styles.reviewText, { color: C.textMuted }]}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      </View>
    </View>

    {/* Rent Button */}
    <TouchableOpacity style={[styles.rentButton, { backgroundColor: C.tint }]}>
      <Text style={styles.rentButtonText}>Rent</Text>
    </TouchableOpacity>
  </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  rightButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  propertyTypeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  propertyType: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  perMonth: {
    marginLeft: 4,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    fontWeight: '600',
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
  locationDetailContainer: {
    marginBottom: 24,
  },
  locationDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationDetailText: {
    fontSize: 14,
    lineHeight: 20,
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
  createdInfoContainer: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  createdInfoItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  createdInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  createdInfoValue: {
    fontSize: 14,
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReviewText: {
    color: '#fff',
    fontWeight: '600',
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  reviewerName: {
    fontWeight: '600',
    flex: 1,
  },
  reviewItemStars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  rentButton: {
    margin: 16,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
