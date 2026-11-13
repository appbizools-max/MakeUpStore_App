const fs = require('fs');

// ==============================================================================
// 1. UPDATE GeneralSettingsPage.jsx (Admin Panel)
// ==============================================================================
let adminPageCode = fs.readFileSync('admin/src/components/settings/GeneralSettingsPage.jsx', 'utf8');

// Ensure ImageField is imported
if (!adminPageCode.includes("import ImageField from '../media/ImageField';")) {
  adminPageCode = adminPageCode.replace(
    "import { useAdmin } from '../../context/AdminContext';",
    "import ImageField from '../media/ImageField';\nimport { useAdmin } from '../../context/AdminContext';"
  );
}

// Ensure DEFAULT_GENERAL_SETTINGS has upiQrCodeUrl
if (!adminPageCode.includes('upiQrCodeUrl:')) {
  adminPageCode = adminPageCode.replace(
    "upiId: 'salbeau.store@okaxis',",
    "upiId: 'salbeau.store@okaxis',\n    upiQrCodeUrl: '',"
  );
}

// Replace the UPI Gateway Section with the complete QR Code uploader & live delivery preview card
const oldUpiSection = `{/* UPI Gateway Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-200/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-950">Store UPI VPA Address</h3>
                  <p className="text-[11px] text-purple-700/80 font-medium">
                    Used to dynamically generate QR codes for customers and delivery partner doorstep collections.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1">Official UPI ID (VPA) *</label>
                <input
                  type="text"
                  value={currentData?.payments?.upiId || ''}
                  onChange={e => handleNestedChange('payments', 'upiId', e.target.value.trim())}
                  placeholder="e.g. salbeau.store@okaxis"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600 shadow-2xs"
                />
              </div>
            </div>`;

const newUpiSection = `{/* UPI Gateway & Live QR Code Management Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-pink-50/40 to-white border border-purple-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-950">Store UPI VPA Address & QR Code</h3>
                  <p className="text-[11px] text-purple-700/80 font-medium">
                    Displayed directly to delivery partners and customers for instant doorstep UPI payment collection.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Form inputs */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1">Official UPI ID (VPA) *</label>
                    <input
                      type="text"
                      value={currentData?.payments?.upiId || ''}
                      onChange={e => handleNestedChange('payments', 'upiId', e.target.value.trim())}
                      placeholder="e.g. salbeau.store@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600 shadow-2xs"
                    />
                    <span className="text-[10px] text-purple-700 font-medium mt-1 block">
                      Customers and delivery partner apps transfer funds to this VPA address.
                    </span>
                  </div>

                  {/* Upload Custom Merchant QR Standee / Image */}
                  <div className="p-4 rounded-xl bg-white/90 border border-purple-200/80 shadow-2xs">
                    <ImageField
                      label="Upload Store Merchant UPI QR Code (Optional)"
                      sublabel="Upload official Bank / Google Pay / PhonePe / Paytm Merchant QR sticker or standee"
                      value={currentData?.payments?.upiQrCodeUrl || ''}
                      onChange={url => handleNestedChange('payments', 'upiQrCodeUrl', url)}
                      folder="payment-proofs"
                      filenamePrefix="store_merchant_upi_qr"
                      entityName={currentData?.storeName || 'Store UPI QR'}
                      aspectRatio="square"
                    />
                    <span className="text-[10px] text-gray-500 font-medium mt-1.5 block leading-relaxed">
                      If left empty, a live dynamic QR code is automatically generated from your VPA ID above with exact order amounts.
                    </span>
                  </div>
                </div>

                {/* Right Column: Live Delivery Partner QR Code Card Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-purple-200 shadow-xs flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Delivery Partner Live QR Preview
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 mb-3 shadow-inner">
                    <img
                      src={
                        currentData?.payments?.upiQrCodeUrl ||
                        \`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=\${encodeURIComponent(
                          \`upi://pay?pa=\${currentData?.payments?.upiId || 'salbeau.store@okaxis'}&pn=\${encodeURIComponent(
                            currentData?.storeName || 'Salbeau MakeUpStore'
                          )}&cu=INR\`
                        )}\`
                      }
                      alt="Store UPI QR Code Preview"
                      className="w-44 h-44 object-contain rounded-xl bg-white p-1"
                    />
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="text-xs font-black text-gray-900">
                      {currentData?.storeName || 'Salbeau MakeUpStore'}
                    </div>
                    <div className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-[11px] font-mono font-black">
                      {currentData?.payments?.upiId || 'salbeau.store@okaxis'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold pt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{currentData?.payments?.upiQrCodeUrl ? 'Custom Merchant QR Active' : 'Dynamic UPI QR Active'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;

if (adminPageCode.includes(oldUpiSection)) {
  adminPageCode = adminPageCode.replace(oldUpiSection, newUpiSection);
}

// In handleSave, ensure upiQrCodeUrl is passed in payload
if (!adminPageCode.includes('upiQrCodeUrl: formData?.payments?.upiQrCodeUrl')) {
  adminPageCode = adminPageCode.replace(
    'upiId: formData?.payments?.upiId,',
    'upiId: formData?.payments?.upiId,\n          upiQrCodeUrl: formData?.payments?.upiQrCodeUrl,'
  );
}

fs.writeFileSync('admin/src/components/settings/GeneralSettingsPage.jsx', adminPageCode, 'utf8');
console.log('GeneralSettingsPage.jsx updated with QR Code uploader & live delivery preview!');

// ==============================================================================
// 2. UPDATE DeliveryPartnerDashboard.js (Delivery Partner App)
// ==============================================================================
let staffCode = fs.readFileSync('app/src/features/staff/DeliveryPartnerDashboard.js', 'utf8');

// Destructure storeSettings from useApp
if (!staffCode.includes('storeSettings')) {
  staffCode = staffCode.replace(
    'const { staffProfile, setStaffProfile, setCurrentScreen } = useApp();',
    'const { staffProfile, setStaffProfile, setCurrentScreen, storeSettings } = useApp();'
  );
}

// Update modalOrderAmount & dynamic upiQrImageUrl calculation to use storeSettings
const oldPayCalc = `  const modalOrderAmount = deliveryModalOrder ? Number(deliveryModalOrder.total_amount || deliveryModalOrder.total || 0) : 0;
  const upiPayString = deliveryModalOrder
    ? \`upi://pay?pa=salbeau.store@okaxis&pn=Salbeau%20MakeUpStore&am=\${modalOrderAmount}&cu=INR&tn=Order%20\${deliveryModalOrder.id}\`
    : '';
  const upiQrImageUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(upiPayString)}\`;`;

