import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signUp } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
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

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async () => {
    // Clear any previous error
    setErrorMessage('');

    // Validation
    if (!formData.displayName.trim()) {
      setErrorMessage('Please enter your display name');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!formData.password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        email: formData.email.trim(),
        password: formData.password,
        display_name: formData.displayName.trim(),
        phone_number: formData.phoneNumber.trim()
      });

      // Navigate to main app after successful sign up
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
          colors={["rgba(106,13,173,0.6)", "rgba(60,149,166,0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bgOverlay}
        />
      </ImageBackground>

      <ScrollView contentContainerStyle={[styles.scroll, isDark && styles.scrollDark]} keyboardShouldPersistTaps="handled">
        <View style={styles.topSpacer} />

        <Animated.View 
          style={[
            styles.contentCard,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.heading}>Create your account</Text>
       

        {/* Display Name */}
        <View style={[styles.inputWrapper, formData.displayName ? styles.focusedWrapper : null]}> 
          {formData.displayName ? <Text style={[styles.label, styles.labelFocused]}>Display Name</Text> : null}
          <TextInput
            placeholder="Display Name"
            placeholderTextColor={isDark ? '#9aa3b2' : '#b0b7c3'}
            style={[styles.input, formData.displayName ? styles.inputFocused : null]}
            value={formData.displayName}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, displayName: text }));
              setErrorMessage('');
            }}
            editable={!loading}
          />
        </View>

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
              setErrorMessage('');
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
              setErrorMessage('');
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

        {/* Create Account Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          activeOpacity={0.85}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
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
          <TouchableOpacity style={styles.socialIcon} activeOpacity={0.9}>
            <AntDesign name="google" size={20} color="#db4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} activeOpacity={0.9}>
            <AntDesign name="apple" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/sign-in')} style={{ marginTop: 16 }}>
          <Text style={styles.metaText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
        </TouchableOpacity>
        </Animated.View>
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
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heading: {
    fontSize: 28,
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
  metaText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 2,
  },
  linkHighlight: {
    color: 'purple',
    fontWeight: '600',
  },
  bottomTextBlock: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  logoWrapper: {
    height: 140,
    width: '85%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 10,
  },
  logoImage: {
    height: '100%',
    width: '100%',
    
  },
  cardDark: {
    backgroundColor: '#0b0f1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  titleDark: {
    color: '#e5e7eb',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 18,
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
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#cb54f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  socialIcon: {
    height: 48,
    width: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  // Focus styles to mimic the purple border in the mock
  focusedWrapper: {
    borderColor: '#a855f7',
  },
  label: {
    position: 'absolute',
    top: 6,
    left: 14,
    fontSize: 12,
    color: '#6b7280',
  },
  labelFocused: {
    color: '#a855f7',
  },
  inputFocused: {
    borderColor: 'transparent',
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
