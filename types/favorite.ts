export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  title?: string;
  location?: string;
  price?: number | string;
  type?: string;
  imageUrl?: string | null;
  createdAt?: Date;
}
