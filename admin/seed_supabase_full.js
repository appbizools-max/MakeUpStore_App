import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    brand_id: 'b1',
    brand_name: 'Lakmé',
    category: 'Lipstick',
    mrp: 499,
    salon_price: 399,
    artist_price: 379,
    beautician_price: 389,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600'
  },
  {
    id: 'p2',
    name: 'Matte Liquid Lipstick - Bold Red',
    brand_id: 'b5',
    brand_name: 'SUGAR',
    category: 'Lipstick',
    mrp: 699,
    salon_price: 529,
    artist_price: 499,
    beautician_price: 519,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
  },
  {
    id: 'p3',
    name: 'Rose Velvet Blush Palette',
    brand_id: 'b4',
    brand_name: 'M.A.C',
    category: 'Makeup',
    mrp: 799,
    salon_price: 559,
    artist_price: 529,
    beautician_price: 539,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'
  },
  {
    id: 'p4',
    name: 'Absolut Repair Hair Mask 250ml',
    brand_id: 'b2',
    brand_name: "L'Oréal",
    category: 'Hair Care',
    mrp: 1124,
    salon_price: 849,
    artist_price: 799,
    beautician_price: 819,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600'
  },
  {
    id: 'p5',
    name: 'Hyaluronic Acid Face Serum 30ml',
    brand_id: 'b6',
    brand_name: 'Biotique',
    category: 'Skin Care',
    mrp: 599,
    salon_price: 449,
    artist_price: 419,
    beautician_price: 429,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'
  },
  {
    id: 'p6',
    name: 'SuperStay Matte Ink Liquid Lipstick',
    brand_id: 'b3',
    brand_name: 'Maybelline',
    category: 'Lipstick',
    mrp: 650,
    salon_price: 480,
    artist_price: 450,
    beautician_price: 465,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'
  },
  {
    id: 'p7',
    name: 'Sinful Matte Lipcolor - Nude Pink',
    brand_id: 'b7',
    brand_name: 'Colorbar',
    category: 'Lipstick',
    mrp: 550,
    salon_price: 410,
    artist_price: 385,
    beautician_price: 395,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=600'
  },
  {
    id: 'p8',
    name: 'Studio Fix Fluid SPF 15 Foundation',
    brand_id: 'b4',
    brand_name: 'M.A.C',
    category: 'Makeup',
    mrp: 1874,
    salon_price: 1450,
    artist_price: 1390,
    beautician_price: 1410,
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
    business_name: 'N/A (Retail)',
    branch: 'MG Road Branch',
    verification_status: 'verified',
    cancellation_count: 0,
    last_active: new Date().toISOString()
  },
  {
    id: 'u_1002',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    role: 'salon',
    business_name: 'Glow Salon & Spa',
    branch: 'MG Road Branch',
    verification_status: 'verified',
    cancellation_count: 0,
    last_active: new Date().toISOString()
  },
  {
    id: 'u_1003',
    name: 'Kavita Verma',
    phone: '+91 98765 00003',
    role: 'artist',
    business_name: 'Kavita Bridal Studio',
    branch: 'Indiranagar Branch',
    verification_status: 'pending',
    cancellation_count: 0,
    last_active: new Date().toISOString()
  },
  {
    id: 'u_1004',
    name: 'Ritu Sen',
    phone: '+91 98765 00004',
    role: 'beautician',
    business_name: 'Ritu Home Beauty Services',
    branch: 'Koramangala Branch',
    verification_status: 'verified',
    cancellation_count: 0,
    last_active: new Date().toISOString()
  }
];

const orders = [
  {
    id: 'FG-854679',
    user_name: 'Priya Sharma',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    item_description: 'Glaze Hydrating Lip Oil - Rosewood (x1)',
    user_role: 'Salon Owner',
    branch: 'MG Road Branch',
    delivery_type: 'delivery',
    delivery_address: '102 Rosewood Heights, 4th Block, MG Road, Bengaluru - 560001',
    total_amount: 499,
    status: 'placed',
    rejection_reason: '',
    placed_at: new Date(Date.now() - 3600000).toLocaleString(),
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { product: { id: 'p1', name: 'Glaze Hydrating Lip Oil - Rosewood', mrp: 499 }, quantity: 1, unitPrice: 499 }
    ]
  },
  {
    id: 'SB-948271',
    user_name: 'Kavita Verma',
    phone: '+91 98765 00003',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    item_description: 'Rose Velvet Blush Palette (x1), Hyaluronic Acid Face Serum (x1)',
    user_role: 'Makeup Artist',
    branch: 'Indiranagar Branch',
    delivery_type: 'store_pickup',
    delivery_address: 'Indiranagar Branch Store Pickup',
    total_amount: 1398,
    status: 'processing',
    rejection_reason: '',
    placed_at: new Date(Date.now() - 7200000).toLocaleString(),
    date: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { product: { id: 'p3', name: 'Rose Velvet Blush Palette', mrp: 799 }, quantity: 1, unitPrice: 799 },
      { product: { id: 'p5', name: 'Hyaluronic Acid Face Serum', mrp: 599 }, quantity: 1, unitPrice: 599 }
    ]
  },
  {
    id: 'SB-310482',
    user_name: 'Ritu Sen',
    phone: '+91 98765 00004',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    item_description: 'Absolut Repair Hair Mask (x2)',
    user_role: 'Beautician',
    branch: 'Koramangala Branch',
    delivery_type: 'delivery',
    delivery_address: '88 5th Main, 7th Block, Koramangala, Bengaluru - 560095',
    total_amount: 2248,
    status: 'delivered',
    rejection_reason: '',
    placed_at: new Date(Date.now() - 86400000).toLocaleString(),
    date: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { product: { id: 'p4', name: 'Absolut Repair Hair Mask', mrp: 1124 }, quantity: 2, unitPrice: 1124 }
    ]
  }
];

async function seedData() {
  console.log('Seeding Supabase tables with initial data...');

  const { error: bErr } = await supabase.from('brands').upsert(brands);
  if (bErr) console.warn('Brands seed error:', bErr.message);
  else console.log('Seeded brands successfully!');

  const { error: pErr } = await supabase.from('products').upsert(products);
  if (pErr) console.warn('Products seed error:', pErr.message);
  else console.log('Seeded products successfully!');

  const { error: uErr } = await supabase.from('users').upsert(users);
  if (uErr) console.warn('Users seed error:', uErr.message);
  else console.log('Seeded users successfully!');

  const { error: oErr } = await supabase.from('orders').upsert(orders);
  if (oErr) console.warn('Orders seed error:', oErr.message);
  else console.log('Seeded orders successfully!');

  console.log('Supabase seeding attempt complete.');
  process.exit(0);
}

seedData();
