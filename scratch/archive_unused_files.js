const fs = require('fs');
const path = require('path');

const filesToArchive = [
  'app/src/features/category/components/CategoryHeroBanner.js',
  'app/src/features/category/components/CategoryPage.js',
  'app/src/features/category/components/SubcategoryCard.js',
  'app/src/features/category/components/SubcategoryFilter.js',
  'app/src/features/category/components/SubcategorySectionHeader.js',
  'admin/src/components/products/preview/MerchandisingPreviewCard.jsx',
  'admin/src/components/products/preview/NumberedStepHeader.jsx',
  'admin/src/components/products/preview/PricingPreviewCard.jsx',
  'admin/src/components/products/preview/ProductPreviewCard.jsx',
  'admin/src/components/products/preview/QuantityDiscountPreviewCard.jsx',
  'admin/src/components/common/ResponsiveImage.jsx'
];

const archiveRoot = 'NO_NEED_ARCHIVE';

filesToArchive.forEach(relPath => {
  if (fs.existsSync(relPath)) {
    const dest = path.join(archiveRoot, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(relPath, dest);
    console.log('Archived:', relPath, '=>', dest);
  } else {
    console.log('File does not exist:', relPath);
  }
});

console.log('Archiving complete!');

