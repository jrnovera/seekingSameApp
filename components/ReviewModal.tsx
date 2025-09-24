import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import reviewService, { ReviewInput } from '@/services/reviewService';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  userName: string;
  userEmail?: string;
  onReviewAdded?: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  propertyId,
  propertyTitle,
  userId,
  userName,
  userEmail,
  onReviewAdded
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters in your review comment.');
      return;
    }

    try {
      setLoading(true);

      const reviewInput: ReviewInput = {
        propertyId,
        userId,
        userName,
        userEmail,
        rating,
        comment: comment.trim()
      };

      await reviewService.addReview(reviewInput);

      Alert.alert(
        'Review Submitted',
        'Thank you for your review! It will help other users make informed decisions.',
        [
          {
            text: 'OK',
            onPress: () => {
              setRating(0);
              setComment('');
              onClose();
              onReviewAdded?.();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (rating > 0 || comment.trim().length > 0) {
      Alert.alert(
        'Discard Review',
        'Are you sure you want to discard your review?',
        [
          { text: 'Continue Writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setComment('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={32}
            color={i <= rating ? '#FFD700' : C.textMuted}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Terrible';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select rating';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: C.screenBg }]}
      >
        <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Write a Review</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.propertyInfo}>
            <Text style={[styles.propertyTitle, { color: C.text }]}>{propertyTitle}</Text>
            <Text style={[styles.reviewPrompt, { color: C.textMuted }]}>
              How was your experience with this property?
            </Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Rating</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={[styles.ratingText, { color: rating > 0 ? '#FFD700' : C.textMuted }]}>
              {getRatingText(rating)}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Your Review</Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: C.surface,
                  borderColor: C.surfaceBorder,
                  color: C.text
                }
              ]}
              placeholder="Share your experience with this property..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: C.textMuted }]}>
              {comment.length}/500 characters
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: C.surfaceBorder }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: rating > 0 && comment.trim().length >= 10 ? '#3c95a6' : C.surfaceSoft,
                opacity: loading ? 0.7 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || comment.trim().length < 10 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.submitButtonText,
                  {
                    color: rating > 0 && comment.trim().length >= 10 ? '#fff' : C.textMuted
                  }
                ]}
              >
                Submit Review
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  propertyInfo: {
    marginBottom: 32,
    alignItems: 'center',
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  reviewPrompt: {
    fontSize: 16,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});