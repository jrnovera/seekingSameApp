import React from 'react';
import { StyleSheet, Text, View, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import RemoteImage from '@/components/remote-image';
import { Favorite } from '@/types/favorite';
import { listenFavoritesByUser } from '@/services/favoriteService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function Favorites() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        <View key={item.id} style={[styles.card, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}> 
          <View style={{ flexDirection: 'row' }}>
            {/* Image with badge */}
            <View style={{ width: 150 }}>
              <RemoteImage uri={item.imageUrl ?? null} style={styles.photo} borderRadius={16}>
                <View style={[styles.badge, { backgroundColor: C.accent2 }]}> 
                  <Text style={styles.badgeText}>{item.type || 'Listing'}</Text>
                </View>
              </RemoteImage>
              {/* Remove bubble */}
              <View style={[styles.removeBubble, { backgroundColor: C.tint }]}> 
                <AntDesign name="close" size={12} color="#fff" />
              </View>
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
        </View>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
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