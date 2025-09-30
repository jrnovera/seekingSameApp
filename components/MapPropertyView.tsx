import { Colors } from "@/constants/theme";
import { PropertyWithCoordinates, useMapStore } from "@/stores/mapStore";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  DimensionValue,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import PropertyInfoModal from "./PropertyInfoModal";
import PropertyMarker from "./PropertyMarker";

const { width, height } = Dimensions.get("window");

type Property = {
  id: string;
  title?: string;
  imageUrl?: string | null;
  price?: string | number;
  location?: {
    latitude: string;
    longitude: string;
  };
  cities?: string;
  address?: any;
  state?: string;
  zipCode?: string;
  bedroomCount?: number;
  BathRoomCount?: number;
  type?: string;
};

interface MapPropertyViewProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

const MapPropertyView: React.FC<MapPropertyViewProps> = ({
  properties,
  onPropertySelect,
}) => {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const mapRef = useRef<MapView>(null);

  // Local state for modal
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    top: DimensionValue;
    left: DimensionValue;
    right: DimensionValue;
  }>({
    top: "15%",
    left: 16,
    right: 16,
  });

  // Zustand store
  const {
    mapRegion,
    selectedProperty,
    isMapLoaded,
    setProperties,
    setSelectedProperty,
    setMapLoaded,
    getPropertiesWithCoordinates,
  } = useMapStore();

  // Extract coordinates directly from properties and create markers
  const markersToRender = properties
    .filter(property => {
      // Check if location object exists and has valid coordinates
      if (!property.location || typeof property.location !== 'object') return false;

      const lat = property.location.latitude;
      const lng = property.location.longitude;

      // Skip empty strings or invalid coordinates
      if (!lat || !lng || lat === "" || lng === "") return false;

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      return !isNaN(latitude) && !isNaN(longitude);
    })
    .map(property => ({
      ...property,
      latitude: parseFloat(property.location!.latitude),
      longitude: parseFloat(property.location!.longitude)
    }));

  console.log("MapPropertyView: Markers to render:", markersToRender.length);
  markersToRender.forEach((marker, i) => {
    console.log(`Marker ${i}: ${marker.title} - ${marker.latitude}, ${marker.longitude}`);
  });

  // Auto-fit map to show all markers
  useEffect(() => {
    if (markersToRender.length > 0 && isMapLoaded && mapRef.current) {
      console.log("Auto-fitting map to show", markersToRender.length, "markers");

      const coordinates = markersToRender.map(marker => ({
        latitude: marker.latitude,
        longitude: marker.longitude,
      }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }, 1000);
    }
  }, [markersToRender.length, isMapLoaded]);

  // Handle map load
  const handleMapReady = () => {
    if (!isMapLoaded) {
      setMapLoaded(true);
      console.log("Map loaded successfully");
    }
  };

  // Handle marker press
  const handleMarkerPress = async (property: PropertyWithCoordinates) => {
    setSelectedProperty(property);

    // Calculate modal position based on marker location
    if (mapRef.current && property.latitude && property.longitude) {
      try {
        const coordinate = {
          latitude: property.latitude,
          longitude: property.longitude,
        };

        // Get screen coordinates of the marker
        const point = await mapRef.current.pointForCoordinate(coordinate);

        // Calculate modal position
        const screenHeight = height;
        const modalHeight = 160; // Approximate modal height
        const padding = 20;

        // Position modal above the marker if there's space, otherwise below
        let topPosition = point.y - modalHeight - padding;
        if (topPosition < 100) {
          // Too close to top
          topPosition = point.y + 60; // Position below marker
        }

        // Ensure modal doesn't go off screen
        topPosition = Math.max(
          60,
          Math.min(topPosition, screenHeight - modalHeight - 60)
        );

        setModalPosition({
          top: topPosition as DimensionValue,
          left: 16,
          right: 16,
        });
      } catch (error) {
        console.log("Error calculating marker position:", error);
        // Fallback to default position
        setModalPosition({ top: "15%" as DimensionValue, left: 16, right: 16 });
      }
    }

    setShowModal(true);
    if (onPropertySelect) {
      onPropertySelect(property as Property);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedProperty(null);
  };

  // Handle book now
  const handleBookNow = (property: PropertyWithCoordinates) => {
    console.log("Book now pressed for:", property.title);

    // Close modal first
    setShowModal(false);
    setSelectedProperty(null);

    // Navigate to property details screen
    router.push(`/property/details?id=${property.id}`);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        onMapReady={handleMapReady}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={true}
        pitchEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        zoomControlEnabled={true}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#FF6B9D"
        moveOnMarkerPress={false}
      >
        {/* Render property markers */}
        {markersToRender.map((marker, index) => {
          console.log(
            `Rendering marker ${index}:`,
            marker.title,
            marker.latitude,
            marker.longitude
          );
          return (
            <Marker
              key={`marker-${marker.id}-${index}`}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() =>
                handleMarkerPress(marker as PropertyWithCoordinates)
              }
              title={marker.title || `Property ${index + 1}`}
              description={`$${marker.price}/month`}
              image={require("@/assets/images/map-pin-icon.png")}

              tracksViewChanges={false}
            >
              <PropertyMarker
                property={marker as PropertyWithCoordinates}
                onPress={handleMarkerPress}
                isSelected={selectedProperty?.id === marker.id}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Property count indicator */}
      <View style={styles.propertyCountContainer}>
        <Text style={[styles.propertyCountText, { color: C.text }]}>
          {markersToRender.length} {markersToRender.length === 1 ? 'property' : 'properties'} in this area
        </Text>
      </View>

      {/* Property Info Modal */}
      <PropertyInfoModal
        property={selectedProperty}
        visible={showModal}
        onClose={handleModalClose}
        onBookNow={handleBookNow}
        modalPosition={modalPosition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
    width: width,
    height: "100%",
  },
  propertyCountContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});

export default MapPropertyView;
