import { Colors } from '@/constants/theme';
import { RentalTransaction, transactionService } from '@/services/transactionService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function MyBookingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user } = useAuth();
  const [bookings, setBookings] = useState<RentalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch bookings
  const fetchBookings = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userBookings = await transactionService.getUserBookings(user.uid);
      // Sort by date (newest first)
      userBookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBookings(userBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load your bookings. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.uid]);

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    
    return formatter.format(amount / 100); // Convert cents to dollars
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // Green
      case 'pending':
        return '#f59e0b'; // Amber
      case 'failed':
        return '#ef4444'; // Red
      case 'refunded':
        return '#6366f1'; // Indigo
      default:
        return '#6b7280'; // Gray
    }
  };

  // Render booking item
  const renderBookingItem = ({ item }: { item: RentalTransaction }) => (
    <TouchableOpacity
      style={[styles.bookingCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/property/${item.propertyId}`)}
    >
      <View style={styles.bookingHeader}>
        <Text style={[styles.propertyTitle, { color: C.text }]} numberOfLines={1}>
          {item.propertyTitle}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' }
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) }
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="calendar-today" size={16} color={C.textMuted} />
          <Text style={[styles.detailText, { color: C.textMuted }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color={C.textMuted} />
          <Text style={[styles.detailText, { color: C.text }]}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="description" size={16} color={C.textMuted} />
          <Text style={[styles.detailText, { color: C.textMuted }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
       {/*  <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: C.tint + '10' }]}
          onPress={() => router.push(`/property/${item.propertyId}`)}
        >
          <Text style={[styles.actionButtonText, { color: C.tint }]}>View Property</Text>
        </TouchableOpacity> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>My Bookings</Text>
        <View style={styles.headerRight} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading your bookings...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="book-online" size={64} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>No Bookings Yet</Text>
          <Text style={[styles.emptyMessage, { color: C.textMuted }]}>
            You haven't made any bookings yet. When you book a property, it will appear here.
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: C.tint }]}
            onPress={() => router.push('/')}>
            <Text style={styles.browseButtonText}>Browse Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
