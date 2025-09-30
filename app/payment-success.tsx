import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { propertyService } from '@/services/propertyService';
import { transactionService } from '@/services/transactionService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

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
  const [propertyUpdated, setPropertyUpdated] = useState(false);
  const [transactionCreated, setTransactionCreated] = useState(false);
  const [processing, setProcessing] = useState(true);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Update property availability and create transaction when component mounts
  useEffect(() => {
    const processSuccessfulPayment = async () => {
      // Prevent duplicate processing
      if (hasProcessed) {
        console.log('Payment already processed, skipping...');
        return;
      }

      if (!propertyId || !sessionId || !auth.currentUser) {
        console.log('Missing required data for payment processing:', {
          propertyId: !!propertyId,
          sessionId: !!sessionId,
          currentUser: !!auth.currentUser
        });
        setProcessing(false);
        setUpdateError('Missing required payment data');
        return;
      }

      setHasProcessed(true);

      const user = auth.currentUser;
      console.log('Starting payment processing for:', {
        propertyId,
        sessionId,
        userId: user.uid,
        amount: amount,
        currency: currency
      });

      let propertyUpdateSuccess = false;
      let transactionCreateSuccess = false;

      try {
        // 1. Mark property as unavailable
        console.log(`Step 1: Marking property ${propertyId} as unavailable for user ${user.uid}`);
        await propertyService.markPropertyAsRented(propertyId, user.uid);
        propertyUpdateSuccess = true;
        setPropertyUpdated(true);
        console.log('✅ Property successfully marked as unavailable');

        // 2. Create transaction record
        console.log(`Step 2: Creating transaction record for session ${sessionId}`);
        const transactionData = {
          amount: parseFloat(amount),
          currency: currency || 'USD',
          stripeSessionId: sessionId,
          propertyId: propertyId,
          propertyTitle: propertyTitle || 'Property Rental',
          renterId: user.uid,
          renterName: user.displayName || user.email?.split('@')[0] || 'User',
          renterEmail: user.email || '',
          metadata: {
            paymentMethod: 'stripe_checkout',
            source: 'mobile_app',
            platform: 'mobile',
            sessionId: sessionId,
          },
        };

        console.log('Transaction data to be created:', transactionData);
        const transactionId = await transactionService.createRentalTransactionWithHostLookup(transactionData);

        transactionCreateSuccess = true;
        setTransactionCreated(true);
        console.log('✅ Transaction record created successfully:', transactionId);

        // Both operations completed successfully
        console.log('✅ Payment processing completed successfully');

      } catch (error) {
        console.error('❌ Failed to process successful payment:', error);

        // Determine what failed for better error messaging
        let errorMessage = 'We encountered issues completing the payment process.';
        let detailMessage = '';

        if (!propertyUpdateSuccess) {
          errorMessage = 'Failed to update property availability.';
          detailMessage = 'The property status could not be updated. ';
        } else if (!transactionCreateSuccess) {
          errorMessage = 'Failed to create transaction record.';
          detailMessage = 'Property was updated but transaction record creation failed. ';
        }

        setUpdateError(errorMessage);

        // Show specific error alert
        Alert.alert(
          'Payment Processing Issue',
          `Your payment was successful! However, ${detailMessage}Please contact support with your session ID: ${sessionId.substring(0, 20)}... if you need assistance.`,
          [{ text: 'OK' }]
        );
      } finally {
        setProcessing(false);
      }
    };

    processSuccessfulPayment();
  }, [propertyId, sessionId, amount, currency, propertyTitle]);

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

          {/* Processing Status */}
          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={C.tint} style={styles.processingSpinner} />
              <Text style={[styles.processingText, { color: C.textMuted }]}>
                Completing payment processing...
              </Text>
            </View>
          )}

          {!processing && (propertyUpdated && transactionCreated) && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.statusText, { color: '#10B981' }]}>
                Processing completed successfully
              </Text>
            </View>
          )}

          {!processing && updateError && (
            <View style={styles.statusContainer}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                {updateError}
              </Text>
            </View>
          )}
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
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  processingSpinner: {
    marginRight: 8,
  },
  processingText: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
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