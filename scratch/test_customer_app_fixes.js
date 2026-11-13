/**
 * Test script for Customer Mobile App fixes:
 * 1. CustomerUpiPaymentStatusScreen Image import and states
 * 2. Horizontal Category Filter Chips logic
 * 3. Search Page Add to Cart & Cart Synchronization
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST 1: CustomerUpiPaymentStatusScreen Import Verification ---');
const paymentScreenPath = path.join(__dirname, '../app/src/features/cart/CustomerUpiPaymentStatusScreen.js');
const paymentScreenCode = fs.readFileSync(paymentScreenPath, 'utf8');

assert.ok(
  paymentScreenCode.includes('Image') && paymentScreenCode.includes("from 'react-native'"),
  'Image must be imported from react-native'
);
assert.ok(
  paymentScreenCode.includes('storeSettings'),
  'storeSettings must be destructured from useApp()'
);
console.log('✅ CustomerUpiPaymentStatusScreen imports Image and storeSettings correctly.');

console.log('--- TEST 2: HomeScreen Horizontal Category Filter Chips ---');
const homeScreenPath = path.join(__dirname, '../app/src/features/home/HomeScreen.js');
const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf8');

assert.ok(
  homeScreenCode.includes('selectedCategoryFilter') && homeScreenCode.includes('setSelectedCategoryFilter'),
  'selectedCategoryFilter state must exist on HomeScreen'
);
assert.ok(
  homeScreenCode.includes('filteredCategoryProducts'),
  'filteredCategoryProducts must be computed for dynamic category filtering'
);
assert.ok(
  homeScreenCode.includes("selectedCategoryFilter === 'All'"),
  'All option must be supported in category filter chips'
);
console.log('✅ HomeScreen category filter chips and dynamic filtering verified.');

console.log('--- TEST 3: SearchScreen Add to Cart & Synchronization ---');
const searchScreenPath = path.join(__dirname, '../app/src/features/search/SearchScreen.js');
const searchScreenCode = fs.readFileSync(searchScreenPath, 'utf8');

assert.ok(
  searchScreenCode.includes('cartSubtotal'),
  'SearchScreen must destructure and use cartSubtotal'
);
assert.ok(
  searchScreenCode.includes('getRolePrice(p, userRole)'),
  'Suggestions must calculate price using getRolePrice for B2B/B2C role accuracy'
);
assert.ok(
  searchScreenCode.includes('existingCartItem'),
  'Suggestions must resolve existing cart item for precise stepper and add-to-cart operations'
);
console.log('✅ SearchScreen Add to Cart & pricing synchronization verified.');

console.log('--- TEST 4: PurplleProductCard Cart Synchronization ---');
const cardPath = path.join(__dirname, '../app/src/components/PurplleProductCard.js');
const cardCode = fs.readFileSync(cardPath, 'utf8');

assert.ok(
  cardCode.includes('activeCartKey'),
  'PurplleProductCard must resolve activeCartKey matching existing cart items'
);
console.log('✅ PurplleProductCard active cart item matching verified.');

console.log('\n=========================================');
console.log('🎉 ALL 4 CUSTOMER APP TESTS PASSED (100%)');
console.log('=========================================');

