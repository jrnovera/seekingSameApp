import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
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
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
}

const CATEGORIES = ['Apartment', 'House', 'Condo', 'Townhouse', 'Studio'];
const MAX_PRICE = 5000;

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
    initialFilters.priceRange || [0, MAX_PRICE]
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || []
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
    setPriceRange([0, MAX_PRICE]);
    setSelectedCategories([]);
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      priceRange,
      categories: selectedCategories,
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
            <Text style={[styles.label, { color: C.text }]}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <Text style={[styles.priceText, { color: C.textMuted }]}>
                Up to ${priceRange[1] === MAX_PRICE ? `${MAX_PRICE}+` : priceRange[1]}
              </Text>
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
                    onPress={() => setPriceRange([0, price])}
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
  priceRangeContainer: {
    paddingVertical: 8,
  },
  priceText: {
    fontSize: 14,
    marginBottom: 8,
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
