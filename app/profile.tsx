import AvatarImage from '@/components/avatar-image';
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'notifications' | 'matches' | 'messages';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { userDoc, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [loading, setLoading] = useState(false);

  // Sample data for demonstration
  const notifications = [
    { id: '1', title: 'New match!', message: 'You have a new match with Sarah', time: '2h ago', read: false },
    { id: '2', title: 'Message received', message: 'John sent you a message', time: '5h ago', read: false },
    { id: '3', title: 'Property update', message: 'Price updated for a property in your favorites', time: '1d ago', read: true },
    { id: '4', title: 'New listing', message: 'New property available in your area', time: '2d ago', read: true },
  ];

  const matches = [
    { id: '1', name: 'Sarah Johnson', photo: null, compatibility: '95%', status: 'active' },
    { id: '2', name: 'Michael Chen', photo: null, compatibility: '87%', status: 'active' },
    { id: '3', name: 'Jessica Williams', photo: null, compatibility: '82%', status: 'pending' },
  ];

  const messages = [
    { id: '1', name: 'Sarah Johnson', photo: null, lastMessage: 'Hey, I\'m interested in your listing', time: '2h ago', unread: 2 },
    { id: '2', name: 'Michael Chen', photo: null, lastMessage: 'When can we schedule a viewing?', time: '1d ago', unread: 0 },
    { id: '3', name: 'Property Manager', photo: null, lastMessage: 'Your application has been received', time: '3d ago', unread: 0 },
  ];

  // Format join date
  const formatJoinDate = () => {
    if (!userDoc?.created_time) return 'Member since 2024';
    
    const date = userDoc.created_time;
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    return `Member since ${month} ${year}`;
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'notifications':
        return (
          <View style={styles.tabContent}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color={C.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: C.text }]}>No notifications</Text>
                <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>
                  You don't have any notifications yet
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    { backgroundColor: notification.read ? C.surface : C.surfaceSoft }
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.notificationIcon, { backgroundColor: C.tint + '20' }]}>
                      <Ionicons name="notifications" size={20} color={C.tint} />
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <Text style={[styles.notificationTitle, { color: C.text }]}>
                        {notification.title}
                        {!notification.read && (
                          <View style={[styles.unreadDot, { backgroundColor: C.tint }]} />
                        )}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: C.textMuted }]}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: C.textMuted }]}>
                        {notification.time}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      
      case 'matches':
        return (
          <View style={styles.tabContent}>
            {matches.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-multiple-remove-outline" size={64} color={C.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: C.text }]}>No matches</Text>
                <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>
                  You don't have any matches yet
                </Text>
              </View>
            ) : (
              matches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={[styles.matchItem, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/conversation/new?userId=${match.id}`)}
                >
                  <AvatarImage uri={match.photo} name={match.name} size={60} />
                  <View style={styles.matchInfo}>
                    <Text style={[styles.matchName, { color: C.text }]}>{match.name}</Text>
                    <View style={styles.matchMeta}>
                      <Text style={[styles.matchCompatibility, { color: C.tint }]}>
                        {match.compatibility} match
                      </Text>
                      <View style={[
                        styles.matchStatus,
                        { backgroundColor: match.status === 'active' ? '#10b981' : '#f59e0b' }
                      ]}>
                        <Text style={styles.matchStatusText}>
                          {match.status === 'active' ? 'Active' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.matchAction, { backgroundColor: C.tint }]}>
                    <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      
      case 'messages':
        return (
          <View style={styles.tabContent}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color={C.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: C.text }]}>No messages</Text>
                <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>
                  You don't have any messages yet
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={[styles.messageItem, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/conversation/${message.id}`)}
                >
                  <View style={styles.messageAvatar}>
                    <AvatarImage uri={message.photo} name={message.name} size={50} />
                    {message.unread > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: C.tint }]}>
                        <Text style={styles.unreadBadgeText}>{message.unread}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={[styles.messageName, { color: C.text }]}>{message.name}</Text>
                      <Text style={[styles.messageTime, { color: C.textMuted }]}>{message.time}</Text>
                    </View>
                    <Text 
                      style={[
                        styles.messageText, 
                        { 
                          color: message.unread > 0 ? C.text : C.textMuted,
                          fontWeight: message.unread > 0 ? '600' : '400'
                        }
                      ]}
                      numberOfLines={1}
                    >
                      {message.lastMessage}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="settings-outline" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <View style={styles.profileContent}>
            <AvatarImage 
              uri={userDoc?.photo_url || user?.photoURL || null} 
              name={userDoc?.display_name || user?.displayName || 'User'} 
              size={80} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: C.text }]}>
                {userDoc?.display_name || user?.displayName || 'User'}
              </Text>
              <Text style={[styles.email, { color: C.textMuted }]}>
                {userDoc?.email || user?.email || 'user@example.com'}
              </Text>
              <Text style={[styles.meta, { color: C.textMuted }]}>{formatJoinDate()}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: C.tint }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'notifications' && [styles.activeTab, { borderBottomColor: C.tint }]
            ]}
            onPress={() => setActiveTab('notifications')}
          >
            <Ionicons 
              name={activeTab === 'notifications' ? "notifications" : "notifications-outline"} 
              size={22} 
              color={activeTab === 'notifications' ? C.tint : C.textMuted} 
            />
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'notifications' ? C.tint : C.textMuted }
              ]}
            >
              Notifications
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'matches' && [styles.activeTab, { borderBottomColor: C.tint }]
            ]}
            onPress={() => setActiveTab('matches')}
          >
            <MaterialIcons 
              name={activeTab === 'matches' ? "people" : "people-outline"} 
              size={22} 
              color={activeTab === 'matches' ? C.tint : C.textMuted} 
            />
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'matches' ? C.tint : C.textMuted }
              ]}
            >
              Matches
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'messages' && [styles.activeTab, { borderBottomColor: C.tint }]
            ]}
            onPress={() => setActiveTab('messages')}
          >
            <Ionicons 
              name={activeTab === 'messages' ? "chatbubbles" : "chatbubbles-outline"} 
              size={22} 
              color={activeTab === 'messages' ? C.tint : C.textMuted} 
            />
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'messages' ? C.tint : C.textMuted }
              ]}
            >
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
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
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    height: 80,
    width: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    opacity: 0.7,
  },
  editProfileButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    position: 'relative',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCompatibility: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  matchStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  matchAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  messageAvatar: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
  },
});
