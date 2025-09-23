import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

// Simple message type
type Message = {
  id: string;
  text: string;
  sent: boolean;
  timestamp: Date;
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  const auth = getAuth();

  // Load messages with proper error handling and ensure chat exists
  useEffect(() => {
    if (!id || !auth.currentUser) {
      setLoading(false);
      return;
    }

    console.log('Loading messages for chat:', id);

    const initializeChat = async () => {
      try {
        // Check if chat document exists
        const chatRef = doc(db, 'chat', id as string);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
          console.log('Chat document does not exist when loading conversation');
          // We could create it here, but it's better to create it when sending the first message
          // This way we have the proper context from the property details page
        }

        // Query messages for this specific chat
        const messagesQuery = query(
          collection(db, 'message'),
          where('chatRef', '==', id),
          orderBy('messageTime', 'asc')
        );

        const unsubscribe = onSnapshot(
          messagesQuery, 
          (snapshot) => {
            console.log('Messages snapshot received, count:', snapshot.docs.length);
            const messagesList: Message[] = [];
            
            snapshot.forEach((docSnapshot) => {
              try {
                const data = docSnapshot.data();
                
                if (!data) {
                  console.warn('Empty message data for doc:', docSnapshot.id);
                  return;
                }

                const currentUserId = auth.currentUser?.uid;
                
                // Safe timestamp handling
                let messageTime = new Date();
                try {
                  if (data.messageTime && typeof data.messageTime === 'object' && data.messageTime.toDate) {
                    messageTime = data.messageTime.toDate();
                  } else if (data.messageTime) {
                    messageTime = new Date(data.messageTime);
                  }
                } catch (timeError) {
                  console.warn('Error parsing timestamp for message:', docSnapshot.id, timeError);
                }
                
                messagesList.push({
                  id: docSnapshot.id,
                  text: data.message || '',
                  sent: data.messageOwner === currentUserId,
                  timestamp: messageTime
                });
              } catch (docError) {
                console.error('Error processing message document:', docSnapshot.id, docError);
              }
            });
            
            setMessages(messagesList);
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to messages:', error);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
        return null;
      }
    };

    let unsubscribe: (() => void) | null = null;
    
    initializeChat().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
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

      // First, ensure the chat document exists
      const chatRef = doc(db, 'chat', id as string);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        console.log('Chat document does not exist, creating it...');
        
        // Create the chat document following the exact schema
        await setDoc(chatRef, {
          userAuth: auth.currentUser.uid,        // Doc Reference (users)
          otherUser: 'unknown',                  // Doc Reference (users) - should be passed from navigation
          lastMessage: messageText,              // String
          messageTime: serverTimestamp(),        // DateTime
          user: auth.currentUser.uid,            // Doc Reference (users)
          propertyCreatedBy: 'unknown'           // Doc Reference (users) - should be passed from property
        });
        
        console.log('Chat document created successfully');
      }

      // Now add the message to Firestore following the exact schema
      const messageDoc = await addDoc(collection(db, 'message'), {
        messageOwner: auth.currentUser.uid,    // Doc Reference (users)
        chatRef: id,                           // Doc Reference (chat)
        message: messageText,                  // String
        imagePath: null,                       // Image Path (optional)
        messageTime: serverTimestamp()         // DateTime
      });

      console.log('Message sent successfully:', messageDoc.id);

      // Update chat with last message
      try {
        await updateDoc(chatRef, {
          lastMessage: messageText,
          messageTime: serverTimestamp()
        });
        console.log('Chat document updated successfully');
      } catch (chatUpdateError) {
        console.warn('Failed to update chat document:', chatUpdateError);
        // Don't fail the whole operation if chat update fails
      }

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

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sent ? styles.sentMessage : styles.receivedMessage
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: item.sent ? C.tint : C.surface,
          borderColor: C.surfaceBorder
        }
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.sent ? '#fff' : C.text }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: item.sent ? 'rgba(255,255,255,0.7)' : C.textMuted }
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

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
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
