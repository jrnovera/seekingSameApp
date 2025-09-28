import { create } from 'zustand';

export type PropertyWithCoordinates = {
  id: string;
  title?: string;
  name?: string; // Alternative property name field
  imageUrl?: string | null;
  photo?: string | null; // Alternative image field
  price?: string | number;
  location?: string;
  cities?: string;
  address?: any;
  state?: string;
  zipCode?: string;
  bedroomCount?: number;
  BathRoomCount?: number;
  capacity?: number; // Number of people property can accommodate
  type?: string;
  // Computed coordinates
  latitude?: number;
  longitude?: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

interface MapState {
  // Map region and properties
  properties: PropertyWithCoordinates[];
  mapRegion: MapRegion;
  selectedProperty: PropertyWithCoordinates | null;
  isMapLoaded: boolean;

  // Actions
  setProperties: (properties: PropertyWithCoordinates[]) => void;
  setMapRegion: (region: MapRegion) => void;
  setSelectedProperty: (property: PropertyWithCoordinates | null) => void;
  setMapLoaded: (loaded: boolean) => void;

  // Computed actions
  getPropertiesWithCoordinates: () => PropertyWithCoordinates[];
  computeRegionFromProperties: () => MapRegion | null;
}

// Helper function to generate coordinates from address/location
const generateCoordinatesFromLocation = (property: any): { latitude?: number; longitude?: number } => {
  // For demo purposes, generate coordinates in a realistic area
  // In production, you'd use a geocoding service

  const baseCoordinates = {
    // Default area around San Francisco/Bay Area (more centered)
    latitude: 37.7849,
    longitude: -122.4094
  };

  // Generate slight variations based on property data
  const propertyId = property.id || '0';
  const seed = propertyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Create spread within a smaller, more visible area
  const latOffset = ((seed % 50) - 25) * 0.002; // Smaller spread for better visibility
  const lngOffset = ((seed % 50) - 25) * 0.002;

  const coords = {
    latitude: baseCoordinates.latitude + latOffset,
    longitude: baseCoordinates.longitude + lngOffset
  };

  console.log(`Property ${property.id} coordinates:`, coords);
  return coords;
};

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  properties: [],
  mapRegion: {
    latitude: 37.7849,
    longitude: -122.4094,
    latitudeDelta: 0.05, // Much smaller for closer zoom
    longitudeDelta: 0.05,
  },
  selectedProperty: null,
  isMapLoaded: false,

  // Actions
  setProperties: (properties) => {
    // Add coordinates to properties when they're set
    const propertiesWithCoords = properties.map(property => ({
      ...property,
      ...generateCoordinatesFromLocation(property)
    }));

    set({ properties: propertiesWithCoords });

    // Auto-compute region to fit all properties
    const state = get();
    const newRegion = state.computeRegionFromProperties();
    if (newRegion) {
      set({ mapRegion: newRegion });
    }
  },

  setMapRegion: (region) => set({ mapRegion: region }),

  setSelectedProperty: (property) => set({ selectedProperty: property }),

  setMapLoaded: (loaded) => set({ isMapLoaded: loaded }),

  getPropertiesWithCoordinates: () => {
    return get().properties.filter(p => p.latitude && p.longitude);
  },

  computeRegionFromProperties: () => {
    const { properties } = get();
    const validProperties = properties.filter(p => p.latitude && p.longitude);

    if (validProperties.length === 0) return null;

    // Find bounds of all properties
    const latitudes = validProperties.map(p => p.latitude!);
    const longitudes = validProperties.map(p => p.longitude!);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Calculate center and deltas
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add padding to show all markers nicely
    const padding = 0.02;
    const latDelta = Math.max((maxLat - minLat) + padding, 0.05); // Minimum delta
    const lngDelta = Math.max((maxLng - minLng) + padding, 0.05);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  },
}));