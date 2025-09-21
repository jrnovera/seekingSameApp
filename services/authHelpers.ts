import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut as firebaseSignOut, onAuthStateChanged, signInWithEmailAndPassword, User } from 'firebase/auth';

export type AuthStateListener = (user: User | null) => void;

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export function subscribeToAuthState(listener: AuthStateListener) {
  const unsubscribe = onAuthStateChanged(auth, listener);
  return unsubscribe;
}

export async function checkEmailInUse(email: string) {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return (methods?.length ?? 0) > 0;
}

export async function createAccountWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}
