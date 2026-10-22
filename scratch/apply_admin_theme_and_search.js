const fs = require('fs');
const path = require('path');

const appJsxPath = path.resolve('src/App.jsx');
let code = fs.readFileSync(appJsxPath, 'utf8');

// Backup original
fs.writeFileSync(path.resolve('src/App.jsx.bak'), code);

// 1. Add import for CustomerSearchRequestsPage
if (!code.includes('CustomerSearchRequestsPage')) {
  code = code.replace(
    "import StockManagerPage from './components/StockManagerPage';",
    "import StockManagerPage from './components/StockManagerPage';\nimport CustomerSearchRequestsPage from './components/CustomerSearchRequestsPage';"
  );
}

// 2. Destructure searchRequests from useAdmin()
if (!code.includes('searchRequests = []')) {
  code = code.replace(
    'abandonedCarts = [],',
    'abandonedCarts = [],\n    searchRequests = [],\n    searchRequestsLoading = false,\n    refreshSearchRequests,\n    updateSearchRequestStatus,\n    deleteSearchRequest,'
  );
}

// 3. Add prefilledProductName state
if (!code.includes('prefilledProductName')) {
  code = code.replace(
    "const [loginLoading, setLoginLoading] = useState(false);",
    "const [loginLoading, setLoginLoading] = useState(false);\n  const [prefilledProductName, setPrefilledProductName] = useState('');"
  );
}

// 4. Add 'search_requests' to validTabs
if (!code.includes("'search_requests'")) {
  code = code.replace(
    "'abandoned_carts',",
    "'abandoned_carts',\n        'search_requests',"
  );
}

// 5. Add search_requests to navItems
if (!code.includes("id: 'search_requests'")) {
  const searchNavItem = `    {
      id: 'search_requests',
      label: 'Customer Search Requests',
      icon: Search,
      badge: (searchRequests || []).filter(r => !r.status || r.status === 'pending').length || null,
      badgeClass: 'min-w-[20px] h-5 px-1.5 bg-[#C2477A] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs',
      isPillBadge: true,
    },
    {
      id: 'abandoned_carts',`;
  code = code.replace("    {\n      id: 'abandoned_carts',", searchNavItem);
}

// 6. In filteredNavItems
if (!code.includes("item.id === 'search_requests'")) {
  code = code.replace(
    "if (item.id === 'abandoned_carts') return true;",
    "if (item.id === 'search_requests') return true;\n      if (item.id === 'abandoned_carts') return true;"
  );
}

// 7. Sidebar Header logo replacement
code = code.replace(
  `<div className="w-8 h-8 rounded-full bg-[#CE4270] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  <Sparkles size={16} />
                </div>
                <h1
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-2xl text-[#CE4270] font-normal tracking-wide leading-none truncate select-none"
                >
                  Salbeau
                </h1>`,
  `<img
                  src={salbeauLogo}
                  alt="Salbeau"
                  className="w-8 h-8 rounded-lg object-contain bg-black p-1 shadow-xs shrink-0"
                />
                <h1
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                  className="text-2xl text-[#C2477A] font-normal tracking-wide leading-none truncate select-none"
                >
                  Salbeau
                </h1>`
);

code = code.replace(
  `<div className="w-7 h-7 rounded-full bg-[#CE4270] text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                <Sparkles size={13} />
              </div>`,
  `<img
                src={salbeauLogo}
                alt="Salbeau"
                className="w-7 h-7 rounded-lg object-contain bg-black p-0.5 shadow-xs shrink-0 mt-0.5"
              />`
);

code = code.replace(
  `<div className="w-8 h-8 rounded-full bg-[#CE4270] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <h1
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                    className="text-2xl text-[#CE4270]"
                  >
                    Salbeau
                  </h1>`,
  `<img
                    src={salbeauLogo}
                    alt="Salbeau"
                    className="w-8 h-8 rounded-lg object-contain bg-black p-1 shadow-xs shrink-0"
                  />
                  <h1
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                    className="text-2xl text-[#C2477A]"
                  >
                    Salbeau
                  </h1>`
);

// 8. Header title & subtitle
if (!code.includes("{activeTab === 'search_requests' && 'Customer Search Requests'}")) {
  code = code.replace(
    "{activeTab === 'abandoned_carts' && 'Abandoned Carts & Cart Recovery'}",
    "{activeTab === 'search_requests' && 'Customer Search Requests'}\n                {activeTab === 'abandoned_carts' && 'Abandoned Carts & Cart Recovery'}"
  );

  code = code.replace(
    "{activeTab === 'abandoned_carts' && 'Real-time tracking of incomplete orders and potential recoveries'}",
    "{activeTab === 'search_requests' && 'Real-time tracking of customer search queries that returned no products'}\n                {activeTab === 'abandoned_carts' && 'Real-time tracking of incomplete orders and potential recoveries'}"
  );
}

