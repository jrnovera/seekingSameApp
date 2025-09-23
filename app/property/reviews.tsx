import { db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Types
type Review = {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
};

type Property = {
  id: string;
  title?: string;
  rating?: number;
};

export default function AllReviews() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  // Generate sample reviews (in a real app, you'd fetch these from Firestore)
  const generateSampleReviews = () => {
    return [
      {
        id: '1',
        userName: 'Sarah Johnson',
        rating: 5,
        comment: 'Absolutely loved this place! Great location, clean, and the host was very responsive. Would definitely stay here again.',
        date: '2 weeks ago'
      },
      {
        id: '2',
        userName: 'Michael Chen',
        rating: 4,
        comment: 'Nice property with good amenities. The neighborhood is quiet and safe. Only issue was the slow WiFi.',
        date: '1 month ago'
      },
      {
        id: '3',
        userName: 'Jessica Williams',
        rating: 5,
        comment: 'Perfect for my needs. Close to public transportation and restaurants. Very clean and well-maintained.',
        date: '2 months ago'
      },
      {
        id: '4',
        userName: 'David Rodriguez',
        rating: 4,
        comment: 'Great value for the price. The property manager was helpful and accommodating. Would recommend.',
        date: '3 months ago'
      },
      {
        id: '5',
        userName: 'Emily Thompson',
        rating: 3,
        comment: 'Decent place. Some maintenance issues but they were addressed promptly when reported.',
        date: '3 months ago'
      },
      {
        id: '6',
        userName: 'Robert Kim',
        rating: 5,
        comment: 'Excellent location and very spacious. All amenities worked perfectly and the place was spotless when I moved in.',
        date: '4 months ago'
      },
      {
        id: '7',
        userName: 'Amanda Garcia',
        rating: 4,
        comment: 'Very comfortable and well-designed space. The kitchen is fully equipped and modern.',
        date: '5 months ago'
      },
      {
        id: '8',
        userName: 'James Wilson',
        rating: 5,
        comment: 'One of the best properties I have stayed in. The host was incredibly helpful and the location is perfect.',
        date: '6 months ago'
      }
    ];
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color="#FFD700" />);
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={16} color="#FFD700" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-star-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }
    
    return stars;
  };

  // Load property data and reviews
  useEffect(() => {
    async function fetchPropertyAndReviews() {
      if (!id) {
        setError('No property ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Use the same collection name as homepage ("property")
        const propertyRef = doc(db, 'property', id as string);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
          const data = propertySnap.data();
          setProperty({
            id: propertySnap.id,
            title: data.title ?? data.name ?? 'Untitled',
            rating: data.rating ?? 4.7,
          });
          
          // In a real app, you would fetch reviews from Firestore
          // For now, we'll use sample data
          setReviews(generateSampleReviews());
        } else {
          setError('Property not found');
        }
      } catch (err: any) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyAndReviews();
  }, [id]);

  // Render a review item
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={[styles.reviewItem, { borderBottomColor: C.surfaceBorder }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          <View style={[styles.reviewAvatar, { backgroundColor: C.tint }]}>
            <Text style={styles.reviewAvatarText}>{item.userName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={[styles.reviewUserName, { color: C.text }]}>{item.userName}</Text>
            <View style={styles.reviewRating}>
              {renderStars(item.rating)}
              <Text style={[styles.reviewDate, { color: C.textMuted }]}>{item.date}</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: C.textMuted }]}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Reviews</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Reviews</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={C.textMuted} />
          <Text style={[styles.errorText, { color: C.text }]}>{error || 'Failed to load reviews'}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: C.tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.surfaceBorder }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Property Info */}
      <View style={[styles.propertyInfo, { borderBottomColor: C.surfaceBorder }]}>
        <Text style={[styles.propertyTitle, { color: C.text }]}>{property.title}</Text>
        <View style={styles.ratingContainer}>
          {renderStars(property.rating || 4.7)}
          <Text style={[styles.ratingText, { color: C.text }]}>
            {property.rating?.toFixed(1) || '4.7'} ({reviews.length} reviews)
          </Text>
        </View>
      </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    padding: 16,
    borderBottomWidth: 1,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewsList: {
    padding: 16,
    paddingBottom: 32,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
