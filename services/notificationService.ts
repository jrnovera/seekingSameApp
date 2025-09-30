import { db } from '@/config/firebase';
import { Notification } from '@/types/notification';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  },

  /**
   * Get notifications for a specific user
   */
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  },

  /**
   * Listen to real-time notifications for a user
   */
  listenToUserNotifications(
    userId: string,
    onNotifications: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      // Use simple query without orderBy to avoid index requirement
      // We'll sort manually after fetching
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          try {
            const notifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Notification[];

            // Sort manually by createdAt in descending order (newest first)
            notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Always call the callback, even with empty array
            onNotifications(notifications);
          } catch (err) {
            console.error('Error processing notifications:', err);
            // Return empty array instead of throwing error
            onNotifications([]);
          }
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          // Return empty array instead of throwing error for better UX
          onNotifications([]);
          // Still call onError for debugging but don't break the app
          onError?.(error instanceof Error ? error : new Error('Failed to listen to notifications'));
        }
      );
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      // Return empty array for initial state
      onNotifications([]);
      onError?.(error instanceof Error ? error : new Error('Failed to set up notifications listener'));
      return () => {}; // Return empty unsubscribe function
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);

      const updatePromises = snapshot.docs.map(docSnapshot =>
        updateDoc(doc(db, 'notifications', docSnapshot.id), {
          isRead: true,
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  },

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Listen to unread notification count for a user
   */
  listenToUnreadCount(
    userId: string,
    onCountChange: (count: number) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          try {
            onCountChange(snapshot.size);
          } catch (err) {
            console.error('Error processing unread count:', err);
            // Default to 0 instead of throwing error
            onCountChange(0);
          }
        },
        (error) => {
          console.error('Error listening to unread count:', error);
          // Default to 0 instead of throwing error for better UX
          onCountChange(0);
          onError?.(error instanceof Error ? error : new Error('Failed to listen to unread count'));
        }
      );
    } catch (error) {
      console.error('Error setting up unread count listener:', error);
      // Default to 0 for initial state
      onCountChange(0);
      onError?.(error instanceof Error ? error : new Error('Failed to set up unread count listener'));
      return () => {}; // Return empty unsubscribe function
    }
  },

  /**
   * Helper function to create a chat message notification
   */
  async createChatMessageNotification(
    userId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserAvatar: string | undefined,
    message: string,
    chatId: string,
    propertyId?: string,
    propertyTitle?: string
  ): Promise<string> {
    return this.createNotification({
      userId,
      fromUserId,
      fromUserName,
      fromUserAvatar,
      type: 'chat_message',
      title: 'New Message',
      message: `${fromUserName}: ${message}`,
      propertyId,
      propertyTitle,
      chatId,
      isRead: false,
    });
  },

  /**
   * Helper function to create a property inquiry notification
   */
  async createPropertyInquiryNotification(
    userId: string,
    fromUserId: string,
    fromUserName: string,
    propertyId: string,
    propertyTitle: string,
    message: string
  ): Promise<string> {
    return this.createNotification({
      userId,
      fromUserId,
      fromUserName,
      type: 'property_inquiry',
      title: 'Property Inquiry',
      message,
      propertyId,
      propertyTitle,
      isRead: false,
    });
  },

  /**
   * Helper function to create a booking request notification
   */
  async createBookingRequestNotification(
    userId: string,
    fromUserId: string,
    fromUserName: string,
    propertyId: string,
    propertyTitle: string,
    message: string
  ): Promise<string> {
    return this.createNotification({
      userId,
      fromUserId,
      fromUserName,
      type: 'booking_request',
      title: 'Booking Request',
      message,
      propertyId,
      propertyTitle,
      isRead: false,
    });
  },

  /**
   * Helper function to create a system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<string> {
    return this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      isRead: false,
      data,
    });
  },
};