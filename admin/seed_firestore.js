import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyD-mockKeyForAppInitialization12345",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.appspot.com",
  messagingSenderId: "1029384756",
  appId: "1:1029384756:web:salbeauapp123"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
async function seedData() {
  console.log('Seeding initial Firestore data for orders and users...');
  // 1. Seed user profile (Priya Sharma)
  await setDoc(doc(db, 'users', 'u_9876543210'), {
    id: 'u_9876543210',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    role: 'salon',
    businessName: 'Glow Salon & Spa',
    branch: 'MG Road Branch',
    verificationStatus: 'verified',
    cancellationCount: 0,
    lastActive: new Date().toISOString()
  }, { merge: true });

  await setDoc(doc(db, 'orders', 'FG-854679'), {
    id: 'FG-854679',
    userName: 'Priya Sharma',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    itemDescription: 'Glaze Hydrating Lip Oil - Rosewood (x1)',
    userRole: 'Salon Owner',
    branch: 'MG Road Branch',
    deliveryType: 'delivery',
    deliveryAddress: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
    totalAmount: 499,
    status: 'processing',
    rejectionReason: '',
    placedAt: '07 Sep 2026, 11:50 AM',
    date: '2026-09-07T11:50:00.000Z',
    items: [
      {
        product: { id: 'hp1', name: 'Glaze Hydrating Lip Oil - Rosewood', mrp: 499, salonPrice: 399 },
        quantity: 1,
        unitPrice: 499
      }
    ]
  }, { merge: true });

  // 3. Seed new live order #SB-948271
  await setDoc(doc(db, 'orders', 'SB-948271'), {
    id: 'SB-948271',
    userName: 'Priya Sharma',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    itemDescription: 'Rose Velvet Blush Palette (x1)',
    userRole: 'Salon Owner',
    branch: 'MG Road Branch',
    deliveryType: 'store_pickup',
    deliveryAddress: 'MG Road Branch Store Pickup',
    totalAmount: 799,
    status: 'placed',
    rejectionReason: '',
    placedAt: new Date().toLocaleString(),
    date: new Date().toISOString(),
    items: [
      {
        product: { id: 'hp3', name: 'Rose Velvet Blush Palette', mrp: 799, salonPrice: 559 },
        quantity: 1,
        unitPrice: 799
      }
    ]
  }, { merge: true });

  console.log('Successfully seeded orders and users into Firebase Firestore!');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Error seeding firestore:', err);
  process.exit(1);
});
