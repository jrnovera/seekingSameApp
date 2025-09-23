import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function ContactSupportScreen() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { user, userDoc } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Support options
  const supportOptions = [
    { 
      title: 'Account Issues', 
      icon: 'person-circle-outline',
      description: 'Problems with login, profile, or account settings'
    },
    { 
      title: 'Payment Problems', 
      icon: 'card-outline',
      description: 'Issues with payments, billing, or subscriptions'
    },
    { 
      title: 'Property Listing', 
      icon: 'home-outline',
      description: 'Help with creating or managing property listings'
    },
    { 
      title: 'App Feedback', 
      icon: 'chatbubble-ellipses-outline',
      description: 'Suggestions or feedback about the app'
    },
    { 
      title: 'Report a Bug', 
      icon: 'bug-outline',
      description: 'Report technical issues or bugs in the app'
    },
    { 
      title: 'Other', 
      icon: 'help-circle-outline',
      description: 'Any other questions or concerns'
    },
  ];

  // Handle sending email
  const handleSendEmail = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }
    
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    
    setSending(true);
    
    try {
      // Format the email content
      const userEmail = user?.email || 'Not provided';
      const userName = userDoc?.display_name || user?.displayName || 'User';
      const emailSubject = `SeekingSame Support: ${subject}`;
      const emailBody = `
From: ${userName} (${userEmail})
User ID: ${user?.uid || 'Not signed in'}

${message}
      `;
      
      // Create the mailto URL
      const mailtoUrl = `mailto:admin@seekingsame.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open the email client
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          'Email Prepared',
          'Your email has been prepared in your email app. Please send it to complete your support request.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error('Cannot open email client');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert(
        'Cannot Open Email',
        'Unable to open your email client. Please send an email directly to admin@seekingsame.com'
      );
    } finally {
      setSending(false);
    }
  };

  // Handle direct contact options
  const handleDirectContact = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:admin@seekingsame.com');
        break;
      case 'phone':
        Linking.openURL('tel:+1234567890');
        break;
      case 'chat':
        Alert.alert('Live Chat', 'Live chat support will be available soon!');
        break;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: C.surface }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Support Info Card */}
        <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <Text style={[styles.infoTitle, { color: C.text }]}>How can we help you?</Text>
          <Text style={[styles.infoText, { color: C.textMuted }]}>
            Our support team is here to help with any questions or issues you may have.
          </Text>
          
          <View style={styles.contactOptions}>
            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: C.surfaceSoft }]}
              onPress={() => handleDirectContact('email')}
            >
              <Ionicons name="mail" size={24} color={C.tint} />
              <Text style={[styles.contactOptionText, { color: C.text }]}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: C.surfaceSoft }]}
              onPress={() => handleDirectContact('phone')}
            >
              <Ionicons name="call" size={24} color={C.tint} />
              <Text style={[styles.contactOptionText, { color: C.text }]}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.contactOption, { backgroundColor: C.surfaceSoft }]}
              onPress={() => handleDirectContact('chat')}
            >
              <Ionicons name="chatbubbles" size={24} color={C.tint} />
              <Text style={[styles.contactOptionText, { color: C.text }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Contact Form */}
        <View style={[styles.formCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <Text style={[styles.formTitle, { color: C.text }]}>Send us a message</Text>
          
          <Text style={[styles.inputLabel, { color: C.textMuted }]}>Subject</Text>
          <View style={styles.subjectOptions}>
            {supportOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subjectOption,
                  { 
                    backgroundColor: subject === option.title ? C.tint : C.surfaceSoft,
                    borderColor: subject === option.title ? C.tint : C.surfaceBorder
                  }
                ]}
                onPress={() => setSubject(option.title)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={subject === option.title ? '#fff' : C.text} 
                />
                <Text 
                  style={[
                    styles.subjectText, 
                    { color: subject === option.title ? '#fff' : C.text }
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.inputLabel, { color: C.textMuted }]}>Message</Text>
          <TextInput
            style={[
              styles.messageInput, 
              { 
                backgroundColor: C.surfaceSoft, 
                borderColor: C.surfaceBorder,
                color: C.text
              }
            ]}
            placeholder="Describe your issue or question..."
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: C.tint }]}
            onPress={handleSendEmail}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Contact Info */}
        <View style={[styles.contactInfoCard, { backgroundColor: C.surface, borderColor: C.surfaceBorder }]}>
          <Text style={[styles.contactInfoTitle, { color: C.text }]}>Contact Information</Text>
          
          <View style={styles.contactInfoRow}>
            <Ionicons name="mail-outline" size={20} color={C.icon} />
            <Text style={[styles.contactInfoText, { color: C.text }]}>admin@seekingsame.com</Text>
          </View>
          
          <View style={styles.contactInfoRow}>
            <Ionicons name="call-outline" size={20} color={C.icon} />
            <Text style={[styles.contactInfoText, { color: C.text }]}>+1 (234) 567-8900</Text>
          </View>
          
          <View style={styles.contactInfoRow}>
            <Ionicons name="time-outline" size={20} color={C.icon} />
            <Text style={[styles.contactInfoText, { color: C.text }]}>
              Monday - Friday, 9:00 AM - 5:00 PM
            </Text>
          </View>
          
          <View style={styles.contactInfoRow}>
            <Ionicons name="globe-outline" size={20} color={C.icon} />
            <Text style={[styles.contactInfoText, { color: C.text }]}>www.seekingsame.com</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textMuted }]}>
            We typically respond within 24-48 hours.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  contactOption: {
    width: '30%',
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactOptionText: {
    marginTop: 8,
    fontWeight: '500',
  },
  formCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  subjectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subjectOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  subjectText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
  },
  sendButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfoCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  contactInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactInfoText: {
    marginLeft: 12,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
