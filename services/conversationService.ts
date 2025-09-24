import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Participant {
  uid: string;
  email: string;
  displayName: string;
  role: 'host' | 'user';
  joinedAt: Timestamp;
}

export interface LastMessage {
  text: string;
  timestamp: Timestamp;
  senderId: string;
}

export interface Conversation {
  id: string;
  participants: { [userId: string]: Participant };
  propertyId: string;
  propertyTitle: string;
  lastMessage: LastMessage;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  imagePath?: string;
  timestamp: Date;
  type: 'text' | 'image';
}

export interface UserInfo {
  uid: string;
  email?: string;
  display_name?: string;
  name?: string;
}

class ConversationService {
  // Create or get existing conversation between host and user for a specific property
  async getOrCreateConversation(
    hostId: string,
    userId: string,
    propertyId: string,
    propertyTitle: string,
    userInfo: UserInfo,
    hostInfo: UserInfo
  ): Promise<Conversation> {
    try {
      // Create a deterministic conversation ID based on participants and property
      const conversationId = this.generateConversationId(hostId, userId, propertyId);
      const conversationRef = doc(db, 'conversations', conversationId);

      // Check if conversation already exists
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        console.log('Conversation already exists:', conversationId);
        const data = conversationDoc.data();
        return { id: conversationId, ...data } as Conversation;
      }

      // Create new conversation
      const conversationData = {
        id: conversationId,
        participants: {
          [hostId]: {
            uid: hostId,
            email: hostInfo.email || '',
            displayName: hostInfo.display_name || hostInfo.name || 'Host',
            role: 'host' as const,
            joinedAt: serverTimestamp()
          },
          [userId]: {
            uid: userId,
            email: userInfo.email || '',
            displayName: userInfo.display_name || userInfo.name || 'User',
            role: 'user' as const,
            joinedAt: serverTimestamp()
          }
        },
        propertyId: propertyId,
        propertyTitle: propertyTitle || 'Property',
        lastMessage: {
          text: '',
          timestamp: serverTimestamp(),
          senderId: ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      await setDoc(conversationRef, conversationData);
      console.log('New conversation created:', conversationId);

      return { id: conversationId, ...conversationData } as Conversation;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  // Generate deterministic conversation ID
  generateConversationId(hostId: string, userId: string, propertyId: string): string {
    // Sort participant IDs to ensure consistent ID generation
    const sortedParticipants = [hostId, userId].sort();
    return `${sortedParticipants[0]}_${sortedParticipants[1]}_${propertyId}`;
  }

  // Subscribe to conversations for a specific user (host or regular user)
  subscribeToUserConversations(userId: string, callback: (conversations: Conversation[]) => void): Unsubscribe {
    try {
      // Query conversations where user is a participant
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where(`participants.${userId}.uid`, '==', userId),
        where('isActive', '==', true)
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const conversations: Conversation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            conversations.push({
              id: doc.id,
              ...data
            } as Conversation);
          });

          // Sort conversations by updatedAt manually
          conversations.sort((a, b) => {
            const aTime = a.updatedAt?.toDate() || new Date(0);
            const bTime = b.updatedAt?.toDate() || new Date(0);
            return bTime.getTime() - aTime.getTime(); // Newest first
          });

          callback(conversations);
        },
        (error) => {
          console.error('Error listening to conversations:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }

  // Subscribe to messages in a specific conversation
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): Unsubscribe {
    try {
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messages: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              senderId: data.senderId,
              text: data.text,
              imagePath: data.imagePath || undefined,
              timestamp: data.timestamp?.toDate() || new Date(),
              type: data.type || 'text'
            });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to messages:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }

  // Send a message to a conversation
  async sendMessage(conversationId: string, senderId: string, text: string, imagePath?: string): Promise<string> {
    try {
      const messageData: any = {
        senderId: senderId,
        text: text,
        timestamp: serverTimestamp(),
        type: imagePath ? 'image' : 'text'
      };

      if (imagePath) {
        messageData.imagePath = imagePath;
      }

      // Add message to messages subcollection
      const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
      const messageDoc = await addDoc(messagesCollection, messageData);

      // Update conversation's lastMessage and updatedAt
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          text: text,
          timestamp: serverTimestamp(),
          senderId: senderId
        },
        updatedAt: serverTimestamp()
      });

      console.log('Message sent successfully:', messageDoc.id);
      return messageDoc.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get conversation details
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        return { id: conversationId, ...data } as Conversation;
      } else {
        throw new Error('Conversation not found');
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Mark conversation as inactive (soft delete)
  async deactivateConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      console.log('Conversation deactivated:', conversationId);
    } catch (error) {
      console.error('Error deactivating conversation:', error);
      throw error;
    }
  }

  // Get conversations for a specific property (useful for hosts to see all inquiries)
  subscribeToPropertyConversations(propertyId: string, callback: (conversations: Conversation[]) => void): Unsubscribe {
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('propertyId', '==', propertyId),
        where('isActive', '==', true)
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const conversations: Conversation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            conversations.push({
              id: doc.id,
              ...data
            } as Conversation);
          });

          // Sort conversations by updatedAt manually
          conversations.sort((a, b) => {
            const aTime = a.updatedAt?.toDate() || new Date(0);
            const bTime = b.updatedAt?.toDate() || new Date(0);
            return bTime.getTime() - aTime.getTime(); // Newest first
          });

          callback(conversations);
        },
        (error) => {
          console.error('Error listening to property conversations:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up property conversations listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }

  // Helper method to get other participant info from conversation
  getOtherParticipant(conversation: Conversation, currentUserId: string): Participant | null {
    const participants = conversation.participants || {};
    const participantIds = Object.keys(participants);
    const otherUserId = participantIds.find(id => id !== currentUserId);
    return otherUserId ? participants[otherUserId] : null;
  }

  // Helper method to format conversation for display in chat list
  formatConversationForDisplay(conversation: Conversation, currentUserId: string) {
    const otherParticipant = this.getOtherParticipant(conversation, currentUserId);
    const lastMessage = conversation.lastMessage || {} as LastMessage;

    return {
      id: conversation.id,
      otherUser: otherParticipant,
      propertyTitle: conversation.propertyTitle,
      propertyId: conversation.propertyId,
      lastMessage: lastMessage.text || '',
      messageTime: lastMessage.timestamp?.toDate() || new Date(),
      isFromCurrentUser: lastMessage.senderId === currentUserId,
      participants: conversation.participants
    };
  }

}

// Export singleton instance
const conversationService = new ConversationService();
export default conversationService;