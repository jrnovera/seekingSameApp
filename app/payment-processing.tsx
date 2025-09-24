import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { paymentService } from '@/services/paymentService';

export default function PaymentProcessing() {
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

  const [statusMessage, setStatusMessage] = useState('Processing your payment...');
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  useEffect(() => {
    if (!sessionId) {
      router.replace('/payment-failed?errorMessage=Invalid session');
      return;
    }

    const processPayment = async () => {
      try {
        setStatusMessage('Confirming payment with Stripe...');

        // Poll payment status until completion or timeout
        const response = await paymentService.pollPaymentStatus(sessionId, 30, 2000);

        if (response.data.paymentStatus === 'succeeded') {
          // Payment successful
          router.replace({
            pathname: '/payment-success',
            params: {
              sessionId: response.data.sessionId,
              propertyTitle: response.data.propertyTitle || propertyTitle,
              amount: response.data.amount.toString(),
              currency: response.data.currency || currency,
              propertyId: response.data.propertyId || propertyId
            }
          });
        } else if (response.data.paymentStatus === 'failed') {
          // Payment failed
          router.replace({
            pathname: '/payment-failed',
            params: {
              sessionId: response.data.sessionId,
              propertyTitle: response.data.propertyTitle || propertyTitle,
              amount: response.data.amount.toString(),
              currency: response.data.currency || currency,
              propertyId: response.data.propertyId || propertyId,
              errorMessage: 'Payment was declined or failed'
            }
          });
        } else {
          // Still pending after polling timeout
          router.replace({
            pathname: '/payment-failed',
            params: {
              sessionId,
              propertyTitle,
              amount,
              currency,
              propertyId,
              errorMessage: 'Payment is taking longer than expected. Please check your payment status or try again.'
            }
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        router.replace({
          pathname: '/payment-failed',
          params: {
            sessionId: sessionId || '',
            propertyTitle,
            amount,
            currency,
            propertyId,
            errorMessage: error instanceof Error ? error.message : 'Payment processing failed'
          }
        });
      }
    };

    processPayment();
  }, [sessionId, propertyTitle, amount, currency, propertyId]);

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      <View style={[styles.content, { backgroundColor: C.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#3c95a6' }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>

        <Text style={[styles.title, { color: C.text }]}>
          Processing Payment
        </Text>

        <Text style={[styles.message, { color: C.textMuted }]}>
          {statusMessage}
        </Text>

        <Text style={[styles.waitMessage, { color: C.textMuted }]}>
          Please don't close this screen while we process your payment.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  waitMessage: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});