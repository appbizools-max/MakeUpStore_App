import fs from 'fs';
import path from 'path';

const filesToClean = [
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/MainCategoriesManager.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/CategorySubcategoryManager.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/ProductsCatalogMatrix.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/ProductFormRightPanel.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/ImageDropzoneUploader.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/DynamicVariantBuilder.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/B2BVerificationPage.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/admin/src/components/AddNewProductPage_Redesigned.jsx',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/search/SearchScreen.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/wishlist/WishlistScreen.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/product/ProductDetailScreen.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/home/HomeScreen.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/category/SubcategoryView.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/category/ProductListingView.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/category/CategoryDetailView.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/cart/CartScreen.js',
  'e:/MakeUpStore_App-main/MakeUpStore_App/app/src/features/auth/B2BVerificationScreen.js'
];

for (const f of filesToClean) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Replace onError fallbacks
  content = content.replace(/e\.target\.src\s*=\s*['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]/g, "e.target.style.display = 'none'");
  content = content.replace(/e\.currentTarget\.src\s*=\s*['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]/g, "e.currentTarget.style.display = 'none'");

  // Replace getSafeImageSource fallback parameters that use unsplash
  content = content.replace(/getSafeImageSource\(([^,]+),\s*['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]\)/g, "getSafeImageSource($1, '')");

  // Replace raw Unsplash URLs in src or source
  content = content.replace(/['"]https:\/\/images\.unsplash\.com\/[^'"]+['"]/g, "''");

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Cleaned: ${path.basename(f)}`);
  }
}
console.log('Finished cleaning fallbacks.');
