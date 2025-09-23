import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { db, auth } from '@/config/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Colors } from '@/constants/theme';

export default function NewConversation() {
  const { userId } = useLocalSearchParams();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];
  
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipient() {
      if (!userId) {
        setError('No recipient specified');
        setLoading(false);
        return;
      }

      if (!auth.currentUser) {
        setError('You must be signed in to start a conversation');
        setLoading(false);
        return;
      }

      try {
        const recipientRef = doc(db, 'users', userId as string);
        const recipientSnap = await getDoc(recipientRef);

        if (!recipientSnap.exists()) {
          setError('Recipient not found');
          setLoading(false);
          return;
        }

        const recipientData = recipientSnap.data();
        setRecipient({
          id: recipientSnap.id,
          name: recipientData.displayName || recipientData.name || recipientData.email || 'Unknown User',
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recipient data:', err);
        setError('Failed to load recipient');
        setLoading(false);
      }
    }

    fetchRecipient();
  }, [userId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !recipient || !auth.currentUser) {
      return;
    }

    setSending(true);
    try {
      // First create a new chat document
      const newChat = await addDoc(collection(db, 'chat'), {
        userAuth: auth.currentUser.uid,
        otherUser: recipient.id,
        lastMessage: message.trim(),
        messageTime: serverTimestamp(),
        user: auth.currentUser.uid,
        propertyCreatedBy: recipient.id
      });

      // Then add the first message to the messages subcollection
      await addDoc(collection(db, `chat/${newChat.id}/messages`), {
        text: message.trim(),
        createdAt: serverTimestamp(),
        user: auth.currentUser.uid,
        read: false
      });

      // Navigate to the conversation
      router.replace({ pathname: '/conversation/[id]', params: { id: newChat.id } });
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to send message. Please try again.');
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.tint} />
        <Text style={{ color: C.textMuted, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (error || !recipient) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.error, fontSize: 16, marginBottom: 16 }}>{error || 'Failed to start conversation'}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: C.tint }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: C.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>New Message</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Recipient info */}
      <View style={[styles.recipientContainer, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
        <Text style={[styles.toLabel, { color: C.textMuted }]}>To:</Text>
        <Text style={[styles.recipientName, { color: C.text }]}>{recipient.name}</Text>
      </View>

      {/* Message input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.messageContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TextInput
          style={[styles.messageInput, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
          placeholder="Type your message..."
          placeholderTextColor={C.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          autoFocus
        />

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: message.trim() ? C.tint : C.surfaceSoft }]}
          onPress={handleSendMessage}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={message.trim() ? '#fff' : C.textMuted} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    marginBottom: 16,
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
