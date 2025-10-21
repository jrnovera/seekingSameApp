import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import communityPostService, {
  GroupChat,
  GroupChatMember,
  GroupMessage,
  JoinRequest,
} from '@/services/communityPostService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { userDoc } = useAuth();

  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const isAdmin = userDoc?.uid === groupChat?.adminId;
  const pendingRequests = Object.entries(groupChat?.joinRequests || {})
    .filter(([_, request]) => request.status === 'pending')
    .map(([userId, request]) => ({ userId, ...request }));

  const activeMembers = Object.entries(groupChat?.members || {})
    .filter(([_, member]) => member.status === 'active')
    .map(([userId, member]) => ({ userId, ...member }));

  // Subscribe to group chat details
  useEffect(() => {
    if (!id) return;

    const unsubscribe = communityPostService.subscribeToGroupChat(id, (fetchedGroupChat) => {
      setGroupChat(fetchedGroupChat);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Subscribe to messages
  useEffect(() => {
    if (!id) return;

    const unsubscribe = communityPostService.subscribeToGroupMessages(id, (fetchedMessages) => {
      setMessages(fetchedMessages);
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userDoc || !id) return;

    setSending(true);
    try {
      await communityPostService.sendGroupMessage(
        id,
        userDoc.uid,
        userDoc.display_name,
        userDoc.photo_url || null,
        messageText.trim()
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!userDoc || !id) return;

    try {
      await communityPostService.acceptJoinRequest(id, requesterId, userDoc.uid);
      Alert.alert('Success', 'Member added to the group!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    if (!userDoc || !id) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityPostService.rejectJoinRequest(id, requesterId, userDoc.uid);
              Alert.alert('Success', 'Join request rejected');
            } catch (error: any) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', error.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!userDoc || !id) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityPostService.removeMember(id, memberId, userDoc.uid);
              Alert.alert('Success', `${memberName} has been removed from the group`);
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwnMessage = item.senderId === userDoc?.uid;
    const messageTime = item.timestamp instanceof Timestamp ? item.timestamp.toDate() : new Date();

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <View style={styles.messageSenderInfo}>
            {item.senderPhoto ? (
              <Image source={{ uri: item.senderPhoto }} style={styles.messageAvatar} />
            ) : (
              <View style={[styles.messageAvatar, { backgroundColor: C.tint }]}>
                <Text style={styles.avatarText}>{item.senderName.charAt(0)}</Text>
              </View>
            )}
            <Text style={[styles.senderName, { color: C.textMuted }]}>{item.senderName}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? { backgroundColor: C.tint }
              : { backgroundColor: C.surface, borderWidth: 1, borderColor: C.surfaceBorder },
          ]}
        >
          <Text style={[styles.messageText, { color: isOwnMessage ? '#fff' : C.text }]}>
            {item.text}
          </Text>
          <Text
            style={[styles.messageTime, { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : C.textMuted }]}
          >
            {messageTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderJoinRequest = (request: JoinRequest & { userId: string }) => (
    <View key={request.userId} style={[styles.requestItem, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
      <View style={styles.requestInfo}>
        {request.photoUrl ? (
          <Image source={{ uri: request.photoUrl }} style={styles.requestAvatar} />
        ) : (
          <View style={[styles.requestAvatar, { backgroundColor: C.tint }]}>
            <Text style={styles.avatarText}>{request.displayName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.requestDetails}>
          <Text style={[styles.requestName, { color: C.text }]}>{request.displayName}</Text>
          <Text style={[styles.requestEmail, { color: C.textMuted }]}>{request.email}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: '#10B981' }]}
          onPress={() => handleAcceptRequest(request.userId)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, { backgroundColor: '#EF4444' }]}
          onPress={() => handleRejectRequest(request.userId)}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMember = (member: GroupChatMember & { userId: string }) => {
    const isGroupAdmin = member.userId === groupChat?.adminId;

    return (
      <View key={member.userId} style={[styles.memberItem, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
        <View style={styles.memberInfo}>
          {member.photoUrl ? (
            <Image source={{ uri: member.photoUrl }} style={styles.memberAvatar} />
          ) : (
            <View style={[styles.memberAvatar, { backgroundColor: C.tint }]}>
              <Text style={styles.avatarText}>{member.displayName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: C.text }]}>
              {member.displayName} {isGroupAdmin && '👑'}
            </Text>
            <Text style={[styles.memberEmail, { color: C.textMuted }]}>{member.email}</Text>
          </View>
        </View>
        {isAdmin && !isGroupAdmin && (
          <TouchableOpacity
            style={[styles.kickButton, { backgroundColor: '#EF4444' }]}
            onPress={() => handleKickMember(member.userId, member.displayName)}
          >
            <Text style={styles.kickButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg }]}>
        <ActivityIndicator size="large" color={C.tint} style={{ marginTop: 50 }} />
      </View>
    );
  }

  if (!groupChat) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Group Chat</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: C.text }]}>Group chat not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: C.screenBg }]}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            {groupChat.groupName} {isAdmin && '👑'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: C.textMuted }]}>
            {groupChat.memberCount} {groupChat.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity onPress={() => setShowAdminPanel(!showAdminPanel)} style={styles.adminButton}>
            <Ionicons name="settings" size={24} color={C.text} />
            {pendingRequests.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF4B4B' }]}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <ScrollView
          style={[styles.adminPanel, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}
          contentContainerStyle={styles.adminPanelContent}
        >
          {/* Join Requests */}
          {pendingRequests.length > 0 && (
            <View style={styles.adminSection}>
              <Text style={[styles.adminSectionTitle, { color: C.text }]}>
                Join Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map(renderJoinRequest)}
            </View>
          )}

          {/* Members */}
          <View style={styles.adminSection}>
            <Text style={[styles.adminSectionTitle, { color: C.text }]}>
              Members ({activeMembers.length})
            </Text>
            {activeMembers.map(renderMember)}
          </View>

          <TouchableOpacity
            style={[styles.closeAdminButton, { backgroundColor: C.surfaceSoft }]}
            onPress={() => setShowAdminPanel(false)}
          >
            <Text style={[styles.closeAdminButtonText, { color: C.text }]}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
            <Text style={[styles.emptyText, { color: C.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: C.textMuted }]}>
              Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: C.surface, borderTopColor: C.surfaceBorder }]}>
        <TextInput
          style={[styles.input, { color: C.text, backgroundColor: C.surfaceSoft }]}
          placeholder="Type a message..."
          placeholderTextColor={C.placeholder}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: messageText.trim() ? C.tint : C.surfaceSoft },
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? '#fff' : C.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  adminButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  adminPanel: {
    maxHeight: 400,
    borderBottomWidth: 1,
  },
  adminPanelContent: {
    padding: 16,
  },
  adminSection: {
    marginBottom: 24,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  kickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  kickButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeAdminButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeAdminButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
