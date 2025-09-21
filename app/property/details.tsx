import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import RemoteImage from '@/components/remote-image';
import { useColorScheme } from 'react-native';

type Property = {
  id: string;
  title?: string;
  location?: string;
  price?: string | number;
  type?: string;
  imageUrl?: string | null;
  city?: string;
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
          
          setProperty({
            id: propertySnap.id,
            title: data.title ?? data.name ?? 'Untitled',
            location: data.location ?? data.city ?? data.address ?? 'Unknown',
            price: data.price ?? data.rent ?? undefined,
            type: data.type ?? data.category ?? undefined,
            imageUrl: data.imageUrl ?? data.imageURL ?? data.photoUrl ?? data.photoURL ?? null,
            city: data.city ?? undefined,
            state: data.state ?? undefined,
            zipCode: data.zipCode ?? data.zip ?? undefined,
            category: data.category ?? data.type ?? undefined,
            description: data.description ?? undefined,
            bedrooms: data.bedrooms ?? data.beds ?? undefined,
            bathrooms: data.bathrooms ?? data.baths ?? undefined,
            amenities: data.amenities ?? [],
            address: data.address ?? data.fullAddress ?? undefined,
          });
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
        <ActivityIndicator size="large" color={C.tint} />
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
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: C.surface }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Property Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Property Image */}
      <View style={styles.imageContainer}>
        <RemoteImage 
          uri={property.imageUrl} 
          style={styles.propertyImage}
        />
        {property.type && (
          <View style={[styles.propertyTypeContainer, { backgroundColor: C.tint }]}>
            <Text style={styles.propertyType}>{property.type}</Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.propertyTitle, { color: C.text }]}>{property.title}</Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={C.textMuted} />
          <Text style={[styles.locationText, { color: C.textMuted }]}>{property.location}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: C.text }]}>
            {typeof property.price === 'number' ? `$${property.price}` : property.price || 'Price not available'}
          </Text>
          <Text style={[styles.perMonth, { color: C.textMuted }]}>per month</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
            <Text style={[styles.actionButtonText, { color: C.text }]}>Inquire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
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
            {property.address || `${property.location}, ${property.city || ''} ${property.state || ''} ${property.zipCode || ''}`}
          </Text>
        </View>

        {property.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: C.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: C.textMuted }]}>{property.description}</Text>
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    height: 250,
    position: 'relative',
    marginBottom: 16,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  propertyTypeContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  propertyType: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
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
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
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
