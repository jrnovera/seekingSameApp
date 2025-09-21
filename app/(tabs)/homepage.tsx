import FilterModal, { FilterOptions } from '@/components/FilterModal';
import RemoteImage from '@/components/remote-image';
import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { addSampleProperties } from '@/utils/sampleData';
import {
    FlatList,
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
};

export default function Homepage() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const categories = ['Room', 'Whole place', 'Co-living', 'Co-housing', 'RV Space', 'Other Type'];
  const hosts = [
    { id: '1', name: 'newuser', price: '$300/ month' },
    { id: '2', name: 'sally', price: '$320/ month' },
    { id: '3', name: 'james', price: '$280/ month' },
  ];
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    city: '',
    state: '',
    zipCode: '',
    priceRange: [0, 5000],
    categories: [],
  });
  const [loadingSampleData, setLoadingSampleData] = useState(false);

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

  useEffect(() => {
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
          title: data.title ?? data.name ?? 'Untitled',
          location: data.location ?? data.city ?? data.address ?? 'Unknown',
          price: data.price ?? data.rent ?? undefined,
          type: data.type ?? data.category ?? undefined,
          imageUrl: data.imageUrl ?? data.imageURL ?? data.photoUrl ?? data.photoURL ?? null,
          city: data.city ?? undefined,
          state: data.state ?? undefined,
          zipCode: data.zipCode ?? data.zip ?? undefined,
          category: data.category ?? data.type ?? undefined,
          latitude,
          longitude,
        };
        
        // Debug logging
        console.log('Property loaded:', property.title, 'Image URL:', property.imageUrl);
        
        return property;
      });
      setProperties(items);
      // Initialize filtered properties if no filters are active
      if (!activeFilters.city && !activeFilters.state && !activeFilters.zipCode && 
          activeFilters.priceRange[1] >= 5000 && activeFilters.categories.length === 0) {
        setFilteredProperties(items);
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply filters whenever properties or activeFilters change
  useEffect(() => {
    let filtered = properties;

    // Filter by city
    if (activeFilters.city.trim()) {
      filtered = filtered.filter(property => 
        property.city?.toLowerCase().includes(activeFilters.city.toLowerCase()) ||
        property.location?.toLowerCase().includes(activeFilters.city.toLowerCase())
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
          property.type?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    setFilteredProperties(filtered);
  }, [properties, activeFilters]);

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  return (
    <>
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: C.screenBg }]}> 
      {/* Greeting header */}
      <View style={styles.headerRow}>
        <Text style={[styles.heyText, { color: C.text }]}>Hey, <Text style={{ color: C.tint, fontWeight: '800' }}>sample</Text></Text>
        <View style={[styles.avatar, { backgroundColor: C.tint }]} />
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
        />
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={[styles.filterBtn, { backgroundColor: C.surfaceSoft }]}
          onPress={() => setShowFilterModal(true)}
        > 
          <Ionicons name="filter" size={18} color={C.icon} />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <View style={styles.chipsWrap}>
        {categories.map((c) => (
          <View key={c} style={[styles.chip, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
            <Text style={[styles.chipText, { color: C.textMuted }]}>{c}</Text>
          </View>
        ))}
      </View>

      {/* Featured horizontal card */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
        {filteredProperties.length > 0 && filteredProperties.slice(0, 10).map((item) => (
          <TouchableOpacity 
            key={`featured-${item.id}`} 
            activeOpacity={0.9} 
            style={[styles.featureCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
            onPress={() => router.push({pathname: '/property/details', params: {id: item.id}})}> 
            <RemoteImage uri={item.imageUrl ?? null} style={styles.photo} borderRadius={0}>
              {!!item.type && (
                <View style={[styles.badge, { backgroundColor: C.accent2 }]}>
                  <Text style={[styles.badgeText, { color: '#ffffff' }]}>{String(item.type)}</Text>
                </View>
              )}
            </RemoteImage>
            <View style={styles.featureMeta}>
              <Text style={[styles.listingTitle, { color: C.text }]}>{String(item.title || 'Untitled')}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={C.icon} />
                <Text style={[styles.metaText, { color: C.textMuted }]}>{String(item.location || 'Unknown')}</Text>
              </View>
              {item.price !== undefined && (
                <Text style={[styles.priceText, { color: C.text }]}>Rent <Text style={{ color: C.accent2, fontWeight: '800' }}>{typeof item.price === 'number' ? `$${item.price}` : String(item.price)}</Text></Text>
              )}
            </View>
            <TouchableOpacity style={[styles.likeBubble, { backgroundColor: C.tint }]} activeOpacity={0.8}>
              <AntDesign name="heart" size={14} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Hosts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>New Hosts</Text>
        <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAll, { color: C.tint }]}>view all</Text></TouchableOpacity>
      </View>
      <FlatList
        data={hosts}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.hostCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
            <View style={[styles.hostAvatar, { backgroundColor: C.tint }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.hostName, { color: C.text }]}>{item.name}</Text>
              <Text style={[styles.hostPrice, { color: C.textMuted }]}>{item.price}</Text>
            </View>
          </View>
        )}
      />

      {/* Listings */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Listings</Text>
        <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAll, { color: C.tint }]}>View all</Text></TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {filteredProperties.length === 0 ? (
          <Text style={{ color: C.textMuted, paddingHorizontal: 16 }}>No properties found.</Text>
        ) : (
          filteredProperties.map((l) => (
            <TouchableOpacity 
              key={`grid-${l.id}`} 
              activeOpacity={0.9} 
              style={[styles.gridCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
              onPress={() => router.push({pathname: '/property/details', params: {id: l.id}})}> 
              <RemoteImage uri={l.imageUrl ?? null} style={styles.gridPhoto} />
              <Text numberOfLines={1} style={[styles.gridTitle, { color: C.text }]}>{String(l.title || 'Untitled')}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={C.icon} />
                <Text style={[styles.metaText, { color: C.textMuted }]}>{String(l.location || 'Unknown')}</Text>
              </View>
              <View style={[styles.gridLikeBubble, { backgroundColor: C.tint }]}>
                <Ionicons name="heart-outline" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>

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
    paddingTop: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  avatar: {
    height: 34,
    width: 34,
    borderRadius: 17,
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
  },
  filterBtn: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '600',
  },
  featuredRow: {
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 10,
  },
  featureCard: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  photo: {
    height: 120,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    justifyContent: 'flex-end',
    padding: 10,
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
  },
  metaText: {
    fontSize: 12,
  },
  priceText: {
    marginTop: 2,
    fontWeight: '600',
  },
  likeBubble: {
    position: 'absolute',
    top: 8,
    left: 8,
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  hostName: {
    fontWeight: '700',
  },
  hostPrice: {
    marginTop: 2,
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
