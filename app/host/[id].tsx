import RemoteImage from '@/components/remote-image';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

type HostProfile = {
  id: string;
  display_name: string;
  photo_url?: string | null;
  email?: string;
  idPhoto?: string;
  phone_number?: string;
  rating?: number;
  created_time?: Date;
  listingsCount?: number;
  role?: string;
  isNewUser?: boolean;
  isSubscribe?: boolean;
  isSuspended?: boolean;
  isVerified?: boolean;
  uid?: string;
  walkthrough?: boolean;
};

type Property = {
  id: string;
  name?: string;
  title?: string;
  cities?: string;
  location?: string | { latitude: number; longitude: number; type?: string } | any;
  price?: number;
  deposit?: number;
  categories?: string;
  type?: string;
  photo?: string;
  imageUrl?: string | null;
  bedroomCount?: number;
  BathRoomCount?: number;
  bathroomType?: string;
  capacity?: number;
  createdAt?: Date;
  createdby?: string | { id: string } | { path: string };
  descriptions?: string;
  email?: string;
  phoneNumber?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  preferences?: string[];
  state?: string;
  zipCode?: string;
  address?: string;
};

export default function HostProfile() {
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  
  const [host, setHost] = useState<HostProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format date
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Helper function to format location display - based on homepage component
  const getLocationDisplay = (property: Property): string => {
    // Always prioritize cities if available
    if (typeof property.cities === 'string' && property.cities.trim() !== '') {
      return property.cities;
    }
    
    // If we have coordinates in the location object
    if (property.location && typeof property.location === 'object' && 'latitude' in property.location) {
      try {
        // Handle standard lat/long object
        if (typeof property.location.latitude === 'number') {
          return `${property.location.latitude.toFixed(6)}, ${property.location.longitude.toFixed(6)}`;
        }
        // Handle GeoPoint with getter methods
        else if (typeof property.location.latitude === 'function') {
          const lat = property.location.latitude();
          const lng = property.location.longitude();
          return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      } catch (e) {
        console.log('Error formatting location:', e);
      }
    }
    
    // If we have address, use it
    if (property.address && property.address.trim() !== '') {
      return property.address;
    }
    
    // Fallback to formatted location string
    const formattedLocation = `${property.state || ''} ${property.zipCode || ''}`.trim();
    if (formattedLocation) {
      return formattedLocation;
    }
    
    // Last resort, use location string if it exists
    if (typeof property.location === 'string' && property.location.trim() !== '') {
      return property.location;
    }
    
    return 'Location not available';
  };

  useEffect(() => {
    async function fetchHostAndListings() {
      if (!id) {
        setError('No host ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch host profile from users collection
        const hostRef = doc(db, 'users', id as string);
        const hostSnap = await getDoc(hostRef);

        if (!hostSnap.exists()) {
          // If not found in users collection, try to find in other collections
          const usersQuery = query(collection(db, 'users'));
          const usersSnap = await getDocs(usersQuery);
          
          // Try to find by other fields like email or uid
          const matchingUser = usersSnap.docs.find(doc => {
            const data = doc.data();
            return data.uid === id || data.email === id;
          });
          
          if (!matchingUser) {
            setError('Host not found');
            setLoading(false);
            return;
          }
          
          const hostData = matchingUser.data();
          setHost({
            id: matchingUser.id,
            display_name: hostData.display_name || hostData.displayName || hostData.name || hostData.email || 'Unknown Host',
            photo_url: hostData.photo_url || hostData.photoURL || hostData.avatar,
            email: hostData.email,
            idPhoto: hostData.idPhoto,
            phone_number: hostData.phone_number || hostData.phone || hostData.phoneNumber,
            rating: hostData.rating || 4.5,
            created_time: hostData.created_time ? new Date(hostData.created_time.toDate()) : new Date(),
            listingsCount: hostData.listingsCount || 0,
            role: hostData.role || 'host',
            isNewUser: hostData.isNewUser || false,
            isSubscribe: hostData.isSubscribe || false,
            isSuspended: hostData.isSuspended || false,
            isVerified: hostData.isVerified || false,
            uid: hostData.uid,
            walkthrough: hostData.walkthrough || false,
          });
        } else {
          // User found directly
          const hostData = hostSnap.data();
          setHost({
            id: hostSnap.id,
            display_name: hostData.display_name || hostData.displayName || hostData.name || hostData.email || 'Unknown Host',
            photo_url: hostData.photo_url || hostData.photoURL || hostData.avatar,
            email: hostData.email,
            idPhoto: hostData.idPhoto,
            phone_number: hostData.phone_number || hostData.phone || hostData.phoneNumber,
            rating: hostData.rating || 4.5,
            created_time: hostData.created_time ? new Date(hostData.created_time.toDate()) : new Date(),
            listingsCount: hostData.listingsCount || 0,
            role: hostData.role || 'host',
            isNewUser: hostData.isNewUser || false,
            isSubscribe: hostData.isSubscribe || false,
            isSuspended: hostData.isSuspended || false,
            isVerified: hostData.isVerified || false,
            uid: hostData.uid,
            walkthrough: hostData.walkthrough || false,
          });
        }

        // Fetch all properties and filter by createdby in the code
        const propertiesSnap = await getDocs(collection(db, 'property'));
        
        // Get all possible user IDs for this host (document ID, uid field if different, etc.)
        const hostIds = new Set<string>();
        
        // Add the document ID
        hostIds.add(id as string);
        
        // Add IDs from host document if it exists
        if (hostSnap.exists()) {
          const hostData = hostSnap.data();
          hostIds.add(hostSnap.id);
          // Add the uid from the user schema
          if (hostData.uid && hostData.uid !== hostSnap.id) hostIds.add(hostData.uid);
        }
        
        console.log('Checking properties for host IDs:', Array.from(hostIds));
        
        // Filter properties by createdby field with priority on the schema field
        const filteredDocs = propertiesSnap.docs.filter(doc => {
          const data = doc.data();
          
          // Check if createdby is a reference type (from Firestore)
          if (data.createdby && typeof data.createdby === 'object' && data.createdby.path) {
            // Extract the ID from the reference path (e.g., "/users/mWOqBEvsXXMndVL3qQ1kZnO9Afy2")
            const refPath = data.createdby.path;
            const refId = refPath.split('/').pop();
            
            // Check if this reference ID matches any of our host IDs
            if (refId && hostIds.has(refId)) {
              return true;
            }
          }
          
          // Check if any of the host IDs match any of the creator fields
          // Prioritize the createdby field as per the schema
          for (const hostId of hostIds) {
            if (
              (data.createdby && typeof data.createdby === 'string' && data.createdby === hostId) || 
              (data.createdby && typeof data.createdby === 'string' && data.createdby.includes(hostId)) ||
              data.createdBy === hostId || 
              data.userId === hostId || 
              data.hostId === hostId || 
              data.ownerId === hostId || 
              data.uid === hostId
            ) {
              return true;
            }
          }
          return false;
        });
        
        console.log(`Found ${filteredDocs.length} properties for host ${id}`);
        
        // Log the first property to understand the GeoPoint structure
        if (filteredDocs.length > 0) {
          const sampleData = filteredDocs[0].data();
          if (sampleData.location) {
            console.log('Sample location data type:', typeof sampleData.location);
            console.log('Sample location data:', JSON.stringify(sampleData.location));
            if (typeof sampleData.location === 'object') {
              console.log('Location object keys:', Object.keys(sampleData.location));
            }
          }
        }
        
        // Map filtered properties to the required format based on the schema - using homepage approach
        const propertiesList = filteredDocs.map(doc => {
          const data = doc.data() as any;
          
          // Safely handle lat/long to prevent errors
          let latitude: number | undefined;
          let longitude: number | undefined;
          
          try {
            if (data.latitude !== undefined && data.latitude !== null && !isNaN(Number(data.latitude))) {
              latitude = Number(data.latitude);
            }
            if (data.longitude !== undefined && data.longitude !== null && !isNaN(Number(data.longitude))) {
              longitude = Number(data.longitude);
            }
          } catch (error) {
            console.warn('Invalid lat/long data for property:', doc.id, error);
          }
          
          return {
            id: doc.id,
            title: data.title ?? data.name ?? 'Untitled',
            name: data.name,
            location: data.location ?? data.address ?? 'Unknown',
            price: data.price ?? data.rent ?? undefined,
            type: data.type ?? data.category ?? undefined,
            imageUrl: data.imageUrl ?? data.photo ?? null,
            photo: data.photo,
            cities: data.city ?? data.cities ?? undefined,
            state: data.state ?? undefined,
            zipCode: data.zipCode ?? data.zip ?? undefined,
            category: data.category ?? data.type ?? undefined,
            latitude,
            longitude,
            address: data.address ?? data.fullAddress ?? data.locationAddress ?? undefined,
            bedroomCount: data.bedroomCount || 0,
            BathRoomCount: data.BathRoomCount || 0,
            bathroomType: data.bathroomType,
            capacity: data.capacity,
            createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
            createdby: data.createdby,
            descriptions: data.descriptions,
            email: data.email,
            phoneNumber: data.phoneNumber,
            isAvailable: data.isAvailable,
            isVerified: data.isVerified,
            preferences: data.preferences || [],
            deposit: data.deposit,
          };
        });

        // Update host with actual listings count
        const actualListingCount = filteredDocs.length;
        setHost(prevHost => {
          if (!prevHost) return null;
          return {
            ...prevHost,
            listingsCount: actualListingCount
          };
        });
        
        console.log(`Updated host listing count to ${actualListingCount}`);
        
        // If no properties were found but we have a host, check for properties again with a broader search
        if (actualListingCount === 0 && host) {
          console.log('No properties found with direct ID match, trying broader search...');
          
          // Try to find properties that might be related to this host in other ways
          const possibleMatches = propertiesSnap.docs.filter(doc => {
            const data = doc.data();
            const hostName = host.display_name.toLowerCase();
            
            // Check if host name appears in property title or description
            return (
              (data.title && data.title.toLowerCase().includes(hostName)) ||
              (data.description && data.description.toLowerCase().includes(hostName)) ||
              (data.hostName && data.hostName.toLowerCase().includes(hostName))
            );
          });
          
          if (possibleMatches.length > 0) {
            console.log(`Found ${possibleMatches.length} possible matches by name`);
            // Add these to our filtered docs if we didn't find any direct matches
            Array.prototype.push.apply(filteredDocs, possibleMatches);
            
            // Map the additional properties
            const additionalProperties = possibleMatches.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || data.name || 'Untitled Property',
                location: data.location || data.address || data.city || 'Unknown Location',
                price: data.price || data.rent || 0,
                type: data.type || data.category || 'Property',
                imageUrl: data.imageUrl || data.photo || data.image || null,
                bedrooms: data.bedrooms || data.beds || 0,
                bathrooms: data.bathrooms || data.baths || 0,
                createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
              };
            });
            
            // Update properties list with the additional properties
            const updatedPropertiesList = [...propertiesList, ...additionalProperties];
            setProperties(updatedPropertiesList);
            
            // Update host listing count again
            setHost(prevHost => {
              if (!prevHost) return null;
              return {
                ...prevHost,
                listingsCount: updatedPropertiesList.length
              };
            });
          } else {
            // If no additional properties were found, use the original list
            setProperties(propertiesList);
          }
        } else {
          // If we found properties directly or don't have a host yet, use the original list
          setProperties(propertiesList);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching host data:', err);
        setError('Failed to load host profile');
        setLoading(false);
      }
    }

    fetchHostAndListings();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.tint} />
        <Text style={{ color: C.textMuted, marginTop: 16 }}>Loading host profile...</Text>
      </View>
    );
  }

  if (error || !host) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.error, fontSize: 16, marginBottom: 16 }}>{error || 'Failed to load host profile'}</Text>
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
        <Text style={[styles.headerTitle, { color: C.text }]}>Host Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Host Profile Section */}
      <View style={[styles.profileContainer, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
        <View style={styles.profileHeader}>
          {host.photo_url ? (
            <Image source={{ uri: host.photo_url }} style={styles.profileImage} />
          ) : host.idPhoto ? (
            <Image source={{ uri: host.idPhoto }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: C.tint }]}>
              <Text style={styles.profileImageText}>{host.display_name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: C.text }]}>{host.display_name}</Text>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: C.text }]}>{host.rating?.toFixed(1)}</Text>
              <Text style={[styles.reviewsText, { color: C.textMuted }]}>
                • {host.listingsCount} listing{host.listingsCount !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <Text style={[styles.joinedText, { color: C.textMuted }]}>
              Joined {formatDate(host.created_time)}
            </Text>
          </View>
        </View>
        
        <View style={styles.bioSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>About</Text>
          <Text style={[styles.bioText, { color: C.textMuted }]}>
            {host.isVerified ? 'Verified host' : 'Host'} {host.role === 'host' ? 'with properties for rent' : ''}
          </Text>
        </View>
        
        <View style={styles.contactSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Contact</Text>
          
          {host.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color={C.icon} />
              <Text style={[styles.contactText, { color: C.text }]}>{host.email}</Text>
            </View>
          )}
          
          {host.phone_number && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={C.icon} />
              <Text style={[styles.contactText, { color: C.text }]}>{host.phone_number}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Host Listings Section */}
      <View style={styles.listingsSection}>
        <View style={styles.listingsTitleRow}>
          <Text style={[styles.listingsSectionTitle, { color: C.text }]}>
            Properties by {host.display_name.split(' ')[0]}
          </Text>
          <Text style={[styles.listingsCount, { color: C.textMuted }]}>
            {properties.length} {properties.length === 1 ? 'listing' : 'listings'}
          </Text>
        </View>
        
        {properties.length === 0 ? (
          <View style={[styles.emptyListings, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
            <Ionicons name="home-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyListingsText, { color: C.textMuted }]}>
              This host has no listings yet
            </Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={[styles.propertyCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/property/details', params: { id: property.id } })}
              >
                <RemoteImage
                  uri={property.photo || property.imageUrl}
                  style={styles.propertyImage}
                  borderRadius={12}
                >
                  <View style={[styles.hostBadge, { backgroundColor: '#3c95a6' }]}>
                    <Text style={styles.hostBadgeText}>Host's Property</Text>
                  </View>
                </RemoteImage>
                
                <View style={styles.propertyDetails}>
                  <Text 
                    numberOfLines={1} 
                    style={[styles.propertyTitle, { color: C.text }]}
                  >
                    {property.title}
                  </Text>
                  
                  <View style={styles.propertyLocationRow}>
                    <MaterialIcons name="location-on" size={14} color={C.icon} />
                    <Text 
                      numberOfLines={1}
                      style={[styles.propertyLocation, { color: C.textMuted }]}
                    >
                      {getLocationDisplay(property)}
                    </Text>
                  </View>
                  
                  <View style={styles.propertyFeaturesRow}>
                    {property.bedroomCount !== undefined && (
                      <View style={styles.propertyFeature}>
                        <Ionicons name="bed-outline" size={14} color={C.icon} />
                        <Text style={[styles.propertyFeatureText, { color: C.textMuted }]}>
                          {property.bedroomCount}
                        </Text>
                      </View>
                    )}
                    
                    {property.BathRoomCount !== undefined && (
                      <View style={styles.propertyFeature}>
                        <MaterialIcons name="bathroom" size={14} color={C.icon} />
                        <Text style={[styles.propertyFeatureText, { color: C.textMuted }]}>
                          {property.BathRoomCount}
                        </Text>
                      </View>
                    )}
                    
                    {property.capacity !== undefined && (
                      <View style={styles.propertyFeature}>
                        <Ionicons name="people-outline" size={14} color={C.icon} />
                        <Text style={[styles.propertyFeatureText, { color: C.textMuted }]}>
                          {property.capacity}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[styles.propertyPrice, { color: '#3c95a6' }]}>
                    ${typeof property.price === 'number' 
                      ? property.price 
                      : parseInt(String(property.price).replace(/[^0-9]/g, '') || '0')
                    }<Text style={{ fontSize: 12, color: C.textMuted }}>/mo</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Contact Host Button */}
      <TouchableOpacity
        style={[styles.contactButton, { backgroundColor: C.tint }]}
        activeOpacity={0.8}
        onPress={() => {
          // Navigate to chat with this host
          router.push({ pathname: '/conversation/new', params: { userId: host.id } });
        }}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.contactButtonText}>Contact Host</Text>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  profileContainer: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewsText: {
    marginLeft: 4,
  },
  joinedText: {
    fontSize: 14,
  },
  bioSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
  },
  listingsSection: {
    padding: 16,
  },
  listingsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listingsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listingsCount: {
    fontSize: 14,
  },
  emptyListings: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListingsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listingsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  propertyCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyImage: {
    height: 160,
    width: '100%',
  },
  hostBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  propertyDetails: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  propertyFeaturesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyFeatureText: {
    marginLeft: 4,
    fontSize: 14,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactButton: {
    margin: 16,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
