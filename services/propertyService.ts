import { db } from '@/config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export interface PropertyUpdateData {
  isAvailable?: boolean;
  rentedBy?: string;
  rentedAt?: Date;
  [key: string]: any;
}

class PropertyService {
  /**
   * Update property availability status
   */
  async updatePropertyAvailability(
    propertyId: string,
    isAvailable: boolean,
    rentedBy?: string
  ): Promise<void> {
    try {
      const propertyRef = doc(db, 'property', propertyId);

      // Check if property exists first
      const propertyDoc = await getDoc(propertyRef);
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }

      const updateData: PropertyUpdateData = {
        isAvailable,
        updatedAt: new Date(),
      };

      // If marking as unavailable (rented), add rental info
      if (!isAvailable && rentedBy) {
        updateData.rentedBy = rentedBy;
        updateData.rentedAt = new Date();
      }

      // If marking as available again, clear rental info
      if (isAvailable) {
        updateData.rentedBy = null;
        updateData.rentedAt = null;
      }

      await updateDoc(propertyRef, updateData);
      console.log(`Property ${propertyId} availability updated to: ${isAvailable}`);

    } catch (error) {
      console.error('Error updating property availability:', error);
      throw error;
    }
  }

  /**
   * Mark property as rented
   */
  async markPropertyAsRented(propertyId: string, rentedBy: string): Promise<void> {
    return this.updatePropertyAvailability(propertyId, false, rentedBy);
  }

  /**
   * Mark property as available
   */
  async markPropertyAsAvailable(propertyId: string): Promise<void> {
    return this.updatePropertyAvailability(propertyId, true);
  }

  /**
   * Get property availability status
   */
  async getPropertyAvailability(propertyId: string): Promise<boolean | null> {
    try {
      const propertyRef = doc(db, 'property', propertyId);
      const propertyDoc = await getDoc(propertyRef);

      if (!propertyDoc.exists()) {
        return null;
      }

      const data = propertyDoc.data();
      return data.isAvailable ?? true; // Default to true if not set
    } catch (error) {
      console.error('Error getting property availability:', error);
      return null;
    }
  }

  /**
   * Check if property is available for rent
   */
  async isPropertyAvailable(propertyId: string): Promise<boolean> {
    const availability = await this.getPropertyAvailability(propertyId);
    return availability === true;
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
export default PropertyService;