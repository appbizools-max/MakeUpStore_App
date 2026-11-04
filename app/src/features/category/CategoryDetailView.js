import React, { useMemo } from 'react';
import { getSubcategoriesForCategory } from '../../config/categoriesHierarchy';
import { CategoryPage } from './components/CategoryPage';

/**
 * CategoryDetailView (Level 2) � no images.
 */
export const CategoryDetailView = ({
  category,
  onSelectSubcategory,
  onBack,
  onViewAllProducts,
  liveSubcategories = null,
  liveLeafCategories = null,
}) => {
  const subcategories = useMemo(() => {
    if (liveSubcategories && Array.isArray(liveSubcategories) && liveSubcategories.length > 0) {
      const nCatId    = (category?.id     || '').toLowerCase().trim();
      const nCatName  = (category?.name   || '').toLowerCase().trim();
      const nCatDbKey = (category?.dbKey  || '').toLowerCase().trim();
      const matched = liveSubcategories.filter(s => {
        if (s.enabled === false) return false;
        const sCatId   = (s.categoryId   || s.category_id   || '').toLowerCase().trim();
        const sCatName = (s.categoryName || s.category_name || '').toLowerCase().trim();
        return (nCatId && sCatId === nCatId) ||
               (nCatName && (sCatId === nCatName || sCatName === nCatName)) ||
               (nCatDbKey && sCatId === nCatDbKey);
      });
      if (matched.length > 0) {
        return matched
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
          .map(s => {
            let childLeaves = [];
            if (liveLeafCategories && Array.isArray(liveLeafCategories)) {
              const sId   = (s.id   || '').toLowerCase().trim();
              const sName = (s.name || '').toLowerCase().trim();
              childLeaves = liveLeafCategories.filter(l => {
                if (l.enabled === false) return false;
                const lSubId   = (l.subcategoryId   || '').toLowerCase().trim();
                const lSubName = (l.subcategoryName || '').toLowerCase().trim();
                return (sId && lSubId === sId) || (sName && (lSubId === sName || lSubName === sName));
              });
            }
            if (childLeaves.length === 0 && Array.isArray(s.leafCategories)) {
              childLeaves = s.leafCategories.filter(l => l.enabled !== false);
            }
            return { ...s, leafCategories: childLeaves };
          });
      }
    }
    return getSubcategoriesForCategory(category);
  }, [category, liveSubcategories, liveLeafCategories]);

  return (
    <CategoryPage
      parentTitle="Categories"
      title={category?.name || 'Category'}
      bannerTitle={category?.name || 'Category'}
      bannerSubtitle={category?.tagline || category?.description || 'Discover luxury beauty formulations.'}
      image={category?.image || null}
      subcategories={subcategories}
      onBack={onBack}
      onShopAll={onViewAllProducts}
      onSelectSubcategory={onSelectSubcategory}
      onExploreProducts={onViewAllProducts}
    />
  );
};

export default CategoryDetailView;
