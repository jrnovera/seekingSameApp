import { db } from '@/config/firebase';
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

export interface RentalTransaction {
  id?: string;
  // Payment Information
  amount: number; // Amount in cents
  currency: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;

  // Property Information
  propertyId: string;
  propertyTitle: string;
  hostId: string; // Property owner ID

  // Renter Information
  renterId: string;
  renterName: string;
  renterEmail: string;

  // Transaction Details
  type: 'rental_payment';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Additional Metadata
  metadata?: {
    source: string;
    platform: string;
    paymentMethod?: string;
    [key: string]: any;
  };
}

export interface CreateRentalTransactionParams {
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  propertyId: string;
  propertyTitle: string;
  hostId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  metadata?: Record<string, any>;
}

class TransactionService {
  /**
   * Create a rental transaction record
   */
  async createRentalTransaction(params: CreateRentalTransactionParams): Promise<string> {
    try {
      const transactionData: any = {
        // Payment Information
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        stripeSessionId: params.stripeSessionId,

        // Property Information
        propertyId: params.propertyId,
        propertyTitle: params.propertyTitle,
        hostId: params.hostId,

        // Renter Information
        renterId: params.renterId,
        renterName: params.renterName,
        renterEmail: params.renterEmail,

        // Transaction Details
        type: 'rental_payment',
        status: 'completed',
        description: `Rental payment for "${params.propertyTitle}"`,

        // Timestamps
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,

        // Additional Metadata
        metadata: {
          source: 'mobile_app',
          platform: 'ios_android',
          ...params.metadata,
        },
      };

      // Only add stripePaymentIntentId if it's defined
      if (params.stripePaymentIntentId) {
        transactionData.stripePaymentIntentId = params.stripePaymentIntentId;
      }

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);

      console.log('Rental transaction created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating rental transaction:', error);
      //console.error('Transaction data that failed:', JSON.stringify(transactionData, null, 2));
      throw error;
    }
  }

  /**
   * Get host ID from property document
   */
  async getPropertyHostId(propertyId: string): Promise<string | null> {
    try {
      const propertyRef = doc(db, 'property', propertyId);
      const propertyDoc = await getDoc(propertyRef);

      if (!propertyDoc.exists()) {
        console.error('Property not found:', propertyId);
        return null;
      }

      const propertyData = propertyDoc.data();

      // Handle different possible formats for createdby field
      let hostId: string | null = null;

      if (typeof propertyData.createdby === 'string') {
        hostId = propertyData.createdby;
      } else if (propertyData.createdby && typeof propertyData.createdby === 'object') {
        // Handle DocumentReference format
        const createdByRef = propertyData.createdby as any;
        if (createdByRef.path) {
          hostId = createdByRef.path.split('/')[1];
        } else if (createdByRef.id) {
          hostId = createdByRef.id;
        }
      } else if (propertyData.ownerId) {
        // Fallback to ownerId field
        hostId = propertyData.ownerId;
      } else if (propertyData.hostId) {
        // Fallback to hostId field
        hostId = propertyData.hostId;
      }

      if (!hostId) {
        console.warn('No host ID found for property:', propertyId);
      }

      return hostId;
    } catch (error) {
      console.error('Error getting property host ID:', error);
      return null;
    }
  }

  /**
   * Create rental transaction with automatic host ID resolution
   */
  async createRentalTransactionWithHostLookup(
    params: Omit<CreateRentalTransactionParams, 'hostId'>
  ): Promise<string> {
    try {
      // Get host ID from property
      const hostId = await this.getPropertyHostId(params.propertyId);

      if (!hostId) {
        throw new Error(`Unable to determine host ID for property ${params.propertyId}`);
      }

      return await this.createRentalTransaction({
        ...params,
        hostId,
      });
    } catch (error) {
      console.error('Error creating rental transaction with host lookup:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: RentalTransaction['status'],
    additionalData?: Partial<RentalTransaction>
  ): Promise<void> {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      const updateData = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      await updateDoc(transactionRef, updateData);
      console.log('Transaction status updated:', transactionId, status);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  }

  /**
   * Get transaction by Stripe session ID
   */
  async getTransactionByStripeSession(stripeSessionId: string): Promise<RentalTransaction | null> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('stripeSessionId', '==', stripeSessionId),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as RentalTransaction;
    } catch (error) {
      console.error('Error getting transaction by Stripe session:', error);
      return null;
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
export default TransactionService;