import conversationService from '@/services/conversationService';
import { Colors } from '@/constants/theme';
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
import type { Conversation } from '@/services/conversationService';

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

export default function Chat() {
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
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
          ) : (
            <TouchableOpacity activeOpacity={0.8}>
              <Ionicons name="options-outline" size={18} color={C.icon} />
            </TouchableOpacity>
          )}
        </View>
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
          <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Please sign in to start chatting with property owners</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: C.text }]}>No conversations yet</Text>
          <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Start chatting with property owners by viewing properties and clicking Chat</Text>
        </View>
      ) : (
        /* Conversation list */
        <FlatList
          data={filteredConversations || []}
          keyExtractor={(item) => item?.id || `conversation-${Date.now()}-${Math.random()}`}
          contentContainerStyle={{ paddingBottom: 24 }}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
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
                  <Text numberOfLines={1} style={[styles.propertyTitle, { color: C.textMuted }]}>
                    🏠 {item.propertyTitle}
                  </Text>
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
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: 10,
    width: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
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
  badge: {
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
});
