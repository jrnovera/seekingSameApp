import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Easing,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { auth, db } from '@/config/firebase';
// Only using collection from firestore
import { collection } from 'firebase/firestore';
// RemoteImage is not used in this file
// import RemoteImage from '@/components/remote-image';
import FilterModal, { FilterOptions } from '@/components/FilterModal';
import CommentsModal from '@/components/CommentsModal';
import UserProfile from '@/components/UserProfile';

type ListingType = 'room' | 'roommate' | 'apartment';

interface CommunityListing {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description?: string;
  location: string;
  price: number | string;
  type: ListingType;
  imageUrl?: string;
  createdAt: Date;
  likes?: number;
  comments?: number;
}

export default function Community() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  
  const [listings, setListings] = useState<CommunityListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CommunityListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ListingType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [likedListings, setLikedListings] = useState<Set<string>>(new Set());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CommunityListing | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CommunityListing | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Filter options
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    city: '',
    state: '',
    zipCode: '',
    priceRange: [0, 5000],
    categories: [],
  });

  // Sample data for development
  const sampleListings: CommunityListing[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Sophia Bennett',
      userPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
      title: 'Spacious room in sunny apartment',
      location: 'Downtown, San Francisco',
      price: '$1,500/month',
      type: 'room',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      createdAt: new Date(),
      likes: 32,
      comments: 5
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Ethan Carter',
      userPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
      title: 'Seeking a clean & quiet roommate',
      location: 'Hayes District, San Francisco',
      price: '$1,200/month',
      type: 'roommate',
      createdAt: new Date(),
      likes: 45,
      comments: 12
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Olivia Davis',
      userPhoto: 'https://randomuser.me/api/portraits/women/65.jpg',
      title: 'Cozy room in a quiet neighborhood',
      location: 'Sunset District, San Francisco',
      price: '$1,350/month',
      type: 'room',
      imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d',
      createdAt: new Date(),
      likes: 52,
      comments: 8
    },
    {
      id: '4',
      userId: 'user4',
      userName: 'James Wilson',
      userPhoto: 'https://randomuser.me/api/portraits/men/45.jpg',
      title: 'Looking for 2 roommates for new apartment',
      location: 'Mission District, San Francisco',
      price: '$1,100/month',
      type: 'roommate',
      createdAt: new Date(),
      likes: 28,
      comments: 6
    },
    {
      id: '5',
      userId: 'user5',
      userName: 'Emma Thompson',
      userPhoto: 'https://randomuser.me/api/portraits/women/22.jpg',
      title: 'Modern apartment with great view',
      location: 'Nob Hill, San Francisco',
      price: '$2,800/month',
      type: 'apartment',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
      createdAt: new Date(),
      likes: 67,
      comments: 15
    },
  ];

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
      })
    ]).start();
  }, []);

  // Load listings
  useEffect(() => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch from Firestore
      // For now, use sample data
      setListings(sampleListings);
      setFilteredListings(sampleListings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters when they change
  useEffect(() => {
    let filtered = listings;

    // Apply type filter
    if (activeFilter) {
      filtered = filtered.filter(listing => listing.type === activeFilter);
    }

    // Apply other filters
    if (activeFilters.city.trim()) {
      filtered = filtered.filter(listing => 
        listing.location.toLowerCase().includes(activeFilters.city.toLowerCase())
      );
    }

    // Apply price filter if not at max
    if (activeFilters.priceRange[1] < 5000) {
      filtered = filtered.filter(listing => {
        // Extract numeric price value
        const priceValue = typeof listing.price === 'string' 
          ? parseFloat(listing.price.replace(/[^0-9.]/g, '')) 
          : listing.price;
        
        return priceValue <= activeFilters.priceRange[1];
      });
    }

    setFilteredListings(filtered);
  }, [listings, activeFilter, activeFilters]);

  const handleToggleLike = (listingId: string) => {
    setLikedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const handleMessage = (listing: CommunityListing) => {
    // Navigate to chat with this user
    router.push({
      pathname: '/(tabs)/chat',
      // In a real app, you would pass the user ID as a parameter
      // For now, just navigate to the chat tab
    });
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  const renderListingItem = ({ item }: { item: CommunityListing }) => {
    const isLiked = likedListings.has(item.id);

    return (
      <View style={[styles.listingCard, { backgroundColor: C.screenBg }]}>
        {/* User info row */}
        <View style={styles.userInfoRow}>
          <TouchableOpacity
            onPress={() => {
              setSelectedUser(item);
              setShowUserProfile(true);
            }}
          >
            {item.userPhoto ? (
              <Image source={{ uri: item.userPhoto }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: C.tint }]}>
                <Text style={styles.userInitial}>{item.userName.charAt(0)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: C.text }]}>{item.userName}</Text>
            <Text style={[styles.listingType, { color: C.textMuted }]}>
              {item.type === 'roommate' ? 'Looking for Roommate' : 
               item.type === 'room' ? 'Room Available' : 'Apartment'}
            </Text>
          </View>
          <Text style={[styles.timeAgo, { color: C.textMuted }]}>11 days</Text>
        </View>

        {/* Listing title */}
        <Text style={[styles.listingTitle, { color: C.text }]}>{item.title}</Text>

        {/* Location and details row */}
        <View style={styles.detailsRow}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={C.textMuted} />
            <Text style={[styles.locationText, { color: C.textMuted }]}>{item.location}</Text>
          </View>
        </View>

        {/* Price */}
        <Text style={[styles.priceText, { color: C.text }]}>{item.price}</Text>

        {/* Bedroom count if available */}
        {item.type !== 'roommate' && (
          <View style={styles.bedroomRow}>
            <Ionicons name="bed-outline" size={14} color={C.textMuted} />
            <Text style={[styles.bedroomText, { color: C.textMuted }]}>
              {item.type === 'room' ? '1 bedroom total' : '2 bedrooms total'}
            </Text>
          </View>
        )}

        {/* Listing image if available */}
        {item.imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.listingImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleToggleLike(item.id)}
          >
            <AntDesign 
              name={isLiked ? "heart" : "heart"} 
              size={20} 
              color={isLiked ? "#FF4B4B" : C.textMuted} 
            />
            <Text style={[styles.actionText, { color: C.textMuted }]}>
              {item.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedListing(item);
              setShowCommentsModal(true);
            }}
          >
            <AntDesign name="message" size={20} color={C.textMuted} />
            <Text style={[styles.actionText, { color: C.textMuted }]}>
              {item.comments || 0}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity 
            style={[styles.messageButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => handleMessage(item)}
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the list of listings
  const renderListings = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading listings...</Text>
        </View>
      );
    }
    
    if (filteredListings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyText, { color: C.text }]}>No listings found</Text>
          <Text style={[styles.emptySubtext, { color: C.textMuted }]}>Try selecting a different category</Text>
        </View>
      );
    }
    
    return filteredListings.map(item => (
      <View key={item.id}>
        {renderListingItem({ item })}
      </View>
    ));
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: C.screenBg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: C.screenBg }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Community</Text>
        </View>

        {/* Filter chips */}
        <View style={styles.filterChips}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { 
                backgroundColor: activeFilter === null ? C.tint : C.surface,
                borderColor: activeFilter === null ? C.tint : C.surfaceBorder 
              }
            ]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === null ? '#fff' : C.text }]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { 
                backgroundColor: activeFilter === 'room' ? C.tint : C.surface,
                borderColor: activeFilter === 'room' ? C.tint : C.surfaceBorder 
              }
            ]}
            onPress={() => setActiveFilter('room')}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === 'room' ? '#fff' : C.text }]}>Rooms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { 
                backgroundColor: activeFilter === 'roommate' ? C.tint : C.surface,
                borderColor: activeFilter === 'roommate' ? C.tint : C.surfaceBorder 
              }
            ]}
            onPress={() => setActiveFilter('roommate')}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === 'roommate' ? '#fff' : C.text }]}>Roommates</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { 
                backgroundColor: activeFilter === 'apartment' ? C.tint : C.surface,
                borderColor: activeFilter === 'apartment' ? C.tint : C.surfaceBorder 
              }
            ]}
            onPress={() => setActiveFilter('apartment')}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === 'apartment' ? '#fff' : C.text }]}>Apartments</Text>
          </TouchableOpacity>
        </View>

        {/* Listings */}
        <View style={styles.listingsContainer}>
          {renderListings()}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />

      {/* Comments Modal */}
      {selectedListing && (
        <CommentsModal
          visible={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          listingId={selectedListing.id}
          listingTitle={selectedListing.title}
          listingImage={selectedListing.imageUrl}
          listingDescription={selectedListing.description}
          userName={selectedListing.userName}
          userPhoto={selectedListing.userPhoto}
        />
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfile
          visible={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUser.userId}
          userName={selectedUser.userName}
          userPhoto={selectedUser.userPhoto}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Account for status bar
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra padding at bottom for tab bar
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listingsContainer: {
    paddingHorizontal: 20,
  },
  listingCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  listingType: {
    fontSize: 13,
    marginTop: 1,
  },
  timeAgo: {
    fontSize: 13,
    fontWeight: '400',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
  },
  bedroomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bedroomText: {
    fontSize: 13,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imageContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
  },
  spacer: {
    flex: 1,
  },
  messageButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  messageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
