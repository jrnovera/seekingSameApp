import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyWithCoordinates } from '@/stores/mapStore';

interface PropertyMarkerProps {
  property: PropertyWithCoordinates;
  onPress: (property: PropertyWithCoordinates) => void;
  isSelected?: boolean;
}

const PropertyMarker: React.FC<PropertyMarkerProps> = ({
  property,
  onPress,
  isSelected = false
}) => {
  const handlePress = () => {
    onPress(property);
  };

  return (
    <TouchableOpacity
      style={[
        styles.markerContainer,
        isSelected && styles.selectedMarker
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Main marker body - teardrop shape */}
      <View style={[
        styles.markerBody,
        isSelected && styles.selectedBody
      ]}>
        {/* House icon */}
        <Ionicons
          name="home"
          size={isSelected ? 14 : 12}
          color="#FFFFFF"
        />
      </View>

      {/* Marker point/tip */}
      <View style={[
        styles.markerPoint,
        isSelected && styles.selectedPoint
      ]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 30,
    height: 40,
  },
  markerBody: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedBody: {
    backgroundColor: '#E91E63',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  markerPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B9D',
    marginTop: -2,
  },
  selectedPoint: {
    borderTopColor: '#E91E63',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    marginTop: -2,
  },
  selectedMarker: {
    zIndex: 1000,
  },
});

export default PropertyMarker;