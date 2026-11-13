const fs = require('fs');

// 1. Update CartScreen.js
let cartCode = fs.readFileSync('app/src/features/cart/CartScreen.js', 'utf8');

// Ensure storeSettings and getDeliveryFee are destructured from useApp
if (!cartCode.includes('getDeliveryFee,')) {
  cartCode = cartCode.replace(
    'setSelectedProduct\n  } = useApp();',
    'setSelectedProduct,\n    getDeliveryFee,\n    storeSettings\n  } = useApp();'
  );
}

// Update totalPayable calculation in CartScreen.js
if (!cartCode.includes('const deliveryFee = getDeliveryFee')) {
  cartCode = cartCode.replace(
    '  const productSavings = Math.max(0, mrpTotal - bagTotal);\n  const totalSavings = productSavings;\n  const totalPayable = bagTotal;',
    `  const productSavings = Math.max(0, mrpTotal - bagTotal);
  const totalSavings = productSavings;
  const deliveryFee = getDeliveryFee ? getDeliveryFee(bagTotal) : 0;
  const isFreeDelivery = deliveryFee === 0;
  const freeThreshold = Number(storeSettings?.delivery?.freeDeliveryThreshold ?? 499);
  const minOrder = Number(storeSettings?.delivery?.minOrderAmount ?? 0);
  const isBelowMinOrder = minOrder > 0 && bagTotal < minOrder;
  const totalPayable = (bagTotal + deliveryFee);`
  );
}

// Update Delivery Charges row in CartScreen.js
const oldDeliveryRow = `<View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-medium text-[#8C7078]">Delivery Charges</Text>
              <Text className="text-xs font-extrabold text-[#2E7D32]">FREE</Text>
            </View>`;

const newDeliveryRow = `<View className="flex-row justify-between items-center mb-2">
              <View>
                <Text className="text-xs font-medium text-[#8C7078]">Delivery Charges</Text>
                {bagTotal < freeThreshold && (
                  <Text className="text-[10px] text-pink-500 font-bold">
                    Add ₹{freeThreshold - bagTotal} more for FREE delivery
                  </Text>
                )}
              </View>
              <Text className={\`text-xs font-extrabold \${isFreeDelivery ? 'text-[#2E7D32]' : 'text-slate-900'}\`}>
                {isFreeDelivery ? 'FREE' : \`₹\${deliveryFee}\`}
              </Text>
            </View>`;

if (cartCode.includes(oldDeliveryRow)) {
  cartCode = cartCode.replace(oldDeliveryRow, newDeliveryRow);
}

fs.writeFileSync('app/src/features/cart/CartScreen.js', cartCode, 'utf8');
console.log('CartScreen.js updated successfully.');

// 2. Update PlaceOrderScreen.js
let placeCode = fs.readFileSync('app/src/features/cart/PlaceOrderScreen.js', 'utf8');

if (!placeCode.includes('storeSettings')) {
  placeCode = placeCode.replace(
    'getRolePrice\n  } = useApp();',
    'getRolePrice,\n    getDeliveryFee,\n    storeSettings\n  } = useApp();'
  );
}

// Update totals in PlaceOrderScreen.js
if (!placeCode.includes('const deliveryFee = getDeliveryFee')) {
  placeCode = placeCode.replace(
    '  const discountAmount = Math.max(0, mrpTotal - bagTotal);\n  const totalPayable = bagTotal;',
    `  const discountAmount = Math.max(0, mrpTotal - bagTotal);
  const deliveryFee = getDeliveryFee ? getDeliveryFee(bagTotal) : 0;
  const isFreeDelivery = deliveryFee === 0;
  const totalPayable = (bagTotal + deliveryFee);
  const maxCodLimit = Number(storeSettings?.payments?.maxCodLimit ?? 5000);
  const isCodAllowed = storeSettings?.payments?.allowCod !== false && bagTotal <= maxCodLimit;
  const isUpiAllowed = storeSettings?.payments?.allowUpi !== false;`
  );
}

// Update delivery charges row in PlaceOrderScreen.js
const oldPlaceDeliv = `<View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-slate-500">Delivery Charges</Text>
            <Text className="text-xs font-extrabold text-emerald-600">FREE</Text>
          </View>`;

const newPlaceDeliv = `<View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-medium text-slate-500">Delivery Charges</Text>
            <Text className={\`text-xs font-extrabold \${isFreeDelivery ? 'text-emerald-600' : 'text-slate-900'}\`}>
              {isFreeDelivery ? 'FREE' : \`₹\${deliveryFee}\`}
            </Text>
          </View>`;

if (placeCode.includes(oldPlaceDeliv)) {
  placeCode = placeCode.replace(oldPlaceDeliv, newPlaceDeliv);
}

fs.writeFileSync('app/src/features/cart/PlaceOrderScreen.js', placeCode, 'utf8');
console.log('PlaceOrderScreen.js updated successfully.');

