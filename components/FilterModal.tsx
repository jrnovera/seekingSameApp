import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  PanResponder,
  Animated,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
// Using built-in components instead of external slider

export interface FilterOptions {
  city: string;
  state: string;
  zipCode: string;
  priceRange: [number, number];
  categories: string[];
  // New fields from the property schema
  bathroomType?: string;
  bedroomCount?: number;
  capacity?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
}

const CATEGORIES = ['Room', 'Whole place', 'Co-living', 'Co-housing', 'RV Space', 'Other Type'];
const MIN_PRICE = 1;
const MAX_PRICE = 5000;
const STEP = 2; // Price increments by 2

export default function FilterModal({ 
  visible, 
  onClose, 
  onApplyFilters, 
  initialFilters = {} 
}: FilterModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const [city, setCity] = useState(initialFilters.city || '');
  const [state, setState] = useState(initialFilters.state || '');
  const [zipCode, setZipCode] = useState(initialFilters.zipCode || '');
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters.priceRange || [MIN_PRICE, MAX_PRICE]
  );
  
  // Animation value for the slider
  const sliderPosition = useRef(new Animated.Value(
    initialFilters.priceRange ? 
    (initialFilters.priceRange[1] / MAX_PRICE) * 100 : 
    100
  )).current;
  
  // Calculate the width of the slider track
  const [sliderWidth, setSliderWidth] = useState(0);
  
  // Create pan responder for slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (sliderWidth <= 0) return;
        
        // Calculate percentage based on gesture
        let newPosition = (gestureState.moveX / sliderWidth) * 100;
        
        // Clamp between 0 and 100
        newPosition = Math.max(0, Math.min(100, newPosition));
        
        // Update the slider position
        sliderPosition.setValue(newPosition);
        
        // Calculate the price based on position percentage
        const rawPrice = MIN_PRICE + ((MAX_PRICE - MIN_PRICE) * (newPosition / 100));
        
        // Round to nearest step
        const steppedPrice = Math.round(rawPrice / STEP) * STEP;
        
        // Update price range
        setPriceRange([MIN_PRICE, Math.max(MIN_PRICE, steppedPrice)]);
      },
      onPanResponderRelease: () => {}
    })
  ).current;
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || []
  );
  
  // New state for additional filters
  const [bathroomType, setBathroomType] = useState<string | undefined>(
    initialFilters.bathroomType
  );
  const [bedroomCount, setBedroomCount] = useState<number | undefined>(
    initialFilters.bedroomCount
  );
  const [capacity, setCapacity] = useState<number | undefined>(
    initialFilters.capacity
  );

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearAll = () => {
    setCity('');
    setState('');
    setZipCode('');
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSelectedCategories([]);
    // Reset new filters
    setBathroomType(undefined);
    setBedroomCount(undefined);
    setCapacity(undefined);
    // Reset slider position
    sliderPosition.setValue(100);
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      priceRange,
      categories: selectedCategories,
      // Include new filter fields
      bathroomType,
      bedroomCount,
      capacity,
    };
    onApplyFilters(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: C.screenBg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>Filter Properties</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* City */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>City</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: C.surface, 
                borderColor: C.surfaceBorder,
                color: C.text 
              }]}
              placeholder="Enter city name"
              placeholderTextColor={C.placeholder}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* State */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>State</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: C.surface, 
                borderColor: C.surfaceBorder,
                color: C.text 
              }]}
              placeholder="Enter state"
              placeholderTextColor={C.placeholder}
              value={state}
              onChangeText={setState}
            />
          </View>

          {/* Zip Code */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>Zip Code</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: C.surface, 
                borderColor: C.surfaceBorder,
                color: C.text 
              }]}
              placeholder="Enter zip code"
              placeholderTextColor={C.placeholder}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: C.text }]}>Price Range</Text>
              <Text style={[styles.priceText, { color: C.textMuted }]}>
                ${priceRange[0]} - ${priceRange[1] === MAX_PRICE ? `${MAX_PRICE}+` : priceRange[1]}
              </Text>
            </View>
            
            <View style={styles.priceRangeContainer}>
              {/* Custom Slider */}
              <View 
                style={[styles.sliderTrack, { backgroundColor: C.surfaceBorder }]}
                onLayout={(event) => {
                  // Get the width of the slider track
                  setSliderWidth(event.nativeEvent.layout.width);
                }}
              >
                <Animated.View 
                  style={[
                    styles.sliderFill, 
                    { 
                      backgroundColor: C.tint,
                      width: sliderPosition.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%']
                      })
                    }
                  ]} 
                />
                
                <View 
                  style={styles.sliderTouchArea}
                  {...panResponder.panHandlers}
                />
                
                <Animated.View 
                  style={[
                    styles.sliderThumb, 
                    { 
                      backgroundColor: C.tint,
                      transform: [{
                        translateX: sliderPosition.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0, sliderWidth - 20] // 20 is thumb width
                        })
                      }]
                    }
                  ]}
                />
              </View>
              
              {/* Price Markers */}
              <View style={styles.priceMarkers}>
                <Text style={[styles.markerText, { color: C.textMuted }]}>${MIN_PRICE}</Text>
                <Text style={[styles.markerText, { color: C.textMuted }]}>${MAX_PRICE}+</Text>
              </View>
              
              {/* Quick Select Buttons */}
              <View style={styles.priceButtons}>
                {[500, 1000, 2000, 3000, MAX_PRICE].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.priceButton,
                      {
                        backgroundColor: priceRange[1] === price ? C.tint : C.surface,
                        borderColor: priceRange[1] === price ? C.tint : C.surfaceBorder,
                      }
                    ]}
                    onPress={() => {
                      setPriceRange([MIN_PRICE, price]);
                      // Update slider position
                      const percentage = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
                      sliderPosition.setValue(percentage);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      { color: priceRange[1] === price ? '#ffffff' : C.text }
                    ]}>
                      ${price === MAX_PRICE ? `${price}+` : price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>Category</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? C.tint : C.surface,
                        borderColor: isSelected ? C.tint : C.surfaceBorder,
                      }
                    ]}
                    onPress={() => handleCategoryToggle(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: isSelected ? '#ffffff' : C.text }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Bathroom Type */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>Bathroom Type</Text>
            <View style={styles.categoriesContainer}>
              {['Private', 'Shared', 'Any'].map((type) => {
                const isSelected = bathroomType === type || (type === 'Any' && bathroomType === undefined);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? C.tint : C.surface,
                        borderColor: isSelected ? C.tint : C.surfaceBorder,
                      }
                    ]}
                    onPress={() => setBathroomType(type === 'Any' ? undefined : type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: isSelected ? '#ffffff' : C.text }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Bedroom Count */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>Minimum Bedrooms</Text>
            <View style={styles.categoriesContainer}>
              {['Any', '1+', '2+', '3+', '4+'].map((count) => {
                const value = count === 'Any' ? undefined : parseInt(count);
                const isSelected = 
                  (count === 'Any' && bedroomCount === undefined) || 
                  (value !== undefined && bedroomCount === value);
                  
                return (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? C.tint : C.surface,
                        borderColor: isSelected ? C.tint : C.surfaceBorder,
                      }
                    ]}
                    onPress={() => setBedroomCount(value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: isSelected ? '#ffffff' : C.text }
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          
          {/* Capacity */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: C.text }]}>Minimum Capacity</Text>
            <View style={styles.categoriesContainer}>
              {['Any', '1+', '2+', '4+', '6+'].map((cap) => {
                const value = cap === 'Any' ? undefined : parseInt(cap);
                const isSelected = 
                  (cap === 'Any' && capacity === undefined) || 
                  (value !== undefined && capacity === value);
                  
                return (
                  <TouchableOpacity
                    key={cap}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? C.tint : C.surface,
                        borderColor: isSelected ? C.tint : C.surfaceBorder,
                      }
                    ]}
                    onPress={() => setCapacity(value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryText,
                      { color: isSelected ? '#ffffff' : C.text }
                    ]}>
                      {cap}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: C.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearButtonText, { color: C.text }]}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: C.tint }]}
            onPress={handleApplyFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceRangeContainer: {
    paddingVertical: 8,
  },
  priceText: {
    fontSize: 14,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginVertical: 16,
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -7,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sliderTouchArea: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  priceMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  markerText: {
    fontSize: 12,
  },
  priceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  priceButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
