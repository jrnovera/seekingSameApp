export interface User {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string | null | undefined;
  phone_number?: string;
  password?: string; // Note: This should never be stored in Firestore
  created_time: Date;
  isNewUser: boolean;
  role: string;
  favorites: string[]; // Array of property IDs
  walkthrough: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  recentSearch: string[];
  idPhoto?: string | null | undefined;
  isSubscribe: boolean;
  // Profile fields
  bio?: string;
  location?: string;
  interests?: string;
  religion?: string;
  about?: string;
  preferences?: {
    dietary?: string;
    lifestyle?: string;
    pets?: string;
    schedule?: string;
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  display_name: string;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
