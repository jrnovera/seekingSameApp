import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyWithCoordinates } from '@/stores/mapStore';
import RemoteImage from './remote-image';

const { width } = Dimensions.get('window');

interface PropertyInfoModalProps {
  property: PropertyWithCoordinates | null;
  visible: boolean;
  onClose: () => void;
  onBookNow: (property: PropertyWithCoordinates) => void;
  modalPosition?: { top: number | string; left: number; right: number };
}

const PropertyInfoModal: React.FC<PropertyInfoModalProps> = ({
  property,
  visible,
  onClose,
  onBookNow,
  modalPosition = { top: '15%', left: 16, right: 16 }
}) => {
  if (!visible || !property) return null;

  // Format price for display
  const formatPrice = (price: string | number | undefined): string => {
    if (!price) return '$0';
    const numPrice = typeof price === 'number' ? price : parseInt(String(price).replace(/[^0-9]/g, '') || '0');
    return `$${numPrice}`;
  };

  // Get location display
  const getLocationDisplay = (): string => {
    if (property.cities) return property.cities;
    if (property.location && typeof property.location === 'string') return property.location;
    return 'Location not available';
  };

  const handleBookNow = () => {
    onBookNow(property);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <View style={[styles.modalContainer, modalPosition]}>
        <View style={styles.card}>
          {/* Property Image */}
          <View style={styles.imageContainer}>
            <RemoteImage
              uri={property.imageUrl || property.photo}
              style={styles.propertyImage}
              borderRadius={12}
            />
          </View>

          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {property.title || property.name || 'Property'}
            </Text>

            {/* Property Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {property.capacity || 3} persons
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="bed" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {property.bedroomCount || 4} Rooms
                </Text>
              </View>
            </View>

            {/* Additional Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.detailText}>2Kms</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.priceText}>
                  {formatPrice(property.price)} Per day
                </Text>
              </View>
            </View>

            {/* Book Now Button */}
            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookNow}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>BOOK NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    position: 'absolute',
    zIndex: 1001,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    height: 140,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PropertyInfoModal;