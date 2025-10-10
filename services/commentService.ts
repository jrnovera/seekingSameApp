import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  text: string;
  createdAt: Timestamp;
}

class CommentService {
  // Add a comment to a post
  async addComment(
    postId: string,
    userId: string,
    userName: string,
    userPhoto: string | null | undefined,
    text: string
  ): Promise<string> {
    try {
      const commentData = {
        postId,
        userId,
        userName,
        userPhoto: userPhoto || null,
        text: text.trim(),
        createdAt: serverTimestamp(),
      };

      // Add comment to comments subcollection
      const commentsRef = collection(db, 'community_posts', postId, 'comments');
      const commentDoc = await addDoc(commentsRef, commentData);

      // Increment comment count on the post
      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        comments: increment(1),
      });

      console.log('✅ Comment added successfully:', commentDoc.id);
      return commentDoc.id;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  }

  // Subscribe to comments for a post
  subscribeToComments(
    postId: string,
    callback: (comments: Comment[]) => void
  ): Unsubscribe {
    try {
      const commentsQuery = query(
        collection(db, 'community_posts', postId, 'comments'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const comments: Comment[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
              id: doc.id,
              postId: data.postId,
              userId: data.userId,
              userName: data.userName,
              userPhoto: data.userPhoto,
              text: data.text,
              createdAt: data.createdAt,
            });
          });
          callback(comments);
        },
        (error) => {
          console.error('❌ Error listening to comments:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up comments listener:', error);
      return () => {};
    }
  }
}

// Export singleton instance
const commentService = new CommentService();
export default commentService;
