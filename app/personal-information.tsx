import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import userService from '@/services/userService';

export default function PersonalInformationScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { userDoc, user } = useAuth();

  // Form state
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');
  const [religion, setReligion] = useState('');
  const [about, setAbout] = useState('');

  // Preferences
  const [dietary, setDietary] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [pets, setPets] = useState('');
  const [schedule, setSchedule] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user profile data
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      if (!userDoc?.uid) return;

      const profile = await userService.getUserProfile(userDoc.uid);
      if (profile) {
        setBio(profile.bio || '');
        setLocation(profile.location || '');
        setInterests(profile.interests || '');
        setReligion(profile.religion || '');
        setAbout(profile.about || '');
        setDietary(profile.preferences?.dietary || '');
        setLifestyle(profile.preferences?.lifestyle || '');
        setPets(profile.preferences?.pets || '');
        setSchedule(profile.preferences?.schedule || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!userDoc?.uid) return;

      await userService.updateUserProfile(userDoc.uid, {
        bio,
        location,
        interests,
        religion,
        about,
        preferences: {
          dietary,
          lifestyle,
          pets,
          schedule,
        },
      });

      Alert.alert('Success', 'Your profile has been updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg }]}>
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Personal Information</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Personal Information</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={C.tint} />
          ) : (
            <Text style={[styles.saveButton, { color: C.tint }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {userDoc?.photo_url ? (
            <Image source={{ uri: userDoc.photo_url }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: C.tint }]}>
              <Text style={styles.profileInitial}>
                {userDoc?.display_name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}

          <Text style={[styles.profileName, { color: C.text }]}>
            {userDoc?.display_name || user?.displayName || 'User'}
          </Text>
          <Text style={[styles.profileEmail, { color: C.textMuted }]}>
            {userDoc?.email || user?.email || ''}
          </Text>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Bio</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
            placeholder="Add a short bio..."
            placeholderTextColor={C.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Preferences</Text>
          <View style={styles.preferencesGrid}>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceIcon}>🥗</Text>
              <Text style={[styles.preferenceLabel, { color: C.textMuted }]}>Dietary</Text>
              <TextInput
                style={[styles.preferenceInput, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
                placeholder="e.g., Vegetarian"
                placeholderTextColor={C.textMuted}
                value={dietary}
                onChangeText={setDietary}
              />
            </View>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceIcon}>🚭</Text>
              <Text style={[styles.preferenceLabel, { color: C.textMuted }]}>Lifestyle</Text>
              <TextInput
                style={[styles.preferenceInput, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
                placeholder="e.g., Non-smoker"
                placeholderTextColor={C.textMuted}
                value={lifestyle}
                onChangeText={setLifestyle}
              />
            </View>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceIcon}>🐱</Text>
              <Text style={[styles.preferenceLabel, { color: C.textMuted }]}>Pets</Text>
              <TextInput
                style={[styles.preferenceInput, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
                placeholder="e.g., Cat lover"
                placeholderTextColor={C.textMuted}
                value={pets}
                onChangeText={setPets}
              />
            </View>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceIcon}>🌅</Text>
              <Text style={[styles.preferenceLabel, { color: C.textMuted }]}>Schedule</Text>
              <TextInput
                style={[styles.preferenceInput, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
                placeholder="e.g., Early bird"
                placeholderTextColor={C.textMuted}
                value={schedule}
                onChangeText={setSchedule}
              />
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Location</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
            placeholder="e.g., San Francisco, CA"
            placeholderTextColor={C.textMuted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Interests</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
            placeholder="e.g., Hiking, Photography, Travel"
            placeholderTextColor={C.textMuted}
            value={interests}
            onChangeText={setInterests}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Religion Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Religion</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
            placeholder="e.g., Christianity"
            placeholderTextColor={C.textMuted}
            value={religion}
            onChangeText={setReligion}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>About</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: C.surface, color: C.text, borderColor: C.surfaceBorder }]}
            placeholder="Tell others about yourself..."
            placeholderTextColor={C.textMuted}
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButtonLarge, { backgroundColor: '#8B5CF6' }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  profileEmail: {
    fontSize: 16,
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
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceItem: {
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
    marginBottom: 8,
  },
  preferenceInput: {
    width: '100%',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
  },
  saveButtonLarge: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