const newPayCalc = `  const modalOrderAmount = deliveryModalOrder ? Number(deliveryModalOrder.total_amount || deliveryModalOrder.total || 0) : 0;
  const storeUpiId = storeSettings?.payments?.upiId || 'salbeau.store@okaxis';
  const storeName = storeSettings?.storeName || storeSettings?.identity?.storeName || 'Salbeau MakeUpStore';
  const customMerchantQrUrl = storeSettings?.payments?.upiQrCodeUrl;
  const upiPayString = deliveryModalOrder
    ? \`upi://pay?pa=\${encodeURIComponent(storeUpiId)}&pn=\${encodeURIComponent(storeName)}&am=\${modalOrderAmount}&cu=INR&tn=Order%20\${deliveryModalOrder.id}\`
    : \`upi://pay?pa=\${encodeURIComponent(storeUpiId)}&pn=\${encodeURIComponent(storeName)}&cu=INR\`;
  const dynamicQrImageUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${encodeURIComponent(upiPayString)}\`;
  const displayQrImageUrl = customMerchantQrUrl || dynamicQrImageUrl;`;

if (staffCode.includes(oldPayCalc)) {
  staffCode = staffCode.replace(oldPayCalc, newPayCalc);
}

// Replace the UPI QR Code view in Delivery Modal
const oldUpiView = `<View className="p-3 bg-white rounded-2xl border border-purple-200 shadow-sm mb-3">
                        <Image
                          source={{ uri: upiQrImageUrl }}
                          style={{ width: 180, height: 180 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Store UPI Details */}
                      <View className="bg-white px-3 py-1.5 rounded-full border border-purple-200 mb-3 flex-row items-center">
                        <Text className="text-[11px] font-bold text-stone-600">UPI ID: </Text>
                        <Text className="text-[11px] font-black text-purple-800">salbeau.store@okaxis</Text>
                      </View>`;

const newUpiView = `<View className="p-3 bg-white rounded-2xl border border-purple-200 shadow-sm mb-3">
                        <Image
                          source={{ uri: displayQrImageUrl }}
                          style={{ width: 190, height: 190 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Store UPI Details */}
                      <View className="bg-white px-3.5 py-1.5 rounded-full border border-purple-200 mb-2 flex-row items-center gap-1">
                        <Text className="text-[11px] font-bold text-stone-600">UPI ID: </Text>
                        <Text className="text-[11px] font-black text-purple-900">{storeUpiId}</Text>
                      </View>

                      <Text className="text-[10px] font-bold text-emerald-700 mb-3">
                        ✓ {customMerchantQrUrl ? 'Official Store Merchant QR' : 'Dynamic Order QR Code'}
                      </Text>`;

