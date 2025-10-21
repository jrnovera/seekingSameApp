import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import commentService from '@/services/commentService';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  text: string;
  timestamp: Date;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  listingDescription?: string;
  userName?: string;
  userPhoto?: string;
}

export default function CommentsModal({
  visible,
  onClose,
  listingId,
  listingTitle,
  listingImage,
  listingDescription,
  userName = 'User',
  userPhoto,
}: CommentsModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { userDoc } = useAuth();

  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to comments when modal opens
  useEffect(() => {
    if (!visible || !listingId) return;

    setIsLoading(true);
    const unsubscribe = commentService.subscribeToComments(listingId, (fetchedComments) => {
      // Convert Timestamp to Date
      const commentsWithDates = fetchedComments.map(comment => ({
        ...comment,
        timestamp: comment.createdAt instanceof Timestamp
          ? comment.createdAt.toDate()
          : new Date(),
      }));
      setComments(commentsWithDates);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [visible, listingId]);

  const handleSubmitComment = async () => {
    if (!comment.trim() || !userDoc || !listingId) return;

    setIsSubmitting(true);

    try {
      await commentService.addComment(
        listingId,
        userDoc.uid,
        userDoc.display_name,
        userDoc.photo_url || null,
        comment.trim()
      );

      setComment('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isCurrentUser = item.userId === userDoc?.uid;
    
    return (
      <View style={styles.commentContainer}>
        {item.userPhoto ? (
          <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: C.tint }]}>
            <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
          </View>
        )}
        
        <View style={styles.commentContent}>
          <Text style={[styles.commentUserName, { color: C.text }]}>
            {item.userName}
            {isCurrentUser && (
              <Text style={[styles.currentUserTag, { color: C.tint }]}> (You)</Text>
            )}
          </Text>
          <Text style={[styles.commentText, { color: C.text }]}>{item.text}</Text>
          <Text style={[styles.timestamp, { color: C.textMuted }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.container, { backgroundColor: C.screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={C.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: C.text }]}>Post</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* Post header with user info */}
            <View style={[styles.postHeader, { borderBottomColor: C.surfaceBorder }]}>
              <View style={styles.userInfoRow}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.userAvatar} />
                ) : (
                  <View style={[styles.userAvatar, { backgroundColor: C.tint }]}>
                    <Text style={styles.avatarText}>{userName?.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.userNameContainer}>
                  <Text style={[styles.userName, { color: C.text }]}>{userName}</Text>
                  <Text style={[styles.userSubtitle, { color: C.textMuted }]}>@sophia</Text>
                </View>
              </View>
              
              {/* Listing title and description */}
              <Text style={[styles.listingTitle, { color: C.text }]} numberOfLines={2}>
                {listingTitle}
              </Text>
              
              <Text style={[styles.listingDescription, { color: C.text }]} numberOfLines={4}>
                {listingDescription}
              </Text>
              
              {/* Listing image if available */}
              {listingImage && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: listingImage }} 
                    style={styles.listingImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              {/* Action buttons - Share button hidden as requested */}
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <AntDesign name="heart" size={18} color="#FF4B4B" />
                  <Text style={[styles.actionText, { color: C.textMuted }]}>22</Text>
                </View>

                <View style={styles.actionButton}>
                  <AntDesign name="message" size={18} color={C.textMuted} />
                  <Text style={[styles.actionText, { color: C.textMuted }]}>{comments.length}</Text>
                </View>

                {/* Share button hidden for now */}
                {/* <TouchableOpacity style={styles.messageIconButton}>
                  <Ionicons name="paper-plane-outline" size={18} color={C.textMuted} />
                </TouchableOpacity> */}
              </View>
            </View>

            {/* Comments section */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.commentsHeader, { color: C.text }]}>Comments</Text>
              {isLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={C.tint} />
                  <Text style={[styles.emptySubtext, { color: C.textMuted, marginTop: 12 }]}>
                    Loading comments...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.commentsContainer}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="chatbubble-outline" size={64} color={C.textMuted} />
                      <Text style={[styles.emptyText, { color: C.text }]}>No comments yet</Text>
                      <Text style={[styles.emptySubtext, { color: C.textMuted }]}>
                        Be the first to comment
                      </Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Comment input */}
            <View style={[styles.inputContainer, { backgroundColor: C.surface, borderTopColor: C.surfaceBorder }]}>
              <TextInput
                style={[styles.input, { color: C.text, backgroundColor: C.surfaceSoft }]}
                placeholder="Add a comment..."
                placeholderTextColor={C.placeholder}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: comment.trim() ? C.tint : C.surfaceSoft }
                ]}
                onPress={handleSubmitComment}
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={comment.trim() ? '#fff' : C.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  messageIconButton: {
    marginLeft: 'auto',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  commentsContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  currentUserTag: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    maxHeight: 80,
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
    paddingVertical: 40,
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
