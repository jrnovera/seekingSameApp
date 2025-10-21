import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import userService from '@/services/userService';
import communityPostService, { CommunityPost } from '@/services/communityPostService';
import { User } from '@/types/user';
import { Timestamp } from 'firebase/firestore';

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userPhoto?: string;
  bio?: string;
}

interface ProfileSection {
  title: string;
  value: string;
  image?: string;
}

export default function UserProfile({
  visible,
  onClose,
  userId,
  userName,
  userPhoto,
  bio = "Current Profile",
}: UserProfileProps) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  // State for user profile data and posts
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    if (visible && userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [visible, userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await userService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      // Subscribe to posts and filter by userId
      const unsubscribe = communityPostService.subscribeToPosts((allPosts) => {
        const filteredPosts = allPosts.filter(post => post.userId === userId);
        setUserPosts(filteredPosts);
        setPostsLoading(false);
      });

      // Clean up subscription when component unmounts or userId changes
      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPostsLoading(false);
    }
  };

  // Build profile sections from real data
  const profileSections: ProfileSection[] = [];

  if (userProfile?.location) {
    profileSections.push({
      title: 'Location',
      value: userProfile.location,
    });
  }

  if (userProfile?.interests) {
    profileSections.push({
      title: 'Interests',
      value: userProfile.interests,
    });
  }

  if (userProfile?.religion) {
    profileSections.push({
      title: 'Religion',
      value: userProfile.religion,
    });
  }

  // Build preferences from real data
  const preferences = [];
  if (userProfile?.preferences?.dietary) {
    preferences.push({
      label: 'Dietary',
      value: userProfile.preferences.dietary,
      icon: '🥗',
    });
  }
  if (userProfile?.preferences?.lifestyle) {
    preferences.push({
      label: 'Lifestyle',
      value: userProfile.preferences.lifestyle,
      icon: '🚭',
    });
  }
  if (userProfile?.preferences?.pets) {
    preferences.push({
      label: 'Pets',
      value: userProfile.preferences.pets,
      icon: '🐱',
    });
  }
  if (userProfile?.preferences?.schedule) {
    preferences.push({
      label: 'Schedule',
      value: userProfile.preferences.schedule,
      icon: '🌅',
    });
  }

  // Format time ago for posts
  const getTimeAgo = (date: Date | Timestamp) => {
    const actualDate = date instanceof Timestamp ? date.toDate() : date;
    const now = new Date();
    const diffInMs = now.getTime() - actualDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return actualDate.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: C.screenBg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.tint} />
              <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading profile...</Text>
            </View>
          ) : (
            <>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, { backgroundColor: C.tint }]}>
                    <Text style={styles.profileInitial}>{userName.charAt(0)}</Text>
                  </View>
                )}

                <Text style={[styles.profileName, { color: C.text }]}>{userName}</Text>
                <Text style={[styles.profileBio, { color: C.textMuted }]}>
                  {userProfile?.bio || bio}
                </Text>
              </View>

              {/* Preferences Section */}
              {preferences.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Preferences</Text>
                  <View style={styles.preferencesGrid}>
                    {preferences.map((pref, index) => (
                      <View key={index} style={[styles.preferenceCard, { backgroundColor: C.surface }]}>
                        <Text style={styles.preferenceIcon}>{pref.icon}</Text>
                        <Text style={[styles.preferenceLabel, { color: C.textMuted }]}>{pref.label}</Text>
                        <Text style={[styles.preferenceValue, { color: C.text }]}>{pref.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Profile Sections */}
          {profileSections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: C.surface }]}>
                <View style={styles.sectionContent}>
                  <Text style={[styles.sectionValue, { color: C.text }]}>{section.value}</Text>
                </View>
                {section.image && (
                  <View style={styles.sectionImageContainer}>
                    <Image 
                      source={{ uri: section.image }} 
                      style={styles.sectionImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Additional Info */}
          {!isLoading && userProfile?.about && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>About</Text>
              <View style={[styles.sectionCard, { backgroundColor: C.surface }]}>
                <Text style={[styles.aboutText, { color: C.text }]}>
                  {userProfile.about}
                </Text>
              </View>
            </View>
          )}

          {/* Recent Posts Section */}
          {!isLoading && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Posts</Text>
              {postsLoading ? (
                <View style={styles.postsLoadingContainer}>
                  <ActivityIndicator size="small" color={C.tint} />
                </View>
              ) : userPosts.length > 0 ? (
                <View>
                  {userPosts.map((post, index) => (
                    <View key={post.id} style={[styles.postCard, { backgroundColor: C.surface }]}>
                      <Text style={[styles.postContent, { color: C.text }]} numberOfLines={3}>
                        {post.content}
                      </Text>
                      <View style={styles.postFooter}>
                        <Text style={[styles.postTime, { color: C.textMuted }]}>
                          {getTimeAgo(post.createdAt)}
                        </Text>
                        <View style={styles.postStats}>
                          <View style={styles.postStat}>
                            <Ionicons name="heart" size={14} color={C.textMuted} />
                            <Text style={[styles.postStatText, { color: C.textMuted }]}>
                              {post.likes || 0}
                            </Text>
                          </View>
                          <View style={styles.postStat}>
                            <Ionicons name="chatbubble" size={14} color={C.textMuted} />
                            <Text style={[styles.postStatText, { color: C.textMuted }]}>
                              {post.comments || 0}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyPostsCard, { backgroundColor: C.surface }]}>
                  <Ionicons name="chatbubbles-outline" size={48} color={C.textMuted} />
                  <Text style={[styles.emptyPostsText, { color: C.textMuted }]}>
                    No community posts yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Contact Section */}
          {!isLoading && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => {
                  // Handle contact/message action
                  onClose();
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.contactButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
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
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  preferenceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionImageContainer: {
    width: 80,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  sectionImage: {
    width: '100%',
    height: '100%',
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  postsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
  },
  emptyPostsCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPostsText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
