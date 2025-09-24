import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function PaymentSuccess() {
  const {
    sessionId,
    propertyTitle = 'Property',
    amount = '0',
    currency = 'USD',
    propertyId
  } = useLocalSearchParams<{
    sessionId: string;
    propertyTitle: string;
    amount: string;
    currency: string;
    propertyId: string;
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

  const handleGoHome = () => {
    router.replace('/(tabs)/homepage');
  };

  const handleViewProperty = () => {
    if (propertyId) {
      router.push(`/property/${propertyId}`);
    } else {
      handleGoHome();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
      <View style={styles.content}>
        {/* Success Animation Container */}
        <View style={[styles.successContainer, { backgroundColor: C.surface }]}>
          <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>

          <Text style={[styles.successTitle, { color: C.text }]}>
            Payment Successful!
          </Text>

          <Text style={[styles.successMessage, { color: C.textMuted }]}>
            Your payment has been processed successfully.
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
            <Text style={[styles.detailLabel, { color: C.textMuted }]}>Amount Paid:</Text>
            <Text style={[styles.detailValue, styles.amountText, { color: '#10B981' }]}>
              {formatAmount(amount, currency)}
            </Text>
          </View>

          {sessionId && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: C.textMuted }]}>Transaction ID:</Text>
              <Text style={[styles.detailValue, styles.transactionId, { color: C.textMuted }]} numberOfLines={1}>
                {sessionId.substring(0, 20)}...
              </Text>
            </View>
          )}
        </View>

        {/* Next Steps */}
        <View style={[styles.nextStepsContainer, { backgroundColor: C.surface }]}>
          <Text style={[styles.nextStepsTitle, { color: C.text }]}>What's Next?</Text>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: '#3c95a6' }]}>
              <MaterialIcons name="email" size={20} color="#fff" />
            </View>
            <Text style={[styles.stepText, { color: C.textMuted }]}>
              A confirmation email has been sent to your registered email address
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: '#3c95a6' }]}>
              <MaterialIcons name="home" size={20} color="#fff" />
            </View>
            <Text style={[styles.stepText, { color: C.textMuted }]}>
              The property owner will be notified of your payment
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: '#3c95a6' }]}>
              <MaterialIcons name="contact-phone" size={20} color="#fff" />
            </View>
            <Text style={[styles.stepText, { color: C.textMuted }]}>
              You can now contact the property owner to arrange move-in details
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: C.surface, borderColor: C.tint }]}
            onPress={handleViewProperty}
          >
            <MaterialIcons name="visibility" size={20} color={C.tint} />
            <Text style={[styles.secondaryButtonText, { color: C.tint }]}>
              View Property
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: C.tint }]}
            onPress={handleGoHome}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Go to Home</Text>
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
  successContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    marginBottom: 20,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
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
  nextStepsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 6,
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
});