if (staffCode.includes(oldUpiView)) {
  staffCode = staffCode.replace(oldUpiView, newUpiView);
}

// Also in the dedicated UPI Payment Verification modal, add a button to view the QR Code
const oldVerifyHeader = `<Text className="text-stone-500 font-medium text-xs mt-1">
                  Compare customer's payment screen, verify amount, and upload photograph proof for Admin approval.
                </Text>`;

const newVerifyHeader = `<Text className="text-stone-500 font-medium text-xs mt-1">
                  Compare customer's payment screen, verify amount, and upload photograph proof for Admin approval.
                </Text>

                {/* Quick Store QR Reference for Customer */}
                <View className="mt-3 p-3 bg-purple-50/80 rounded-2xl border border-purple-200 flex-row items-center gap-3">
                  <Image
                    source={{ uri: displayQrImageUrl }}
                    style={{ width: 52, height: 52 }}
                    className="rounded-lg bg-white p-0.5 border border-purple-200"
                    resizeMode="contain"
                  />
                  <View className="flex-1">
                    <Text className="text-[11px] font-black text-purple-950">Store Payment QR Code</Text>
                    <Text className="text-[10px] font-mono text-purple-800 font-bold">{storeUpiId}</Text>
                    <Text className="text-[9.5px] text-purple-600 font-medium">Customer pays directly to this QR</Text>
                  </View>
                </View>`;

if (staffCode.includes(oldVerifyHeader) && !staffCode.includes('Store Payment QR Code')) {
  staffCode = staffCode.replace(oldVerifyHeader, newVerifyHeader);
}

fs.writeFileSync('app/src/features/staff/DeliveryPartnerDashboard.js', staffCode, 'utf8');
console.log('DeliveryPartnerDashboard.js updated with dynamic store QR & VPA reflection!');

// ==============================================================================
// 3. UPDATE CustomerUpiPaymentStatusScreen.js
// ==============================================================================
let custScreenCode = fs.readFileSync('app/src/features/cart/CustomerUpiPaymentStatusScreen.js', 'utf8');

if (!custScreenCode.includes('storeSettings')) {
  custScreenCode = custScreenCode.replace(
    'const { currentUpiOrder, setCurrentScreen } = useApp();',
    'const { currentUpiOrder, setCurrentScreen, storeSettings } = useApp();'
  );
}

const oldCustPaymentBox = `<View className="w-full bg-stone-50 rounded-2xl border border-stone-200/70 p-4 mb-6 space-y-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Order ID</Text>
                <Text className="text-xs font-black text-stone-800">#{orderId}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payable Amount</Text>
                <Text className="text-sm font-black text-[#C2477A]">₹{verifiedAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payment Mode</Text>
                <Text className="text-xs font-bold text-purple-900">UPI / QR Code</Text>
              </View>
            </View>`;

const newCustPaymentBox = `<View className="w-full bg-stone-50 rounded-2xl border border-stone-200/70 p-4 mb-6 space-y-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Order ID</Text>
                <Text className="text-xs font-black text-stone-800">#{orderId}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payable Amount</Text>
                <Text className="text-sm font-black text-[#C2477A]">₹{verifiedAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-stone-500">Payment Mode</Text>
                <Text className="text-xs font-bold text-purple-900">UPI / QR Code</Text>
              </View>

              {/* Live QR Code Display for Customer */}
              <View className="pt-2 border-t border-stone-200 items-center">
                <View className="p-2.5 bg-white rounded-xl border border-purple-200 mb-2">
                  <Image
                    source={{
                      uri: storeSettings?.payments?.upiQrCodeUrl ||
                        \`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(
                          \`upi://pay?pa=\${storeSettings?.payments?.upiId || 'salbeau.store@okaxis'}&pn=Salbeau%20Store&am=\${verifiedAmount}&cu=INR\`
                        )}\`
                    }}
                    style={{ width: 140, height: 140 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-[11px] font-bold text-stone-600">
                  Pay to: <Text className="font-mono text-purple-800 font-black">{storeSettings?.payments?.upiId || 'salbeau.store@okaxis'}</Text>
                </Text>
                <Text className="text-[10px] text-stone-500 mt-0.5">Show receipt to delivery partner upon arrival</Text>
              </View>
            </View>`;

if (custScreenCode.includes(oldCustPaymentBox)) {
  custScreenCode = custScreenCode.replace(oldCustPaymentBox, newCustPaymentBox);
}

fs.writeFileSync('app/src/features/cart/CustomerUpiPaymentStatusScreen.js', custScreenCode, 'utf8');
console.log('CustomerUpiPaymentStatusScreen.js updated with live Store QR code!');

