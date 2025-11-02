import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthErrorModal } from '../../components/AuthErrorModal';

export default function ForgotPasswordScreen() {
  const isDark = useColorScheme() === 'dark';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [email, setEmail] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: ''
  });

  // Use local loading state
  const loading = localLoading;
  
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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorModal({
        visible: true,
        title: 'Email Required',
        message: 'Please enter your email address to receive a password reset link.'
      });
      return;
    }

    try {
      setLocalLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (error: any) {
      let errorMessage = 'Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or sign up.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      // Use a small delay to ensure the component is stable before showing modal
      setTimeout(() => {
        setErrorModal({
          visible: true,
          title: 'Password Reset Failed',
          message: errorMessage
        });
      }, 100);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background image with gradient overlay (match sign-in) */}
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
          {!resetSent ? (
            <>
              <Text style={styles.heading}>Forgot Password?</Text>
              <Text style={styles.subheading}>Enter your email to receive a password reset link</Text>

              {/* Email */}
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                activeOpacity={0.85}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/sign-in')} 
                style={styles.backLink}
              >
                <Ionicons name="arrow-back" size={16} color="#6b7280" />
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#10b981" />
              <Text style={styles.heading}>Check Your Email</Text>
              <Text style={styles.subheading}>
                We've sent a password reset link to {email}
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.85}
                onPress={() => router.push('/sign-in')}
              >
                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Error Modal */}
      <AuthErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
        type="error"
      />
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
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#cb54f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#cb54f8',
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backLinkText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
  },
});
