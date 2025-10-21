import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this post
  comments: number;
  groupChatId: string; // Associated group chat ID
  isActive: boolean;
}

export interface GroupChatMember {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: 'admin' | 'member'; // Admin is the post creator
  joinedAt: Timestamp;
  status: 'active' | 'removed';
}

export interface JoinRequest {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  requestedAt: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface GroupChat {
  id: string;
  postId: string;
  groupName: string; // "Group chat #1", "Group chat #2", etc.
  adminId: string; // User who created the post
  members: { [userId: string]: GroupChatMember };
  joinRequests: { [userId: string]: JoinRequest };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  isActive: boolean;
  memberCount: number;
  maxMembers?: number; // Optional: limit group size
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  timestamp: Timestamp;
  type: 'text';
}

class CommunityPostService {
  // Create a new community post with associated group chat
  async createPost(
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    content: string,
    userEmail: string
  ): Promise<{ postId: string; groupChatId: string }> {
    try {
      // Get the next group chat number
      const groupChatNumber = await this.getNextGroupChatNumber();

      // Create the post first
      const postData = {
        userId,
        userName,
        userPhoto: userPhoto || null,
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: 0,
        groupChatId: '', // Will be updated after group chat is created
        isActive: true,
      };

      const postRef = await addDoc(collection(db, 'community_posts'), postData);
      const postId = postRef.id;
      console.log('✅ Post created with ID:', postId);

      // Create the associated group chat
      const groupChatId = `group_${postId}`;
      console.log('Creating group chat with ID:', groupChatId);

      // Prepare member data - ensure no undefined values
      const memberData = {
        uid: userId,
        email: userEmail,
        displayName: userName,
        role: 'admin' as const,
        joinedAt: serverTimestamp(),
        status: 'active' as const,
      };

      // Only add photoUrl if it exists (avoid undefined)
      if (userPhoto) {
        (memberData as any).photoUrl = userPhoto;
      } else {
        (memberData as any).photoUrl = null;
      }

      const groupChatData = {
        postId,
        groupName: `Group chat #${groupChatNumber}`,
        adminId: userId,
        members: {
          [userId]: memberData,
        },
        joinRequests: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: '',
          timestamp: serverTimestamp(),
          senderId: '',
        },
        isActive: true,
        memberCount: 1,
      };

      console.log('Group chat data prepared:', groupChatData);

      try {
        await setDoc(doc(db, 'group_chats', groupChatId), groupChatData);
        console.log('✅ Group chat created successfully:', groupChatId);
      } catch (groupChatError) {
        console.error('❌ Error creating group chat:', groupChatError);
        throw new Error(`Failed to create group chat: ${groupChatError}`);
      }

      // Update the post with the group chat ID
      try {
        await updateDoc(postRef, {
          groupChatId,
        });
        console.log('✅ Post updated with groupChatId:', groupChatId);
      } catch (updateError) {
        console.error('❌ Error updating post with groupChatId:', updateError);
        throw new Error(`Failed to update post: ${updateError}`);
      }

      console.log('✅ Post and group chat created successfully');
      return { postId, groupChatId };
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  // Get the next group chat number (for naming)
  async getNextGroupChatNumber(): Promise<number> {
    try {
      const groupChatsQuery = query(collection(db, 'group_chats'));
      const snapshot = await getDocs(groupChatsQuery);
      return snapshot.size + 1;
    } catch (error) {
      console.error('Error getting group chat number:', error);
      return 1; // Default to 1 if error
    }
  }

  // Subscribe to all community posts
  subscribeToPosts(callback: (posts: CommunityPost[]) => void): Unsubscribe {
    try {
      // Simplified query - just order by createdAt, filter isActive in client
      const postsQuery = query(
        collection(db, 'community_posts'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          const posts: CommunityPost[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();

            // Filter out inactive posts on the client side
            if (data.isActive !== false) {
              posts.push({
                id: doc.id,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                content: data.content,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                likes: data.likes || 0,
                likedBy: data.likedBy || [],
                comments: data.comments || 0,
                groupChatId: data.groupChatId,
                isActive: data.isActive !== false,
              });
            }
          });
          callback(posts);
        },
        (error) => {
          console.error('Error listening to posts:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      return () => {};
    }
  }

  // Toggle like on a post
  async toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void> {
    try {
      const postRef = doc(db, 'community_posts', postId);

      if (isLiked) {
        // Unlike: remove user from likedBy array and decrement count
        await updateDoc(postRef, {
          likedBy: arrayRemove(userId),
          likes: increment(-1),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Like: add user to likedBy array and increment count
        await updateDoc(postRef, {
          likedBy: arrayUnion(userId),
          likes: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Request to join a group chat
  async requestToJoinGroup(
    groupChatId: string,
    userId: string,
    userName: string,
    userEmail: string,
    userPhoto?: string
  ): Promise<void> {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      const groupChatDoc = await getDoc(groupChatRef);

      if (!groupChatDoc.exists()) {
        throw new Error('Group chat not found');
      }

      const groupChatData = groupChatDoc.data() as GroupChat;

      // Check if user is already a member
      if (groupChatData.members[userId]) {
        throw new Error('You are already a member of this group');
      }

      // Check if user already has a pending request
      if (groupChatData.joinRequests[userId]?.status === 'pending') {
        throw new Error('You already have a pending request');
      }

      // Add join request (remove photoUrl if undefined to avoid Firestore error)
      const joinRequestData: any = {
        uid: userId,
        email: userEmail,
        displayName: userName,
        requestedAt: serverTimestamp(),
        status: 'pending',
      };

      // Only add photoUrl if it exists
      if (userPhoto) {
        joinRequestData.photoUrl = userPhoto;
      } else {
        joinRequestData.photoUrl = null;
      }

      await updateDoc(groupChatRef, {
        [`joinRequests.${userId}`]: joinRequestData,
        updatedAt: serverTimestamp(),
      });

      console.log('Join request sent successfully');
    } catch (error) {
      console.error('Error requesting to join group:', error);
      throw error;
    }
  }

  // Accept a join request (admin only)
  async acceptJoinRequest(groupChatId: string, requesterId: string, adminId: string): Promise<void> {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      const groupChatDoc = await getDoc(groupChatRef);

      if (!groupChatDoc.exists()) {
        throw new Error('Group chat not found');
      }

      const groupChatData = groupChatDoc.data() as GroupChat;

      // Verify the user is admin
      if (groupChatData.adminId !== adminId) {
        throw new Error('Only the admin can accept join requests');
      }

      // Get the join request
      const joinRequest = groupChatData.joinRequests[requesterId];
      if (!joinRequest) {
        throw new Error('Join request not found');
      }

      // Add user as member and update request status
      const memberData: any = {
        uid: joinRequest.uid,
        email: joinRequest.email,
        displayName: joinRequest.displayName,
        photoUrl: joinRequest.photoUrl || null,
        role: 'member',
        joinedAt: serverTimestamp(),
        status: 'active',
      };

      await updateDoc(groupChatRef, {
        [`members.${requesterId}`]: memberData,
        [`joinRequests.${requesterId}.status`]: 'accepted',
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      console.log('Join request accepted successfully');
    } catch (error) {
      console.error('Error accepting join request:', error);
      throw error;
    }
  }

  // Reject a join request (admin only)
  async rejectJoinRequest(groupChatId: string, requesterId: string, adminId: string): Promise<void> {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      const groupChatDoc = await getDoc(groupChatRef);

      if (!groupChatDoc.exists()) {
        throw new Error('Group chat not found');
      }

      const groupChatData = groupChatDoc.data() as GroupChat;

      // Verify the user is admin
      if (groupChatData.adminId !== adminId) {
        throw new Error('Only the admin can reject join requests');
      }

      // Update request status to rejected
      await updateDoc(groupChatRef, {
        [`joinRequests.${requesterId}.status`]: 'rejected',
        updatedAt: serverTimestamp(),
      });

      console.log('Join request rejected successfully');
    } catch (error) {
      console.error('Error rejecting join request:', error);
      throw error;
    }
  }

  // Get group chat details
  async getGroupChat(groupChatId: string): Promise<GroupChat> {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      const groupChatDoc = await getDoc(groupChatRef);

      if (groupChatDoc.exists()) {
        const data = groupChatDoc.data();
        return { id: groupChatId, ...data } as GroupChat;
      } else {
        throw new Error('Group chat not found');
      }
    } catch (error) {
      console.error('Error getting group chat:', error);
      throw error;
    }
  }

  // Subscribe to group chat (to listen for updates)
  subscribeToGroupChat(groupChatId: string, callback: (groupChat: GroupChat | null) => void): Unsubscribe {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);

      const unsubscribe = onSnapshot(
        groupChatRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            callback({ id: snapshot.id, ...data } as GroupChat);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to group chat:', error);
          callback(null);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up group chat listener:', error);
      return () => {};
    }
  }

  // Subscribe to user's group chats (where they are a member or admin)
  subscribeToUserGroupChats(userId: string, callback: (groupChats: GroupChat[]) => void): Unsubscribe {
    try {
      // Simplified query - just filter by membership status
      // We'll sort manually on the client side to avoid composite index requirement
      const groupChatsQuery = query(
        collection(db, 'group_chats'),
        where(`members.${userId}.status`, '==', 'active')
      );

      const unsubscribe = onSnapshot(
        groupChatsQuery,
        (snapshot) => {
          const groupChats: GroupChat[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            groupChats.push({
              id: doc.id,
              ...data
            } as GroupChat);
          });

          // Sort manually by updatedAt (newest first)
          groupChats.sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(0);
            const bTime = b.updatedAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });

          callback(groupChats);
        },
        (error) => {
          console.error('Error listening to group chats:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up group chats listener:', error);
      return () => {};
    }
  }

  // Remove member from group (admin only)
  async removeMember(groupChatId: string, memberId: string, adminId: string): Promise<void> {
    try {
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      const groupChatDoc = await getDoc(groupChatRef);

      if (!groupChatDoc.exists()) {
        throw new Error('Group chat not found');
      }

      const groupChatData = groupChatDoc.data() as GroupChat;

      // Verify the user is admin
      if (groupChatData.adminId !== adminId) {
        throw new Error('Only the admin can remove members');
      }

      // Cannot remove admin
      if (memberId === adminId) {
        throw new Error('Admin cannot be removed');
      }

      // Update member status to removed
      await updateDoc(groupChatRef, {
        [`members.${memberId}.status`]: 'removed',
        memberCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      console.log('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Subscribe to group chat messages
  subscribeToGroupMessages(
    groupChatId: string,
    callback: (messages: GroupMessage[]) => void
  ): Unsubscribe {
    try {
      const messagesQuery = query(
        collection(db, 'group_chats', groupChatId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messages: GroupMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderPhoto: data.senderPhoto || null,
              text: data.text,
              timestamp: data.timestamp,
              type: data.type || 'text',
            });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to group messages:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up group messages listener:', error);
      return () => {};
    }
  }

  // Send a message to a group chat
  async sendGroupMessage(
    groupChatId: string,
    senderId: string,
    senderName: string,
    senderPhoto: string | null | undefined,
    text: string
  ): Promise<string> {
    try {
      const messageData = {
        senderId,
        senderName,
        senderPhoto: senderPhoto || null,
        text: text.trim(),
        timestamp: serverTimestamp(),
        type: 'text',
      };

      // Add message to messages subcollection
      const messagesCollection = collection(db, 'group_chats', groupChatId, 'messages');
      const messageDoc = await addDoc(messagesCollection, messageData);

      // Update group chat's lastMessage and updatedAt
      const groupChatRef = doc(db, 'group_chats', groupChatId);
      await updateDoc(groupChatRef, {
        lastMessage: {
          text: text.trim(),
          timestamp: serverTimestamp(),
          senderId,
        },
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Group message sent successfully:', messageDoc.id);
      return messageDoc.id;
    } catch (error) {
      console.error('❌ Error sending group message:', error);
      throw error;
    }
  }

  // Delete a post (soft delete)
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'community_posts', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();

      // Verify the user is the post owner
      if (postData.userId !== userId) {
        throw new Error('You can only delete your own posts');
      }

      // Mark post as inactive
      await updateDoc(postRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      // Also mark the associated group chat as inactive
      if (postData.groupChatId) {
        const groupChatRef = doc(db, 'group_chats', postData.groupChatId);
        await updateDoc(groupChatRef, {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

// Export singleton instance
const communityPostService = new CommunityPostService();
export default communityPostService;
