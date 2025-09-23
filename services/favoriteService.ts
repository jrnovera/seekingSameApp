import { db } from '@/config/firebase';
import { Favorite } from '@/types/favorite';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';

const COLLECTION = 'favorites';

function mapDoc(id: string, data: any): Favorite {
  return {
    id,
    userId: data.userId,
    propertyId: data.propertyId,
    title: data.title,
    location: data.location,
    price: data.price,
    type: data.type,
    imageUrl: data.imageUrl ?? null,
    createdAt: (data.createdAt instanceof Timestamp) ? data.createdAt.toDate() : data.createdAt,
  } as Favorite;
}

export async function getFavoritesByUser(userId: string): Promise<Favorite[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export function listenFavoritesByUser(
  userId: string,
  callback: (favorites: Favorite[]) => void,
  onError?: (error: any) => void
) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => mapDoc(d.id, d.data()));
    callback(items);
  }, onError);
}

/**
 * Create a new favorite
 * @param favoriteData The favorite data to create
 * @returns Promise that resolves with the created favorite ID
 */
export async function createFavorite(favoriteData: {
  userId: string;
  propertyId: string;
  title?: string;
  location?: string;
  price?: number | string;
  type?: string;
  imageUrl?: string | null;
}): Promise<string> {
  // Create a clean object with only defined values
  const cleanData: Record<string, any> = {
    userId: favoriteData.userId,
    propertyId: favoriteData.propertyId,
    createdAt: serverTimestamp()
  };
  
  // Only add fields that are defined
  if (favoriteData.title) cleanData.title = favoriteData.title;
  if (favoriteData.location) cleanData.location = favoriteData.location;
  if (favoriteData.price !== undefined) cleanData.price = favoriteData.price;
  if (favoriteData.type) cleanData.type = favoriteData.type;
  if (favoriteData.imageUrl !== undefined) cleanData.imageUrl = favoriteData.imageUrl;
  
  const docRef = await addDoc(collection(db, COLLECTION), cleanData);
  return docRef.id;
}

/**
 * Check if a property is favorited by a user
 * @param userId The user ID
 * @param propertyId The property ID
 * @returns Promise that resolves with the favorite document ID if exists, null otherwise
 */
export async function checkIfFavorited(userId: string, propertyId: string): Promise<string | null> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('propertyId', '==', propertyId)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Remove a favorite by its ID
 * @param favoriteId The ID of the favorite to remove
 * @returns Promise that resolves when the favorite is removed
 */
export async function removeFavorite(favoriteId: string): Promise<void> {
  const favoriteRef = doc(db, COLLECTION, favoriteId);
  return deleteDoc(favoriteRef);
}
