import { db } from '@/config/firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Favorite } from '@/types/favorite';

const COLLECTION = 'favorites';

function mapDoc(id: string, data: any): Favorite {
  return {
    id,
    userId: data.userId,
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
