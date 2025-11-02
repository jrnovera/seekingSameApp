import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { AuthService } from '../services/authService';
import { CreateUserData, LoginData, User } from '../types/user';
import { clearStoredAuthUser, getStoredAuthUser } from '../utils/setupFirebaseAuth';

interface AuthContextType {
  user: FirebaseUser | null;
  userDoc: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (userData: CreateUserData) => Promise<void>;
  signIn: (loginData: LoginData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored auth user in AsyncStorage
        const storedAuthUser = await getStoredAuthUser();
        
        if (storedAuthUser) {
          // We found a stored user, now get the full user data
          const storedUserData = await AuthService.getUserDocument(storedAuthUser.uid);
          if (storedUserData) {
            setUserDoc(storedUserData);
            setIsAuthenticated(true);
            console.log('User restored from AsyncStorage:', storedAuthUser.email);
            // Navigation will be handled by index.tsx redirect
          }
          
          // Firebase auth state will be handled by onAuthStateChanged
          // but we can show the user data immediately from storage
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth from storage:', error);
      }
    };

    // Initialize auth from storage first
    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get user document from Firestore (this will also update storage)
        const userDocument = await AuthService.getUserDocument(firebaseUser.uid);

        // Check if user has 'customer' role
        if (userDocument && userDocument.role !== 'customer') {
          // Sign out host/admin accounts immediately
          await AuthService.signOut();
          await clearStoredAuthUser();
          setUser(null);
          setUserDoc(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setUserDoc(userDocument);
        setIsAuthenticated(true);

        // Note: Auth data is now saved by setupFirebaseAuthPersistence
      } else {
        // If no Firebase user but we had stored data, clear it
        const storedAuth = await AuthService.isAuthenticated();
        if (storedAuth) {
          await AuthService.signOut(); // This will clear stored data
          await clearStoredAuthUser(); // Also clear our backup auth data
        }
        setUserDoc(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (userData: CreateUserData): Promise<void> => {
    try {
      const { user: firebaseUser, userDoc: newUserDoc } = await AuthService.signUp(userData);
      setUser(firebaseUser);
      setUserDoc(newUserDoc);
      setIsAuthenticated(true);
    } catch (error) {
      // Don't update loading state on error - let the UI component handle it
      throw error;
    }
  };

  const signIn = async (loginData: LoginData): Promise<void> => {
    try {
      const { user: firebaseUser, userDoc: existingUserDoc } = await AuthService.signIn(loginData);
      setUser(firebaseUser);
      setUserDoc(existingUserDoc);
      setIsAuthenticated(true);
    } catch (error) {
      // Don't update loading state on error - let the UI component handle it
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await AuthService.signOut();
      await clearStoredAuthUser(); // Clear our backup auth data
      setUser(null);
      setUserDoc(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserDoc = async (): Promise<void> => {
    if (user) {
      const userDocument = await AuthService.getUserDocument(user.uid);
      setUserDoc(userDocument);
    }
  };

  const value: AuthContextType = {
    user,
    userDoc,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshUserDoc,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
