import {
  collection,
  doc,
  addDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  timestamp: Date;
  createdAt: Timestamp;
}

export interface ReviewInput {
  propertyId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
}

class ReviewService {
  // Add a new review for a property
  async addReview(reviewInput: ReviewInput): Promise<string> {
    try {
      const reviewData = {
        propertyId: reviewInput.propertyId,
        userId: reviewInput.userId,
        userName: reviewInput.userName,
        userEmail: reviewInput.userEmail || '',
        rating: reviewInput.rating,
        comment: reviewInput.comment,
        createdAt: serverTimestamp()
      };

      const reviewsCollection = collection(db, 'reviews');
      const reviewDoc = await addDoc(reviewsCollection, reviewData);

      console.log('Review added successfully:', reviewDoc.id);
      return reviewDoc.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // Subscribe to reviews for a specific property
  subscribeToPropertyReviews(propertyId: string, callback: (reviews: Review[]) => void): Unsubscribe {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('propertyId', '==', propertyId)
      );

      const unsubscribe = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          const reviews: Review[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({
              id: doc.id,
              propertyId: data.propertyId,
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail || undefined,
              rating: data.rating,
              comment: data.comment,
              timestamp: data.createdAt?.toDate() || new Date(),
              createdAt: data.createdAt
            });
          });

          // Sort reviews by timestamp manually (newest first)
          reviews.sort((a, b) => {
            const aTime = a.timestamp.getTime();
            const bTime = b.timestamp.getTime();
            return bTime - aTime;
          });

          callback(reviews);
        },
        (error) => {
          console.error('Error listening to reviews:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up reviews listener:', error);
      return () => {}; // Return empty function if setup fails
    }
  }

  // Get reviews for a specific property (one-time fetch)
  async getPropertyReviews(propertyId: string): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('propertyId', '==', propertyId)
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          reviewsQuery,
          (snapshot) => {
            const reviews: Review[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              reviews.push({
                id: doc.id,
                propertyId: data.propertyId,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail || undefined,
                rating: data.rating,
                comment: data.comment,
                timestamp: data.createdAt?.toDate() || new Date(),
                createdAt: data.createdAt
              });
            });

            // Sort reviews by timestamp manually (newest first)
            reviews.sort((a, b) => {
              const aTime = a.timestamp.getTime();
              const bTime = b.timestamp.getTime();
              return bTime - aTime;
            });

            unsubscribe(); // Unsubscribe after first fetch
            resolve(reviews);
          },
          (error) => {
            console.error('Error fetching reviews:', error);
            unsubscribe();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Error getting property reviews:', error);
      throw error;
    }
  }

  // Check if a user has already reviewed a property
  async hasUserReviewedProperty(userId: string, propertyId: string): Promise<boolean> {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('propertyId', '==', propertyId),
        where('userId', '==', userId)
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          reviewsQuery,
          (snapshot) => {
            const hasReviewed = !snapshot.empty;
            unsubscribe();
            resolve(hasReviewed);
          },
          (error) => {
            console.error('Error checking user review status:', error);
            unsubscribe();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Error checking if user reviewed property:', error);
      throw error;
    }
  }

  // Calculate average rating for a property
  async getPropertyAverageRating(propertyId: string): Promise<{ averageRating: number; totalReviews: number }> {
    try {
      const reviews = await this.getPropertyReviews(propertyId);

      if (reviews.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviews.length
      };
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return { averageRating: 0, totalReviews: 0 };
    }
  }

  // Format date for display
  formatReviewDate(date: Date): string {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  }
}

// Export singleton instance
const reviewService = new ReviewService();
export default reviewService;