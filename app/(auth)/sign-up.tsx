import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
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
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Get Started</Text>
        <Text style={styles.subtitle}>Let's get started by filling out the form below.</Text>

        {/* Display Name */}
        <View style={[styles.inputWrapper, formData.displayName ? styles.focusedWrapper : null]}> 
          {formData.displayName ? <Text style={[styles.label, styles.labelFocused]}>Display Name</Text> : null}
          <TextInput
            placeholder="Display Name"
            placeholderTextColor={isDark ? '#9aa3b2' : '#b0b7c3'}
            style={[styles.input, formData.displayName ? styles.inputFocused : null]}
            value={formData.displayName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
            editable={!loading}
          />
        </View>

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

        {/* Create Account Button */}
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
          activeOpacity={0.8}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.dividerText}>Or sign up with</Text>

        {/* Social Buttons */}
        <View style={styles.socialStack}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
            <AntDesign name="google" size={18} color="#0f172a" style={{ marginRight: 8 }} />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
              <AntDesign name="apple" size={18} color="#0f172a" style={{ marginRight: 8 }} />
              <Text style={styles.socialText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => router.push('/sign-in')}>
            <Text style={styles.metaText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
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
  metaText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  linkHighlight: {
    color: '#a855f7',
    fontWeight: '600',
  },
  bottomTextBlock: {
    
    marginTop: 16,
    marginHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
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
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, android: 8, default: 12 }),
    marginBottom: 12,
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
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#a855f7',
    shadowOpacity: 0.45,
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
  dividerText: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 4,
  },
  socialStack: {
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
    borderRadius: 12,
    height: 46,
  },
  socialText: {
    color: '#0f172a',
    fontWeight: '600',
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
});
