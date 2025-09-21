import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const isDark = useColorScheme() === 'dark';
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await signIn({
        email: formData.email.trim(),
        password: formData.password
      });
      
      // Navigate to main app after successful sign in
      router.replace('/(tabs)/homepage');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, isDark && styles.cardDark]}>
        {/* Header Placeholder */}
        <View style={styles.headerPlaceholder}>
          <AntDesign name="picture" size={28} color="#9ca3af" />
          <Text style={styles.placeholderText}>Header Image</Text>
        </View>

        <Text style={[styles.heading, isDark && styles.headingDark]}>Let's <Text style={styles.accent}>Sign In</Text></Text>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={isDark ? '#9aa3b2' : '#9ca3af'}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={isDark ? '#9aa3b2' : '#9ca3af'}
            secureTextEntry={!showPassword}
            style={[styles.input, { paddingRight: 44 }]}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            editable={!loading}
          />
          <TouchableOpacity 
            style={styles.iconButton} 
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
              size={22} 
              color="#8a8ea3" 
            />
          </TouchableOpacity>
        </View>

        {/* Inline links */}
        <View style={styles.inlineLinks}>
          <TouchableOpacity activeOpacity={0.8}><Text style={styles.linkText}>Forgot password?</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}><Text style={styles.linkText}>Show password</Text></TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          activeOpacity={0.85}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.hrRow}>
          <View style={styles.hr} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.hr} />
        </View>

        {/* Social Row */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialPill]} activeOpacity={0.9}>
            <AntDesign name="google" size={20} color="#db4437" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialPill]} activeOpacity={0.9}>
            <AntDesign name="facebook" size={20} color="#1877f2" />
          </TouchableOpacity>
        </View>

        {/* Bottom links */}
        <View style={styles.bottomTextBlock}>
          <TouchableOpacity onPress={() => router.push('/sign-up')}>
            <Text style={styles.metaText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
          </TouchableOpacity>
         
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f6f7fb',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#0b0f1a',
  },
  headerPlaceholder: {
    height: 120,
    width: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#eef0f6',
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 12,
    color: '#9ca3af',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },
  headingDark: {
    color: '#e5e7eb',
  },
  accent: {
    color: '#8b5cf6',
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eef0f6',
  },
  input: {
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 6,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLinks: {
    marginTop: 10,
    marginHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: '#6b7280',
    fontSize: 13,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 16,
    shadowColor: '#a855f7',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  hrRow: {
    marginTop: 18,
    marginHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  socialRow: {
    marginTop: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  socialPill: {
    height: 44,
    width: 120,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTextBlock: {
    marginTop: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  metaText: {
    color: '#6b7280',
  },
  linkHighlight: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
});
