import { useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

const FRONTEND_URL = process.env.EXPO_PUBLIC_FRONTEND_URL || 'http://192.168.1.11:3000';

interface UseWebBrowserPaymentOptions {
  sessionId: string;
  propertyTitle: string;
  amount: string;
  currency: string;
  propertyId: string;
}

export const useWebBrowserPayment = (options: UseWebBrowserPaymentOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const browserSessionRef = useRef<WebBrowser.WebBrowserResult | null>(null);

  const openPaymentBrowser = async (checkoutUrl: string) => {
    try {
      // Open the browser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#3c95a6',
        toolbarColor: '#ffffff',
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: false,
        readerMode: false,
        dismissButtonStyle: 'close',
      });

      browserSessionRef.current = result;

      // Start URL monitoring (this is a fallback approach)
      startURLMonitoring();

      // Handle browser closure
      handleBrowserClosure(result);

    } catch (error) {
      console.error('Error opening payment browser:', error);
      throw error;
    }
  };

  const startURLMonitoring = () => {
    // Note: WebBrowser doesn't provide real-time URL monitoring
    // This is a simplified implementation that handles browser closure
    console.log('Payment browser opened, monitoring for completion...');
  };

  const handleBrowserClosure = (result: WebBrowser.WebBrowserResult) => {
    // When browser closes, we need to check the payment status
    // Since we can't detect the exact URL, we'll always go to processing screen
    // and let the polling determine the actual result

    console.log('Browser closed with result:', result.type);

    // Navigate to processing screen to poll for actual status
    router.push({
      pathname: '/payment-processing',
      params: {
        sessionId: options.sessionId,
        propertyTitle: options.propertyTitle,
        amount: options.amount,
        currency: options.currency,
        propertyId: options.propertyId
      }
    });
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    openPaymentBrowser,
    cleanup
  };
};

// Alternative approach using URL detection in processing screen
export const detectPaymentResultFromURL = (url: string): 'success' | 'failed' | 'unknown' => {
  if (url.includes('mobile-payment-success')) {
    return 'success';
  } else if (url.includes('mobile-payment-failed')) {
    return 'failed';
  }
  return 'unknown';
};