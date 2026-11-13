import { calculateDeliveryCharge, DELIVERY_MODELS } from '../admin/src/utils/deliveryChargeCalculator.js';
import assert from 'assert';

console.log('Testing Delivery Charge Calculator Engine...');

// Test 1: Default Free Delivery
const res1 = calculateDeliveryCharge({
  orderAmount: 300,
  distanceKm: 10,
  config: { delivery: { pricingModel: 'default_free', isDefaultFree: true } }
});
assert.strictEqual(res1.fee, 0);
assert.strictEqual(res1.isFree, true);
console.log('✓ Model 1 (default_free) passed');

// Test 2: Free Delivery for All
const res2 = calculateDeliveryCharge({
  orderAmount: 200,
  distanceKm: 25,
  config: { delivery: { pricingModel: 'always_free', isFreeDeliveryAll: true } }
});
assert.strictEqual(res2.fee, 0);
assert.strictEqual(res2.isFree, true);
console.log('✓ Model 2 (always_free) passed');

// Test 3: Per-km Charges (₹3/km, baseDistance: 2km, baseFee: ₹20)
// For 5 km: base 2km = ₹20, extra 3km @ ₹3/km = ₹9 => total ₹29
const res3 = calculateDeliveryCharge({
  orderAmount: 300,
  distanceKm: 5,
  config: {
    delivery: {
      pricingModel: 'per_km',
      perKmRate: 3,
      baseDistanceKm: 2,
      baseDeliveryCharge: 20,
      freeDeliveryThreshold: 500
    }
  }
});
assert.strictEqual(res3.fee, 29);
assert.strictEqual(res3.isFree, false);
console.log('✓ Model 3 (per_km) passed: fee = ₹' + res3.fee);

// Test 3b: Per-km with cart above freeDeliveryThreshold (₹600 > ₹500)
const res3b = calculateDeliveryCharge({
  orderAmount: 600,
  distanceKm: 12,
  config: {
    delivery: {
      pricingModel: 'per_km',
      perKmRate: 3,
      freeDeliveryThreshold: 500,
      enableFreeDeliveryThreshold: true
    }
  }
});
assert.strictEqual(res3b.fee, 0);
assert.strictEqual(res3b.isFree, true);
console.log('✓ Model 3b (per_km threshold override) passed');

// Test 4: Free Above Order Value (threshold 500, standard fee 49)
const res4a = calculateDeliveryCharge({
  orderAmount: 350,
  config: {
    delivery: {
      pricingModel: 'order_value',
      freeDeliveryThreshold: 500,
      standardFee: 49
    }
  }
});
assert.strictEqual(res4a.fee, 49);
assert.strictEqual(res4a.shortfallForFreeDelivery, 150);

const res4b = calculateDeliveryCharge({
  orderAmount: 550,
  config: {
    delivery: {
      pricingModel: 'order_value',
      freeDeliveryThreshold: 500,
      standardFee: 49
    }
  }
});
assert.strictEqual(res4b.fee, 0);
assert.strictEqual(res4b.isFree, true);
console.log('✓ Model 4 (order_value) passed');

// Test 5: Fixed Delivery Charges
const res5 = calculateDeliveryCharge({
  orderAmount: 250,
  config: {
    delivery: {
      pricingModel: 'fixed',
      fixedDeliveryFee: 40,
      standardFee: 40
    }
  }
});
assert.strictEqual(res5.fee, 40);
assert.strictEqual(res5.isFree, false);
console.log('✓ Model 5 (fixed) passed');

console.log('\nAll 5 Delivery Pricing Models verified successfully!');

