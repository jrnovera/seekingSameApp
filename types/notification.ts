export interface Notification {
  id: string;
  userId: string; // The user who should receive the notification
  fromUserId?: string; // The user who triggered the notification
  fromUserName?: string;
  fromUserAvatar?: string;
  type: 'chat_message' | 'property_inquiry' | 'booking_request' | 'system';
  title: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  chatId?: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>; // Additional data
}

export interface NotificationBadge {
  unreadCount: number;
  hasUnread: boolean;
}