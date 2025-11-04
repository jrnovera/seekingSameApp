import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types/user';

class UserService {
  // Get user profile by user ID
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          email: data.email || '',
          display_name: data.display_name || '',
          photo_url: data.photo_url || null,
          phone_number: data.phone_number,
          created_time: data.created_time?.toDate() || new Date(),
          isNewUser: data.isNewUser || false,
          role: data.role || 'user',
          favorites: data.favorites || [],
          walkthrough: data.walkthrough || false,
          isVerified: data.isVerified || false,
          isSuspended: data.isSuspended || false,
          recentSearch: data.recentSearch || [],
          idPhoto: data.idPhoto || null,
          isSubscribe: data.isSubscribe || false,
          // Profile fields
          bio: data.bio,
          location: data.location,
          interests: data.interests,
          religion: data.religion,
          about: data.about,
          preferences: data.preferences,
        } as User;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    profileData: Partial<User>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);

      // Remove fields that shouldn't be updated
      const { uid, email, created_time, password, ...updateData } = profileData as any;

      await updateDoc(userRef, updateData);
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
