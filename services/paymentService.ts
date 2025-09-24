import { auth } from '@/config/firebase';
import Constants from 'expo-constants';

const STRIPE_BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL || 'http://localhost:3001';

export interface CreateMobileCheckoutRequest {
  amount: number;
  propertyTitle: string;
  propertyId: string;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreateMobileCheckoutResponse {
  success: boolean;
  data: {
    sessionId: string;
    url: string;
    customerId: string;
    amount: number;
    currency: string;
    propertyId: string;
    propertyTitle: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    sessionId: string;
    paymentStatus: 'pending' | 'succeeded' | 'failed';
    paymentIntentId: string | null;
    amount: number;
    currency: string;
    customerEmail: string;
    propertyId: string;
    propertyTitle: string;
    created: number;
    paymentMethod: string;
  };
}

class PaymentService {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${STRIPE_BACKEND_URL}/api/mobile-payments${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create a mobile checkout session
   */
  async createMobileCheckout(request: CreateMobileCheckoutRequest): Promise<CreateMobileCheckoutResponse> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const payload = {
      ...request,
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || user.email?.split('@')[0] || 'User',
    };

    return this.makeRequest<CreateMobileCheckoutResponse>('/create-mobile-checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get payment status for polling
   */
  async getPaymentStatus(sessionId: string): Promise<PaymentStatusResponse> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.makeRequest<PaymentStatusResponse>(`/payment-status/${sessionId}?userId=${user.uid}`);
  }

  /**
   * Poll payment status until completion or timeout
   */
  async pollPaymentStatus(
    sessionId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<PaymentStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const response = await this.getPaymentStatus(sessionId);

          if (response.data.paymentStatus !== 'pending') {
            resolve(response);
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Payment status polling timed out'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const paymentService = new PaymentService();
export default PaymentService;