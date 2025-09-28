import { Colors } from "@/constants/theme";
import { PropertyWithCoordinates, useMapStore } from "@/stores/mapStore";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  DimensionValue,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import PropertyInfoModal from "./PropertyInfoModal";

const { width, height } = Dimensions.get("window");

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

  // Update store when properties change (only once per properties array)
  useEffect(() => {
    if (properties.length > 0) {
      console.log("Setting properties in map store:", properties.length);
      setProperties(properties as PropertyWithCoordinates[]);
    }
  }, [properties.length, setProperties]); // Only re-run when length changes

  // Get properties with valid coordinates
  const validProperties = getPropertiesWithCoordinates();

  // Debug logging
  useEffect(() => {
    console.log("Original properties count:", properties.length);
    console.log("Valid properties for markers:", validProperties.length);

    if (properties.length > 0 && validProperties.length === 0) {
      console.log(
        "Properties exist but no valid coordinates. First property:",
        properties[0]
      );
    }

    validProperties.forEach((prop, index) => {
      console.log(`Property ${index}:`, {
        id: prop.id,
        title: prop.title,
        lat: prop.latitude,
        lng: prop.longitude,
      });
    });
  }, [validProperties.length, properties.length]);

  // Add fallback demo markers if no valid properties
  const fallbackMarkers =
    validProperties.length === 0
      ? [
          {
            id: "demo-1",
            title: "Demo Property 1",
            latitude: 37.7849,
            longitude: -122.4094,
            price: 150,
          },
          {
            id: "demo-2",
            title: "Demo Property 2",
            latitude: 37.7849 + 0.01,
            longitude: -122.4094 + 0.01,
            price: 200,
          },
          {
            id: "demo-3",
            title: "Demo Property 3",
            latitude: 37.7849 - 0.01,
            longitude: -122.4094 - 0.01,
            price: 175,
          },
        ]
      : [];

  const markersToRender =
    validProperties.length > 0 ? validProperties : fallbackMarkers;

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
        {markersToRender.map((property, index) => {
          console.log(
            `Rendering marker ${index} for property:`,
            property.id,
            property.latitude,
            property.longitude
          );
          return (
            <Marker
              key={`marker-${property.id}`}
              coordinate={{
                latitude: property.latitude!,
                longitude: property.longitude!,
              }}
              onPress={() =>
                handleMarkerPress(property as PropertyWithCoordinates)
              }
              title={property.title || `Property ${index + 1}`}
              description={`$${property.price}/month`}
              image={require("@/assets/images/map-pin-icon.png")}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Property count indicator */}
      {/* <View style={styles.propertyCountContainer}>
        <Text style={styles.propertyCountText}>
          {markersToRender.length} properties in this area
        </Text>
      </View> */}

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
