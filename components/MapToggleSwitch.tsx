import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';

interface MapToggleSwitchProps {
  isMapView: boolean;
  onToggle: (isMapView: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
}

const MapToggleSwitch: React.FC<MapToggleSwitchProps> = ({
  isMapView,
  onToggle,
  leftLabel = "Turn On Your Map View",
  rightLabel = "Map View is ON"
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const handleToggle = () => {
    onToggle(!isMapView);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          {
            backgroundColor: isMapView ? '#FF6B9D' : '#E5E5E5'
          }
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        {/* Toggle Circle */}
        <View
          style={[
            styles.toggleCircle,
            {
              marginLeft: isMapView ? 22 : 2
            }
          ]}
        />
      </TouchableOpacity>

      {/* Toggle Label */}
      <Text
        style={[
          styles.toggleLabel,
          {
            color: isMapView ? '#4CAF50' : '#666666',
            fontWeight: isMapView ? '600' : '500'
          }
        ]}
      >
        {isMapView ? rightLabel : leftLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleContainer: {
    width: 50,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleLabel: {
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 20,
  },
});

export default MapToggleSwitch;