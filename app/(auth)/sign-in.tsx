import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const isDark = useColorScheme() === 'dark';
  const { signIn } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Start entrance animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleSignIn = async () => {
    // Clear any previous error
    setErrorMessage('');

    // Validation
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!formData.password.trim()) {
      setErrorMessage('Please enter your password');
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
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background image with gradient overlay */}
      <ImageBackground 
        source={require('../../assets/images/newloginlogo.png')} 
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
      >
        <LinearGradient 
          colors={["#cb54f8", "#6095a6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bgOverlay}
        />
      </ImageBackground>

      <ScrollView contentContainerStyle={[styles.scroll, isDark && styles.scrollDark]} keyboardShouldPersistTaps="handled">
        {/* Spacer for top padding */}
        <View style={styles.topSpacer} />

        {/* Main content card */}
        <Animated.View 
          style={[
            styles.contentCard,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>Sign in to continue</Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                setErrorMessage(''); // Clear error when user types
              }}
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              style={[styles.input, { paddingRight: 44 }]}
              value={formData.password}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, password: text }));
                setErrorMessage(''); // Clear error when user types
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Forgot password link */}
          <TouchableOpacity
            style={styles.forgotLink}
            activeOpacity={0.8}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>

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
              <Text style={styles.primaryButtonText}>Sign In</Text>
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
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.9}>
              <AntDesign name="google" size={20} color="#db4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.9}>
              <AntDesign name="apple" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom links */}
        <View style={styles.bottomTextBlock}>
          <TouchableOpacity onPress={() => router.push('/sign-up')}>
            <Text style={styles.metaText}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Background image + overlay
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImageStyle: {
    resizeMode: 'cover',
    opacity: 0.6,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollDark: {
    backgroundColor: 'transparent',
  },
  topSpacer: {
    height: 80,
  },
  contentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  topLogo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 12,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    minHeight: 52,
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  iconButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#cb54f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6a0dad',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  hr: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  orText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialButton: {
    height: 48,
    width: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bottomTextBlock: {
    marginTop: 32,
    alignItems: 'center',
  },
  metaText: {
    color: '#111827',
    fontSize: 15,
  },
  linkHighlight: {
    color: 'purple',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
});
