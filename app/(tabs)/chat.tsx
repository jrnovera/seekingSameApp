import { auth, db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query, doc, getDoc } from 'firebase/firestore';
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

// Simple chat item type for display
type ChatItem = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export default function Chat() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  // Use initialized auth from our Firebase config
  // This avoids pulling in the RN-specific entrypoint multiple times
  
  // Simple format timestamp function
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      // Handle Firebase timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
    console.log('Fetching chats for user:', userId);
    
    // Single query to get all chats and filter by authenticated user
    const chatsQuery = query(
      collection(db, 'chat'),
      orderBy('messageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      console.log('Chat snapshot received, total docs:', snapshot.docs.length);
      const chatItems: ChatItem[] = [];
      
      for (const chatDoc of snapshot.docs) {
        try {
          const data = chatDoc.data();
          
          if (!data) {
            console.warn('Empty chat data for doc:', chatDoc.id);
            continue;
          }
          
          // Only include chats where current user is involved (either userAuth or otherUser)
          if (data.userAuth === userId || data.otherUser === userId) {
            // Determine the other user
            const otherUserId = data.userAuth === userId ? data.otherUser : data.userAuth;
            
            // Fetch other user's name
            let otherUserName = 'Unknown User';
            try {
              if (otherUserId && otherUserId !== 'unknown') {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  otherUserName = userData.displayName || userData.name || userData.email || 'Unknown User';
                }
              }
            } catch (userError) {
              console.warn('Error fetching user data for:', otherUserId, userError);
            }
            
            chatItems.push({
              id: chatDoc.id,
              otherUserId: otherUserId || 'unknown',
              otherUserName: otherUserName,
              lastMessage: data.lastMessage || 'No messages yet',
              time: formatTime(data.messageTime),
              unread: 0
            });
          }
        } catch (error) {
          console.error('Error processing chat doc:', chatDoc.id, error);
        }
      }
      
      console.log('Processed chat items for user:', chatItems.length);
      setChats(chatItems);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching chats:', error);
      setChats([]);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [auth.currentUser]);
  
  // Filter chats based on search query - search in user names and messages
  const filteredChats = searchQuery
    ? chats.filter(chat => 
        chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

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
      ) : chats.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: C.text }]}>No conversations yet</Text>
          <Text style={[styles.emptyStateMessage, { color: C.textMuted }]}>Start chatting with property owners by viewing properties and clicking Chat</Text>
        </View>
      ) : (
        /* Chat list */
        <FlatList
          data={filteredChats || []}
          keyExtractor={(item) => item?.id || `chat-${Date.now()}-${Math.random()}`}
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
                      {item.otherUserName.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.content}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: C.text }]}>{item.otherUserName}</Text>
                    <Text style={[styles.time, { color: C.textMuted }]}>{item.time}</Text>
                  </View>
                  <View style={styles.msgRow}>
                    <Text numberOfLines={1} style={[styles.msg, { color: C.textMuted }]}>{item.lastMessage}</Text>
                    {item.unread > 0 ? (
                      <View style={[styles.badge, { backgroundColor: C.tint }]}> 
                        <Text style={styles.badgeText}>{item.unread}</Text>
                      </View>
                    ) : null}
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
