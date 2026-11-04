import React, { useMemo } from 'react';
import { getLeafCategoriesForSubcategory } from '../../config/categoriesHierarchy';
import { CategoryPage } from './components/CategoryPage';

/**
 * SubcategoryView (Level 3) — no images.
 */
export const SubcategoryView = ({
  category,
  subcategory,
  onSelectLeaf,
  onBack,
  onDirectViewAll,
  liveLeafCategories = null,
}) => {
  const leafCategories = useMemo(() => {
    if (subcategory?.leafCategories && Array.isArray(subcategory.leafCategories) && subcategory.leafCategories.length > 0) {
      return subcategory.leafCategories.filter(l => l.enabled !== false);
    }
    if (liveLeafCategories && Array.isArray(liveLeafCategories) && liveLeafCategories.length > 0) {
      const nSubId   = (subcategory?.id   || '').toLowerCase().trim();
      const nSubName = (subcategory?.name || '').toLowerCase().trim();
      const matched = liveLeafCategories.filter(l => {
        if (l.enabled === false) return false;
        const lSubId   = (l.subcategoryId   || '').toLowerCase().trim();
        const lSubName = (l.subcategoryName || '').toLowerCase().trim();
        return (nSubId && lSubId === nSubId) || (nSubName && (lSubId === nSubName || lSubName === nSubName));
      });
      if (matched.length > 0) {
        return matched.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      }
    }
    return getLeafCategoriesForSubcategory(subcategory, category);
  }, [subcategory, category, liveLeafCategories]);

  return (
    <CategoryPage
      parentTitle={category?.name || 'Category'}
      title={subcategory?.name || 'Subcategory'}
      bannerTitle={subcategory?.name || 'Subcategory'}
      bannerSubtitle={subcategory?.tagline || subcategory?.description || 'Targeted formulations for every need.'}
      subcategories={leafCategories}
      onBack={onBack}
      onShopAll={onDirectViewAll}
      onSelectSubcategory={onSelectLeaf}
      onExploreProducts={onDirectViewAll}
    />
  );
};

export default SubcategoryView;
