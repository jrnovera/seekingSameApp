import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

  // Sample profile data - in a real app, this would be fetched based on userId
  const profileSections: ProfileSection[] = [
    {
      title: 'Location',
      value: 'San Francisco, CA',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=60&fit=crop',
    },
    {
      title: 'Interests',
      value: 'Hiking, Photography, Travel',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=100&h=60&fit=crop',
    },
    {
      title: 'Religion',
      value: 'Christianity',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=60&fit=crop',
    },
  ];

  const preferences = [
    { label: 'Dietary', value: 'Vegetarian', icon: '🥗' },
    { label: 'Lifestyle', value: 'Non-smoker', icon: '🚭' },
    { label: 'Pets', value: 'Cat lover', icon: '🐱' },
    { label: 'Schedule', value: 'Early bird', icon: '🌅' },
  ];

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
            <Text style={[styles.profileBio, { color: C.textMuted }]}>{bio}</Text>
          </View>

          {/* Preferences Section */}
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>About</Text>
            <View style={[styles.sectionCard, { backgroundColor: C.surface }]}>
              <Text style={[styles.aboutText, { color: C.text }]}>
                Looking for a clean, respectful roommate to share a beautiful apartment in San Francisco. 
                I enjoy outdoor activities, photography, and exploring the city. I'm a vegetarian and prefer 
                a quiet, peaceful living environment.
              </Text>
            </View>
          </View>

          {/* Contact Section */}
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
});
