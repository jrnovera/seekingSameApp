import { makeAutoObservable } from 'mobx';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

class UserAuthStore {
  isAuthenticated = false;
  isLoading = true;
  isHydrated = false;
  user: User | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeAuth();
  }

  private initializeAuth() {
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      this.isLoading = false;
      this.isHydrated = true;
    });
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setAuthenticated(authenticated: boolean) {
    this.isAuthenticated = authenticated;
  }

  setUser(user: User | null) {
    this.user = user;
  }

  signOut() {
    this.isAuthenticated = false;
    this.user = null;
  }
}

export const userAuthStore = new UserAuthStore();
