import conversationService from '@/services/conversationService';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import type { Message, Conversation } from '@/services/conversationService';

// Using Message type from conversationService

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  const auth = getAuth();

  // Load conversation and messages
  useEffect(() => {
    if (!id || !auth.currentUser) {
      setLoading(false);
      return;
    }

    console.log('Loading conversation:', id);

    const loadConversation = async () => {
      try {
        const conv = await conversationService.getConversation(id as string);
        setConversation(conv);
      } catch (error) {
        console.error('Error loading conversation:', error);
        setError('Conversation not found or no longer exists');
        setLoading(false); // Make sure to stop loading even on error
      }
    };

    loadConversation();

    // Subscribe to messages
    const unsubscribe = conversationService.subscribeToMessages(
      id as string,
      (messagesList: Message[]) => {
        console.log('Messages received:', messagesList.length);
        setMessages(messagesList);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [id, auth.currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser || !id) {
      console.warn('Cannot send message: missing required data');
      return;
    }

    const messageText = newMessage.trim();
    console.log('Sending message:', messageText);

    try {
      // Clear input immediately for better UX
      setNewMessage('');

      await conversationService.sendMessage(id as string, auth.currentUser.uid, messageText);
      console.log('Message sent successfully');

    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message text if sending failed
      setNewMessage(messageText);
      // Could show an alert here if needed
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === auth.currentUser?.uid;
    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.sentMessage : styles.receivedMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isOwn ? C.tint : C.surface,
            borderColor: C.surfaceBorder
          }
        ]}>
          {item.imagePath ? (
            <Image source={{ uri: item.imagePath }} style={styles.messageImage} />
          ) : (
            <Text style={[
              styles.messageText,
              { color: isOwn ? '#fff' : C.text }
            ]}>
              {item.text}
            </Text>
          )}
          <Text style={[
            styles.messageTime,
            { color: isOwn ? 'rgba(255,255,255,0.7)' : C.textMuted }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
        {/* Simple Header */}
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Chat</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="chatbubble-outline" size={64} color={C.textMuted} />
          <Text style={[styles.errorTitle, { color: C.text }]}>Conversation Not Found</Text>
          <Text style={[styles.errorMessage, { color: C.textMuted }]}>
            This conversation no longer exists or you don't have access to it.
          </Text>
          <TouchableOpacity
            style={[styles.backToChatsButton, { backgroundColor: C.tint }]}
            onPress={() => router.replace('/(tabs)/chat')}
          >
            <Text style={styles.backToChatsButtonText}>Back to Conversations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Simple Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            {conversation ? conversationService.getOtherParticipant(conversation, auth.currentUser?.uid || '')?.displayName || 'Chat' : 'Chat'}
          </Text>
          {conversation && (
            <Text style={[styles.propertySubtitle, { color: C.textMuted }]}>
              {conversation.propertyTitle}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyText, { color: C.text }]}>No messages yet</Text>
          <Text style={[styles.emptySubtext, { color: C.textMuted }]}>Start the conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
        />
      )}

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: C.surface, borderTopColor: C.surfaceBorder }]}>
          <TextInput
            style={[styles.input, { backgroundColor: C.screenBg, color: C.text, borderColor: C.surfaceBorder, maxHeight: 100 }]}
            placeholder="Type a message..."
            placeholderTextColor={C.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: C.tint }]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  propertySubtitle: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backToChatsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backToChatsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  messageImage: {
    maxWidth: 200,
    maxHeight: 200,
    borderRadius: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
