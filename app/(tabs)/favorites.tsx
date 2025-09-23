import RemoteImage from '@/components/remote-image';
import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { listenFavoritesByUser, removeFavorite } from '@/services/favoriteService';
import { Favorite } from '@/types/favorite';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function Favorites() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Animation references
  const fadeAnim = useRef<{[key: string]: Animated.Value}>({});

  // Handle removing a favorite with animation
  const handleRemoveFavorite = (favorite: Favorite) => {
    // Ask for confirmation
    Alert.alert(
      "Remove Favorite",
      `Are you sure you want to remove "${favorite.title || 'this property'}" from your favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => confirmRemoveFavorite(favorite)
        }
      ]
    );
  };

  // Confirm and remove the favorite with animation
  const confirmRemoveFavorite = async (favorite: Favorite) => {
    try {
      setRemovingId(favorite.id);
      
      // Create parallel animations for a more engaging effect
      Animated.parallel([
        // Fade out
        Animated.timing(fadeAnim.current[favorite.id], {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        }),
        // Scale down
        Animated.timing(fadeAnim.current[`${favorite.id}_scale`], {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(async () => {
        // After animation completes, remove from database
        await removeFavorite(favorite.id);
        
        // Show success message with a nice checkmark icon
        Alert.alert(
          "Success ✓", 
          `"${favorite.title || 'Property'}" has been removed from your favorites.`,
          [{ text: "OK" }]
        );
        
        setRemovingId(null);
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert("Error", "Failed to remove from favorites. Please try again.");
      setRemovingId(null);
      
      // Reset animations if there was an error
      if (fadeAnim.current[favorite.id]) {
        fadeAnim.current[favorite.id].setValue(1);
      }
      if (fadeAnim.current[`${favorite.id}_scale`]) {
        fadeAnim.current[`${favorite.id}_scale`].setValue(1);
      }
    }
  };

  // Initialize animation values for new favorites
  React.useEffect(() => {
    favorites.forEach(fav => {
      if (!fadeAnim.current[fav.id]) {
        fadeAnim.current[fav.id] = new Animated.Value(1);
        fadeAnim.current[`${fav.id}_scale`] = new Animated.Value(1);
      }
    });
  }, [favorites]);

  React.useEffect(() => {
    // Holder for the Firestore unsubscribe function to allow cleanup on auth change
    let unsubscribeFav: (() => void) | null = null;

    // Watch auth state first to get the current user's UID
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup any previous favorites listener when auth state changes
      unsubscribeFav && unsubscribeFav();

      if (!user) {
        setFavorites([]);
        setLoading(false);
        setError('Please sign in to see your favorites.');
        return;
      }

      setLoading(true);
      setError(null);

      // Listen to favorites of this user
      unsubscribeFav = listenFavoritesByUser(
        user.uid,
        (items) => {
          setFavorites(items);
          setLoading(false);
        },
        (e) => {
          console.error('Favorites listener error', e);
          setError('Failed to load favorites.');
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFav) unsubscribeFav();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: C.screenBg }]}> 
      <Text style={[styles.title, { color: C.text }]}>Favourites</Text>
      {loading && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={C.accent2} />
          <Text style={{ color: C.textMuted, marginTop: 8 }}>Loading...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: C.text }}>{error}</Text>
        </View>
      )}

      {!loading && !error && favorites.length === 0 && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: C.text }}>No favorites yet.</Text>
        </View>
      )}

      {favorites.map((item) => (
        <Animated.View 
          key={item.id} 
          style={[
            styles.card, 
            { 
              backgroundColor: C.surface, 
              borderColor: C.surfaceBorder,
              opacity: fadeAnim.current[item.id] || 1,
              transform: [{
                scale: fadeAnim.current[`${item.id}_scale`] || 1
              }]
            }
          ]}
        > 
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => item.propertyId && router.push(`/property/${item.propertyId}`)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row' }}>
            {/* Image with badge */}
            <View style={{ width: 150 }}>
              <RemoteImage uri={item.imageUrl ?? null} style={styles.photo} borderRadius={16}>
                <View style={[styles.badge, { backgroundColor: C.accent2 }]}> 
                  <Text style={styles.badgeText}>{item.type || 'Listing'}</Text>
                </View>
              </RemoteImage>
              {/* Remove bubble */}
              <TouchableOpacity 
                style={[styles.removeBubble, { backgroundColor: C.tint }]}
                onPress={() => handleRemoveFavorite(item)}
                disabled={removingId === item.id}
              > 
                {removingId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AntDesign name="close" size={12} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={[styles.name, { color: C.text }]}>{item.title || 'Untitled'}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={C.icon} />
                <Text style={[styles.metaText, { color: C.textMuted }]}>{item.location || 'Unknown'}</Text>
              </View>
              <Text style={[styles.rent, { color: C.text }]}>Rent</Text>
              <Text style={[styles.price, { color: C.accent2, fontWeight: '800' }]}>{typeof item.price === 'number' ? `$${item.price}` : (item.price ? `$${item.price}` : '$0')}</Text>
            </View>
          </View>
          </TouchableOpacity>
        </Animated.View>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
  },
  photo: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  removeBubble: {
    position: 'absolute',
    top: -10,
    left: -10,
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  details: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontSize: 18,
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
  rent: {
    marginTop: 6,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
});