import { Colors } from '@/constants/theme';
import type { GroupChat } from '@/services/communityPostService';
import communityPostService from '@/services/communityPostService';
import type { Conversation } from '@/services/conversationService';
import conversationService from '@/services/conversationService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Display conversation type for list
type ConversationDisplay = {
  id: string;
  otherUser: {
    uid: string;
    displayName?: string;
    email?: string;
    role: 'host' | 'user';
  } | null;
  propertyTitle: string;
  lastMessage: string;
  messageTime: Date;
  isFromCurrentUser: boolean;
};

type ActiveTab = 'chats' | 'groups';

export default function Chat() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  const auth = getAuth();

  // Simple format timestamp function
  const formatTime = (date: Date) => {
    if (!date) return '';

    try {
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        // Today: show time
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (diffInDays === 1) {
        // Yesterday
        return 'Yesterday';
      } else if (diffInDays < 7) {
        // Within a week: show day name
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        // Older: show date
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  // Load regular conversations
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    console.log('Fetching conversations for user:', userId);

    const unsubscribe = conversationService.subscribeToUserConversations(
      userId,
      (rawConversations: Conversation[]) => {
        console.log('Conversations received:', rawConversations.length);

        const formattedConversations: ConversationDisplay[] = rawConversations.map(conversation => {
          return conversationService.formatConversationForDisplay(conversation, userId);
        });

        setConversations(formattedConversations);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [auth.currentUser]);

  // Load group chats
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    console.log('Fetching group chats for user:', userId);

    const unsubscribe = communityPostService.subscribeToUserGroupChats(
      userId,
      (fetchedGroupChats) => {
        console.log('Group chats received:', fetchedGroupChats.length);
        setGroupChats(fetchedGroupChats);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(conversation => {
        const query = searchQuery.toLowerCase();
        const displayName = conversation.otherUser?.displayName?.toLowerCase() || '';
        const email = conversation.otherUser?.email?.toLowerCase() || '';
        const lastMessage = conversation.lastMessage.toLowerCase();
        const propertyTitle = conversation.propertyTitle.toLowerCase();

        return displayName.includes(query) ||
               email.includes(query) ||
               lastMessage.includes(query) ||
               propertyTitle.includes(query);
      })
    : conversations;

  // Filter group chats based on search query
  const filteredGroupChats = searchQuery
    ? groupChats.filter(groupChat => {
        const query = searchQuery.toLowerCase();
        const groupName = groupChat.groupName.toLowerCase();
        const lastMessage = groupChat.lastMessage?.text?.toLowerCase() || '';

        return groupName.includes(query) || lastMessage.includes(query);
      })
    : groupChats;

  const renderGroupChatItem = ({ item }: { item: GroupChat }) => {
    const isAdmin = auth.currentUser?.uid === item.adminId;
    const pendingRequestsCount = Object.values(item.joinRequests || {}).filter(
      req => req.status === 'pending'
    ).length;

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: C.surfaceBorder }]}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/group-chat/[id]', params: { id: item.id } })}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: isAdmin ? '#8B5CF6' : C.surfaceBorder }]}>
            <Ionicons name="people" size={24} color={isAdmin ? '#fff' : C.text} />
          </View>
          {isAdmin && pendingRequestsCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FF4B4B' }]}>
              <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: C.text }]}>
              {item.groupName} {isAdmin && '👑'}
            </Text>
            <Text style={[styles.time, { color: C.textMuted }]}>
              {item.updatedAt ? formatTime(item.updatedAt.toDate()) : ''}
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.propertyTitle, { color: C.textMuted }]}>
            👥 {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
          </Text>
          {item.lastMessage?.text && (
            <View style={styles.msgRow}>
              <Text numberOfLines={1} style={[styles.msg, { color: C.textMuted }]}>
                {item.lastMessage.text}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.screenBg }]}>
      {/* Search bar with padding for safe area */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <Ionicons name="search" size={18} color={C.icon} />
          <TextInput
            placeholder="Search messages"
            placeholderTextColor={C.placeholder}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'chats' ? C.tint : C.textMuted }]}>
            Chats
          </Text>
          {activeTab === 'chats' && <View style={[styles.tabIndicator, { backgroundColor: C.tint }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'groups' ? C.tint : C.textMuted }]}>
            Group Chats
          </Text>
          {activeTab === 'groups' && <View style={[styles.tabIndicator, { backgroundColor: C.tint }]} />}
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : !auth.currentUser ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: C.text }]}>Sign in to view chats</Text>
          <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Please sign in to start chatting</Text>
        </View>
      ) : activeTab === 'chats' ? (
        conversations.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
            <Text style={[styles.emptyStateTitle, { color: C.text }]}>No conversations yet</Text>
            <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Start chatting with property owners</Text>
          </View>
        ) : (
          /* Conversation list */
          <FlatList
            data={filteredConversations || []}
            keyExtractor={(item) => item?.id || `conversation-${Date.now()}-${Math.random()}`}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              if (!item) return null;
              return (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: C.surfaceBorder }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: item.id } })}
                >
                  <View style={styles.avatarWrap}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: C.surfaceBorder }]}>
                      <Text style={[styles.avatarInitial, { color: C.text }]}>
                        {(item.otherUser?.displayName || item.otherUser?.email || '?').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.content}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: C.text }]}>{item.otherUser?.displayName || item.otherUser?.email || 'Unknown User'}</Text>
                      <Text style={[styles.time, { color: C.textMuted }]}>{formatTime(item.messageTime)}</Text>
                    </View>
                    {/* <Text numberOfLines={1} style={[styles.propertyTitle, { color: C.textMuted }]}>
                      🏠 {item.propertyTitle}
                    </Text> */}
                    <View style={styles.msgRow}>
                      <Text numberOfLines={1} style={[styles.msg, { color: C.textMuted }]}>
                        {item.isFromCurrentUser ? 'You: ' : ''}{item.lastMessage || 'No messages yet'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )
      ) : (
        /* Group chats list */
        groupChats.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="people-outline" size={64} color={C.textMuted} />
            <Text style={[styles.emptyStateTitle, { color: C.text }]}>No group chats yet</Text>
            <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Create a post to start a group chat</Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroupChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={renderGroupChatItem}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBarContainer: {
    paddingTop: 44, // Safe area padding
  },
  searchBar: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active state
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    height: 48,
    width: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  time: {
    fontSize: 12,
  },
  propertyTitle: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  msgRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  msg: {
    flex: 1,
  },
});
