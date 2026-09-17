import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVA0tumqqN97dodRZ2E97Jh3oOkz0cY9A",
  authDomain: "salbeauapp.firebaseapp.com",
  projectId: "salbeauapp",
  storageBucket: "salbeauapp.firebasestorage.app",
  messagingSenderId: "286964052282",
  appId: "1:286964052282:web:ae1160781f170e9c62a003",
  measurementId: "G-PRT3QNX4MN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const brands = [
  { id: 'b1', name: 'Lakmé', enabled: true, logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300' },
  { id: 'b2', name: "L'Oréal", enabled: true, logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
  { id: 'b3', name: 'Maybelline', enabled: true, logo: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
  { id: 'b4', name: 'M.A.C', enabled: true, logo: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=300' },
  { id: 'b5', name: 'SUGAR', enabled: true, logo: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
  { id: 'b6', name: 'Biotique', enabled: true, logo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300' },
  { id: 'b7', name: 'Colorbar', enabled: true, logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
];

const products = [
  {
    id: 'p1',
    name: 'Glaze Hydrating Lip Oil - Rosewood',
    brandId: 'b1',
    brandName: 'Lakmé',
    category: 'Lipstick',
    mrp: 499,
    salonPrice: 399,
    artistPrice: 379,
    beauticianPrice: 389,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600'
  },
  {
    id: 'p2',
    name: 'Matte Liquid Lipstick - Bold Red',
    brandId: 'b5',
    brandName: 'SUGAR',
    category: 'Lipstick',
    mrp: 699,
    salonPrice: 529,
    artistPrice: 499,
    beauticianPrice: 519,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
  },
  {
    id: 'p3',
    name: 'Rose Velvet Blush Palette',
    brandId: 'b4',
    brandName: 'M.A.C',
    category: 'Makeup',
    mrp: 799,
    salonPrice: 559,
    artistPrice: 529,
    beauticianPrice: 539,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'
  },
  {
    id: 'p4',
    name: 'Absolut Repair Hair Mask 250ml',
    brandId: 'b2',
    brandName: "L'Oréal",
    category: 'Hair Care',
    mrp: 1124,
    salonPrice: 849,
    artistPrice: 799,
    beauticianPrice: 819,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600'
  },
  {
    id: 'p5',
    name: 'Hyaluronic Acid Face Serum 30ml',
    brandId: 'b6',
    brandName: 'Biotique',
    category: 'Skin Care',
    mrp: 599,
    salonPrice: 449,
    artistPrice: 419,
    beauticianPrice: 429,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'
  },
  {
    id: 'p6',
    name: 'SuperStay Matte Ink Liquid Lipstick',
    brandId: 'b3',
    brandName: 'Maybelline',
    category: 'Lipstick',
    mrp: 650,
    salonPrice: 480,
    artistPrice: 450,
    beauticianPrice: 465,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
  },
  {
    id: 'p7',
    name: 'Sinful Matte Lipcolor - Nude Pink',
    brandId: 'b7',
    brandName: 'Colorbar',
    category: 'Lipstick',
    mrp: 550,
    salonPrice: 410,
    artistPrice: 385,
    beauticianPrice: 395,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600'
  },
  {
    id: 'p8',
    name: 'Studio Fix Fluid SPF 15 Foundation',
    brandId: 'b4',
    brandName: 'M.A.C',
    category: 'Makeup',
    mrp: 1874,
    salonPrice: 1450,
    artistPrice: 1390,
    beauticianPrice: 1410,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600'
  }
];

const users = [
  {
    id: 'u_1001',
    name: 'Ananya Rao',
    phone: '+91 98765 00001',
    role: 'general',
    businessName: 'N/A (Retail)',
    branch: 'MG Road Branch',
    verificationStatus: 'verified',
    cancellationCount: 0,
    lastActive: new Date().toISOString()
  },
  {
    id: 'u_1002',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    role: 'salon',
    businessName: 'Glow Salon & Spa',
    branch: 'MG Road Branch',
    verificationStatus: 'verified',
    cancellationCount: 0,
    lastActive: new Date().toISOString()
  },
  {
    id: 'u_1003',
    name: 'Kavita Verma',
    phone: '+91 98765 00003',
    role: 'artist',
    businessName: 'Kavita Bridal Studio',
    branch: 'Indiranagar Branch',
    verificationStatus: 'pending',
    cancellationCount: 0,
    lastActive: new Date().toISOString()
  },
  {
    id: 'u_1004',
    name: 'Ritu Sen',
    phone: '+91 98765 00004',
    role: 'beautician',
    businessName: 'Ritu Home Beauty Services',
    branch: 'Koramangala Branch',
    verificationStatus: 'verified',
    cancellationCount: 0,
    lastActive: new Date().toISOString()
  }
];

const orders = [
  {
    id: 'FG-854679',
    userName: 'Priya Sharma',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    itemDescription: 'Glaze Hydrating Lip Oil - Rosewood (x1)',
    userRole: 'Salon Owner',
    branch: 'MG Road Branch',
    deliveryType: 'delivery',
    deliveryAddress: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
    totalAmount: 499,
    status: 'placed',
    rejectionReason: '',
    placedAt: new Date(Date.now() - 3600000).toLocaleString(),
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { product: products[0], quantity: 1, unitPrice: 499 }
    ]
  },
  {
    id: 'SB-948271',
    userName: 'Kavita Verma',
    phone: '+91 98765 00003',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    itemDescription: 'Rose Velvet Blush Palette (x1), Hyaluronic Acid Face Serum (x1)',
    userRole: 'Makeup Artist',
    branch: 'Indiranagar Branch',
    deliveryType: 'store_pickup',
    deliveryAddress: 'Indiranagar Branch Store Pickup',
    totalAmount: 1398,
    status: 'processing',
    rejectionReason: '',
    placedAt: new Date(Date.now() - 7200000).toLocaleString(),
    date: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { product: products[2], quantity: 1, unitPrice: 799 },
      { product: products[4], quantity: 1, unitPrice: 599 }
    ]
  },
  {
    id: 'SB-310482',
    userName: 'Ritu Sen',
    phone: '+91 98765 00004',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    itemDescription: 'Absolut Repair Hair Mask (x2)',
    userRole: 'Beautician',
    branch: 'Koramangala Branch',
    deliveryType: 'delivery',
    deliveryAddress: '88 5th Main, 7th Block, Koramangala, Bengaluru - 560095',
    totalAmount: 2248,
    status: 'delivered',
    rejectionReason: '',
    placedAt: new Date(Date.now() - 86400000).toLocaleString(),
    date: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { product: products[3], quantity: 2, unitPrice: 1124 }
    ]
  }
];

async function seedData() {
  console.log('Seeding full dataset into Firebase Firestore...');

  for (const b of brands) {
    await setDoc(doc(db, 'brands', b.id), b, { merge: true });
  }
  console.log(`Seeded ${brands.length} brands.`);

  for (const p of products) {
    await setDoc(doc(db, 'products', p.id), p, { merge: true });
  }
  console.log(`Seeded ${products.length} products.`);

  for (const u of users) {
    await setDoc(doc(db, 'users', u.id), u, { merge: true });
  }
  console.log(`Seeded ${users.length} user profiles.`);

  for (const o of orders) {
    await setDoc(doc(db, 'orders', o.id), o, { merge: true });
  }
  console.log(`Seeded ${orders.length} orders.`);

  console.log('Seeding complete successfully!');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
