import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function PaymentFailed() {
  const {
    sessionId,
    propertyTitle = 'Property',
    amount = '0',
    currency = 'USD',
    propertyId,
    errorMessage = 'Payment could not be processed'
  } = useLocalSearchParams<{
    sessionId: string;
    propertyTitle: string;
    amount: string;
    currency: string;
    propertyId: string;
    errorMessage: string;
  }>();

  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount) / 100; // Convert from cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numAmount);
  };

  const handleTryAgain = () => {
    // Go back to the property details to retry payment
    if (propertyId) {
      router.replace(`/property/${propertyId}`);
    } else {
      router.back();
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Please contact our support team for assistance with your payment issue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            // In a real app, you might open an email client or support system
            Alert.alert('Support', 'Please email us at support@seekingsame.com');
          }
        }
      ]
    );
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/homepage');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
      <View style={styles.content}>
        {/* Error Container */}
        <View style={[styles.errorContainer, { backgroundColor: C.surface }]}>
          <View style={[styles.errorIcon, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="close" size={48} color="#fff" />
          </View>

          <Text style={[styles.errorTitle, { color: C.text }]}>
            Payment Failed
          </Text>

          <Text style={[styles.errorMessage, { color: C.textMuted }]}>
            {errorMessage}
          </Text>
        </View>

        {/* Payment Details */}
        <View style={[styles.detailsContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.detailsTitle, { color: C.text }]}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: C.textMuted }]}>Property:</Text>
            <Text style={[styles.detailValue, { color: C.text }]} numberOfLines={2}>
              {propertyTitle}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: C.textMuted }]}>Amount:</Text>
            <Text style={[styles.detailValue, styles.amountText, { color: C.text }]}>
              {formatAmount(amount, currency)}
            </Text>
          </View>

          {sessionId && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: C.textMuted }]}>Session ID:</Text>
              <Text style={[styles.detailValue, styles.transactionId, { color: C.textMuted }]} numberOfLines={1}>
                {sessionId.substring(0, 20)}...
              </Text>
            </View>
          )}
        </View>

        {/* Common Issues & Solutions */}
        <View style={[styles.solutionsContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.solutionsTitle, { color: C.text }]}>Common Issues & Solutions</Text>

          <View style={styles.solutionItem}>
            <View style={[styles.solutionIcon, { backgroundColor: '#F59E0B' }]}>
              <MaterialIcons name="credit-card" size={20} color="#fff" />
            </View>
            <View style={styles.solutionText}>
              <Text style={[styles.solutionTitle, { color: C.text }]}>Card Declined</Text>
              <Text style={[styles.solutionDescription, { color: C.textMuted }]}>
                Check your card details and ensure you have sufficient funds
              </Text>
            </View>
          </View>

          <View style={styles.solutionItem}>
            <View style={[styles.solutionIcon, { backgroundColor: '#8B5CF6' }]}>
              <MaterialIcons name="security" size={20} color="#fff" />
            </View>
            <View style={styles.solutionText}>
              <Text style={[styles.solutionTitle, { color: C.text }]}>Security Check</Text>
              <Text style={[styles.solutionDescription, { color: C.textMuted }]}>
                Your bank may require additional verification for this transaction
              </Text>
            </View>
          </View>

          <View style={styles.solutionItem}>
            <View style={[styles.solutionIcon, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="wifi" size={20} color="#fff" />
            </View>
            <View style={styles.solutionText}>
              <Text style={[styles.solutionTitle, { color: C.text }]}>Network Issue</Text>
              <Text style={[styles.solutionDescription, { color: C.textMuted }]}>
                Check your internet connection and try again
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: C.tint }]}
            onPress={handleTryAgain}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: C.surface, borderColor: '#F59E0B' }]}
            onPress={handleContactSupport}
          >
            <MaterialIcons name="support-agent" size={20} color="#F59E0B" />
            <Text style={[styles.secondaryButtonText, { color: '#F59E0B' }]}>
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tertiaryButton]}
            onPress={handleGoHome}
          >
            <Text style={[styles.tertiaryButtonText, { color: C.textMuted }]}>
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  solutionsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  solutionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  solutionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  solutionText: {
    flex: 1,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  solutionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    alignItems: 'center',
    padding: 12,
  },
  tertiaryButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});