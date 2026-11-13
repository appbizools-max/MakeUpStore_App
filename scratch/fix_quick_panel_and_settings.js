const fs = require('fs');

const appPath = 'admin/src/App.jsx';
let code = fs.readFileSync(appPath, 'utf8');

// Replace settings redirects
code = code.replace(
  /if \(routeParam === 'settings'\) \{\s*return 'dashboard_visibility';\s*\}/g,
  "if (routeParam === 'settings') {\n        return 'settings';\n      }"
);

code = code.replace(
  /if \(routeParam === 'settings'\) \{\s*setActiveTab\('dashboard_visibility'\);\s*return;\s*\}/g,
  "if (routeParam === 'settings') {\n          setActiveTab('settings');\n          return;\n        }"
);

// Add missing validTabs
if (!code.includes("'delivery_partners'")) {
  code = code.replace(
    "'quick_panel',\n        'settings'",
    "'quick_panel',\n        'settings',\n        'branches',\n        'upi_verification',\n        'delivery_partners'"
  );
  code = code.replace(
    "'quick_panel',\r\n        'settings'",
    "'quick_panel',\r\n        'settings',\r\n        'branches',\r\n        'upi_verification',\r\n        'delivery_partners'"
  );
  code = code.replace(
    "'quick_panel',\n          'settings'",
    "'quick_panel',\n          'settings',\n          'branches',\n          'upi_verification',\n          'delivery_partners'"
  );
  code = code.replace(
    "'quick_panel',\r\n          'settings'",
    "'quick_panel',\r\n          'settings',\r\n          'branches',\r\n          'upi_verification',\r\n          'delivery_partners'"
  );
}

// Find quick_panel start and end
const startMarker = "{activeTab === 'quick_panel' && (() => {";
const endMarker = "{/* 9. ABANDONED CARTS PAGE */}";

const startPos = code.indexOf(startMarker);
const endPos = code.indexOf(endMarker);

console.log('startPos:', startPos, 'endPos:', endPos);