// 9. Add Quick Button next to Abandoned Cart in top header
if (!code.includes("navigateToTab('search_requests')")) {
  const quickSearchBtn = `              {/* Customer Search Requests Quick Button with Live Counter Badge */}
              <button
                onClick={() => navigateToTab('search_requests')}
                title="Customer Search Requests"
                className={\`relative p-2.5 rounded-xl border transition-all cursor-pointer \${
                  activeTab === 'search_requests'
                    ? 'bg-[#C2477A] text-white border-[#C2477A]'
                    : 'bg-white hover:bg-[#FFF5F8] text-black border-[#FCE4EC] shadow-2xs'
                }\`}
              >
                <Search size={16} />
                {(searchRequests || []).filter(r => !r.status || r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C2477A] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {(searchRequests || []).filter(r => !r.status || r.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Abandoned Cart Quick Button with Live Counter Badge */}`;
  code = code.replace('{/* Abandoned Cart Quick Button with Live Counter Badge */}', quickSearchBtn);
}

// 10. Pass initialProductName to AddNewProductPage and reset it onNavigateBack
code = code.replace(
  `setPrefilledHierarchyForNewProduct({ category: '', subcategory: '', selectCategory: '' });\n              navigateToTab('products');`,
  `setPrefilledHierarchyForNewProduct({ category: '', subcategory: '', selectCategory: '' });\n              setPrefilledProductName('');\n              navigateToTab('products');`
);

code = code.replace(
  `initialBarcode={prefilledBarcodeForNewProduct.barcode}`,
  `initialProductName={prefilledProductName}\n            initialBarcode={prefilledBarcodeForNewProduct.barcode}`
);

// 11. Render CustomerSearchRequestsPage
if (!code.includes("<CustomerSearchRequestsPage")) {
  const searchPageRender = `        {/* 5E. CUSTOMER SEARCH REQUESTS TRACKING PAGE */}
        {activeTab === 'search_requests' && (
          <CustomerSearchRequestsPage
            onNavigateToNewProduct={(productName) => {
              setPrefilledProductName(productName || '');
              navigateToTab('products/new');
            }}
          />
        )}

        {/* 5D. STOCK & INVENTORY MANAGER PAGE */}`;
  code = code.replace('{/* 5D. STOCK & INVENTORY MANAGER PAGE */}', searchPageRender);
}

// 12. Standardize #CE4270 to #C2477A
code = code.replace(/#CE4270/gi, '#C2477A');

// 13. Standardize #FDF2F4 to #FFF5F8
code = code.replace(/#FDF2F4/gi, '#FFF5F8');

// 14. Standardize bg-[#F8FAFC] to bg-white
code = code.replace(/bg-\[#F8FAFC\]/gi, 'bg-white');

// 15. Unrelated violet/indigo classes in products & pricing
code = code.replace(/'bg-violet-600 text-white border-violet-600 shadow-xs'/g, "'bg-[#C2477A] text-white border-[#C2477A] shadow-xs'");
code = code.replace(/'bg-violet-50 text-violet-900 border-violet-300 hover:bg-violet-100'/g, "'bg-[#FFF5F8] text-black border-[#FCE4EC] hover:bg-[#FDF2F8]'");
code = code.replace(/text-violet-600/g, 'text-[#C2477A]');
code = code.replace(/text-violet-700/g, 'text-[#C2477A]');
code = code.replace(/text-violet-800/g, 'text-black');
code = code.replace(/text-violet-900/g, 'text-black');
code = code.replace(/bg-violet-50/g, 'bg-[#FFF5F8]');
code = code.replace(/bg-violet-100/g, 'bg-[#FDF2F8]');
code = code.replace(/bg-violet-600/g, 'bg-[#C2477A]');
code = code.replace(/bg-violet-700/g, 'bg-[#9E2D5B]');
code = code.replace(/border-violet-100/g, 'border-[#FCE4EC]');
code = code.replace(/border-violet-200/g, 'border-[#FCE4EC]');
code = code.replace(/border-violet-300/g, 'border-[#F8B4CB]');
code = code.replace(/border-violet-400/g, 'border-[#C2477A]');
code = code.replace(/border-violet-500/g, 'border-[#C2477A]');
code = code.replace(/border-violet-600/g, 'border-[#C2477A]');

// Unrelated indigo classes in summary metrics & tags
code = code.replace(/bg-indigo-50 text-indigo-600/g, 'bg-[#FFF5F8] text-[#C2477A]');
code = code.replace(/text-indigo-600/g, 'text-[#C2477A]');
code = code.replace(/text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/g, 'text-black bg-[#FFF5F8] px-2 py-0.5 rounded border border-[#FCE4EC]');
code = code.replace(/bg-indigo-500/g, 'bg-[#C2477A]');

// Unrelated purple classes
code = code.replace(/bg-purple-100 text-purple-700/g, 'bg-[#FFF5F8] text-[#C2477A] border border-[#F8B4CB]');
code = code.replace(/border-purple-400/g, 'border-[#F8B4CB]');
code = code.replace(/border-purple-200/g, 'border-[#FCE4EC]');
code = code.replace(/text-purple-600/g, 'text-black');
code = code.replace(/text-purple-700/g, 'text-black');
code = code.replace(/bg-purple-50/g, 'bg-[#FFF5F8]');

fs.writeFileSync(appJsxPath, code, 'utf8');
console.log('Successfully updated App.jsx with Customer Search Requests and Theme Harmonization!');
