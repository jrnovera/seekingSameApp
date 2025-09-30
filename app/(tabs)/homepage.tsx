import FilterModal, { FilterOptions } from '@/components/FilterModal';
import RemoteImage from '@/components/remote-image';
import { auth, db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { addSampleProperties } from '@/utils/sampleData';
import { checkIfFavorited, createFavorite, removeFavorite } from '@/services/favoriteService';
import { notificationService } from '@/services/notificationService';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

type Property = {
  id: string;
  name?: string;
  title?: string;
  descriptions?: string;
  email?: string;
  phoneNumber?: string;
  cities?: string;
  capacity?: number;
  categories?: string;
  price?: string | number;
  deposit?: string | number;
  parkingSizeForRv?: number;
  bathroomType?: string;
  bedroomCount?: number;
  BathRoomCount?: number;
  amenities?: string[];
  preferences?: string[];
  isAvailable?: boolean;
  isVerified?: boolean;
  samplePhotos?: string[];
  photo?: string;
  imageUrl?: string | null;
  imageFile?: any;
  location?: string | { latitude: string | number; longitude: string | number; type?: string };
  latitude?: number | string;
  longitude?: number | string;
  type?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  address?: string | {
    street?: string;
    unit?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

export default function Homepage() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Helper function to format location display
  const getLocationDisplay = (property: Property): string => {
    // Always prioritize cities if available
    if (typeof property.cities === 'string' && property.cities.trim() !== '') {
      return property.cities;
    }
    
    // If we have a structured address object
    if (property.address && typeof property.address === 'object') {
      const addr = property.address;
      if (addr.city) {
        // Return city, state if available
        if (addr.state) {
          return `${addr.city}, ${addr.state}`;
        }
        return addr.city;
      }
      
      // If no city, try to construct from other address parts
      const addressParts = [];
      if (addr.street) addressParts.push(addr.street);
      if (addr.unit) addressParts.push(addr.unit);
      if (addr.state) addressParts.push(addr.state);
      if (addr.zipCode) addressParts.push(addr.zipCode);
      
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
    }
    
    // If we have coordinates in the location object
    if (property.location && typeof property.location === 'object' && 'latitude' in property.location) {
      const lat = typeof property.location.latitude === 'string' 
        ? parseFloat(property.location.latitude) 
        : property.location.latitude;
      
      const lng = typeof property.location.longitude === 'string' 
        ? parseFloat(property.location.longitude) 
        : property.location.longitude;
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    }
    
    // If we have a string address, use it
    if (property.address && typeof property.address === 'string' && property.address.trim() !== '') {
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

  // Categories with icons
  const categories = [
    { name: 'Room', icon: 'bed-outline' },
    { name: 'Whole place', icon: 'home-outline' },
    { name: 'Co-living', icon: 'people-outline' },
    { name: 'Co-housing', icon: 'business-outline' },
    { name: 'RV Space', icon: 'car-outline' },
    { name: 'Other Type', icon: 'ellipsis-horizontal-outline' }
  ];
  
  // Define Host type
  type Host = {
    id: string;
    name: string;
    photoURL?: string;
    email?: string;
    rating?: number;
    listingsCount?: number;
  };
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    city: '',
    state: '',
    zipCode: '',
    priceRange: [0, 5000],
    categories: [],
    // Initialize new filter fields
    bathroomType: undefined,
    bedroomCount: undefined,
    capacity: undefined,
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loadingSampleData, setLoadingSampleData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [favoritedProperties, setFavoritedProperties] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleAddSampleData = async () => {
    setLoadingSampleData(true);
    try {
      await addSampleProperties();
      alert('Sample properties added successfully!');
    } catch (error) {
      alert('Error adding sample properties');
    } finally {
      setLoadingSampleData(false);
    }
  };

  // Load user's favorite properties
  const loadUserFavorites = async (userId: string) => {
    try {
      // For now, we'll check each property individually
      // In a real app, you might want to batch this or use a different approach
      const favoritePromises = properties.map(property =>
        checkIfFavorited(userId, property.id)
      );
      const favoriteResults = await Promise.all(favoritePromises);

      const favoriteIds = new Set<string>();
      favoriteResults.forEach((favoriteId, index) => {
        if (favoriteId) {
          favoriteIds.add(properties[index].id);
        }
      });

      setFavoritedProperties(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (property: Property) => {
    if (!currentUserId) {
      alert('Please sign in to save favorites');
      return;
    }

    try {
      const isFavorited = favoritedProperties.has(property.id);

      if (isFavorited) {
        // Remove from favorites
        const favoriteId = await checkIfFavorited(currentUserId, property.id);
        if (favoriteId) {
          await removeFavorite(favoriteId);
          setFavoritedProperties(prev => {
            const newSet = new Set(prev);
            newSet.delete(property.id);
            return newSet;
          });
          console.log(`Removed "${property.title}" from favorites`);
        }
      } else {
        // Add to favorites
        await createFavorite({
          userId: currentUserId,
          propertyId: property.id,
          title: property.title || property.name,
          location: getLocationDisplay(property),
          price: property.price,
          type: property.type || property.category,
          imageUrl: property.imageUrl
        });
        setFavoritedProperties(prev => new Set([...prev, property.id]));
        console.log(`Added "${property.title}" to favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
    }
  };

  // Load user profile data and favorites
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          // Get user's display name from Firebase Auth
          let displayName = user.displayName || 'User';

          // Try to get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Use Firestore data if available
            displayName = userData.displayName || userData.name || displayName;
            setUserAvatar(userData.photoURL || userData.avatar || null);
          }

          // Extract first name or use full name
          const firstName = displayName.split(' ')[0];
          setUserName(firstName);

          // Load user's favorite properties
          await loadUserFavorites(user.uid);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUserId(null);
        setUserName('Guest');
        setUserAvatar(null);
        setFavoritedProperties(new Set());
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to unread notification count
  useEffect(() => {
    let unsubscribeNotificationCount: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup previous listener
      if (unsubscribeNotificationCount) {
        unsubscribeNotificationCount();
        unsubscribeNotificationCount = null;
      }

      if (user) {
        // Listen to unread notification count
        unsubscribeNotificationCount = notificationService.listenToUnreadCount(
          user.uid,
          (count) => {
            setUnreadNotificationCount(count);
          },
          (error) => {
            console.error('Error listening to notification count:', error);
          }
        );
      } else {
        setUnreadNotificationCount(0);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotificationCount) {
        unsubscribeNotificationCount();
      }
    };
  }, []);

  // Start entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      })
    ]).start();
  }, []);

  // Fetch all users and filter hosts in the code
  useEffect(() => {
    setHostsLoading(true);
    
    // Function to filter hosts by role and sort by creation date
    const filterAndSortHosts = (users: any[]) => {
      return users
        .filter(user => user.role === 'host') // Filter users with role 'host'
        .sort((a, b) => {
          // Sort by createdAt in descending order (newest first)
          const dateA = a.createdAt ? new Date(a.createdAt.toDate()).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt.toDate()).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10); // Limit to 10 hosts
    };
    
    // Get all users and filter in the code
    const unsubscribeHosts = onSnapshot(collection(db, 'users'), (snapshot) => {
      try {
        // Get all users
        const allUsers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            name: data.displayName || data.name || data.email || 'Unknown Host',
            photoURL: data.photoURL || data.avatar,
            rating: data.rating || 4.5,
            listingsCount: data.listingsCount || Math.floor(Math.random() * 5) + 1, // Temporary random count
            createdAt: data.createdAt
          };
        });
        
        // Filter and sort hosts
        const filteredHosts = filterAndSortHosts(allUsers);
        
        // Map to the required format
        const hostsList = filteredHosts.map(host => ({
          id: host.id,
          name: host.name,
          photoURL: host.photoURL,
          email: host.email,
          rating: host.rating,
          listingsCount: host.listingsCount,
          createdBy: host.createdBy || null
        }));
        
        setHosts(hostsList);
        setHostsLoading(false);
      } catch (error) {
        console.error('Error processing hosts data:', error);
        setHostsLoading(false);
        // Fallback to sample data if error
        setHosts([
          { id: '1', name: 'John Doe', rating: 4.8, listingsCount: 3 },
          { id: '2', name: 'Sarah Smith', rating: 4.6, listingsCount: 2 },
          { id: '3', name: 'Michael Brown', rating: 4.9, listingsCount: 5 }
        ]);
      }
    }, (error) => {
      console.error('Error fetching users:', error);
      setHostsLoading(false);
      // Fallback to sample data if error
      setHosts([
        { id: '1', name: 'John Doe', rating: 4.8, listingsCount: 3 },
        { id: '2', name: 'Sarah Smith', rating: 4.6, listingsCount: 2 },
        { id: '3', name: 'Michael Brown', rating: 4.9, listingsCount: 5 }
      ]);
    });
    
    return () => unsubscribeHosts();
  }, []);

  // Fetch properties
  useEffect(() => {
    setIsLoading(true);
    // Subscribe to the 'property' collection in Firestore
    const q = query(collection(db, 'property'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Property[] = snapshot.docs.map((doc) => {
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
        
        const property = {
          id: doc.id,
          name: data.name ?? undefined,
          title: data.title ?? data.name ?? 'Untitled',
          descriptions: data.descriptions ?? data.description ?? undefined,
          email: data.email ?? undefined,
          phoneNumber: data.phoneNumber ?? data.phone ?? undefined,
          cities: data.city ?? data.cities ?? undefined,
          capacity: data.capacity ?? undefined,
          categories: data.categories ?? data.category ?? undefined,
          price: data.price ?? data.rent ?? undefined,
          deposit: data.deposit ?? undefined,
          parkingSizeForRv: data.parkingSizeForRv ?? undefined,
          bathroomType: data.bathroomType ?? undefined,
          bedroomCount: data.bedroomCount ?? undefined,
          BathRoomCount: data.BathRoomCount ?? data.bathroomCount ?? undefined,
          amenities: data.amenities ?? [],
          preferences: data.preferences ?? [],
          isAvailable: data.isAvailable ?? true,
          isVerified: data.isVerified ?? false,
          samplePhotos: data.samplePhotos ?? [],
          photo: data.photo ?? undefined,
          imageUrl: data.imageUrl ?? data.photo ?? null,
          imageFile: data.imageFile ?? null,
          location: data.location ?? data.address ?? 'Unknown',
          type: data.type ?? data.category ?? undefined,
          state: data.state ?? (typeof data.address === 'object' ? data.address.state : undefined),
          zipCode: data.zipCode ?? data.zip ?? (typeof data.address === 'object' ? data.address.zipCode : undefined),
          category: data.category ?? data.type ?? undefined,
          latitude,
          longitude,
          address: data.address ?? data.fullAddress ?? data.locationAddress ?? undefined,
        };
        
        // Debug logging
        console.log('Property loaded:', property.title, 'Image URL:', property.imageUrl);
        
        return property;
      });
      console.log("check items:",JSON.stringify(items, null, 2))
      setProperties(items);
      // Initialize filtered properties if no filters are active
      if (!activeFilters.city && !activeFilters.state && !activeFilters.zipCode && 
          activeFilters.priceRange[1] >= 5000 && activeFilters.categories.length === 0) {
        setFilteredProperties(items);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reload favorites when properties change and user is logged in
  useEffect(() => {
    if (currentUserId && properties.length > 0) {
      loadUserFavorites(currentUserId);
    }
  }, [currentUserId, properties.length]);

  // Check if search or filters are active
  const isSearchActive = () => {
    return searchQuery.trim() !== '' || activeCategory !== null || hasActiveFilters();
  };

  // Apply filters and search whenever properties, activeFilters, or searchQuery change
  useEffect(() => {
    let filtered = properties;
    
    // Apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(property => 
        // Search in title and name
        property.title?.toLowerCase().includes(query) ||
        property.name?.toLowerCase().includes(query) ||
        
        // Search in descriptions
        property.descriptions?.toLowerCase().includes(query) ||
        
        // Search in location fields
        property.cities?.toLowerCase().includes(query) ||
        (typeof property.location === 'string' && property.location.toLowerCase().includes(query)) ||
        
        // Search in address fields if object
        (property.address && typeof property.address === 'object' && (
          property.address.street?.toLowerCase().includes(query) ||
          property.address.city?.toLowerCase().includes(query) ||
          property.address.state?.toLowerCase().includes(query) ||
          property.address.zipCode?.toLowerCase().includes(query)
        )) ||
        
        // Search in type and category
        property.type?.toLowerCase().includes(query) ||
        property.category?.toLowerCase().includes(query) ||
        property.categories?.toLowerCase().includes(query) ||
        
        // Search in amenities
        (property.amenities && Array.isArray(property.amenities) && 
          property.amenities.some(amenity => amenity.toLowerCase().includes(query))) ||
        
        // Search in preferences
        (property.preferences && Array.isArray(property.preferences) && 
          property.preferences.some(preference => preference.toLowerCase().includes(query)))
      );
    }
    
    // Filter by active category chip
    if (activeCategory) {
      const categoryLower = activeCategory.toLowerCase();
      filtered = filtered.filter(property => {
        // Check in multiple property fields that might contain category info
        return (
          // Direct type/category fields
          (property.type && property.type.toLowerCase().includes(categoryLower)) ||
          (property.category && property.category.toLowerCase().includes(categoryLower)) ||
          (property.categories && property.categories.toLowerCase().includes(categoryLower)) ||
          
          // Check in arrays if available
          (property.amenities && Array.isArray(property.amenities) && 
            property.amenities.some(a => a.toLowerCase().includes(categoryLower))) ||
          
          // Check if it's an exact match for room type categories
          (categoryLower === 'room' && property.type?.toLowerCase() === 'room') ||
          (categoryLower === 'whole place' && 
            (property.type?.toLowerCase() === 'whole place' || 
             property.type?.toLowerCase() === 'apartment' || 
             property.type?.toLowerCase() === 'house')) ||
          (categoryLower === 'co-living' && 
            (property.type?.toLowerCase() === 'co-living' || 
             property.type?.toLowerCase().includes('coliving') || 
             property.type?.toLowerCase().includes('co-living'))) ||
          (categoryLower === 'rv space' && 
            (property.type?.toLowerCase().includes('rv') || 
             property.type?.toLowerCase().includes('recreational vehicle')))
        );
      });
    }

    // Filter by city
    if (activeFilters.city.trim()) {
      filtered = filtered.filter(property => 
        property.cities?.toLowerCase().includes(activeFilters.city.toLowerCase()) ||
        (typeof property.location === 'string' && property.location.toLowerCase().includes(activeFilters.city.toLowerCase()))
      );
    }

    // Filter by state
    if (activeFilters.state.trim()) {
      filtered = filtered.filter(property => 
        property.state?.toLowerCase().includes(activeFilters.state.toLowerCase())
      );
    }

    // Filter by zip code
    if (activeFilters.zipCode.trim()) {
      filtered = filtered.filter(property => 
        property.zipCode?.includes(activeFilters.zipCode)
      );
    }

    // Filter by price range
    if (activeFilters.priceRange[1] < 5000) {
      filtered = filtered.filter(property => {
        const price = typeof property.price === 'string' 
          ? parseFloat(property.price.replace(/[^0-9.]/g, '')) 
          : property.price;
        return price !== undefined && price <= activeFilters.priceRange[1];
      });
    }

    // Filter by categories
    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(property => 
        activeFilters.categories.some(category => 
          property.category?.toLowerCase().includes(category.toLowerCase()) ||
          property.categories?.toLowerCase().includes(category.toLowerCase()) ||
          property.type?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }
    
    // Additional filters for new fields
    // Filter by bathroom type if added to filter options
    if (activeFilters.bathroomType) {
      filtered = filtered.filter(property => 
        property.bathroomType === activeFilters.bathroomType
      );
    }
    
    // Filter by bedroom count if added to filter options
    if (activeFilters.bedroomCount !== undefined) {
      const minBedroomCount = activeFilters.bedroomCount; // Store in a constant to avoid TS errors
      filtered = filtered.filter(property => 
        property.bedroomCount !== undefined && 
        property.bedroomCount >= minBedroomCount
      );
    }
    
    // Filter by capacity if added to filter options
    if (activeFilters.capacity !== undefined) {
      const minCapacity = activeFilters.capacity; // Store in a constant to avoid TS errors
      filtered = filtered.filter(property => 
        property.capacity !== undefined && 
        property.capacity >= minCapacity
      );
    }

    setFilteredProperties(filtered);
  }, [properties, activeFilters, searchQuery, activeCategory]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      activeFilters.city.trim() !== '' ||
      activeFilters.state.trim() !== '' ||
      activeFilters.zipCode.trim() !== '' ||
      activeFilters.priceRange[1] < 5000 ||
      activeFilters.categories.length > 0 ||
      activeFilters.bathroomType !== undefined ||
      activeFilters.bedroomCount !== undefined ||
      activeFilters.capacity !== undefined
    );
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };
  
  // Clear all filters and search
  const clearAllFilters = () => {
    setActiveFilters({
      city: '',
      state: '',
      zipCode: '',
      priceRange: [0, 5000],
      categories: [],
      // Reset new filter fields
      bathroomType: undefined,
      bedroomCount: undefined,
      capacity: undefined,
    });
    setSearchQuery('');
    setActiveCategory(null);
  };

  return (
    <>
    <Animated.ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: C.screenBg }]}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    > 
      {/* Greeting header */}
      <View style={styles.headerRow}>
        <Text style={[styles.heyText, { color: C.text }]}>Hey, <Text style={{ color: '#3c95a6', fontWeight: '800' }}>{userName}</Text></Text>
        <View style={styles.headerActions}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={[styles.notificationBell, { backgroundColor: C.surface }]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={C.text} />
            {/* Show badge only when there are unread notifications */}
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: C.tint }]}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Sample Data Button (temporary) */}
      {properties.length === 0 && (
        <View style={styles.sampleDataContainer}>
          <Text style={[styles.noDataText, { color: C.textMuted }]}>No properties found. Add some sample data to get started:</Text>
          <TouchableOpacity 
            style={[styles.sampleDataButton, { backgroundColor: C.tint }]} 
            onPress={handleAddSampleData}
            disabled={loadingSampleData}
          >
            <Text style={styles.sampleDataButtonText}>
              {loadingSampleData ? 'Adding...' : 'Add Sample Properties'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
        <AntDesign name="search" size={18} color={C.icon} />
        <TextInput
          placeholder="Search House, Apartment, etc"
          placeholderTextColor={C.placeholder}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          > 
            <AntDesign name="close" size={16} color={C.icon} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={[styles.filterBtn, { 
            backgroundColor: hasActiveFilters() ? C.tint : C.surfaceSoft 
          }]}
          onPress={() => setShowFilterModal(true)}
        > 
          <Ionicons name="filter" size={18} color={hasActiveFilters() ? '#fff' : C.icon} />
        </TouchableOpacity>
      </View>

      {/* Category chips in grid layout */}
      <View style={styles.filtersContainer}>
        <View style={styles.chipsGrid}>
          {categories.slice(0, 3).map((c) => (
            <TouchableOpacity 
              key={c.name} 
              style={[styles.chip, { 
                backgroundColor: activeCategory === c.name ? C.tint : C.surface, 
                borderColor: activeCategory === c.name ? C.tint : C.surfaceBorder 
              }]} 
              onPress={() => {
                if (activeCategory === c.name) {
                  setActiveCategory(null); // Deselect if already selected
                } else {
                  setActiveCategory(c.name); // Select this category
                }
              }}
            > 
              <Ionicons 
                name={c.icon as any} 
                size={16} 
                color={activeCategory === c.name ? '#fff' : C.textMuted} 
                style={styles.chipIcon} 
              />
              <Text style={[styles.chipText, { 
                color: activeCategory === c.name ? '#fff' : C.textMuted 
              }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.chipsGrid}>
          {categories.slice(3).map((c) => (
            <TouchableOpacity 
              key={c.name} 
              style={[styles.chip, { 
                backgroundColor: activeCategory === c.name ? C.tint : C.surface, 
                borderColor: activeCategory === c.name ? C.tint : C.surfaceBorder 
              }]} 
              onPress={() => {
                if (activeCategory === c.name) {
                  setActiveCategory(null); // Deselect if already selected
                } else {
                  setActiveCategory(c.name); // Select this category
                }
              }}
            > 
              <Ionicons 
                name={c.icon as any} 
                size={16} 
                color={activeCategory === c.name ? '#fff' : C.textMuted} 
                style={styles.chipIcon} 
              />
              <Text style={[styles.chipText, { 
                color: activeCategory === c.name ? '#fff' : C.textMuted 
              }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Clear filters button */}
          {(searchQuery || activeCategory || hasActiveFilters()) && (
            <TouchableOpacity 
              style={[styles.clearFiltersBtn, { 
                borderColor: C.tint,
                backgroundColor: activeCategory ? 'rgba(60, 149, 166, 0.1)' : 'transparent'
              }]}
              onPress={clearAllFilters}
            >
              <Text style={[styles.clearFiltersBtnText, { 
                color: C.tint,
                fontWeight: activeCategory ? '700' : '600'
              }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* No results message when search is active but no properties found */}
      {isSearchActive() && filteredProperties.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color={C.textMuted} />
          <Text style={[styles.noResultsTitle, { color: C.text }]}>No properties found</Text>
          <Text style={[styles.noResultsMessage, { color: C.textMuted }]}>
            Try adjusting your search or filters
          </Text>
          <TouchableOpacity 
            style={[styles.clearFiltersBtn, { borderColor: C.tint, marginTop: 16 }]}
            onPress={clearAllFilters}
          >
            <Text style={[styles.clearFiltersBtnText, { color: C.tint }]}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Properties Section - Only show when search is not active */}
      {!isSearchActive() && (
        <>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.heyText, { color: C.text }]}>Featured Properties</Text>
            <Text style={[styles.resultsCount, { color: C.textMuted }]}>
              {filteredProperties.length} results
            </Text>
          </View>

          {filteredProperties.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color={C.textMuted} />
              <Text style={[styles.noResultsTitle, { color: C.text }]}>No properties found</Text>
              <Text style={[styles.noResultsMessage, { color: C.textMuted }]}>
                Try adjusting your search or filters
              </Text>
              <TouchableOpacity 
                style={[styles.clearFiltersBtn, { borderColor: C.tint, marginTop: 16 }]}
                onPress={clearAllFilters}
              >
                <Text style={[styles.clearFiltersBtnText, { color: C.tint }]}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {filteredProperties.slice(0, 10).map((item, index) => (
              <Animated.View 
                key={`featured-${item.id}`}
                style={{
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: Animated.multiply(slideAnim, new Animated.Value(index * 0.5 + 1)) }]
                }}
              >
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={[styles.featureCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
                  onPress={() => router.push(`/property/details?id=${item.id}`)}> 
                  <RemoteImage uri={item.imageUrl ?? null} style={styles.photo} borderRadius={16}>
                    {!!item.type && (
                      <View style={[styles.badge, { backgroundColor: '#3c95a6' }]}>
                        <Text style={[styles.badgeText, { color: '#ffffff' }]}>{String(item.type)}</Text>
                      </View>
                    )}
                  </RemoteImage>
                  <View style={styles.featureMeta}>
                    <Text style={[styles.listingTitle, { color: C.text }]}>{String(item.title || 'Untitled')}</Text>
                    <View style={styles.metaRow}>
                      <MaterialIcons name="location-on" size={14} color="#666" />
                      <Text style={[styles.metaText, { color: C.textMuted }]}>{getLocationDisplay(item)}</Text>
                      <TouchableOpacity
                        style={styles.heartButton}
                        activeOpacity={0.8}
                        onPress={() => handleToggleFavorite(item)}
                      >
                        <AntDesign
                          name={favoritedProperties.has(item.id) ? "heart" : "hearto"}
                          size={18}
                          color={favoritedProperties.has(item.id) ? "#FF6B9D" : "#3c95a6"}
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Property details row */}
                    <View style={styles.detailsRow}>
                      {item.bedroomCount !== undefined && (
                        <View style={styles.detailItem}>
                          <Ionicons name="bed-outline" size={14} color={C.textMuted} />
                          <Text style={[styles.detailText, { color: C.textMuted }]}>{item.bedroomCount} {item.bedroomCount === 1 ? 'bed' : 'beds'}</Text>
                        </View>
                      )}
                      
                      {item.BathRoomCount !== undefined && (
                        <View style={styles.detailItem}>
                          <Ionicons name="water-outline" size={14} color={C.textMuted} />
                          <Text style={[styles.detailText, { color: C.textMuted }]}>{item.BathRoomCount} {item.BathRoomCount === 1 ? 'bath' : 'baths'}</Text>
                        </View>
                      )}
                      
                      {item.capacity !== undefined && (
                        <View style={styles.detailItem}>
                          <Ionicons name="people-outline" size={14} color={C.textMuted} />
                          <Text style={[styles.detailText, { color: C.textMuted }]}>{item.capacity} {item.capacity === 1 ? 'guest' : 'guests'}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.priceRow}>
                      <Text style={[styles.rentLabel, { color: C.textMuted }]}>Rent</Text>
                      {item.price !== undefined && (
                        <Text style={[styles.priceText, { color: C.text }]}>
                          <Text style={{ color: C.accent2, fontWeight: '800' }}>
                            ${typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '') || '0')}
                          </Text>
                          <Text style={{ fontSize: 12, color: C.textMuted }}> / month</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* New Hosts - Only show when search is not active */}
      {!isSearchActive() && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>New Hosts</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAll, { color: C.tint }]}>view all</Text></TouchableOpacity>
          </View>
          
          {hostsLoading ? (
            <View style={[styles.loadingContainer, { paddingVertical: 20 }]}>
              <ActivityIndicator size="small" color={C.tint} />
              <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading hosts...</Text>
            </View>
          ) : (
            <FlatList
              data={hosts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.hostCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/host/[id]', params: { id: item.id } })}
                > 
                  {item.photoURL ? (
                    <Image 
                      source={{ uri: item.photoURL }} 
                      style={styles.hostAvatar} 
                    />
                  ) : (
                    <View style={[styles.hostAvatar, { backgroundColor: C.tint }]}>
                      <Text style={styles.hostAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hostName, { color: C.text }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.hostRatingRow}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={[styles.hostRating, { color: C.textMuted }]}>{item.rating}</Text>
                      <Text style={[styles.hostListings, { color: C.textMuted }]}>· {item.listingsCount} listing{item.listingsCount !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Listings */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>{isSearchActive() ? 'Search Results' : 'Listings'}</Text>
        {!isSearchActive() && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/viewlisting')}>
            <Text style={[styles.viewAll, { color: C.tint }]}>View all</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading properties...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={{ color: C.textMuted, paddingHorizontal: 16 }}>No properties found.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredProperties.map((l) => (
            <TouchableOpacity 
              key={`grid-${l.id}`} 
              activeOpacity={0.9} 
              style={[styles.gridCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
              onPress={() => router.push(`/property/details?id=${l.id}`)}> 
              <RemoteImage uri={l.imageUrl ?? null} style={styles.gridPhoto}>
                {l.categories && (
                  <View style={[styles.badgeSmall, { backgroundColor: '#3c95a6' }]}>
                    <Text style={[styles.badgeTextSmall, { color: '#ffffff' }]}>{l.categories}</Text>
                  </View>
                )}
              </RemoteImage>
              <Text numberOfLines={1} style={[styles.gridTitle, { color: C.text }]}>{String(l.title || 'Untitled')}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={C.icon} />
                <Text style={[styles.metaText, { color: C.textMuted }]}>{getLocationDisplay(l)}</Text>
                <TouchableOpacity
                  style={styles.heartButtonSmall}
                  activeOpacity={0.8}
                  onPress={() => handleToggleFavorite(l)}
                >
                  <AntDesign
                    name={favoritedProperties.has(l.id) ? "heart" : "hearto"}
                    size={14}
                    color={favoritedProperties.has(l.id) ? "#FF6B9D" : "#3c95a6"}
                  />
                </TouchableOpacity>
              </View>
              
              {/* Grid card details */}
              <View style={styles.gridDetailsRow}>
                {l.bedroomCount !== undefined && (
                  <View style={styles.gridDetailItem}>
                    <Ionicons name="bed-outline" size={12} color={C.textMuted} />
                    <Text style={[styles.gridDetailText, { color: C.textMuted }]}>{l.bedroomCount}</Text>
                  </View>
                )}
                
                {l.BathRoomCount !== undefined && (
                  <View style={styles.gridDetailItem}>
                    <Ionicons name="water-outline" size={12} color={C.textMuted} />
                    <Text style={[styles.gridDetailText, { color: C.textMuted }]}>{l.BathRoomCount}</Text>
                  </View>
                )}
                
                {l.capacity !== undefined && (
                  <View style={styles.gridDetailItem}>
                    <Ionicons name="people-outline" size={12} color={C.textMuted} />
                    <Text style={[styles.gridDetailText, { color: C.textMuted }]}>{l.capacity}</Text>
                  </View>
                )}
                
                {l.price !== undefined && (
                  <Text style={[styles.gridPrice, { color: C.accent2 }]}>
                    ${typeof l.price === 'number' ? l.price : parseInt(String(l.price).replace(/[^0-9]/g, '') || '0')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Extra padding at bottom to account for floating tab bar */}
      <View style={{ height: 30 }} />
    </Animated.ScrollView>

    {/* Filter Modal */}
    <FilterModal
      visible={showFilterModal}
      onClose={() => setShowFilterModal(false)}
      onApplyFilters={handleApplyFilters}
      initialFilters={activeFilters}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90, // Add padding for floating tab bar + safe area
  },
  // New styles for property details
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  gridDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  gridDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridDetailText: {
    fontSize: 10,
    fontWeight: '500',
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  heyText: {
    fontSize: 22,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 'auto',
  },
  heartButtonSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rentLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    height: 40,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  filterBtn: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  clearFiltersBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  resultsCount: {
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minWidth: 95,
    maxWidth: 115,
    flexDirection: 'row',
    gap: 4,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontWeight: '400',
    fontSize: 12,
  },
  featuredRow: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 10,
  },
  featureCard: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photo: {
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'flex-end',
    padding: 10,
    overflow: 'hidden',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureMeta: {
    padding: 12,
    gap: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  metaText: {
    fontSize: 12,
  },
  priceText: {
    marginTop: 2,
    fontWeight: '600',
  },
  // Removed likeBubble style as we're using heartButtonSmall instead
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAll: {
    fontWeight: '700',
  },
  hostCard: {
    width: 220,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hostName: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  hostRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostRating: {
    fontSize: 13,
  },
  hostListings: {
    fontSize: 13,
  },
  grid: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  gridPhoto: {
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
  },
  gridTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  gridLikeBubble: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleDataContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  sampleDataButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sampleDataButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