if (startPos !== -1 && endPos !== -1) {
  const replacement = `{activeTab === 'quick_panel' && (() => {
            const resolvedProductsCount = Array.isArray(products) ? products.length : 0;
            const resolvedCategoriesCount = Array.isArray(categories) ? categories.length : 0;
            const resolvedBrandsCount = Array.isArray(brands) ? brands.length : 0;
            const resolvedAbandonedCartsCount = (abandonedCarts || []).filter(c => c.status === 'abandoned').length;
            const resolvedOrdersCount = Array.isArray(orders) ? orders.length : 0;
            const resolvedBranchesCount = Array.isArray(branches) ? branches.length : 0;
            const resolvedEmployeesCount = Array.isArray(employees) ? employees.length : 0;
            const resolvedUpiPendingCount = (upiVerifications || []).filter(u => u.verification_status === 'PENDING_VERIFICATION').length;
            const liveDeliveriesCount = (orders || []).filter(o => o.status === 'out_for_delivery').length;

            return (
              <div className="space-y-6 animate-fade-in pb-12">
                {/* Executive Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170817] via-[#48082B] to-[#C2477A] p-7 md:p-8 text-white shadow-2xl border border-pink-500/20">
                  {/* Ambient background glow accents */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#C2477A]/25 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black tracking-wider uppercase mb-3 border border-white/15 text-pink-200">
                        <Sparkles size={13} className="text-pink-300 animate-pulse" />
                        <span>Salbeau Executive Command Center</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2.5 drop-shadow-xs">
                        Quick Access Hub
                      </h1>
                      <p className="text-xs sm:text-sm text-pink-100/90 font-medium leading-relaxed max-w-xl">
                        Real-time store metrics, pending verification alerts, and direct operational shortcuts organized by department.
                      </p>
                    </div>

                    {/* Live Pulse & Quick Status Box */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider uppercase text-pink-200/80">Store Engine</div>
                          <div className="text-xs font-black text-white">Live Cloud Sync</div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (typeof refreshData === 'function') {
                            await refreshData();
                            setDashboardToast('Store metrics, orders, branches & verifications synchronized successfully.');
                          }
                        }}
                        className="bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold px-4 py-3 rounded-2xl border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        title="Reload all live store data from Supabase"
                      >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        <span>Refresh All</span>
                      </button>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10 text-white">
                    <LayoutGrid size={260} />
                  </div>
                </div>

                {/* Live Operational Metrics Grid (8 Interactive Cards with Zero Mock Data) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
                  {/* 1. B2B Pending */}
                  <div
                    onClick={() => navigateToTab('b2b-verification')}
                    className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-amber-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">B2B Pending</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all shadow-xs">
                        <ShieldCheck size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">{b2bPendingTotal || 0}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Review</span>
                      <ChevronRight size={11} className="text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 2. UPI Verifications */}
                  <div
                    onClick={() => navigateToTab('upi_verification')}
                    className="bg-white p-3.5 rounded-2xl border border-purple-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-purple-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">UPI Verify</span>
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-100 transition-all shadow-xs">
                        <ShieldCheck size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-purple-600 tracking-tight">{resolvedUpiPendingCount}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Proofs</span>
                      <ChevronRight size={11} className="text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 3. Catalog Products */}
                  <div
                    onClick={() => navigateToTab('products')}
                    className="bg-white p-3.5 rounded-2xl border border-pink-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-[#C2477A]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Products</span>
                      <div className="w-7 h-7 rounded-lg bg-pink-50 text-[#C2477A] flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-100 transition-all shadow-xs">
                        <Package size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{resolvedProductsCount}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Catalog</span>
                      <ChevronRight size={11} className="text-[#C2477A] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 4. Store Orders */}
                  <div
                    onClick={() => navigateToTab('order_updated')}
                    className="bg-white p-3.5 rounded-2xl border border-blue-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-blue-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Orders</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all shadow-xs">
                        <ShoppingBag size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{resolvedOrdersCount}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Live Queue</span>
                      <ChevronRight size={11} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 5. B2C Customers */}
                  <div
                    onClick={() => navigateToTab('users/b2c')}
                    className="bg-white p-3.5 rounded-2xl border border-emerald-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-emerald-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">B2C Users</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all shadow-xs">
                        <User size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{b2cUsersCount || 0}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Shoppers</span>
                      <ChevronRight size={11} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 6. B2B Accounts */}
                  <div
                    onClick={() => navigateToTab('users/b2b')}
                    className="bg-white p-3.5 rounded-2xl border border-indigo-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-indigo-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">B2B Accounts</span>
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all shadow-xs">
                        <Building2 size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{b2bUsersCount || 0}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Wholesale</span>
                      <ChevronRight size={11} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 7. Store Branches */}
                  <div
                    onClick={() => navigateToTab('branches')}
                    className="bg-white p-3.5 rounded-2xl border border-cyan-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-cyan-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Branches</span>
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-100 transition-all shadow-xs">
                        <Store size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{resolvedBranchesCount}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Locations</span>
                      <ChevronRight size={11} className="text-cyan-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* 8. Abandoned Carts */}
                  <div
                    onClick={() => navigateToTab('abandoned_carts')}
                    className="bg-white p-3.5 rounded-2xl border border-rose-100/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-rose-400"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Abandoned</span>
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-100 transition-all shadow-xs">
                        <ShoppingCart size={14} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                      {resolvedAbandonedCartsCount}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-semibold flex items-center justify-between">
                      <span>Recover</span>
                      <ChevronRight size={11} className="text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Department Shortcuts Grid (Organized into 6 Functional Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Card 1: B2B Verification Command */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">B2B Verification Desk</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Verify professional wholesale accounts</p>
                        </div>
                      </div>
                      {b2bPendingTotal > 0 && (
                        <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-xs">
                          {b2bPendingTotal} pending
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('b2b-verification')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>All Applications</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2bPendingTotal}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('b2b-verification/salon')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Salon Desk</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2bPendingSalon}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('b2b-verification/makeup-artist')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Makeup Artist</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2bPendingArtist}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('b2b-verification/beautician')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Beautician</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2bPendingBeautician}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Catalog & Store Management */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#C2477A] flex items-center justify-center font-bold shadow-xs">
                          <Package size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Catalog & Products</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Manage catalog, shades & bulk imports</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('products')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Products Matrix</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{resolvedProductsCount}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('products/bulk')}
                        className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-900 font-bold transition-all text-left cursor-pointer border border-indigo-100/80"
                      >
                        <span>Bulk Product Entry</span>
                        <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 text-[9px] rounded-md font-black">FAST</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('categories')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Categories</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{resolvedCategoriesCount}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('add_brand')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Brand Partners</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{resolvedBrandsCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Orders, Delivery & Payments Workflow */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Orders & Deliveries</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Fulfillment, Riders & UPI Verifications</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('order_updated')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Orders</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{resolvedOrdersCount}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('delivery_partners')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-purple-200"
                      >
                        <span>Delivery Partners</span>
                        {liveDeliveriesCount > 0 ? (
                          <span className="px-1.5 py-0.5 bg-purple-500 text-white text-[9px] rounded-full font-black">
                            {liveDeliveriesCount} Live
                          </span>
                        ) : (
                          <ChevronRight size={13} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => navigateToTab('upi_verification')}
                        className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100 hover:text-purple-800 text-purple-900 font-bold transition-all text-left cursor-pointer border border-purple-200/80"
                      >
                        <span>UPI Verification</span>
                        {resolvedUpiPendingCount > 0 ? (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded-full font-black animate-pulse">
                            {resolvedUpiPendingCount}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold">0</span>
                        )}
                      </button>
                      <button
                        onClick={() => navigateToTab('approval_center')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-amber-200"
                      >
                        <span>Approval Center</span>
                        {(employeeOperations || []).filter(op => op.status === 'pending').length > 0 ? (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded-full font-black">
                            {(employeeOperations || []).filter(op => op.status === 'pending').length}
                          </span>
                        ) : (
                          <ChevronRight size={13} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card 4: Customers & Sales Intelligence */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                          <Users size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Customer Base</h3>
                          <p className="text-[11px] text-gray-400 font-medium">B2C Shoppers vs B2B Professionals</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('users/b2c')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>B2C Users</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2cUsersCount || 0}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('users/b2b')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-purple-200"
                      >
                        <span>B2B Users</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{b2bUsersCount || 0}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('search_requests')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Search Activity</span>
                        <ChevronRight size={13} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigateToTab('abandoned_carts')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-rose-200"
                      >
                        <span>Abandoned Carts</span>
                        <span className="text-[11px] text-rose-500 font-bold">{resolvedAbandonedCartsCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 5: Store Settings & Configuration */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#C2477A] flex items-center justify-center font-bold shadow-xs">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Settings & Rules</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Store configuration, rates & locations</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('settings')}
                        className="flex items-center justify-between p-3 rounded-xl bg-pink-50/60 hover:bg-pink-100 hover:text-[#C2477A] text-gray-800 font-bold transition-all text-left cursor-pointer border border-pink-200/70"
                      >
                        <span>General Settings</span>
                        <ChevronRight size={13} className="text-[#C2477A]" />
                      </button>
                      <button
                        onClick={() => navigateToTab('branches')}
                        className="flex items-center justify-between p-3 rounded-xl bg-cyan-50/60 hover:bg-cyan-100 hover:text-cyan-800 text-gray-800 font-bold transition-all text-left cursor-pointer border border-cyan-200/70"
                      >
                        <span>Branch Management</span>
                        <span className="text-[11px] text-cyan-700 font-bold">{resolvedBranchesCount}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('home_banners')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Home Banners</span>
                        <ChevronRight size={13} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigateToTab('pricing_rules')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Pricing Rules</span>
                        <ChevronRight size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Card 6: Team & Governance */}
                  <div className="bg-white rounded-3xl p-5.5 border border-pink-100/80 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold shadow-xs">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">Team & Governance</h3>
                          <p className="text-[11px] text-gray-400 font-medium">Internal staff, roles & security</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => navigateToTab('employees')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Employees List</span>
                        <span className="text-[11px] text-gray-400 font-semibold">{resolvedEmployeesCount}</span>
                      </button>
                      <button
                        onClick={() => navigateToTab('employees/new')}
                        className="flex items-center justify-between p-3 rounded-xl bg-pink-50/50 hover:bg-pink-100 hover:text-[#C2477A] text-gray-800 font-bold transition-all text-left cursor-pointer border border-pink-200/50"
                      >
                        <span>+ Add Employee</span>
                        <UserPlus size={13} className="text-[#C2477A]" />
                      </button>
                      <button
                        onClick={() => navigateToTab('cancel_fee')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Cancel Fee Policy</span>
                        <ChevronRight size={13} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigateToTab('dashboard_visibility')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-[#C2477A] text-gray-700 font-bold transition-all text-left cursor-pointer border border-transparent hover:border-pink-200"
                      >
                        <span>Dashboard Visibility</span>
                        <Eye size={13} className="text-[#C2477A]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}\n\n          `;

  code = code.slice(0, startPos) + replacement + code.slice(endPos);
  console.log('Successfully replaced quick_panel in App.jsx');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('Finished updating App.jsx');
