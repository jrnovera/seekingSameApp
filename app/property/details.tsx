import RemoteImage from '@/components/remote-image';
import ReviewModal from '@/components/ReviewModal';
import { auth, db } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import conversationService from '@/services/conversationService';
import { checkIfFavorited, createFavorite, removeFavorite } from '@/services/favoriteService';
import { paymentService } from '@/services/paymentService';
import reviewService, { Review } from '@/services/reviewService';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type Property = {
  id: string;
  title?: string;
  location?: string | { latitude: number | string; longitude: number | string; type?: string };
  price?: string | number;
  type?: string;
  imageUrl?: string | null;
  photo?: string;
  samplePhotos?: string[];
  cities?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  description?: string;
  descriptions?: string;
  bedrooms?: string | number;
  bedroomCount?: number;
  bathrooms?: string | number;
  BathRoomCount?: number;
  amenities?: string[];
  preferences?: string[];
  latitude?: number | string;
  longitude?: number | string;
  createdby?: string;
  address?: string;
  rating?: number;
  isAvailable?: boolean;
  rentedBy?: string;
};


export default function PropertyDetails() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  console.log("CHeck property:", JSON.stringify(property, null,2))
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme as 'light' | 'dark'];

  // Helper function to format location display
  const getLocationDisplay = (property: Property): string => {
    // Always prioritize cities if available
    if (property.cities && property.cities.trim() !== '') {
      return property.cities;
    }

    // If location is a string, use it
    if (typeof property.location === 'string') {
      return property.location;
    }

    // Fall back to address if available
    if (property.address) {
      return property.address;
    }
    
    // Last resort - if location is an object with coordinates, don't show raw coordinates
    if (property.location && typeof property.location === 'object' && 'latitude' in property.location) {
      return 'Location available on map';
    }
    
    return 'Location not available';
  };

  // Helper function to get icon for amenity
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const accentColor = '#3c95a6';
    
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Ionicons name="wifi" size={20} color={accentColor} />;
    } else if (amenityLower.includes('kitchen')) {
      return <Ionicons name="restaurant-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('parking') || amenityLower.includes('garage')) {
      return <Ionicons name="car-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('pet')) {
      return <MaterialIcons name="pets" size={20} color={accentColor} />;
    } else if (amenityLower.includes('tv')) {
      return <Ionicons name="tv-outline" size={20} color={accentColor} />;
    } else if (amenityLower.includes('washer') || amenityLower.includes('dryer') || amenityLower.includes('laundry')) {
      return <MaterialIcons name="local-laundry-service" size={20} color={accentColor} />;
    } else if (amenityLower.includes('air') || amenityLower.includes('ac') || amenityLower.includes('conditioning')) {
      return <FontAwesome name="snowflake-o" size={20} color={accentColor} />;
    } else if (amenityLower.includes('heat') || amenityLower.includes('heating')) {
      return <MaterialCommunityIcons name="radiator" size={20} color={accentColor} />;
    } else if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
      return <MaterialIcons name="fitness-center" size={20} color={accentColor} />;
    } else if (amenityLower.includes('pool') || amenityLower.includes('swimming')) {
      return <MaterialIcons name="pool" size={20} color={accentColor} />;
    } else if (amenityLower.includes('security') || amenityLower.includes('camera')) {
      return <MaterialIcons name="security" size={20} color={accentColor} />;
    } else {
      return <Ionicons name="checkmark-circle-outline" size={20} color={accentColor} />;
    }
  };

  // Handle chat button press
  const handleChatPress = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to start a chat with the property owner.');
      return;
    }

    if (!property?.createdby) {
      Alert.alert('Error', 'Property owner information is not available.');
      console.error('Invalid property.createdby:', property?.createdby);
      return;
    }

    // Extract user ID from Firebase DocumentReference
    let hostUserId: string;
    console.log('Processing property.createdby:', property.createdby);
    console.log('Type of property.createdby:', typeof property.createdby);

    if (typeof property.createdby === 'string') {
      hostUserId = property.createdby;
    } else if (property.createdby && typeof property.createdby === 'object') {
      // Cast to any to access DocumentReference properties
      const createdByRef = property.createdby as any;

      // Try different ways to extract the user ID from DocumentReference
      if (createdByRef.referencePath) {
        hostUserId = createdByRef.referencePath.split('/')[1];
        console.log('Extracted host user ID from referencePath:', hostUserId);
      } else if (createdByRef.path) {
        hostUserId = createdByRef.path.split('/')[1];
        console.log('Extracted host user ID from path:', hostUserId);
      } else if (createdByRef.id) {
        hostUserId = createdByRef.id;
        console.log('Extracted host user ID from id:', hostUserId);
      } else {
        // Log all available properties to debug
        console.log('Available properties on createdby object:', Object.keys(createdByRef));
        Alert.alert('Error', 'Cannot extract user ID from property owner reference.');
        return;
      }
    } else {
      Alert.alert('Error', 'Property owner information format is invalid.');
      console.error('Unsupported property.createdby format:', property?.createdby);
      return;
    }

    if (auth.currentUser.uid === hostUserId) {
      Alert.alert('Info', 'You cannot chat with yourself on your own property.');
      return;
    }

    try {
      console.log('Creating conversation between:', auth.currentUser.uid, 'and', hostUserId);

      // Get user info for both participants
      const [currentUserDoc, hostUserDoc] = await Promise.all([
        getDoc(doc(db, 'users', auth.currentUser.uid)),
        getDoc(doc(db, 'users', hostUserId))
      ]);

      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
      const hostUserData = hostUserDoc.exists() ? hostUserDoc.data() : {};

      console.log('Current user data:', currentUserData);
      console.log('Host user data:', hostUserData);

      // Create or get existing conversation
      const conversation = await conversationService.getOrCreateConversation(
        hostUserId, // hostId
        auth.currentUser.uid, // userId
        property.id || 'unknown', // propertyId
        property.title || 'Property', // propertyTitle
        {
          uid: auth.currentUser.uid,
          email: currentUserData.email || '',
          display_name: currentUserData.display_name || currentUserData.name || 'User'
        },
        {
          uid: hostUserId,
          email: hostUserData.email || '',
          display_name: hostUserData.display_name || hostUserData.name || 'Host'
        }
      );

      // Navigate to the conversation screen
      router.push(`/conversation/${conversation.id}`);

    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  // Handle rent button press
  const handleRentPress = async () => {
    if (!auth.currentUser || !property) {
      Alert.alert('Sign In Required', 'Please sign in to rent this property.');
      return;
    }

    if (paymentLoading) return;

    // Check if property is available for rent
    if (property.isAvailable === false) {
      Alert.alert('Property Unavailable', 'This property is currently not available for rent.');
      return;
    }

    // Check if user is trying to rent their own property
    if (property.createdby === auth.currentUser.uid) {
      Alert.alert('Invalid Action', 'You cannot rent your own property.');
      return;
    }

    try {
      setPaymentLoading(true);

      // Calculate amount in cents for Stripe
      let amount = 0;
      if (typeof property.price === 'number') {
        amount = property.price * 100; // Convert to cents
      } else if (typeof property.price === 'string') {
        // Extract number from string (remove $ and other characters)
        const priceNumber = parseFloat(property.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNumber)) {
          amount = priceNumber * 100; // Convert to cents
        }
      }

      if (amount < 50) { // Minimum 50 cents for Stripe
        Alert.alert('Invalid Amount', 'The property price seems to be invalid. Please contact the property owner.');
        return;
      }

      Alert.alert(
        'Proceed to Payment',
        `Would you like to rent "${property.title}" for ${typeof property.price === 'number' ? `$${property.price}` : property.price} per month?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed',
            onPress: async () => {
              try {
                // Create mobile checkout session
                const response = await paymentService.createMobileCheckout({
                  amount: amount,
                  propertyTitle: property.title || 'Property Rental',
                  propertyId: property.id,
                  currency: 'usd',
                  metadata: {
                    propertyId: property.id,
                    propertyTitle: property.title || '',
                    location: getLocationDisplay(property),
                    bedrooms: property.bedrooms?.toString() || '',
                    bathrooms: property.bathrooms?.toString() || ''
                  }
                });

                // Start background polling immediately after creating session
                const pollPaymentStatus = async () => {
                  let attempts = 0;
                  const maxAttempts = 60; // Poll for up to 2 minutes
                  const intervalMs = 2000; // Check every 2 seconds

                  const pollInterval = setInterval(async () => {
                    try {
                      attempts++;
                      const statusResponse = await paymentService.getPaymentStatus(response.data.sessionId);

                      if (statusResponse.data.paymentStatus === 'succeeded') {
                        clearInterval(pollInterval);
                        console.log('🎉 Payment succeeded! Preparing to navigate...');

                        // Start background navigation immediately
                        const navigationPromise = new Promise((resolve) => {
                          setTimeout(() => {
                            router.push({
                              pathname: '/payment-success',
                              params: {
                                sessionId: statusResponse.data.sessionId,
                                propertyTitle: statusResponse.data.propertyTitle,
                                amount: statusResponse.data.amount.toString(),
                                currency: statusResponse.data.currency,
                                propertyId: statusResponse.data.propertyId
                              }
                            });
                            resolve(true);
                          }, 0); // Navigate immediately in background
                        });

                        // Wait 1 second (hidden from user) then close browser
                        setTimeout(async () => {
                          console.log('⏰ 1-second delay complete, closing browser...');
                          await navigationPromise; // Ensure navigation started
                          WebBrowser.dismissBrowser();
                        }, 1000); // 1 second hidden delay

                        return;
                      }

                      if (statusResponse.data.paymentStatus === 'failed') {
                        clearInterval(pollInterval);
                        console.log('❌ Payment failed! Preparing to navigate...');

                        // Start background navigation immediately
                        const navigationPromise = new Promise((resolve) => {
                          setTimeout(() => {
                            router.push({
                              pathname: '/payment-failed',
                              params: {
                                sessionId: statusResponse.data.sessionId,
                                propertyTitle: statusResponse.data.propertyTitle,
                                amount: statusResponse.data.amount.toString(),
                                currency: statusResponse.data.currency,
                                propertyId: statusResponse.data.propertyId,
                                errorMessage: 'Payment was declined or failed'
                              }
                            });
                            resolve(true);
                          }, 0); // Navigate immediately in background
                        });

                        // Wait 1 second (hidden from user) then close browser
                        setTimeout(async () => {
                          console.log('⏰ 1-second delay complete, closing browser...');
                          await navigationPromise; // Ensure navigation started
                          WebBrowser.dismissBrowser();
                        }, 1000); // 1 second hidden delay

                        return;
                      }

                      if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        // Close browser if still open
                        WebBrowser.dismissBrowser();
                        // Navigate to failed screen with timeout message
                        router.push({
                          pathname: '/payment-failed',
                          params: {
                            sessionId: response.data.sessionId,
                            propertyTitle: response.data.propertyTitle,
                            amount: response.data.amount.toString(),
                            currency: response.data.currency,
                            propertyId: response.data.propertyId,
                            errorMessage: 'Payment is taking longer than expected. Please check your payment status.'
                          }
                        });
                      }
                    } catch (error) {
                      console.error('Error polling payment status:', error);
                      // Continue polling on error
                    }
                  }, intervalMs);

                  return pollInterval;
                };

                // Start polling
                const pollInterval = await pollPaymentStatus();

                // Open Stripe Checkout in in-app browser modal
                const result = await WebBrowser.openBrowserAsync(response.data.url, {
                  presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET, // iOS modal style
                  controlsColor: '#3c95a6', // Match your app's theme
                  toolbarColor: '#ffffff',
                  showTitle: true,
                  enableBarCollapsing: false,
                  showInRecents: false,
                  readerMode: false,
                  dismissButtonStyle: 'close',
                });

                // If user manually closed browser before polling completed
                if (pollInterval && result.type === 'dismiss') {
                  clearInterval(pollInterval);
                  // Navigate to processing screen as fallback
                  router.push({
                    pathname: '/payment-processing',
                    params: {
                      sessionId: response.data.sessionId,
                      propertyTitle: response.data.propertyTitle,
                      amount: response.data.amount.toString(),
                      currency: response.data.currency,
                      propertyId: response.data.propertyId
                    }
                  });
                }
              } catch (error) {
                console.error('Payment initiation error:', error);
                Alert.alert(
                  'Payment Error',
                  error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Rent button error:', error);
      Alert.alert('Error', 'Failed to process payment request. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };


  // Handle see all reviews
  const handleSeeAllReviews = () => {
    // Navigate to the reviews page with the property ID
    router.push(`/property/reviews?id=${property?.id}`);
  };

  // Handle add review button press
  const handleAddReview = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review.');
      return;
    }

    if (!property?.id) {
      Alert.alert('Error', 'Property information is not available.');
      return;
    }

    if (hasUserReviewed) {
      Alert.alert('Already Reviewed', 'You have already left a review for this property.');
      return;
    }

    setShowReviewModal(true);
  };

  // Load reviews for the property
  const loadReviews = async (propertyId: string) => {
    try {
      const unsubscribe = reviewService.subscribeToPropertyReviews(propertyId, (reviewsList) => {
        setReviews(reviewsList);
        setTotalReviews(reviewsList.length);

        if (reviewsList.length > 0) {
          const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
          const avgRating = totalRating / reviewsList.length;
          setAverageRating(Math.round(avgRating * 10) / 10);
        } else {
          setAverageRating(0);
        }

        // Check if current user has reviewed this property
        if (auth.currentUser) {
          const hasReviewed = reviewsList.some(review => review.userId === auth.currentUser!.uid);
          setHasUserReviewed(hasReviewed);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);
    }
  };

  // Check if current user has reviewed this property
  const checkUserReviewStatus = async (propertyId: string) => {
    if (!auth.currentUser) {
      setHasUserReviewed(false);
      return;
    }

    try {
      const hasReviewed = await reviewService.hasUserReviewedProperty(auth.currentUser.uid, propertyId);
      setHasUserReviewed(hasReviewed);
    } catch (error) {
      console.error('Error checking user review status:', error);
      setHasUserReviewed(false);
    }
  };

  // Handle review added callback
  const handleReviewAdded = () => {
    // Reviews will be updated automatically via the subscription
    // The hasUserReviewed state will also be updated in the loadReviews callback
    console.log('Review added successfully');
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

  // Function to toggle favorite status
  const toggleFavorite = async () => {
    if (!auth.currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to add this property to your favorites.');
      return;
    }
    
    try {
      setFavoriteLoading(true);
      const userId = auth.currentUser.uid;
      
      if (isFavorite && favoriteDocId) {
        // Remove from favorites
        await removeFavorite(favoriteDocId);
        setIsFavorite(false);
        setFavoriteDocId(null);
        Alert.alert('Success', 'Property removed from favorites');
      } else {
        // Add to favorites
        const favoriteData: any = {
          userId,
          propertyId: id as string,
          title: property?.title || 'Untitled Property',
          location: property ? getLocationDisplay(property) : 'Unknown location',
          imageUrl: property?.imageUrl || null,
          price: property?.price || 0
        };
        
        // Only add type if it exists to avoid undefined field error
        if (property?.type) {
          favoriteData.type = property.type;
        }
        
        const favoriteId = await createFavorite(favoriteData);
        setIsFavorite(true);
        setFavoriteDocId(favoriteId);
        
        // Show success message with option to navigate to favorites
        Alert.alert(
          'Added to Favorites!', 
          'Property has been added to your favorites.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'View Favorites', 
              onPress: () => router.push('/(tabs)/favorites')
            }
          ]
        );
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // Check if property is in favorites
  const checkIfFavorite = async () => {
    if (!auth.currentUser || !id) return;
    
    try {
      const userId = auth.currentUser.uid;
      const favoriteId = await checkIfFavorited(userId, id as string);
      
      if (favoriteId) {
        setIsFavorite(true);
        setFavoriteDocId(favoriteId);
      } else {
        setIsFavorite(false);
        setFavoriteDocId(null);
      }
      
      console.log(`Property ${id} favorite status:`, !!favoriteId);
    } catch (err) {
      console.error('Error checking favorite status:', err);
      setIsFavorite(false);
      setFavoriteDocId(null);
    }
  };

  // Load property data
  useEffect(() => {
    async function fetchProperty() {
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
          // Prepare all available photos
          const mainPhoto = data.imageUrl ?? data.photo ?? data.image ?? null;
          const samplePhotos = data.samplePhotos ?? [];
          const allAvailablePhotos = [mainPhoto, ...samplePhotos].filter(Boolean);
          
          // Set the current image to the main photo
          setCurrentImage(mainPhoto);
          
          // Store all photos for the gallery
          setAllPhotos(allAvailablePhotos);
          
          // Extract latitude and longitude from data
          let latitude = data.latitude;
          let longitude = data.longitude;
          
          // If location is an object with lat/lng, use those values
          if (data.location && typeof data.location === 'object' && 'latitude' in data.location && 'longitude' in data.location) {
            latitude = data.location.latitude;
            longitude = data.location.longitude;
          }
          
          setProperty({
            id: propertySnap.id,
            title: data.title ?? data.name ?? 'Untitled',
            location: data.location ?? data.address ?? 'Unknown',
            price: data.price ?? data.rent ?? 'Price not available',
            type: data.type ?? data.category ?? undefined,
            imageUrl: mainPhoto,
            photo: data.photo,
            samplePhotos: samplePhotos,
            cities: data.city ?? data.cities ?? undefined,
            isAvailable: data.isAvailable,
            state: data.state ?? undefined,
            description: data.description ?? data.descriptions ?? undefined,
            descriptions: data.descriptions,
            bedrooms: data.bedrooms ?? data.bedroomCount ?? data.beds ?? '3',
            bedroomCount: data.bedroomCount,
            bathrooms: data.bathrooms ?? data.BathRoomCount ?? data.baths ?? '2',
            BathRoomCount: data.BathRoomCount,
            amenities: data.amenities ?? [],
            preferences: data.preferences ?? [],
            latitude: latitude,
            longitude: longitude,
            createdby: data.createdby ?? data.userId ?? undefined,
            rating: data.rating ?? 4.7,
          });
          
          // Load reviews for this property (this also checks user review status)
          loadReviews(propertySnap.id);

          // Check if this property is in user's favorites
          checkIfFavorite();
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

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3c95a6" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.container, { backgroundColor: C.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          {error || 'Property not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: C.tint }]} 
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.screenBg }]}>
      {/* Property Image with Back Button and Type Badge */}
      <View style={styles.imageContainer}>
        <RemoteImage 
          uri={currentImage || property.imageUrl} 
          style={styles.propertyImage}
        >
          {/* Back button */}
          <View style={styles.imageOverlayTop}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: C.surfaceSoft }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#3c95a6" />
            </TouchableOpacity>
            
            {/* Right side buttons */}
            <View style={styles.imageTopRightButtons}>
              
              
              <TouchableOpacity 
                style={[styles.iconButton, { backgroundColor: favoriteLoading ? C.surfaceSoft : 'transparent' }]}
                onPress={toggleFavorite}
                disabled={favoriteLoading}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color="#3c95a6" />
                ) : (
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorite ? "#3c95a6" : "#3c95a6"} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Type badge */}
          {property.type && (
            <View style={[styles.propertyTypeContainer, { backgroundColor: '#3c95a6' }]}>
              <Text style={styles.propertyType}>{property.type}</Text>
            </View>
          )}
          
          {/* Photo count indicator */}
          {allPhotos.length > 1 && (
            <View style={[styles.photoCountContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={styles.photoCountText}>{allPhotos.length}</Text>
            </View>
          )}
        </RemoteImage>
      </View>

      {/* Photo Gallery */}
      {allPhotos.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoGallery}
        >
          {allPhotos.map((photo, index) => (
            <TouchableOpacity 
              key={`photo-${index}`} 
              style={[styles.thumbnailContainer, currentImage === photo ? { borderColor: '#3c95a6' } : null]}
              onPress={() => setCurrentImage(photo)}
            >
              <RemoteImage 
                uri={photo} 
                style={styles.thumbnail}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {/* Property Details */}
      <View style={styles.detailsContainer}>
        {/* Title and Price */}
        <View style={styles.titlePriceRow}>
          <Text style={[styles.propertyTitle, { color: C.text }]}>{property.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: '#3c95a6' }]}>
              ${typeof property.price === 'number' ? property.price : property.price}
            </Text>
            <Text style={[styles.perMonth, { color: C.textMuted }]}>per month</Text>
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={C.textMuted} />
          <Text style={[styles.locationText, { color: C.textMuted }]}>
            {getLocationDisplay(property)}
          </Text>
        </View>
        
       
        
        {/* Host info */}
        <View style={styles.hostContainer}>
          <View style={styles.hostAvatarContainer}>
            <View style={[styles.hostAvatar, { backgroundColor: C.tint }]}>
              <Text style={styles.hostAvatarText}>L</Text>
            </View>
            <View>
              <Text style={[styles.hostName, { color: C.text }]}>Lincoln Smith</Text>
              <Text style={[styles.hostLocation, { color: C.textMuted }]}>{getLocationDisplay(property)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amenitiesContainer}>
          <View style={styles.amenityItem}>
            <Ionicons name="bed-outline" size={20} color={C.text} />
            <Text style={[styles.amenityText, { color: C.text }]}>{property.bedrooms} Bedroom</Text>
          </View>
          <View style={styles.amenityItem}>
            <MaterialIcons name="bathroom" size={20} color={C.text} />
            <Text style={[styles.amenityText, { color: C.text }]}>{property.bathrooms} Bathroom</Text>
          </View>
        </View>

        {(property.description || property.descriptions) && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: C.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: C.textMuted }]}>{property.description || property.descriptions}</Text>
          </View>
        )}

        {/* Amenities */}
        <View style={styles.amenitiesSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(property.amenities && property.amenities.length > 0 ? property.amenities : [
              'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Parking', 'TV', 'Washer/Dryer'
            ]).map((amenity, index) => (
              <View key={index} style={styles.amenityGridItem}>
                {getAmenityIcon(amenity)}
                <Text style={[styles.amenityGridText, { color: C.text }]}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Preferences */}
        {property.preferences && property.preferences.length > 0 && (
          <View style={styles.preferencesSection}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Host Preferences</Text>
            <View style={styles.preferencesContainer}>
              {property.preferences.map((preference, index) => (
                <View key={index} style={[styles.preferenceItem, { borderColor: '#3c95a6', backgroundColor: 'rgba(60, 149, 166, 0.05)' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#3c95a6" />
                  <Text style={[styles.preferenceText, { color: C.text }]}>{preference}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Location</Text>
          <TouchableOpacity 
            style={styles.mapContainer}
            onPress={() => {
              // Extract latitude and longitude
              let latitude, longitude;
              
              if (property.location && typeof property.location === 'object' && 'latitude' in property.location && 'longitude' in property.location) {
                latitude = property.location.latitude;
                longitude = property.location.longitude;
              } else if (property.latitude !== undefined && property.longitude !== undefined) {
                latitude = property.latitude;
                longitude = property.longitude;
              }
              
              if (latitude && longitude) {
                // Convert to string if they're numbers
                const lat = typeof latitude === 'number' ? latitude.toString() : latitude;
                const lng = typeof longitude === 'number' ? longitude.toString() : longitude;
                
                // Create Google Maps URL
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                
                // Open URL in browser
                Linking.openURL(url).catch(err => {
                  console.error('Error opening map:', err);
                  Alert.alert('Error', 'Could not open map. Please try again.');
                });
              } else {
                Alert.alert('Location Unavailable', 'Map coordinates are not available for this property.');
              }
            }}
          >
            <View style={styles.mapImagePlaceholder}>
              <Entypo name="location-pin" size={40} color="#3c95a6" />
              <Text style={[styles.mapText, { color: C.text }]}>View on Google Maps</Text>
            </View>
            <View style={styles.mapOverlay}>
              <View style={styles.mapButtonContainer}>
                <View style={[styles.mapButton, { backgroundColor: '#3c95a6' }]}>
                  <Text style={styles.mapButtonText}>Open Map</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.mapAddress, { color: C.textMuted }]}>{getLocationDisplay(property)}</Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Reviews</Text>
            <View style={styles.ratingContainer}>
              {averageRating > 0 ? (
                <>
                  {renderStars(averageRating)}
                  <Text style={[styles.ratingText, { color: C.text }]}>
                    {averageRating.toFixed(1)} ({totalReviews})
                  </Text>
                </>
              ) : (
                <Text style={[styles.ratingText, { color: C.textMuted }]}>No reviews yet</Text>
              )}
            </View>
          </View>

          {/* Add Review Button */}
          {auth.currentUser && !hasUserReviewed && (
            <TouchableOpacity
              style={[styles.addReviewButton, { backgroundColor: '#3c95a6' }]}
              onPress={handleAddReview}
            >
              <Ionicons name="star-outline" size={20} color="#fff" />
              <Text style={styles.addReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <>
              {reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={[styles.reviewItem, { borderBottomColor: C.surfaceBorder }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      <View style={[styles.reviewAvatar, { backgroundColor: '#3c95a6' }]}>
                        <Text style={styles.reviewAvatarText}>{review.userName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={[styles.reviewUserName, { color: C.text }]}>{review.userName}</Text>
                        <View style={styles.reviewRating}>
                          {renderStars(review.rating)}
                          <Text style={[styles.reviewDate, { color: C.textMuted }]}>
                            {reviewService.formatReviewDate(review.timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: C.textMuted }]}>{review.comment}</Text>
                </View>
              ))}

              {reviews.length > 2 && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={handleSeeAllReviews}
                >
                  <Text style={[styles.seeAllText, { color: '#3c95a6' }]}>See All Reviews ({reviews.length})</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3c95a6" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={C.textMuted} />
              <Text style={[styles.noReviewsText, { color: C.textMuted }]}>
                No reviews yet. Be the first to review this property!
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.chatButton, { backgroundColor: C.surface, borderColor: C.tint }]}
          onPress={handleChatPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color={C.tint} />
          <Text style={[styles.chatButtonText, { color: C.tint }]}>Chat & Inquire</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.rentButton,
            {
              backgroundColor: paymentLoading
                ? C.surfaceSoft
                : (property?.isAvailable === false
                  ? '#666'
                  : C.tint
                )
            }
          ]}
          onPress={handleRentPress}
          disabled={paymentLoading || property?.isAvailable === false}
        >
          {paymentLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : property?.isAvailable === false ? (
            <MaterialIcons name="block" size={20} color="#fff" />
          ) : (
            <MaterialIcons name="payment" size={20} color="#fff" />
          )}
          <Text style={styles.rentButtonText}>
            {paymentLoading
              ? 'Processing...'
              : property?.isAvailable === false
                ? 'Not Available'
                : 'Rent Now'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      {property && auth.currentUser && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          propertyId={property.id}
          propertyTitle={property.title || 'Property'}
          userId={auth.currentUser.uid}
          userName={auth.currentUser.displayName || auth.currentUser.email || 'User'}
          userEmail={auth.currentUser.email || ''}
          onReviewAdded={handleReviewAdded}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  photoCountContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoGallery: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#3c95a6',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  imageTopRightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  propertyTypeContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  propertyType: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsContainer: {
    padding: 16,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  perMonth: {
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  hostContainer: {
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hostAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
  },
  hostLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  amenityText: {
    marginLeft: 8,
    fontSize: 14,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  preferencesSection: {
    marginBottom: 24,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  preferenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  mapImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  mapButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  mapAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityGridItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 8,
  },
  amenityGridText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 10,
  },
  chatButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rentButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  noReviewsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
