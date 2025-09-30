import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function Notifications() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup previous notification listener
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!user) {
        setNotifications([]);
        setLoading(false);
        setError('Please sign in to see your notifications.');
        return;
      }

      setLoading(true);
      setError(null);

      // Listen to real-time notifications
      unsubscribeNotifications = notificationService.listenToUserNotifications(
        user.uid,
        (notifications) => {
          setNotifications(notifications);
          setLoading(false);
          setError(null); // Clear any previous errors when data loads successfully
        },
        (error) => {
          console.error('Notifications listener error:', error);
          // Set a gentle error message that doesn't break the user experience
          setError('Some notifications may not be up to date.');
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'chat_message':
        return 'chatbubble-outline';
      case 'property_inquiry':
        return 'home-outline';
      case 'booking_request':
        return 'calendar-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark notification as read if it's unread
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }

      // Navigate based on notification type
      if (notification.type === 'chat_message' && notification.chatId) {
        // Navigate directly to the specific conversation detail screen
        router.push(`/conversation/${notification.chatId}`);
      } else if (notification.propertyId) {
        // For non-chat notifications, still go to property details
        router.push(`/property/details?id=${notification.propertyId}`);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: C.surface,
          borderColor: C.surfaceBorder,
        },
        !item.isRead && { backgroundColor: C.accent2 + '10' }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: C.accent2 + '20' }]}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={C.accent2}
            />
          </View>
          <View style={styles.notificationText}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, { color: C.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: C.accent2 }]} />
              )}
            </View>
            <Text style={[styles.notificationMessage, { color: C.textMuted }]} numberOfLines={2}>
              {item.message}
            </Text>
            {item.propertyTitle && (
              <Text style={[styles.propertyTitle, { color: C.accent2 }]} numberOfLines={1}>
                {item.propertyTitle}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.timeAgo, { color: C.textMuted }]}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.screenBg }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrow-left" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={C.accent2} size="large" />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading notifications...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={[styles.errorText, { color: C.text }]}>{error}</Text>
        </View>
      )}

      {!loading && !error && notifications.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>No notifications yet</Text>
          <Text style={[styles.emptyMessage, { color: C.textMuted }]}>
            You'll see notifications about messages, property updates, and more here.
          </Text>
        </View>
      )}

      {!loading && !error && notifications.length > 0 && (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notificationContent: {
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  propertyTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
});