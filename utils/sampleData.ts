import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const sampleProperties = [
  {
    name: 'Modern Apartment',
    title: 'Modern Apartment',
    descriptions: 'A beautiful modern apartment in the heart of Manila with all amenities included.',
    email: 'owner1@example.com',
    phoneNumber: '+63 912 345 6789',
    cities: 'Manila',
    capacity: 4,
    categories: 'Whole place',
    price: 120,
    deposit: 240,
    parkingSizeForRv: 0,
    bathroomType: 'Private',
    bedroomCount: 3,
    BathRoomCount: 2,
    amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking'],
    preferences: ['No smoking', 'No pets'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.5995',
      longitude: '120.9842'
    },
    type: 'Apartment',
    category: 'Whole place',
    city: 'Manila',
    state: 'Metro Manila',
    zipCode: '1000',
    address: {
      street: 'St. Cikoko Timur',
      unit: '3A',
      city: 'Manila',
      state: 'Metro Manila',
      zipCode: '1000',
      country: 'Philippines'
    }
  },
  {
    name: 'Cozy Studio',
    title: 'Cozy Studio',
    descriptions: 'Perfect studio apartment for students and young professionals.',
    email: 'owner2@example.com',
    phoneNumber: '+63 923 456 7890',
    cities: 'Quezon City',
    capacity: 2,
    categories: 'Room',
    price: 80,
    deposit: 160,
    parkingSizeForRv: 0,
    bathroomType: 'Private',
    bedroomCount: 1,
    BathRoomCount: 1,
    amenities: ['WiFi', 'Air Conditioning', 'Shared Kitchen'],
    preferences: ['Students welcome', 'No smoking'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.6760',
      longitude: '121.0437'
    },
    type: 'Studio',
    category: 'Room',
    city: 'Quezon City',
    state: 'Metro Manila',
    zipCode: '1100',
    address: {
      street: 'Commonwealth Avenue',
      unit: '5B',
      city: 'Quezon City',
      state: 'Metro Manila',
      zipCode: '1100',
      country: 'Philippines'
    }
  },
  {
    name: 'Family House',
    title: 'Family House',
    descriptions: 'Spacious family house with garden and parking space.',
    email: 'owner3@example.com',
    phoneNumber: '+63 934 567 8901',
    cities: 'Makati',
    capacity: 6,
    categories: 'Whole place',
    price: 200,
    deposit: 400,
    parkingSizeForRv: 0,
    bathroomType: 'Private',
    bedroomCount: 4,
    BathRoomCount: 3,
    amenities: ['WiFi', 'Air Conditioning', 'Garden', 'Parking', 'Security'],
    preferences: ['Families welcome', 'No parties'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.5547',
      longitude: '121.0244'
    },
    type: 'House',
    category: 'Whole place',
    city: 'Makati',
    state: 'Metro Manila',
    zipCode: '1200',
    address: {
      street: 'Ayala Avenue',
      unit: '',
      city: 'Makati',
      state: 'Metro Manila',
      zipCode: '1200',
      country: 'Philippines'
    }
  },
  {
    name: 'Shared Room',
    title: 'Shared Room',
    descriptions: 'Affordable shared room in a friendly co-living space.',
    email: 'owner4@example.com',
    phoneNumber: '+63 945 678 9012',
    cities: 'Pasig',
    capacity: 2,
    categories: 'Co-living',
    price: 50,
    deposit: 100,
    parkingSizeForRv: 0,
    bathroomType: 'Shared',
    bedroomCount: 1,
    BathRoomCount: 1,
    amenities: ['WiFi', 'Shared Kitchen', 'Laundry'],
    preferences: ['Students welcome', 'Young professionals'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.5764',
      longitude: '121.0851'
    },
    type: 'Room',
    category: 'Co-living',
    city: 'Pasig',
    state: 'Metro Manila',
    zipCode: '1600',
    address: {
      street: 'Ortigas Center',
      unit: '7C',
      city: 'Pasig',
      state: 'Metro Manila',
      zipCode: '1600',
      country: 'Philippines'
    }
  },
  {
    name: 'Luxury Condo',
    title: 'Luxury Condo',
    descriptions: 'Luxury condominium with city view and premium amenities.',
    email: 'owner5@example.com',
    phoneNumber: '+63 956 789 0123',
    cities: 'Taguig',
    capacity: 4,
    categories: 'Whole place',
    price: 300,
    deposit: 600,
    parkingSizeForRv: 0,
    bathroomType: 'Private',
    bedroomCount: 2,
    BathRoomCount: 2,
    amenities: ['WiFi', 'Air Conditioning', 'Gym', 'Pool', 'Security', 'Parking'],
    preferences: ['No smoking', 'No pets'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560185008-a8a0238fb90c?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.5508',
      longitude: '121.0513'
    },
    type: 'Condominium',
    category: 'Whole place',
    city: 'Taguig',
    state: 'Metro Manila',
    zipCode: '1630',
    address: {
      street: 'Bonifacio Global City',
      unit: '15A',
      city: 'Taguig',
      state: 'Metro Manila',
      zipCode: '1630',
      country: 'Philippines'
    }
  },
  {
    name: 'RV Parking Space',
    title: 'RV Parking Space',
    descriptions: 'Spacious RV parking space with hookups and amenities.',
    email: 'owner6@example.com',
    phoneNumber: '+63 967 890 1234',
    cities: 'Tagaytay',
    capacity: 1,
    categories: 'RV Space',
    price: 75,
    deposit: 150,
    parkingSizeForRv: 40,
    bathroomType: 'Shared',
    bedroomCount: 0,
    BathRoomCount: 1,
    amenities: ['Electricity Hookup', 'Water Hookup', 'Waste Disposal', 'WiFi'],
    preferences: ['No loud music after 10PM'],
    isAvailable: true,
    isVerified: true,
    samplePhotos: [
      'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=400&h=300&fit=crop'
    ],
    photo: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&h=300&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&h=300&fit=crop',
    imageFile: null,
    location: {
      latitude: '14.1153',
      longitude: '120.9621'
    },
    type: 'RV Space',
    category: 'RV Space',
    city: 'Tagaytay',
    state: 'Cavite',
    zipCode: '4120',
    address: {
      street: 'Tagaytay-Nasugbu Highway',
      unit: '',
      city: 'Tagaytay',
      state: 'Cavite',
      zipCode: '4120',
      country: 'Philippines'
    }
  }
];

export async function addSampleProperties() {
  try {
    const propertyCollection = collection(db, 'property');
    
    for (const property of sampleProperties) {
      // Convert location object to proper format if needed
      const propertyData = {
        ...property,
        // Ensure location is properly formatted
        location: property.location,
        // Add timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(propertyCollection, propertyData);
    }
    
    console.log('Sample properties added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample properties:', error);
    return false;
  }
}
