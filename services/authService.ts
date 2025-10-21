import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    getIdToken,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { CreateUserData, LoginData, User } from '../types/user';
import { SecureStorage } from '../utils/secureStorage';

export class AuthService {
  // Helper method to convert undefined values to null for Firestore compatibility
  private static convertUndefinedToNull(obj: any): any {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = value === undefined ? null : value;
    }
    return converted;
  }
  // Sign up new user
  static async signUp(userData: CreateUserData): Promise<{ user: FirebaseUser; userDoc: User }> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const firebaseUser = userCredential.user;

      // Update display name in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: userData.display_name
      });

      // Create user document in Firestore
      const userDoc: User = {
        uid: firebaseUser.uid,
        email: userData.email,
        display_name: userData.display_name,
        phone_number: userData.phone_number || '',
        created_time: new Date(),
        isNewUser: true,
        role: 'host', // Default role
        favorites: [],
        walkthrough: false,
        isVerified: false,
        isSuspended: false,
        recentSearch: [],
        isSubscribe: false,
        photo_url: firebaseUser.photoURL || undefined,
        idPhoto: undefined
      };

      // Prepare data for Firestore (convert undefined to null, include all fields)
      const firestoreData = this.convertUndefinedToNull({
        ...userDoc,
        created_time: serverTimestamp(),
        metadata: {
          source: 'mobile_app',
          platform: 'ios_android',
          signupDate: serverTimestamp()
        }
      });

      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);

      // Get Firebase ID token and save to SecureStore
      const idToken = await getIdToken(firebaseUser);
      await SecureStorage.saveAuthToken(idToken);
      await SecureStorage.saveUserData(userDoc);

      return { user: firebaseUser, userDoc };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign in existing user
  static async signIn(loginData: LoginData): Promise<{ user: FirebaseUser; userDoc: User | null }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        loginData.email, 
        loginData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Get user document from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let userDoc: User | null = null;
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        userDoc = {
          ...data,
          created_time: data.created_time?.toDate() || new Date()
        } as User;
      }

      // Get Firebase ID token and save to SecureStore
      const idToken = await getIdToken(firebaseUser);
      await SecureStorage.saveAuthToken(idToken);
      if (userDoc) {
        await SecureStorage.saveUserData(userDoc);
      }

      return { user: firebaseUser, userDoc };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out user
  static async signOut(): Promise<void> {
    try {
      // Clear stored data from SecureStore
      await SecureStorage.clearAll();
      
      // Sign out from Firebase
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Get user document from Firestore
  static async getUserDocument(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return {
          ...data,
          created_time: data.created_time?.toDate() || new Date()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  // Check if user is authenticated from stored token
  static async isAuthenticated(): Promise<boolean> {
    try {
      return await SecureStorage.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Get stored user data
  static async getStoredUserData(): Promise<User | null> {
    try {
      return await SecureStorage.getUserData();
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  // Get stored auth token
  static async getStoredAuthToken(): Promise<string | null> {
    try {
      return await SecureStorage.getAuthToken();
    } catch (error) {
      console.error('Error getting stored auth token:', error);
      return null;
    }
  }

  // Helper method to convert Firebase error codes to user-friendly messages
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or try signing in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}
