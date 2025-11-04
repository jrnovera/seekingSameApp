import { Colors } from "@/constants/theme";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
// Only using collection from firestore
// RemoteImage is not used in this file
// import RemoteImage from '@/components/remote-image';
import CommentsModal from "@/components/CommentsModal";
import UserProfile from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import communityPostService from "@/services/communityPostService";
import { Timestamp } from "firebase/firestore";

// New interface for community posts (text-only)
interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: Date | Timestamp;
  likes?: number;
  likedBy?: string[];
  comments?: number;
  groupChatId?: string;
}

// Keep the old interface commented out for reference
/*
type ListingType = 'room' | 'roommate' | 'apartment';

interface CommunityListing {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description?: string;
  location: string;
  price: number | string;
  type: ListingType;
  imageUrl?: string;
  createdAt: Date;
  likes?: number;
  comments?: number;
}
*/

export default function Community() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const { userDoc } = useAuth();

  // Updated state for posts instead of listings
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserPhoto, setSelectedUserPhoto] = useState<string | null>(
    null
  );

  // Create Post Modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Sample data commented out - will be replaced with actual data from Firestore
  /*
  const sampleListings: CommunityListing[] = [
    // ... sample data kept for reference but not used
  ];
  */

  // Start entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  // Load posts from Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = communityPostService.subscribeToPosts(
      (fetchedPosts) => {
        // Convert Timestamp to Date for display
        const postsWithDates = fetchedPosts.map((post) => ({
          ...post,
          createdAt:
            post.createdAt instanceof Timestamp
              ? post.createdAt.toDate()
              : new Date(),
        }));
        setPosts(postsWithDates);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleToggleLike = async (postId: string) => {
    if (!userDoc?.uid) return;

    const isCurrentlyLiked = likedPosts.has(postId);

    // Optimistically update UI
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      // Update in Firestore
      await communityPostService.toggleLike(
        postId,
        userDoc.uid,
        isCurrentlyLiked
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleJoinGroup = async (post: CommunityPost) => {
    if (!userDoc || !post.groupChatId) return;

    // Check if user is the post owner
    if (post.userId === userDoc.uid) {
      alert("You are the owner of this group chat!");
      return;
    }

    try {
      await communityPostService.requestToJoinGroup(
        post.groupChatId,
        userDoc.uid,
        userDoc.display_name,
        userDoc.email,
        userDoc.photo_url || undefined
      );

      alert("Join request sent! The group admin will review your request.");
    } catch (error: any) {
      console.error("Error requesting to join group:", error);
      alert(error.message || "Failed to send join request. Please try again.");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !userDoc) return;

    try {
      // Create post with group chat
      const { postId, groupChatId } = await communityPostService.createPost(
        userDoc.uid,
        userDoc.display_name,
        userDoc.photo_url || undefined,
        newPostContent.trim(),
        userDoc.email
      );

      console.log("Post created successfully:", postId);
      console.log("Group chat created:", groupChatId);

      // Close modal and clear input
      setShowCreatePostModal(false);
      setNewPostContent("");

      // Show success message (optional - you could add a toast/alert here)
      alert(
        "Post created successfully! A group chat has been created for this post."
      );
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const handleOpenCreatePost = () => {
    setShowCreatePostModal(true);
  };

  // Check if current user has liked posts
  useEffect(() => {
    if (userDoc?.uid && posts.length > 0) {
      const likedPostIds = new Set<string>();
      posts.forEach((post) => {
        if (post.likedBy?.includes(userDoc.uid)) {
          likedPostIds.add(post.id);
        }
      });
      setLikedPosts(likedPostIds);
    }
  }, [posts, userDoc?.uid]);

  // Updated render function for posts (text-only, no images)
  const renderPostItem = ({ item }: { item: CommunityPost }) => {
    const isLiked = likedPosts.has(item.id);

    // Calculate time ago (simplified)
    const getTimeAgo = (date: Date | Timestamp) => {
      const actualDate = date instanceof Timestamp ? date.toDate() : date;
      const now = new Date();
      const diffInMs = now.getTime() - actualDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays === 1) return "1 day ago";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      return actualDate.toLocaleDateString();
    };

    return (
      <View style={[styles.listingCard, { backgroundColor: C.screenBg }]}>
        {/* User info row */}
        <View style={styles.userInfoRow}>
          <TouchableOpacity
            onPress={() => {
              setSelectedUserId(item.userId);
              setSelectedUserName(item.userName);
              setSelectedUserPhoto(item.userPhoto || null);
              setShowUserProfile(true);
            }}
          >
            {item.userPhoto ? (
              <Image
                source={{ uri: item.userPhoto }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: C.tint }]}>
                <Text style={styles.userInitial}>
                  {item.userName.charAt(0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: C.text }]}>
              {item.userName}
            </Text>
            <Text style={[styles.listingType, { color: C.textMuted }]}>
              {getTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Post content (text only) */}
        <Text style={[styles.postContent, { color: C.text }]}>
          {item.content}
        </Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleLike(item.id)}
          >
            <AntDesign
              name="heart"
              size={20}
              color={isLiked ? "#FF4B4B" : C.textMuted}
            />
            <Text style={[styles.actionText, { color: C.textMuted }]}>
              {item.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPost(item);
              setShowCommentsModal(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={C.textMuted} />
            <Text style={[styles.actionText, { color: C.textMuted }]}>
              {item.comments || 0}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* Only show Join Group button if the current user is NOT the post owner */}
          {item.userId !== userDoc?.uid && (
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: "#8B5CF6" }]}
              onPress={() => handleJoinGroup(item)}
            >
              <Text style={styles.messageButtonText}>Join Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render the list of posts
  const renderPosts = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>
            Loading posts...
          </Text>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
          <Text style={[styles.emptyText, { color: C.text }]}>
            No posts yet
          </Text>
          <Text style={[styles.emptySubtext, { color: C.textMuted }]}>
            Be the first to share something!
          </Text>
        </View>
      );
    }

    return posts.map((item) => (
      <View key={item.id}>{renderPostItem({ item })}</View>
    ));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: C.screenBg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: C.screenBg }]}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Community</Text>
        </View>

        {/* "What's on your mind?" Input */}
        <TouchableOpacity
          style={[
            styles.createPostContainer,
            { backgroundColor: C.surface, borderColor: C.surfaceBorder },
          ]}
          onPress={handleOpenCreatePost}
        >
          <View style={styles.createPostRow}>
            {userDoc?.photo_url ? (
              <Image
                source={{ uri: userDoc.photo_url }}
                style={styles.userAvatarSmall}
              />
            ) : (
              <View
                style={[styles.userAvatarSmall, { backgroundColor: C.tint }]}
              >
                <Text style={styles.userInitialSmall}>
                  {userDoc?.display_name?.charAt(0) || "U"}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.createPostInput,
                { backgroundColor: C.screenBg, borderColor: C.surfaceBorder },
              ]}
            >
              <Text
                style={[styles.createPostPlaceholder, { color: C.textMuted }]}
              >
                What's on your mind?
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Posts */}
        <View style={styles.listingsContainer}>{renderPosts()}</View>
      </ScrollView>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePostModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: C.surfaceBorder },
                ]}
              >
                <TouchableOpacity onPress={() => setShowCreatePostModal(false)}>
                  <Ionicons name="close" size={28} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: C.text }]}>
                  Create Post
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim()}
                >
                  <Text
                    style={[
                      styles.postButton,
                      {
                        color: newPostContent.trim() ? "#8B5CF6" : C.textMuted,
                      },
                    ]}
                  >
                    Post
                  </Text>
                </TouchableOpacity>
              </View>

              {/* User info */}
              <View style={styles.modalUserInfo}>
                {userDoc?.photo_url ? (
                  <Image
                    source={{ uri: userDoc.photo_url }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View
                    style={[styles.userAvatar, { backgroundColor: C.tint }]}
                  >
                    <Text style={styles.userInitial}>
                      {userDoc?.display_name?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
                <Text style={[styles.userName, { color: C.text }]}>
                  {userDoc?.display_name || "User"}
                </Text>
              </View>

              {/* Text input */}
              <TextInput
                style={[styles.modalTextInput, { color: C.text }]}
                placeholder="What's on your mind?"
                placeholderTextColor={C.textMuted}
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                autoFocus
                maxLength={1000}
              />

              {/* Character count */}
              <Text style={[styles.characterCount, { color: C.textMuted }]}>
                {newPostContent.length}/1000
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          visible={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          listingId={selectedPost.id}
          listingTitle={selectedPost.content.substring(0, 50)}
          listingImage={undefined}
          listingDescription={selectedPost.content}
          userName={selectedPost.userName}
          userPhoto={selectedPost.userPhoto}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfile
          visible={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userId={selectedUserId}
          userName={selectedUserName || ""}
          userPhoto={selectedUserPhoto || undefined}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Account for status bar
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra padding at bottom for tab bar
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  // Create Post Container
  createPostContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  createPostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  userInitialSmall: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  createPostInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  createPostPlaceholder: {
    fontSize: 15,
  },
  // Filter chips - commented out but kept for reference
  /*
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  */
  listingsContainer: {
    paddingHorizontal: 20,
  },
  listingCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userNameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    left: 10,
  },
  listingType: {
    fontSize: 13,
    marginTop: 1,
  },
  timeAgo: {
    fontSize: 13,
    fontWeight: "400",
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
  },
  bedroomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bedroomText: {
    fontSize: 13,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  imageContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  listingImage: {
    width: "100%",
    height: "100%",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
  },
  spacer: {
    flex: 1,
  },
  messageButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  messageButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  postButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTextInput: {
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
  },
  characterCount: {
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 12,
    textAlign: "right",
  },
});
