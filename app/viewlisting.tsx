import FilterModal, { FilterOptions } from '@/components/FilterModal'
import RemoteImage from '@/components/remote-image'
import { db } from '@/config/firebase'
import { AntDesign, Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { collection, getDocs, query } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

type Property = {
  id: string;
  title?: string;
  imageUrl?: string | null;
  price?: string | number;
  location?: string;
  cities?: string;
  address?: any;
  state?: string;
  zipCode?: string;
  bedroomCount?: number;
  BathRoomCount?: number;
  type?: string;
};

const ViewListing = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    city: '',
    state: '',
    zipCode: '',
    priceRange: [0, 5000],
    categories: [],
    bathroomType: undefined,
    bedroomCount: undefined,
    capacity: undefined,
  })

  // Fetch all properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'property'))
        const snapshot = await getDocs(q)
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || data.name || 'Untitled',
            imageUrl: data.imageUrl || data.photo || null,
            price: data.price || data.rent,
            location: data.location,
            cities: data.city || data.cities,
            address: data.address,
            state: data.state,
            zipCode: data.zipCode,
            bedroomCount: data.bedroomCount,
            BathRoomCount: data.BathRoomCount || data.bathroomCount,
            type: data.type || data.category
          } as Property
        })
        
        setProperties(items)
        setFilteredProperties(items)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProperties()
  }, [])

  // Apply search and filters
  useEffect(() => {
    let filtered = properties;
    
    // Apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        (typeof property.location === 'string' && property.location.toLowerCase().includes(query)) ||
        property.cities?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.zipCode?.includes(query) ||
        property.type?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (activeFilters.city.trim()) {
      filtered = filtered.filter(property => 
        property.cities?.toLowerCase().includes(activeFilters.city.toLowerCase())
      );
    }

    if (activeFilters.state.trim()) {
      filtered = filtered.filter(property => 
        property.state?.toLowerCase().includes(activeFilters.state.toLowerCase())
      );
    }

    if (activeFilters.zipCode.trim()) {
      filtered = filtered.filter(property => 
        property.zipCode?.includes(activeFilters.zipCode)
      );
    }

    if (activeFilters.priceRange[1] < 5000) {
      filtered = filtered.filter(property => {
        const price = typeof property.price === 'string' 
          ? parseFloat(property.price.replace(/[^0-9.]/g, '')) 
          : property.price;
        return price !== undefined && price <= activeFilters.priceRange[1];
      });
    }

    if (activeFilters.bedroomCount !== undefined) {
      filtered = filtered.filter(property => 
        property.bedroomCount !== undefined && 
        property.bedroomCount >= (activeFilters.bedroomCount || 0)
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, activeFilters]);

  // Handle filter application
  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

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

  // Clear all filters and search
  const clearAllFilters = () => {
    setActiveFilters({
      city: '',
      state: '',
      zipCode: '',
      priceRange: [0, 5000],
      categories: [],
      bathroomType: undefined,
      bedroomCount: undefined,
      capacity: undefined,
    });
    setSearchQuery('');
  };

  // Helper function to format location display
  const getLocationDisplay = (property: Property): string => {
    if (typeof property.cities === 'string' && property.cities.trim() !== '') {
      return property.cities
    }
    
    if (property.address && typeof property.address === 'object') {
      const addr = property.address
      if (addr.city) {
        if (addr.state) {
          return `${addr.city}, ${addr.state}`
        }
        return addr.city
      }
      
      const addressParts = []
      if (addr.street) addressParts.push(addr.street)
      if (addr.unit) addressParts.push(addr.unit)
      if (addr.state) addressParts.push(addr.state)
      if (addr.zipCode) addressParts.push(addr.zipCode)
      
      if (addressParts.length > 0) {
        return addressParts.join(', ')
      }
    }
    
    const formattedLocation = `${property.state || ''} ${property.zipCode || ''}`.trim()
    if (formattedLocation) {
      return formattedLocation
    }
    
    if (typeof property.location === 'string' && property.location.trim() !== '') {
      return property.location
    }
    
    return 'Location not available'
  }

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/property/details?id=${item.id}`)}
    >
      <RemoteImage 
        uri={item.imageUrl} 
        style={styles.propertyImage} 
        borderRadius={8}
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.propertyLocation} numberOfLines={1}>{getLocationDisplay(item)}</Text>
        
        <View style={styles.propertyDetails}>
          {item.bedroomCount !== undefined && (
            <Text style={styles.propertyDetail}>{item.bedroomCount} bed{item.bedroomCount !== 1 ? 's' : ''}</Text>
          )}
          {item.BathRoomCount !== undefined && (
            <Text style={styles.propertyDetail}>{item.BathRoomCount} bath{item.BathRoomCount !== 1 ? 's' : ''}</Text>
          )}
          {item.type && (
            <Text style={styles.propertyDetail}>{item.type}</Text>
          )}
        </View>
        
        {item.price !== undefined && (
          <Text style={styles.propertyPrice}>
            ${typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '') || '0')}/mo
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Listings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <AntDesign name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <AntDesign name="close" size={16} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters() && styles.activeFilterButton]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters() ? "#fff" : "#666"} />
        </TouchableOpacity>
      </View>
      
      {/* Active Filters Indicator */}
      {hasActiveFilters() && (
        <View style={styles.filtersAppliedContainer}>
          <Text style={styles.filtersAppliedText}>Filters applied</Text>
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3c95a6" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No properties found</Text>
          {searchQuery || hasActiveFilters() ? (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          renderItem={renderPropertyItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </View>
  )
}

export default ViewListing

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  // Search and filter styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  activeFilterButton: {
    backgroundColor: '#3c95a6',
    borderColor: '#3c95a6',
  },
  filtersAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersAppliedText: {
    fontSize: 14,
    color: '#3c95a6',
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3c95a6',
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#3c95a6',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    height: 180,
    width: '100%',
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyDetail: {
    fontSize: 13,
    color: '#666',
    marginRight: 12,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3c95a6',
  },
})