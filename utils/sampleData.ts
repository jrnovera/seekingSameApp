import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const sampleProperties = [
  {
    title: 'Modern Apartment',
    location: 'Manila',
    price: 120,
    type: 'Apartment',
    category: 'Whole place',
    city: 'Manila',
    state: 'Metro Manila',
    zipCode: '1000',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    description: 'A beautiful modern apartment in the heart of Manila with all amenities included.',
    bedrooms: 3,
    bathrooms: 2,
    address: 'St. Cikoko Timur, Kec. Pancoran, Jakarta',
    amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking']
  },
  {
    title: 'Cozy Studio',
    location: 'Quezon City',
    price: 80,
    type: 'Studio',
    category: 'Room',
    city: 'Quezon City',
    state: 'Metro Manila',
    zipCode: '1100',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    description: 'Perfect studio apartment for students and young professionals.',
    bedrooms: 1,
    bathrooms: 1,
    address: 'Commonwealth Avenue, Quezon City',
    amenities: ['WiFi', 'Air Conditioning', 'Shared Kitchen']
  },
  {
    title: 'Family House',
    location: 'Makati',
    price: 200,
    type: 'House',
    category: 'Whole place',
    city: 'Makati',
    state: 'Metro Manila',
    zipCode: '1200',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    description: 'Spacious family house with garden and parking space.',
    bedrooms: 4,
    bathrooms: 3,
    address: 'Ayala Avenue, Makati City',
    amenities: ['WiFi', 'Air Conditioning', 'Garden', 'Parking', 'Security']
  },
  {
    title: 'Shared Room',
    location: 'Pasig',
    price: 50,
    type: 'Room',
    category: 'Co-living',
    city: 'Pasig',
    state: 'Metro Manila',
    zipCode: '1600',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    description: 'Affordable shared room in a friendly co-living space.',
    bedrooms: 1,
    bathrooms: 1,
    address: 'Ortigas Center, Pasig City',
    amenities: ['WiFi', 'Shared Kitchen', 'Laundry']
  },
  {
    title: 'Luxury Condo',
    location: 'Taguig',
    price: 300,
    type: 'Condominium',
    category: 'Whole place',
    city: 'Taguig',
    state: 'Metro Manila',
    zipCode: '1630',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    description: 'Luxury condominium with city view and premium amenities.',
    bedrooms: 2,
    bathrooms: 2,
    address: 'Bonifacio Global City, Taguig',
    amenities: ['WiFi', 'Air Conditioning', 'Gym', 'Pool', 'Security', 'Parking']
  }
];

export async function addSampleProperties() {
  try {
    const propertyCollection = collection(db, 'property');
    
    for (const property of sampleProperties) {
      await addDoc(propertyCollection, {
        ...property,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Sample properties added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample properties:', error);
    return false;
  }
}
