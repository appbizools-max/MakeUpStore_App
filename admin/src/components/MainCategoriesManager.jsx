import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderPlus,
  Layers,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Save,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
  Filter,
  Tag,
  GripVertical
} from 'lucide-react';
import InlineImageSection from './InlineImageSection';
import { supabase, supabaseAdmin } from '../config/supabase';
import { useAdmin } from '../context/AdminContext';

// Helper for generating clean slugs internally (not shown in UI)
export const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function MainCategoriesManager({
  onRefreshMaster,
  onNavigateToProducts
}) {
  const adminCtx = useAdmin?.() || {};

  // Core Data States from Supabase
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Active View / Hierarchy Navigation:
  // 'categories' (Level 1: Main Categories)
  // 'subcategories' (Level 2: Subcategories under selected Main Category)
  // 'product_types' (Level 3: Select Categories / Product Types under selected Subcategory)
  const [currentView, setCurrentView] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Search & Filters for Main Categories (Level 1)
  const [catSearch, setCatSearch] = useState('');
  const [catStatusFilter, setCatStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [catMobileFilter, setCatMobileFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

  // Search & Filters for Subcategories (Level 2)
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [subMobileFilter, setSubMobileFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

  // Search & Filters for Select Categories / Product Types (Level 3)
  const [ptSearch, setPtSearch] = useState('');
  const [ptStatusFilter, setPtStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [ptMobileFilter, setPtMobileFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

  // Drag and Drop State for ordering
  const [dragItemIndex, setDragItemIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Modal States: null | 'add_category' | 'edit_category' | 'add_subcategory' | 'edit_subcategory' | 'add_product_type' | 'edit_product_type'
  const [modalMode, setModalMode] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Category Form State
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    description: '',
    image: '',
    color: '#FCE4EC',
    icon: 'Sparkles',
    is_active: true,
    show_in_mobile_app: true
  });

  // Subcategory Form State
  const [subFormData, setSubFormData] = useState({
    id: '',
    category_id: '',
    name: '',
    description: '',
    image: '',
    is_active: true,
    show_in_mobile_app: true
  });

  // Select Category / Product Type Form State (Level 3)
  const [ptFormData, setPtFormData] = useState({
    id: '',
    category_id: '',
    subcategory_id: '',
    name: '',
    description: '',
    image: '',
    is_active: true,
    show_in_mobile_app: true
  });

  const [formErrors, setFormErrors] = useState({});

  // Safe Delete Dialog State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'category', // 'category' | 'subcategory' | 'product_type'
    item: null,
    isChecking: false,
    hasRelations: false,
    childCount: 0,
    productsCount: 0,
    isDeleting: false
  });

  // Wipe All Images Modal State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isWipingImages, setIsWipingImages] = useState(false);

  const showNotice = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // ── WIPE ALL IMAGES COMPLETELY FROM DATABASE & ADMIN PANEL ───────────
  const handleWipeAllImages = async () => {
    setIsWipingImages(true);
    try {
      const client = supabaseAdmin || supabase;

      // 1. Clear categories table image and icon
      try {
        await client.from('categories').update({ image: '', icon: '' }).neq('id', '___salbeau_dummy___');
      } catch (e) {
        console.warn('Clear categories images error:', e);
      }

      // 2. Clear subcategories table image
      try {
        await client.from('subcategories').update({ image: '' }).neq('id', '___salbeau_dummy___');
      } catch (e) {
        console.warn('Clear subcategories images error:', e);
      }

      // 3. Clear product_types table image
      try {
        await client.from('product_types').update({ image: '' }).neq('id', '___salbeau_dummy___');
      } catch (_) {}

      // 4. Clear products image & images
      try {
        await client.from('products').update({ image: '', images: [] }).neq('id', '___salbeau_dummy___');
      } catch (e) {
        console.warn('Clear products images error:', e);
      }

      // 5. Clear brands logo (excluding config records)
      try {
        await client.from('brands').update({ logo: '' })
          .neq('id', 'salbeau_category_subcategory_hierarchy')
          .neq('id', 'app_category_order_config');
      } catch (_) {}

      // 6. Strip all images from local memory categories & subcategories & productTypes
      const cleanCategories = categories.map(c => ({ ...c, image: '', icon: '' }));
      const cleanSubcategories = subcategories.map(s => ({ ...s, image: '' }));
      const cleanProductTypes = productTypes.map(pt => ({ ...pt, image: '' }));

      // 7. Update the hierarchy configuration record in brands table
      await client.from('brands').upsert({
        id: 'salbeau_category_subcategory_hierarchy',
        name: 'Salbeau Category & Subcategory Master Hierarchy',
        logo: JSON.stringify({
          categories: cleanCategories,
          subcategories: cleanSubcategories,
          leafCategories: cleanProductTypes,
          product_types: cleanProductTypes,
          updatedAt: new Date().toISOString()
        }),
        enabled: true
      });

      await client.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(cleanCategories),
        enabled: true
      });

      // 8. Update local React state
      setCategories(cleanCategories);
      setSubcategories(cleanSubcategories);
      setProductTypes(cleanProductTypes);

      setIsWipeModalOpen(false);
      showNotice('All images have been completely removed from database and admin panel!', 'success');
    } catch (err) {
      console.error('Wipe images error:', err);
      showNotice(`Failed to remove images: ${err.message || 'Unknown database error'}`, 'error');
    } finally {
      setIsWipingImages(false);
    }
  };

  // ── 1. LOAD DATA FROM SUPABASE ──────────────────────────────────────
  const loadHierarchyData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // 1. Fetch categories table
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;

      // 2. Fetch subcategories table
      const { data: subData, error: subErr } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (subErr) throw subErr;

      // 3. Fetch hierarchy configuration record from brands table
      const { data: hierData } = await supabase
        .from('brands')
        .select('logo')
        .eq('id', 'salbeau_category_subcategory_hierarchy')
        .maybeSingle();

      let hierCategoriesMap = new Map();
      let hierSubsMap = new Map();
      let rawLeafCategories = [];

      if (hierData?.logo) {
        try {
          const parsed = JSON.parse(hierData.logo);
          if (Array.isArray(parsed?.categories)) {
            parsed.categories.forEach(hc => {
              if (hc.id) hierCategoriesMap.set(hc.id, hc);
              if (hc.name) hierCategoriesMap.set(hc.name.toLowerCase().trim(), hc);
            });
          }
          if (Array.isArray(parsed?.subcategories)) {
            parsed.subcategories.forEach(hs => {
              if (hs.id) hierSubsMap.set(hs.id, hs);
              const key = `${hs.category_id || hs.categoryId}_${(hs.name || '').toLowerCase().trim()}`;
              hierSubsMap.set(key, hs);
            });
          }
          if (Array.isArray(parsed?.leafCategories)) {
            rawLeafCategories = parsed.leafCategories;
          } else if (Array.isArray(parsed?.product_types)) {
            rawLeafCategories = parsed.product_types;
          }
        } catch (_) {}
      }

      // 4. Normalize Categories
      const normalizedCategories = (catData || []).map((c, index) => {
        const extra = hierCategoriesMap.get(c.id) || hierCategoriesMap.get(c.name?.toLowerCase().trim()) || {};
        const sortOrder = typeof c.sort_order === 'number' ? c.sort_order : (typeof extra.display_order === 'number' ? extra.display_order : index + 1);
        const isActive = c.enabled !== false && c.enabled !== 'false' && c.enabled !== 0;
        const showMobile = extra.show_in_mobile_app !== undefined ? extra.show_in_mobile_app : (c.show_in_mobile_app !== undefined ? c.show_in_mobile_app : true);

        return {
          id: c.id,
          name: c.name || '',
          slug: c.slug || extra.slug || generateSlug(c.name),
          description: c.description || extra.description || '',
          image: c.image || extra.image || '',
          image_url: c.image || extra.image || '',
          color: c.color || extra.color || '#FCE4EC',
          icon: c.icon || extra.icon || 'Sparkles',
          sort_order: sortOrder,
          display_order: sortOrder,
          enabled: isActive,
          is_active: isActive,
          show_in_mobile_app: showMobile,
          created_at: c.created_at || extra.created_at || null,
          updated_at: c.updated_at || extra.updated_at || null
        };
      }).sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

      // 5. Normalize Subcategories
      const normalizedSubcategories = (subData || []).map((s, index) => {
        const extra = hierSubsMap.get(s.id) || hierSubsMap.get(`${s.category_id}_${(s.name || '').toLowerCase().trim()}`) || {};
        const sortOrder = typeof s.sort_order === 'number' ? s.sort_order : (typeof extra.display_order === 'number' ? extra.display_order : index + 1);
        const isActive = s.enabled !== false && s.enabled !== 'false' && s.enabled !== 0;
        const showMobile = extra.show_in_mobile_app !== undefined ? extra.show_in_mobile_app : (s.show_in_mobile_app !== undefined ? s.show_in_mobile_app : true);

        return {
          id: s.id,
          category_id: s.category_id,
          categoryId: s.category_id,
          name: s.name || '',
          slug: s.slug || extra.slug || generateSlug(s.name),
          description: s.description || s.tagline || extra.description || extra.tagline || '',
          tagline: s.tagline || s.description || extra.tagline || extra.description || '',
          image: s.image || extra.image || '',
          image_url: s.image || extra.image || '',
          sort_order: sortOrder,
          display_order: sortOrder,
          enabled: isActive,
          is_active: isActive,
          show_in_mobile_app: showMobile,
          created_at: s.created_at || extra.created_at || null,
          updated_at: s.updated_at || extra.updated_at || null
        };
      }).sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

      // 6. Normalize Select Categories / Product Types
      const normalizedProductTypes = (rawLeafCategories || []).map((pt, index) => {
        const sortOrder = typeof pt.sort_order === 'number' ? pt.sort_order : (typeof pt.display_order === 'number' ? pt.display_order : index + 1);
        const isActive = pt.enabled !== false && pt.enabled !== 'false' && pt.is_active !== false;
        const showMobile = pt.show_in_mobile_app !== undefined ? pt.show_in_mobile_app : true;

        return {
          id: pt.id || `pt_${generateSlug(pt.name)}_${Date.now().toString(36)}`,
          category_id: pt.category_id || pt.categoryId || '',
          categoryId: pt.category_id || pt.categoryId || '',
          subcategory_id: pt.subcategory_id || pt.subcategoryId || '',
          subcategoryId: pt.subcategory_id || pt.subcategoryId || '',
          name: pt.name || '',
          slug: pt.slug || generateSlug(pt.name),
          description: pt.description || pt.tagline || '',
          tagline: pt.description || pt.tagline || '',
          image: pt.image || pt.image_url || '',
          image_url: pt.image || pt.image_url || '',
          sort_order: sortOrder,
          display_order: sortOrder,
          enabled: isActive,
          is_active: isActive,
          show_in_mobile_app: showMobile,
          created_at: pt.created_at || null,
          updated_at: pt.updated_at || null
        };
      }).sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

      setCategories(normalizedCategories);
      setSubcategories(normalizedSubcategories);
      setProductTypes(normalizedProductTypes);

      // Keep selected category & subcategory synced if active
      setSelectedCategory(prev => {
        if (!prev) return null;
        return normalizedCategories.find(c => c.id === prev.id) || null;
      });

      setSelectedSubcategory(prev => {
        if (!prev) return null;
        return normalizedSubcategories.find(s => s.id === prev.id) || null;
      });
    } catch (err) {
      console.error('Failed to load category hierarchy from Supabase:', err);
      setFetchError(err.message || 'Unable to load categories. Please check database connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // ── 2. REALTIME SUBSCRIPTION ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('category_redesign_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadHierarchyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        loadHierarchyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands', filter: 'id=eq.salbeau_category_subcategory_hierarchy' }, () => {
        loadHierarchyData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHierarchyData]);

  // ── Keyboard Escape Dismissal & Background Scroll Lock ───────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalMode && !isSaving) {
          closeModal();
        } else if (deleteModal.isOpen && !deleteModal.isDeleting && !deleteModal.isChecking) {
          setDeleteModal({
            isOpen: false,
            type: 'category',
            item: null,
            isChecking: false,
            hasRelations: false,
            childCount: 0,
            productsCount: 0,
            isDeleting: false
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, isSaving, deleteModal]);

  useEffect(() => {
    if (modalMode || deleteModal.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalMode, deleteModal.isOpen]);

  // ── 3. PERSISTENCE HELPER ───────────────────────────────────────────
  const persistHierarchy = async (newCategories, newSubcategories, newProductTypes) => {
    const client = supabaseAdmin || supabase;
    setIsSaving(true);
    try {
      const catsToSave = newCategories || categories;
      const subsToSave = newSubcategories || subcategories;
      const ptsToSave = newProductTypes || productTypes;

      // 1. Upsert categories table
      const categoryUpserts = catsToSave.map(c => ({
        id: c.id,
        name: (c.name || '').trim(),
        image: c.image || '',
        icon: c.icon || 'Sparkles',
        color: c.color || '#FCE4EC',
        sort_order: Number(c.sort_order || c.display_order || 1),
        enabled: c.is_active !== false && c.enabled !== false
      }));

      const { error: catErr } = await client.from('categories').upsert(categoryUpserts);
      if (catErr) console.warn('Categories table upsert warning:', catErr);

      // 2. Upsert subcategories table
      const subcategoryUpserts = subsToSave.map(s => ({
        id: s.id,
        category_id: s.category_id || s.categoryId,
        name: (s.name || '').trim(),
        image: s.image || '',
        tagline: s.description || s.tagline || '',
        sort_order: Number(s.sort_order || s.display_order || 1),
        enabled: s.is_active !== false && s.enabled !== false
      }));

      const { error: subErr } = await client.from('subcategories').upsert(subcategoryUpserts);
      if (subErr) console.warn('Subcategories table upsert warning:', subErr);

      // 3. Sync rich 3-level hierarchy to brands table (salbeau_category_subcategory_hierarchy)
      const hierarchyPayload = {
        id: 'salbeau_category_subcategory_hierarchy',
        name: 'Salbeau Category & Subcategory Master Hierarchy',
        logo: JSON.stringify({
          categories: catsToSave,
          subcategories: subsToSave,
          leafCategories: ptsToSave,
          product_types: ptsToSave,
          updatedAt: new Date().toISOString()
        }),
        enabled: true
      };

      await client.from('brands').upsert(hierarchyPayload);

      // 4. Sync category order config for mobile app
      await client.from('brands').upsert({
        id: 'app_category_order_config',
        name: 'Category Order Config',
        logo: JSON.stringify(catsToSave),
        enabled: true
      });

      // 5. Try upserting to product_types table if present in Postgres
      try {
        const ptUpserts = ptsToSave.map(pt => ({
          id: pt.id,
          category_id: pt.category_id || pt.categoryId,
          subcategory_id: pt.subcategory_id || pt.subcategoryId,
          name: (pt.name || '').trim(),
          slug: pt.slug || generateSlug(pt.name),
          description: pt.description || '',
          image: pt.image || '',
          sort_order: Number(pt.sort_order || pt.display_order || 1),
          display_order: Number(pt.sort_order || pt.display_order || 1),
          enabled: pt.is_active !== false && pt.enabled !== false,
          is_active: pt.is_active !== false && pt.enabled !== false,
          show_in_mobile_app: pt.show_in_mobile_app !== false
        }));
        await client.from('product_types').upsert(ptUpserts);
      } catch (_) {
        // Safe fallback if table schema cache is pending SQL execution
      }

      // Update local state optimistically
      setCategories(catsToSave);
      setSubcategories(subsToSave);
      setProductTypes(ptsToSave);

      if (typeof onRefreshMaster === 'function') onRefreshMaster();
      return true;
    } catch (err) {
      console.error('Failed to persist hierarchy changes:', err);
      showNotice('Failed to save changes. Please try again.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ── 4. NAVIGATION HANDLERS ──────────────────────────────────────────
  // Main Category -> Show Subcategories -> Level 2
  const handleOpenCategorySubcategories = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setCurrentView('subcategories');
    setSubSearch('');
    setSubStatusFilter('all');
    setSubMobileFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sub Category -> Show Select Categories -> Level 3
  const handleOpenSubcategoryProductTypes = (sub) => {
    const parentCat = categories.find(c => c.id === sub.category_id) || selectedCategory;
    setSelectedCategory(parentCat);
    setSelectedSubcategory(sub);
    setCurrentView('product_types');
    setPtSearch('');
    setPtStatusFilter('all');
    setPtMobileFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Main Categories (Level 1)
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCurrentView('categories');
    setModalMode(null);
    setEditingItem(null);
  };

  // Back to Subcategories (Level 2)
  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setCurrentView('subcategories');
    setModalMode(null);
    setEditingItem(null);
  };

  // ── 5. DRAG & DROP REORDERING ───────────────────────────────────────
  // A. Reorder Main Categories
  const handleCategoryDragStart = (idx) => {
    setDragItemIndex(idx);
  };

  const handleCategoryDragEnter = (idx) => {
    setDragOverIndex(idx);
  };

  const handleCategoryDrop = async (dropIndex) => {
    if (dragItemIndex === null || dragItemIndex === dropIndex) {
      setDragItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...filteredAndSortedCategories];
    const draggedItem = items[dragItemIndex];
    items.splice(dragItemIndex, 1);
    items.splice(dropIndex, 0, draggedItem);

    // Re-index display_order and sort_order
    const updatedCats = items.map((c, i) => ({
      ...c,
      display_order: i + 1,
      sort_order: i + 1
    }));

    setDragItemIndex(null);
    setDragOverIndex(null);
    await persistHierarchy(updatedCats, subcategories, productTypes);
    showNotice(`Order updated successfully.`);
  };

  // B. Reorder Subcategories (within parent)
  const handleSubcategoryDragStart = (idx) => {
    setDragItemIndex(idx);
  };

  const handleSubcategoryDragEnter = (idx) => {
    setDragOverIndex(idx);
  };

  const handleSubcategoryDrop = async (dropIndex) => {
    if (dragItemIndex === null || dragItemIndex === dropIndex) {
      setDragItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const parentId = selectedCategory?.id;
    const parentSubs = subcategories
      .filter(s => s.category_id === parentId)
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

    const draggedItem = parentSubs[dragItemIndex];
    parentSubs.splice(dragItemIndex, 1);
    parentSubs.splice(dropIndex, 0, draggedItem);

    const reindexedParentSubs = parentSubs.map((s, i) => ({
      ...s,
      display_order: i + 1,
      sort_order: i + 1
    }));

    const updatedAllSubs = subcategories.map(s => {
      const found = reindexedParentSubs.find(ps => ps.id === s.id);
      return found || s;
    });

    setDragItemIndex(null);
    setDragOverIndex(null);
    await persistHierarchy(categories, updatedAllSubs, productTypes);
    showNotice(`Order updated successfully.`);
  };

  // C. Reorder Product Types (within subcategory)
  const handleProductTypeDragStart = (idx) => {
    setDragItemIndex(idx);
  };

  const handleProductTypeDragEnter = (idx) => {
    setDragOverIndex(idx);
  };

  const handleProductTypeDrop = async (dropIndex) => {
    if (dragItemIndex === null || dragItemIndex === dropIndex) {
      setDragItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const parentSubId = selectedSubcategory?.id;
    const siblingPTs = productTypes
      .filter(p => (p.subcategory_id || p.subcategoryId) === parentSubId)
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

    const draggedItem = siblingPTs[dragItemIndex];
    siblingPTs.splice(dragItemIndex, 1);
    siblingPTs.splice(dropIndex, 0, draggedItem);

    const reindexedSiblings = siblingPTs.map((p, i) => ({
      ...p,
      display_order: i + 1,
      sort_order: i + 1
    }));

    const updatedAllPTs = productTypes.map(p => {
      const found = reindexedSiblings.find(sp => sp.id === p.id);
      return found || p;
    });

    setDragItemIndex(null);
    setDragOverIndex(null);
    await persistHierarchy(categories, subcategories, updatedAllPTs);
    showNotice(`Order updated successfully.`);
  };

  // ── 6. MODAL OPENERS ────────────────────────────────────────────────
  // Main Category Modal
  const openAddCategoryModal = () => {
    setCategoryFormData({
      id: '',
      name: '',
      description: '',
      image: '',
      color: '#FCE4EC',
      icon: 'Sparkles',
      is_active: true,
      show_in_mobile_app: true
    });
    setFormErrors({});
    setEditingItem(null);
    setModalMode('add_category');
  };

  const openEditCategoryModal = (cat) => {
    setEditingItem(cat);
    setCategoryFormData({
      id: cat.id,
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      color: cat.color || '#FCE4EC',
      icon: cat.icon || 'Sparkles',
      is_active: cat.is_active !== false && cat.enabled !== false,
      show_in_mobile_app: cat.show_in_mobile_app !== false
    });
    setFormErrors({});
    setModalMode('edit_category');
  };

  // Subcategory Modal
  const openAddSubcategoryModal = (parentCategory = selectedCategory) => {
    const parentId = parentCategory?.id || (categories[0] ? categories[0].id : '');

    setSubFormData({
      id: '',
      category_id: parentId,
      name: '',
      description: '',
      image: '',
      is_active: true,
      show_in_mobile_app: true
    });
    setFormErrors({});
    setEditingItem(null);
    setModalMode('add_subcategory');
  };

  const openEditSubcategoryModal = (sub) => {
    setEditingItem(sub);
    setSubFormData({
      id: sub.id,
      category_id: sub.category_id,
      name: sub.name || '',
      description: sub.description || sub.tagline || '',
      image: sub.image || '',
      is_active: sub.is_active !== false && sub.enabled !== false,
      show_in_mobile_app: sub.show_in_mobile_app !== false
    });
    setFormErrors({});
    setModalMode('edit_subcategory');
  };

  // Select Category / Product Type Modal (Level 3)
  const openAddProductTypeModal = (parentCat = selectedCategory, parentSub = selectedSubcategory) => {
    const chosenCatId = parentCat?.id || (categories[0] ? categories[0].id : '');
    const availableSubs = subcategories.filter(s => s.category_id === chosenCatId);
    const chosenSubId = parentSub?.id || (availableSubs[0] ? availableSubs[0].id : '');

    setPtFormData({
      id: '',
      category_id: chosenCatId,
      subcategory_id: chosenSubId,
      name: '',
      description: '',
      image: '',
      is_active: true,
      show_in_mobile_app: true
    });
    setFormErrors({});
    setEditingItem(null);
    setModalMode('add_product_type');
  };

  const openEditProductTypeModal = (pt) => {
    setEditingItem(pt);
    const parentSub = subcategories.find(s => s.id === (pt.subcategory_id || pt.subcategoryId));
    const parentCatId = pt.category_id || pt.categoryId || (parentSub ? parentSub.category_id : categories[0]?.id || '');

    setPtFormData({
      id: pt.id,
      category_id: parentCatId,
      subcategory_id: pt.subcategory_id || pt.subcategoryId || '',
      name: pt.name || '',
      description: pt.description || pt.tagline || '',
      image: pt.image || pt.image_url || '',
      is_active: pt.is_active !== false && pt.enabled !== false,
      show_in_mobile_app: pt.show_in_mobile_app !== false
    });
    setFormErrors({});
    setModalMode('edit_product_type');
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalMode(null);
    setEditingItem(null);
    setFormErrors({});
  };

  // ── 7. FORM SUBMISSIONS ─────────────────────────────────────────────
  // A. Main Category Form Submit
  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const cleanName = categoryFormData.name.trim();

    if (!cleanName) {
      errors.name = 'Category Name is required.';
    } else if (cleanName.length < 2) {
      errors.name = 'Category Name must be at least 2 characters.';
    }

    // Check duplicate name
    const duplicateName = categories.find(c =>
      c.name.toLowerCase().trim() === cleanName.toLowerCase() &&
      c.id !== (editingItem ? editingItem.id : '')
    );
    if (duplicateName) {
      errors.name = `A category named "${cleanName}" already exists.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanSlug = generateSlug(cleanName);

    if (modalMode === 'add_category') {
      const maxOrder = categories.reduce((max, c) => Math.max(max, Number(c.display_order || c.sort_order || 0)), 0);
      const newOrder = maxOrder + 1;
      const newId = 'cat_' + cleanSlug.replace(/-/g, '_') + '_' + Date.now().toString(36);

      const newCat = {
        id: newId,
        name: cleanName,
        slug: cleanSlug,
        description: categoryFormData.description.trim(),
        image: categoryFormData.image || '',
        image_url: categoryFormData.image || '',
        color: categoryFormData.color || '#FCE4EC',
        icon: categoryFormData.icon || 'Sparkles',
        sort_order: newOrder,
        display_order: newOrder,
        enabled: categoryFormData.is_active,
        is_active: categoryFormData.is_active,
        show_in_mobile_app: categoryFormData.show_in_mobile_app,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedCats = [...categories, newCat];
      const success = await persistHierarchy(updatedCats, subcategories, productTypes);
      if (success) {
        showNotice(`Main Category "${cleanName}" created successfully!`);
        closeModal();
      }
    } else if (modalMode === 'edit_category' && editingItem) {
      const updatedCats = categories.map(c => {
        if (c.id === editingItem.id) {
          return {
            ...c,
            name: cleanName,
            slug: cleanSlug,
            description: categoryFormData.description.trim(),
            image: categoryFormData.image || '',
            image_url: categoryFormData.image || '',
            enabled: categoryFormData.is_active,
            is_active: categoryFormData.is_active,
            show_in_mobile_app: categoryFormData.show_in_mobile_app,
            updated_at: new Date().toISOString()
          };
        }
        return c;
      });

      const success = await persistHierarchy(updatedCats, subcategories, productTypes);
      if (success) {
        showNotice(`Main Category "${cleanName}" updated successfully!`);
        closeModal();
      }
    }
  };

  // B. Subcategory Form Submit
  const handleSubcategoryFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const cleanName = subFormData.name.trim();
    const parentId = subFormData.category_id;

    if (!parentId) {
      errors.category_id = 'Parent Main Category is required.';
    }

    if (!cleanName) {
      errors.name = 'Subcategory Name is required.';
    } else if (cleanName.length < 2) {
      errors.name = 'Subcategory Name must be at least 2 characters.';
    }

    // Check duplicate subcategory name under the same parent (Case-insensitive)
    const duplicateInParent = subcategories.find(s =>
      s.category_id === parentId &&
      s.name.toLowerCase().trim() === cleanName.toLowerCase() &&
      s.id !== (editingItem ? editingItem.id : '')
    );
    if (duplicateInParent) {
      const parentName = categories.find(c => c.id === parentId)?.name || 'this category';
      errors.name = `Subcategory "${cleanName}" already exists under ${parentName}.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanSlug = generateSlug(cleanName);

    if (modalMode === 'add_subcategory') {
      const parentCat = categories.find(c => c.id === parentId);
      const catSlug = parentCat ? generateSlug(parentCat.name) : 'cat';
      const newId = `sub_${catSlug}_${cleanSlug}`.replace(/_+/g, '_').slice(0, 50) + '_' + Date.now().toString(36);
      const parentSubs = subcategories.filter(s => s.category_id === parentId);
      const maxOrder = parentSubs.reduce((max, s) => Math.max(max, Number(s.display_order || s.sort_order || 0)), 0);

      const newSub = {
        id: newId,
        category_id: parentId,
        categoryId: parentId,
        name: cleanName,
        slug: cleanSlug,
        description: subFormData.description.trim(),
        tagline: subFormData.description.trim(),
        image: subFormData.image || '',
        image_url: subFormData.image || '',
        sort_order: maxOrder + 1,
        display_order: maxOrder + 1,
        enabled: subFormData.is_active,
        is_active: subFormData.is_active,
        show_in_mobile_app: subFormData.show_in_mobile_app,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedSubs = [...subcategories, newSub];
      const success = await persistHierarchy(categories, updatedSubs, productTypes);
      if (success) {
        showNotice(`Subcategory "${cleanName}" created successfully!`);
        closeModal();
      }
    } else if (modalMode === 'edit_subcategory' && editingItem) {
      const updatedSubs = subcategories.map(s => {
        if (s.id === editingItem.id) {
          return {
            ...s,
            category_id: parentId,
            categoryId: parentId,
            name: cleanName,
            slug: cleanSlug,
            description: subFormData.description.trim(),
            tagline: subFormData.description.trim(),
            image: subFormData.image || '',
            image_url: subFormData.image || '',
            enabled: subFormData.is_active,
            is_active: subFormData.is_active,
            show_in_mobile_app: subFormData.show_in_mobile_app,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });

      const success = await persistHierarchy(categories, updatedSubs, productTypes);
      if (success) {
        showNotice(`Subcategory "${cleanName}" updated successfully!`);
        closeModal();
      }
    }
  };

  // C. Select Category / Product Type Form Submit (Level 3)
  const handleProductTypeFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const cleanName = ptFormData.name.trim();
    const parentCatId = ptFormData.category_id;
    const parentSubId = ptFormData.subcategory_id;

    if (!parentCatId) {
      errors.category_id = 'Parent Main Category is required.';
    }

    if (!parentSubId) {
      errors.subcategory_id = 'Parent Sub Category is required.';
    }

    if (!cleanName) {
      errors.name = 'Select Category / Product Type Name is required.';
    } else if (cleanName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    // Check duplicate product type name under the same subcategory (Case-insensitive)
    const duplicateInSubcategory = productTypes.find(pt =>
      (pt.subcategory_id === parentSubId || pt.subcategoryId === parentSubId) &&
      pt.name.toLowerCase().trim() === cleanName.toLowerCase() &&
      pt.id !== (editingItem ? editingItem.id : '')
    );
    if (duplicateInSubcategory) {
      const subName = subcategories.find(s => s.id === parentSubId)?.name || 'this subcategory';
      errors.name = `Select Category "${cleanName}" already exists under ${subName}.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanSlug = generateSlug(cleanName);

    if (modalMode === 'add_product_type') {
      const newId = `pt_${cleanSlug}_` + Date.now().toString(36);
      const siblingPTs = productTypes.filter(p => (p.subcategory_id || p.subcategoryId) === parentSubId);
      const maxOrder = siblingPTs.reduce((max, p) => Math.max(max, Number(p.display_order || p.sort_order || 0)), 0);

      const newPT = {
        id: newId,
        category_id: parentCatId,
        categoryId: parentCatId,
        subcategory_id: parentSubId,
        subcategoryId: parentSubId,
        name: cleanName,
        slug: cleanSlug,
        description: ptFormData.description.trim(),
        tagline: ptFormData.description.trim(),
        image: ptFormData.image || '',
        image_url: ptFormData.image || '',
        sort_order: maxOrder + 1,
        display_order: maxOrder + 1,
        enabled: ptFormData.is_active,
        is_active: ptFormData.is_active,
        show_in_mobile_app: ptFormData.show_in_mobile_app,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedPTs = [...productTypes, newPT];
      const success = await persistHierarchy(categories, subcategories, updatedPTs);
      if (success) {
        showNotice(`Select Category "${cleanName}" created successfully!`);
        closeModal();
      }
    } else if (modalMode === 'edit_product_type' && editingItem) {
      const updatedPTs = productTypes.map(pt => {
        if (pt.id === editingItem.id) {
          return {
            ...pt,
            category_id: parentCatId,
            categoryId: parentCatId,
            subcategory_id: parentSubId,
            subcategoryId: parentSubId,
            name: cleanName,
            slug: cleanSlug,
            description: ptFormData.description.trim(),
            tagline: ptFormData.description.trim(),
            image: ptFormData.image || '',
            image_url: ptFormData.image || '',
            enabled: ptFormData.is_active,
            is_active: ptFormData.is_active,
            show_in_mobile_app: ptFormData.show_in_mobile_app,
            updated_at: new Date().toISOString()
          };
        }
        return pt;
      });

      const success = await persistHierarchy(categories, subcategories, updatedPTs);
      if (success) {
        showNotice(`Select Category "${cleanName}" updated successfully!`);
        closeModal();
      }
    }
  };

  // ── 8. TOGGLE CONTROLS ──────────────────────────────────────────────
  const handleToggleCategoryStatus = async (cat) => {
    const nextStatus = !cat.is_active;
    const updated = categories.map(c => {
      if (c.id === cat.id) {
        return { ...c, is_active: nextStatus, enabled: nextStatus, updated_at: new Date().toISOString() };
      }
      return c;
    });

    const success = await persistHierarchy(updated, subcategories, productTypes);
    if (success) {
      showNotice(`Category "${cat.name}" is now ${nextStatus ? 'Active' : 'Inactive'}.`);
    }
  };

  const handleToggleCategoryMobile = async (cat) => {
    const nextVal = !cat.show_in_mobile_app;
    const updated = categories.map(c => {
      if (c.id === cat.id) {
        return { ...c, show_in_mobile_app: nextVal, updated_at: new Date().toISOString() };
      }
      return c;
    });

    const success = await persistHierarchy(updated, subcategories, productTypes);
    if (success) {
      showNotice(`Mobile visibility for "${cat.name}" set to ${nextVal ? 'Yes' : 'No'}.`);
    }
  };

  const handleToggleSubcategoryStatus = async (sub) => {
    const nextStatus = !sub.is_active;
    const updated = subcategories.map(s => {
      if (s.id === sub.id) {
        return { ...s, is_active: nextStatus, enabled: nextStatus, updated_at: new Date().toISOString() };
      }
      return s;
    });

    const success = await persistHierarchy(categories, updated, productTypes);
    if (success) {
      showNotice(`Subcategory "${sub.name}" is now ${nextStatus ? 'Active' : 'Inactive'}.`);
    }
  };

  const handleToggleSubcategoryMobile = async (sub) => {
    const nextVal = !sub.show_in_mobile_app;
    const updated = subcategories.map(s => {
      if (s.id === sub.id) {
        return { ...s, show_in_mobile_app: nextVal, updated_at: new Date().toISOString() };
      }
      return s;
    });

    const success = await persistHierarchy(categories, updated, productTypes);
    if (success) {
      showNotice(`Mobile visibility for "${sub.name}" set to ${nextVal ? 'Yes' : 'No'}.`);
    }
  };

  const handleToggleProductTypeStatus = async (pt) => {
    const nextStatus = !pt.is_active;
    const updated = productTypes.map(p => {
      if (p.id === pt.id) {
        return { ...p, is_active: nextStatus, enabled: nextStatus, updated_at: new Date().toISOString() };
      }
      return p;
    });

    const success = await persistHierarchy(categories, subcategories, updated);
    if (success) {
      showNotice(`Select Category "${pt.name}" is now ${nextStatus ? 'Active' : 'Inactive'}.`);
    }
  };

  const handleToggleProductTypeMobile = async (pt) => {
    const nextVal = !pt.show_in_mobile_app;
    const updated = productTypes.map(p => {
      if (p.id === pt.id) {
        return { ...p, show_in_mobile_app: nextVal, updated_at: new Date().toISOString() };
      }
      return p;
    });

    const success = await persistHierarchy(categories, subcategories, updated);
    if (success) {
      showNotice(`Mobile visibility for "${pt.name}" set to ${nextVal ? 'Yes' : 'No'}.`);
    }
  };

  // ── 9. SAFE DELETE CHECKS & EXECUTION ───────────────────────────────
  const initiateCategoryDelete = async (cat) => {
    setDeleteModal({
      isOpen: true,
      type: 'category',
      item: cat,
      isChecking: true,
      hasRelations: false,
      childCount: 0,
      productsCount: 0,
      isDeleting: false
    });

    try {
      const childSubs = subcategories.filter(s => s.category_id === cat.id);
      const { data: prods } = await supabase
        .from('products')
        .select('id')
        .or(`category.eq."${cat.name}",category.eq."${cat.id}"`);

      const childCount = childSubs.length;
      const productsCount = prods?.length || 0;
      const hasRelations = childCount > 0 || productsCount > 0;

      setDeleteModal(prev => ({
        ...prev,
        isChecking: false,
        hasRelations,
        childCount,
        productsCount
      }));
    } catch (err) {
      console.error('Error checking category delete safety:', err);
      setDeleteModal(prev => ({ ...prev, isChecking: false, hasRelations: true }));
    }
  };

  const initiateSubcategoryDelete = async (sub) => {
    setDeleteModal({
      isOpen: true,
      type: 'subcategory',
      item: sub,
      isChecking: true,
      hasRelations: false,
      childCount: 0,
      productsCount: 0,
      isDeleting: false
    });

    try {
      const childPTs = productTypes.filter(pt => (pt.subcategory_id || pt.subcategoryId) === sub.id);
      const { data: prods } = await supabase.from('products').select('id, additional_info');
      let matchingProds = 0;
      (prods || []).forEach(p => {
        const subName = p.additional_info?.subcategory || '';
        if (subName.toLowerCase().trim() === sub.name.toLowerCase().trim()) {
          matchingProds++;
        }
      });

      const childCount = childPTs.length;
      const hasRelations = childCount > 0 || matchingProds > 0;

      setDeleteModal(prev => ({
        ...prev,
        isChecking: false,
        hasRelations,
        childCount,
        productsCount: matchingProds
      }));
    } catch (err) {
      console.error('Error checking subcategory delete safety:', err);
      setDeleteModal(prev => ({ ...prev, isChecking: false, hasRelations: true }));
    }
  };

  const initiateProductTypeDelete = async (pt) => {
    setDeleteModal({
      isOpen: true,
      type: 'product_type',
      item: pt,
      isChecking: true,
      hasRelations: false,
      childCount: 0,
      productsCount: 0,
      isDeleting: false
    });

    try {
      const { data: prods } = await supabase.from('products').select('id, product_type, additional_info');
      let matchingProds = 0;

      (prods || []).forEach(p => {
        const directType = (p.product_type || '').toLowerCase().trim();
        const infoType = (p.additional_info?.product_type || p.additional_info?.selectCategory || p.additional_info?.productType || '').toLowerCase().trim();
        const ptNameLower = (pt.name || '').toLowerCase().trim();
        const ptSlugLower = (pt.slug || '').toLowerCase().trim();

        if (directType === ptNameLower || directType === ptSlugLower || infoType === ptNameLower || infoType === ptSlugLower) {
          matchingProds++;
        }
      });

      const hasRelations = matchingProds > 0;

      setDeleteModal(prev => ({
        ...prev,
        isChecking: false,
        hasRelations,
        childCount: 0,
        productsCount: matchingProds
      }));
    } catch (err) {
      console.error('Error checking product type delete safety:', err);
      setDeleteModal(prev => ({ ...prev, isChecking: false, hasRelations: true }));
    }
  };

  // Safe Deactivate
  const handleConfirmDeactivate = async () => {
    if (!deleteModal.item) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    if (deleteModal.type === 'category') {
      const updatedCats = categories.map(c =>
        c.id === deleteModal.item.id ? { ...c, is_active: false, enabled: false, updated_at: new Date().toISOString() } : c
      );
      await persistHierarchy(updatedCats, subcategories, productTypes);
      showNotice(`Main Category "${deleteModal.item.name}" deactivated safely. All products & relations preserved!`);
    } else if (deleteModal.type === 'subcategory') {
      const updatedSubs = subcategories.map(s =>
        s.id === deleteModal.item.id ? { ...s, is_active: false, enabled: false, updated_at: new Date().toISOString() } : s
      );
      await persistHierarchy(categories, updatedSubs, productTypes);
      showNotice(`Subcategory "${deleteModal.item.name}" deactivated safely. All products & relations preserved!`);
    } else {
      const updatedPTs = productTypes.map(p =>
        p.id === deleteModal.item.id ? { ...p, is_active: false, enabled: false, updated_at: new Date().toISOString() } : p
      );
      await persistHierarchy(categories, subcategories, updatedPTs);
      showNotice(`Select Category "${deleteModal.item.name}" deactivated safely. All products & relations preserved!`);
    }

    setDeleteModal({ isOpen: false, type: 'category', item: null, isChecking: false, hasRelations: false, childCount: 0, productsCount: 0, isDeleting: false });
  };

  // Hard Delete
  const handleConfirmHardDelete = async () => {
    if (!deleteModal.item || deleteModal.hasRelations) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const client = supabaseAdmin || supabase;
      if (deleteModal.type === 'category') {
        await client.from('categories').delete().eq('id', deleteModal.item.id);
        const updatedCats = categories.filter(c => c.id !== deleteModal.item.id);
        await persistHierarchy(updatedCats, subcategories, productTypes);
        showNotice(`Main Category "${deleteModal.item.name}" permanently deleted.`);
      } else if (deleteModal.type === 'subcategory') {
        await client.from('subcategories').delete().eq('id', deleteModal.item.id);
        const updatedSubs = subcategories.filter(s => s.id !== deleteModal.item.id);
        await persistHierarchy(categories, updatedSubs, productTypes);
        showNotice(`Subcategory "${deleteModal.item.name}" permanently deleted.`);
      } else {
        const updatedPTs = productTypes.filter(p => p.id !== deleteModal.item.id);
        try {
          await client.from('product_types').delete().eq('id', deleteModal.item.id);
        } catch (_) {}
        await persistHierarchy(categories, subcategories, updatedPTs);
        showNotice(`Select Category "${deleteModal.item.name}" permanently deleted.`);
      }

      setDeleteModal({ isOpen: false, type: 'category', item: null, isChecking: false, hasRelations: false, childCount: 0, productsCount: 0, isDeleting: false });
    } catch (err) {
      console.error('Failed to execute hard delete:', err);
      showNotice('Failed to delete item from database.', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // ── 10. FILTERED LISTS ──────────────────────────────────────────────
  // A. Filtered Main Categories
  const filteredAndSortedCategories = useMemo(() => {
    let result = [...categories];

    const q = catSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    }

    if (catStatusFilter === 'active') {
      result = result.filter(c => c.is_active);
    } else if (catStatusFilter === 'inactive') {
      result = result.filter(c => !c.is_active);
    }

    if (catMobileFilter === 'visible') {
      result = result.filter(c => c.show_in_mobile_app);
    } else if (catMobileFilter === 'hidden') {
      result = result.filter(c => !c.show_in_mobile_app);
    }

    return result;
  }, [categories, catSearch, catStatusFilter, catMobileFilter]);

  // B. Filtered Subcategories (under selected category)
  const filteredAndSortedSubcategories = useMemo(() => {
    if (!selectedCategory) return [];

    let result = subcategories.filter(s => s.category_id === selectedCategory.id);

    const q = subSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }

    if (subStatusFilter === 'active') {
      result = result.filter(s => s.is_active);
    } else if (subStatusFilter === 'inactive') {
      result = result.filter(s => !s.is_active);
    }

    if (subMobileFilter === 'visible') {
      result = result.filter(s => s.show_in_mobile_app);
    } else if (subMobileFilter === 'hidden') {
      result = result.filter(s => !s.show_in_mobile_app);
    }

    return result;
  }, [subcategories, selectedCategory, subSearch, subStatusFilter, subMobileFilter]);

  // C. Filtered Select Categories / Product Types (under selected subcategory)
  const filteredAndSortedProductTypes = useMemo(() => {
    if (!selectedSubcategory) return [];

    let result = productTypes.filter(pt =>
      (pt.subcategory_id || pt.subcategoryId) === selectedSubcategory.id
    );

    const q = ptSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(pt =>
        (pt.name || '').toLowerCase().includes(q) ||
        (pt.description || '').toLowerCase().includes(q)
      );
    }

    if (ptStatusFilter === 'active') {
      result = result.filter(pt => pt.is_active);
    } else if (ptStatusFilter === 'inactive') {
      result = result.filter(pt => !pt.is_active);
    }

    if (ptMobileFilter === 'visible') {
      result = result.filter(pt => pt.show_in_mobile_app);
    } else if (ptMobileFilter === 'hidden') {
      result = result.filter(pt => !pt.show_in_mobile_app);
    }

    return result;
  }, [productTypes, selectedSubcategory, ptSearch, ptStatusFilter, ptMobileFilter]);

  // Dependent subcategories options for Select Category modal
  const dependentSubcategoryOptions = useMemo(() => {
    if (!ptFormData.category_id) return [];
    return subcategories.filter(s => s.category_id === ptFormData.category_id);
  }, [subcategories, ptFormData.category_id]);

  // Statistics
  const hierarchyStats = useMemo(() => {
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.is_active).length,
      totalSubcategories: subcategories.length,
      activeSubcategories: subcategories.filter(s => s.is_active).length,
      totalProductTypes: productTypes.length,
      activeProductTypes: productTypes.filter(p => p.is_active).length
    };
  }, [categories, subcategories, productTypes]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-[1600px] mx-auto">
      {/* Toast Notice */}
      {notice && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-fade-in transition-all ${
            notice.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} className="text-emerald-600" />}
            <span className="text-sm">{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="cursor-pointer p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-black/5"
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── BREADCRUMB TRAIL ─────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-gray-500 bg-white p-3.5 px-5 rounded-2xl border border-pink-100 shadow-2xs">
        <button
          type="button"
          onClick={handleBackToCategories}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            currentView === 'categories' ? 'text-[#C2477A] font-extrabold' : 'text-gray-600 hover:text-[#C2477A]'
          }`}
        >
          <FolderPlus size={14} className="text-[#C2477A]" />
          <span>Categories</span>
        </button>

        {selectedCategory && (
          <>
            <ChevronRight size={14} className="text-gray-300" />
            <button
              type="button"
              onClick={handleBackToSubcategories}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'subcategories' ? 'text-[#C2477A] font-extrabold' : 'text-gray-600 hover:text-[#C2477A]'
              }`}
            >
              <span className="px-2 py-0.5 rounded-md bg-[#FFF5F8] text-[#C2477A] border border-pink-100 text-[10px] uppercase font-bold">
                Main
              </span>
              <span>{selectedCategory.name}</span>
            </button>
          </>
        )}

        {selectedSubcategory && currentView === 'product_types' && (
          <>
            <ChevronRight size={14} className="text-gray-300" />
            <div className="flex items-center gap-1.5 text-gray-900 font-extrabold">
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[10px] uppercase font-bold">
                Sub
              </span>
              <span>{selectedSubcategory.name}</span>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-[#C2477A] font-extrabold">Select Category / Product Type</span>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: MAIN CATEGORIES MANAGEMENT                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {currentView === 'categories' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-pink-100/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#C2477A] uppercase tracking-wider mb-1">
                <FolderPlus size={16} />
                <span>Level 1 • Master Hierarchy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Categories</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Manage your product category structure. Drag rows (⋮⋮) to reorder directly.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="hidden lg:flex items-center gap-2 bg-[#FFF5F8] px-4 py-2.5 rounded-xl border border-pink-100">
                <span className="text-xs font-extrabold text-[#C2477A]">{hierarchyStats.totalCategories} Main Categories</span>
                <span className="text-pink-300">•</span>
                <span className="text-xs font-bold text-gray-700">{hierarchyStats.totalSubcategories} Subcategories</span>
                <span className="text-pink-300">•</span>
                <span className="text-xs font-bold text-purple-700">{hierarchyStats.totalProductTypes} Select Categories</span>
              </div>

              <button
                type="button"
                onClick={() => setIsWipeModalOpen(true)}
                title="Completely remove all images from the database and reset to clean state"
                className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] w-full sm:w-auto shrink-0"
              >
                <Trash2 size={16} className="text-rose-600" />
                <span>Remove All Images</span>
              </button>

              <button
                type="button"
                onClick={openAddCategoryModal}
                className="bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] w-full sm:w-auto shrink-0"
              >
                <PlusCircle size={17} />
                <span>+ Add Main Category</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-2.5 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100 flex-1 min-w-[260px]">
              <Search size={16} className="text-[#C2477A] shrink-0" />
              <input
                type="text"
                placeholder="Search main categories by name..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="bg-transparent text-xs sm:text-sm outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
              />
              {catSearch && (
                <button type="button" onClick={() => setCatSearch('')} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <select
                  value={catStatusFilter}
                  onChange={(e) => setCatStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Mobile App:</span>
                <select
                  value={catMobileFilter}
                  onChange={(e) => setCatMobileFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories Table View: Clean Table without Slug, Display Order, Created At */}
          {isLoading ? (
            <div className="bg-white p-16 rounded-2xl border border-pink-100 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-[#C2477A]" />
              <p className="text-sm font-bold text-gray-700">Loading categories from Supabase...</p>
            </div>
          ) : filteredAndSortedCategories.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-pink-100 text-center space-y-3">
              <FolderPlus size={36} className="text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-base">
                {catSearch ? 'No matching categories found' : 'No categories found'}
              </h3>
              <p className="text-gray-400 text-xs">
                {catSearch ? `No records match "${catSearch}".` : 'Get started by creating your first category.'}
              </p>
              {catSearch && (
                <button
                  type="button"
                  onClick={() => setCatSearch('')}
                  className="px-4 py-2 rounded-xl border border-pink-200 text-[#C2477A] text-xs font-bold cursor-pointer hover:bg-pink-50"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-pink-100/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-pink-100 bg-[#FFF5F8] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                      <th className="py-4 px-4 w-16 text-center">#</th>
                      <th className="py-4 px-4 min-w-[260px]">Category Name</th>
                      <th className="py-4 px-4 text-center w-48">Subcategories</th>
                      <th className="py-4 px-4 text-center w-32">Mobile App</th>
                      <th className="py-4 px-4 text-center w-32">Status</th>
                      <th className="py-4 px-4 text-right w-64">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100/60 text-xs">
                    {filteredAndSortedCategories.map((cat, idx) => {
                      const childSubs = subcategories.filter(s => s.category_id === cat.id);
                      const isDragged = dragItemIndex === idx;
                      const isDragOver = dragOverIndex === idx;

                      return (
                        <tr
                          key={cat.id}
                          draggable
                          onDragStart={() => handleCategoryDragStart(idx)}
                          onDragEnter={() => handleCategoryDragEnter(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleCategoryDrop(idx)}
                          className={`transition-all group ${
                            isDragged ? 'opacity-40 bg-pink-50' : isDragOver ? 'bg-pink-100/50' : 'hover:bg-[#FFF9FB]'
                          }`}
                        >
                          {/* # and Drag Handle */}
                          <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                            <div className="flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#C2477A]">
                              <GripVertical size={15} className="shrink-0" title="Drag to reorder" />
                              <span className="text-xs">{idx + 1}</span>
                            </div>
                          </td>

                          {/* Category Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-[#FFF5F8] border border-pink-100 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-pink-300 transition-colors">
                                {cat.image ? (
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon size={18} className="text-[#C2477A]" />
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-gray-900 block leading-tight">
                                  {cat.name}
                                </span>
                                {cat.description && (
                                  <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                                    {cat.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Subcategories Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF5F8] text-[#C2477A] border border-pink-200">
                              <Layers size={12} className="text-[#C2477A]" />
                              <span>{childSubs.length} Subcategories</span>
                            </span>
                          </td>

                          {/* Mobile App */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryMobile(cat)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                cat.show_in_mobile_app
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cat.show_in_mobile_app ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{cat.show_in_mobile_app ? 'Yes' : 'No'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryStatus(cat)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                cat.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{cat.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions: Show Subcategories → | Edit | Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenCategorySubcategories(cat)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#FFF5F8] hover:bg-[#C2477A] text-[#C2477A] hover:text-white border border-pink-200 font-extrabold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5 group/btn"
                                title={`Show Subcategories for ${cat.name}`}
                              >
                                <span>Show Subcategories</span>
                                <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditCategoryModal(cat)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-[#C2477A] hover:text-[#C2477A] text-gray-600 transition-colors cursor-pointer bg-white shadow-2xs"
                                title="Edit Category"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => initiateCategoryDelete(cat)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-rose-300 hover:text-rose-600 text-gray-600 transition-colors cursor-pointer bg-white shadow-2xs"
                                title="Delete Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: SUBCATEGORIES MANAGEMENT (UNDER SELECTED CATEGORY)       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {currentView === 'subcategories' && selectedCategory && (
        <div className="space-y-6">
          {/* Parent Context Banner */}
          <div className="bg-gradient-to-r from-[#FFF5F8] to-white p-6 sm:p-7 rounded-2xl border border-pink-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="p-2.5 rounded-xl border border-pink-200 bg-white text-[#C2477A] hover:bg-[#FFF5F8] transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Back to Main Categories"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white border border-pink-200/80 p-1 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {selectedCategory.image ? (
                  <img src={selectedCategory.image} alt={selectedCategory.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <FolderPlus size={26} className="text-[#C2477A]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-100 text-[#C2477A]">
                    Parent Main Category
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    selectedCategory.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {selectedCategory.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                  {selectedCategory.name}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Subcategory Management • {filteredAndSortedSubcategories.length} subcategories configured under {selectedCategory.name}. Drag (⋮⋮) to reorder.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => openAddSubcategoryModal(selectedCategory)}
                className="bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] w-full md:w-auto shrink-0"
              >
                <PlusCircle size={17} />
                <span>+ Add Sub Category</span>
              </button>
            </div>
          </div>

          {/* Subcategories Search & Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-2.5 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100 flex-1 min-w-[260px]">
              <Search size={16} className="text-[#C2477A] shrink-0" />
              <input
                type="text"
                placeholder={`Search subcategories in ${selectedCategory.name}...`}
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="bg-transparent text-xs sm:text-sm outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
              />
              {subSearch && (
                <button type="button" onClick={() => setSubSearch('')} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <select
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Mobile App:</span>
                <select
                  value={subMobileFilter}
                  onChange={(e) => setSubMobileFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subcategories Table: # | SUB CATEGORY | MAIN CATEGORY | SELECT CATEGORIES | MOBILE APP | STATUS | ACTIONS */}
          {filteredAndSortedSubcategories.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-pink-100 text-center space-y-3">
              <Layers size={36} className="text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-base">
                {subSearch ? 'No matching subcategories found' : 'No subcategories found'}
              </h3>
              <p className="text-gray-400 text-xs">
                {subSearch
                  ? `No subcategories matching "${subSearch}" under ${selectedCategory.name}.`
                  : `Get started by adding your first subcategory under ${selectedCategory.name}.`}
              </p>
              {subSearch ? (
                <button
                  type="button"
                  onClick={() => setSubSearch('')}
                  className="px-4 py-2 rounded-xl border border-pink-200 text-[#C2477A] text-xs font-bold cursor-pointer hover:bg-pink-50"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddSubcategoryModal(selectedCategory)}
                  className="px-4 py-2.5 rounded-xl bg-[#C2477A] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <PlusCircle size={14} />
                  <span>+ Add Sub Category</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-pink-100/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-pink-100 bg-[#FFF5F8] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                      <th className="py-4 px-4 w-16 text-center">#</th>
                      <th className="py-4 px-4 min-w-[220px]">Sub Category</th>
                      <th className="py-4 px-4 min-w-[150px]">Main Category</th>
                      <th className="py-4 px-4 text-center w-48">Select Categories</th>
                      <th className="py-4 px-4 text-center w-32">Mobile App</th>
                      <th className="py-4 px-4 text-center w-32">Status</th>
                      <th className="py-4 px-4 text-right w-64">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100/60 text-xs">
                    {filteredAndSortedSubcategories.map((sub, idx) => {
                      const childPTs = productTypes.filter(pt => (pt.subcategory_id || pt.subcategoryId) === sub.id);
                      const isDragged = dragItemIndex === idx;
                      const isDragOver = dragOverIndex === idx;

                      return (
                        <tr
                          key={sub.id}
                          draggable
                          onDragStart={() => handleSubcategoryDragStart(idx)}
                          onDragEnter={() => handleSubcategoryDragEnter(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleSubcategoryDrop(idx)}
                          className={`transition-all group ${
                            isDragged ? 'opacity-40 bg-pink-50' : isDragOver ? 'bg-pink-100/50' : 'hover:bg-[#FFF9FB]'
                          }`}
                        >
                          {/* # and Drag Handle */}
                          <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                            <div className="flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#C2477A]">
                              <GripVertical size={15} className="shrink-0" title="Drag to reorder" />
                              <span className="text-xs">{idx + 1}</span>
                            </div>
                          </td>

                          {/* Sub Category Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#FFF5F8] border border-pink-100 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-pink-300 transition-colors">
                                {sub.image ? (
                                  <img
                                    src={sub.image}
                                    alt={sub.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Layers size={16} className="text-[#C2477A]" />
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-gray-900 block leading-tight">
                                  {sub.name}
                                </span>
                                {sub.description && (
                                  <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                                    {sub.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Main Category */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFF5F8] text-[#C2477A] border border-pink-100">
                              {selectedCategory.name}
                            </span>
                          </td>

                          {/* Select Categories Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                              <Tag size={12} className="text-purple-600" />
                              <span>{childPTs.length} Select Categories</span>
                            </span>
                          </td>

                          {/* Mobile App */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSubcategoryMobile(sub)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                sub.show_in_mobile_app
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sub.show_in_mobile_app ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{sub.show_in_mobile_app ? 'Yes' : 'No'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSubcategoryStatus(sub)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                sub.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sub.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{sub.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions: Show Select Categories → | Edit | Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenSubcategoryProductTypes(sub)}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 font-extrabold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5 group/btn"
                                title={`Show Select Categories for ${sub.name}`}
                              >
                                <span>Show Select Categories</span>
                                <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditSubcategoryModal(sub)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-[#C2477A] hover:text-[#C2477A] text-gray-600 transition-colors cursor-pointer bg-white shadow-2xs"
                                title="Edit Subcategory"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => initiateSubcategoryDelete(sub)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-rose-300 hover:text-rose-600 text-gray-600 transition-colors cursor-pointer bg-white shadow-2xs"
                                title="Delete Subcategory"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: SELECT CATEGORY / PRODUCT TYPE MANAGEMENT (LEVEL 3)     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {currentView === 'product_types' && selectedSubcategory && (
        <div className="space-y-6">
          {/* Parent Context Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-[#FFF5F8] to-white p-6 sm:p-7 rounded-2xl border border-purple-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBackToSubcategories}
                className="p-2.5 rounded-xl border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Back to Subcategories"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white border border-purple-200/80 p-1 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {selectedSubcategory.image ? (
                  <img src={selectedSubcategory.image} alt={selectedSubcategory.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Tag size={26} className="text-purple-600" />
                )}
              </div>

              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-100 text-[#C2477A]">
                    {selectedCategory?.name || 'Main Category'}
                  </span>
                  <span className="text-gray-300">→</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">
                    Sub Category: {selectedSubcategory.name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    selectedSubcategory.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {selectedSubcategory.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                  Select Category / Product Type
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Level 3 Hierarchy • {filteredAndSortedProductTypes.length} items under {selectedCategory?.name} → {selectedSubcategory.name}. Drag (⋮⋮) to reorder.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => openAddProductTypeModal(selectedCategory, selectedSubcategory)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] w-full md:w-auto shrink-0"
              >
                <PlusCircle size={17} />
                <span>+ Add Select Category</span>
              </button>
            </div>
          </div>

          {/* Product Types Search & Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-2.5 bg-purple-50/50 px-3.5 py-2.5 rounded-xl border border-purple-100 flex-1 min-w-[260px]">
              <Search size={16} className="text-purple-600 shrink-0" />
              <input
                type="text"
                placeholder={`Search select categories in ${selectedSubcategory.name}...`}
                value={ptSearch}
                onChange={(e) => setPtSearch(e.target.value)}
                className="bg-transparent text-xs sm:text-sm outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
              />
              {ptSearch && (
                <button type="button" onClick={() => setPtSearch('')} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <select
                  value={ptStatusFilter}
                  onChange={(e) => setPtStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-50/50 border border-purple-100 text-purple-700 outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Mobile App:</span>
                <select
                  value={ptMobileFilter}
                  onChange={(e) => setPtMobileFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-50/50 border border-purple-100 text-purple-700 outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Select Category Table: # | PRODUCT TYPE | SUB CATEGORY | MAIN CATEGORY | MOBILE APP | STATUS | ACTIONS */}
          {filteredAndSortedProductTypes.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-purple-100 text-center space-y-3">
              <Tag size={36} className="text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-base">
                {ptSearch ? 'No matching select categories found' : 'No select categories found'}
              </h3>
              <p className="text-gray-400 text-xs">
                {ptSearch
                  ? `No items matching "${ptSearch}" under ${selectedSubcategory.name}.`
                  : `Get started by adding your first select category under ${selectedSubcategory.name}.`}
              </p>
              {ptSearch ? (
                <button
                  type="button"
                  onClick={() => setPtSearch('')}
                  className="px-4 py-2 rounded-xl border border-purple-200 text-purple-700 text-xs font-bold cursor-pointer hover:bg-purple-50"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAddProductTypeModal(selectedCategory, selectedSubcategory)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <PlusCircle size={14} />
                  <span>+ Add Select Category</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/60 text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                      <th className="py-4 px-4 w-16 text-center">#</th>
                      <th className="py-4 px-4 min-w-[220px]">Select Category / Product Type</th>
                      <th className="py-4 px-4 min-w-[150px]">Sub Category</th>
                      <th className="py-4 px-4 min-w-[150px]">Main Category</th>
                      <th className="py-4 px-4 text-center w-32">Mobile App</th>
                      <th className="py-4 px-4 text-center w-32">Status</th>
                      <th className="py-4 px-4 text-right w-44">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/50 text-xs">
                    {filteredAndSortedProductTypes.map((pt, idx) => {
                      const isDragged = dragItemIndex === idx;
                      const isDragOver = dragOverIndex === idx;

                      return (
                        <tr
                          key={pt.id}
                          draggable
                          onDragStart={() => handleProductTypeDragStart(idx)}
                          onDragEnter={() => handleProductTypeDragEnter(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleProductTypeDrop(idx)}
                          className={`transition-all group ${
                            isDragged ? 'opacity-40 bg-purple-50' : isDragOver ? 'bg-purple-100/50' : 'hover:bg-purple-50/30'
                          }`}
                        >
                          {/* # and Drag Handle */}
                          <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                            <div className="flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600">
                              <GripVertical size={15} className="shrink-0" title="Drag to reorder" />
                              <span className="text-xs">{idx + 1}</span>
                            </div>
                          </td>

                          {/* Product Type Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-purple-300 transition-colors">
                                {pt.image ? (
                                  <img
                                    src={pt.image}
                                    alt={pt.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Tag size={16} className="text-purple-600" />
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-sm text-gray-900 block leading-tight">
                                  {pt.name}
                                </span>
                                {pt.description && (
                                  <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                                    {pt.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sub Category */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                              {selectedSubcategory.name}
                            </span>
                          </td>

                          {/* Main Category */}
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFF5F8] text-[#C2477A] border border-pink-100">
                              {selectedCategory?.name || 'Main Category'}
                            </span>
                          </td>

                          {/* Mobile App */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleProductTypeMobile(pt)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                pt.show_in_mobile_app
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${pt.show_in_mobile_app ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span>{pt.show_in_mobile_app ? 'Yes' : 'No'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleProductTypeStatus(pt)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer transition-colors shadow-2xs ${
                                pt.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${pt.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{pt.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions: View / Edit | Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditProductTypeModal(pt)}
                                className="px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-700 font-extrabold text-xs transition-colors cursor-pointer bg-white shadow-2xs inline-flex items-center gap-1"
                                title="View & Edit Select Category"
                              >
                                <Edit2 size={13} />
                                <span>View / Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => initiateProductTypeDelete(pt)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-rose-300 hover:text-rose-600 text-gray-600 transition-colors cursor-pointer bg-white shadow-2xs"
                                title="Delete Select Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 11. ADD / EDIT MAIN CATEGORY MODAL (INTEGRATED IMAGE SECTION)    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modalMode === 'add_category' || modalMode === 'edit_category') && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              closeModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky with prominent Close (✕) button */}
            <div className="p-4 sm:p-5 sm:px-6 bg-gradient-to-r from-[#FFF5F8] via-[#FFF9FB] to-white border-b border-pink-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <FolderPlus size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {modalMode === 'add_category' ? 'Add Main Category' : `Edit Category: ${editingItem?.name}`}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                    Parent Level 1 category in the product catalog
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-pink-200/90 hover:border-rose-300 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ml-3 group focus:outline-none focus:ring-2 focus:ring-rose-200"
                aria-label="Close modal"
                title="Close (✕)"
              >
                <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Scrollable Form Body with Sticky Footer */}
            <form onSubmit={handleCategoryFormSubmit} className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              <div className="p-5 sm:p-7 space-y-5 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Category Name <span className="text-rose-500">*</span></span>
                    {formErrors.name && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.name}</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makeup, Skincare, Hair Care"
                    value={categoryFormData.name}
                    onChange={(e) => {
                      setCategoryFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 text-sm font-medium outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Enter a clean, descriptive summary of products in this category..."
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 outline-none text-xs sm:text-sm font-medium transition-all resize-none"
                  />
                </div>

                {/* Mobile App & Status Switches */}
                <div className="bg-[#FFF9FB] p-3.5 rounded-xl border border-pink-100/80 flex items-center justify-around">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-xs font-bold text-gray-700">Show in Mobile App</span>
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, show_in_mobile_app: !prev.show_in_mobile_app }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        categoryFormData.show_in_mobile_app ? 'bg-[#C2477A]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        categoryFormData.show_in_mobile_app ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${categoryFormData.show_in_mobile_app ? 'text-[#C2477A]' : 'text-gray-400'}`}>
                      {categoryFormData.show_in_mobile_app ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-center border-l border-pink-200/60 pl-6">
                    <span className="text-xs font-bold text-gray-700">Active Status</span>
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        categoryFormData.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        categoryFormData.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${categoryFormData.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {categoryFormData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Integrated Image Management: Preview + Google Search + Drag & Drop Upload */}
                <InlineImageSection
                  imageUrl={categoryFormData.image}
                  onChange={(newUrl) => setCategoryFormData(prev => ({ ...prev, image: newUrl }))}
                  entityName={categoryFormData.name || 'Category'}
                  entityType="Main Category"
                  folder="categories"
                  filenamePrefix="cat"
                />
              </div>

              {/* Sticky Footer */}
              <div className="p-4 sm:p-5 bg-gray-50/95 backdrop-blur-xs border-t border-pink-100 flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{modalMode === 'add_category' ? 'Create Main Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 12. ADD / EDIT SUBCATEGORY MODAL (INTEGRATED IMAGE SECTION)      */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modalMode === 'add_subcategory' || modalMode === 'edit_subcategory') && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              closeModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky with prominent Close (✕) button */}
            <div className="p-4 sm:p-5 sm:px-6 bg-gradient-to-r from-[#FFF5F8] via-[#FFF9FB] to-white border-b border-pink-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#C2477A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Layers size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {modalMode === 'add_subcategory' ? 'Add Sub Category' : `Edit Subcategory: ${editingItem?.name}`}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                    Subcategory Level 2 attached to a Main Category
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-pink-200/90 hover:border-rose-300 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ml-3 group focus:outline-none focus:ring-2 focus:ring-rose-200"
                aria-label="Close modal"
                title="Close (✕)"
              >
                <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Scrollable Form Body with Sticky Footer */}
            <form onSubmit={handleSubcategoryFormSubmit} className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              <div className="p-5 sm:p-7 space-y-5 flex-1">
                {/* Parent Main Category Selection (Required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Parent Main Category <span className="text-rose-500">*</span></span>
                    {formErrors.category_id && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.category_id}</span>}
                  </label>
                  <select
                    required
                    value={subFormData.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setSubFormData(prev => ({ ...prev, category_id: newCatId }));
                      if (formErrors.category_id) setFormErrors(prev => ({ ...prev, category_id: null }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 text-sm font-bold text-gray-800 bg-[#FFF5F8]/50 outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Parent Main Category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.is_active ? '' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Sub Category Name <span className="text-rose-500">*</span></span>
                    {formErrors.name && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.name}</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lip Makeup, Face Cleansers"
                    value={subFormData.name}
                    onChange={(e) => {
                      setSubFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 text-sm font-medium outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Enter a descriptive summary for this subcategory..."
                    value={subFormData.description}
                    onChange={(e) => setSubFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 outline-none text-xs sm:text-sm font-medium transition-all resize-none"
                  />
                </div>

                {/* Mobile App & Status Switches */}
                <div className="bg-[#FFF9FB] p-3.5 rounded-xl border border-pink-100/80 flex items-center justify-around">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-xs font-bold text-gray-700">Show in Mobile App</span>
                    <button
                      type="button"
                      onClick={() => setSubFormData(prev => ({ ...prev, show_in_mobile_app: !prev.show_in_mobile_app }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        subFormData.show_in_mobile_app ? 'bg-[#C2477A]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        subFormData.show_in_mobile_app ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${subFormData.show_in_mobile_app ? 'text-[#C2477A]' : 'text-gray-400'}`}>
                      {subFormData.show_in_mobile_app ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-center border-l border-pink-200/60 pl-6">
                    <span className="text-xs font-bold text-gray-700">Active Status</span>
                    <button
                      type="button"
                      onClick={() => setSubFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        subFormData.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        subFormData.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${subFormData.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {subFormData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Integrated Image Management: Preview + Google Search + Drag & Drop Upload */}
                <InlineImageSection
                  imageUrl={subFormData.image}
                  onChange={(newUrl) => setSubFormData(prev => ({ ...prev, image: newUrl }))}
                  entityName={subFormData.name || 'Subcategory'}
                  entityType="Sub Category"
                  folder="subcategories"
                  filenamePrefix="sub"
                />
              </div>

              {/* Sticky Footer */}
              <div className="p-4 sm:p-5 bg-gray-50/95 backdrop-blur-xs border-t border-pink-100 flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{modalMode === 'add_subcategory' ? 'Create Sub Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 13. ADD / EDIT SELECT CATEGORY MODAL (INTEGRATED IMAGE SECTION)  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {(modalMode === 'add_product_type' || modalMode === 'edit_product_type') && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              closeModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl border border-purple-100 shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky with prominent Close (✕) button */}
            <div className="p-4 sm:p-5 sm:px-6 bg-gradient-to-r from-purple-50 via-[#FAF5FF] to-white border-b border-purple-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Tag size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {modalMode === 'add_product_type' ? 'Add Select Category' : `Edit Select Category: ${editingItem?.name}`}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                    Level 3 Catalog: Select Category / Product Type
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-purple-200/90 hover:border-rose-300 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ml-3 group focus:outline-none focus:ring-2 focus:ring-rose-200"
                aria-label="Close modal"
                title="Close (✕)"
              >
                <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Scrollable Form Body with Sticky Footer */}
            <form onSubmit={handleProductTypeFormSubmit} className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
              <div className="p-5 sm:p-7 space-y-5 flex-1">
                {/* Hierarchical Dependent Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Parent Main Category Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>Main Category <span className="text-rose-500">*</span></span>
                      {formErrors.category_id && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.category_id}</span>}
                    </label>
                    <select
                      required
                      value={ptFormData.category_id}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const validSubs = subcategories.filter(s => s.category_id === newCatId);
                        const defaultSubId = validSubs[0] ? validSubs[0].id : '';

                        setPtFormData(prev => ({
                          ...prev,
                          category_id: newCatId,
                          subcategory_id: defaultSubId
                        }));
                        if (formErrors.category_id) setFormErrors(prev => ({ ...prev, category_id: null }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-bold text-gray-800 bg-purple-50/40 outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select Main Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.is_active ? '' : '(Inactive)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Parent Sub Category (Dependent Dropdown!) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>Sub Category <span className="text-rose-500">*</span></span>
                      {formErrors.subcategory_id && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.subcategory_id}</span>}
                    </label>
                    <select
                      required
                      value={ptFormData.subcategory_id}
                      onChange={(e) => {
                        const newSubId = e.target.value;
                        setPtFormData(prev => ({ ...prev, subcategory_id: newSubId }));
                        if (formErrors.subcategory_id) setFormErrors(prev => ({ ...prev, subcategory_id: null }));
                      }}
                      disabled={dependentSubcategoryOptions.length === 0}
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-bold text-gray-800 bg-purple-50/40 outline-none transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="" disabled>
                        {dependentSubcategoryOptions.length === 0 ? 'No subcategories available' : 'Select Sub Category...'}
                      </option>
                      {dependentSubcategoryOptions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.is_active ? '' : '(Inactive)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select Category / Product Type Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>Select Category / Product Type Name <span className="text-rose-500">*</span></span>
                    {formErrors.name && <span className="text-rose-500 font-semibold text-[11px]">{formErrors.name}</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lipstick, Liquid Foundation, Day Cream"
                    value={ptFormData.name}
                    onChange={(e) => {
                      setPtFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-medium outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Enter a descriptive summary for this select category..."
                    value={ptFormData.description}
                    onChange={(e) => setPtFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm font-medium transition-all resize-none"
                  />
                </div>

                {/* Mobile App & Status Switches */}
                <div className="bg-purple-50/40 p-3.5 rounded-xl border border-purple-100/80 flex items-center justify-around">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-xs font-bold text-gray-700">Show in Mobile App</span>
                    <button
                      type="button"
                      onClick={() => setPtFormData(prev => ({ ...prev, show_in_mobile_app: !prev.show_in_mobile_app }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        ptFormData.show_in_mobile_app ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        ptFormData.show_in_mobile_app ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${ptFormData.show_in_mobile_app ? 'text-purple-700' : 'text-gray-400'}`}>
                      {ptFormData.show_in_mobile_app ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-center border-l border-purple-200/60 pl-6">
                    <span className="text-xs font-bold text-gray-700">Active Status</span>
                    <button
                      type="button"
                      onClick={() => setPtFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        ptFormData.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        ptFormData.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className={`text-[10px] font-extrabold ${ptFormData.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {ptFormData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Integrated Image Management: Preview + Google Search + Drag & Drop Upload */}
                <InlineImageSection
                  imageUrl={ptFormData.image}
                  onChange={(newUrl) => setPtFormData(prev => ({ ...prev, image: newUrl }))}
                  entityName={ptFormData.name || 'Product Type'}
                  entityType="Select Category"
                  folder="products"
                  filenamePrefix="pt"
                />
              </div>

              {/* Sticky Footer */}
              <div className="p-4 sm:p-5 bg-gray-50/95 backdrop-blur-xs border-t border-purple-100 flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{modalMode === 'add_product_type' ? 'Create Select Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 14. SAFE DELETE CONFIRMATION MODAL                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && deleteModal.item && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteModal.isDeleting && !deleteModal.isChecking) {
              setDeleteModal({ isOpen: false, type: 'category', item: null, isChecking: false, hasRelations: false, childCount: 0, productsCount: 0, isDeleting: false });
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-scale-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with prominent Close (✕) button */}
            <div className={`p-4 sm:p-5 sm:px-6 border-b flex items-center justify-between shrink-0 sticky top-0 z-20 ${
              deleteModal.hasRelations ? 'bg-amber-50/90 border-amber-100' : 'bg-rose-50/90 border-rose-100'
            }`}>
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                  deleteModal.hasRelations ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {deleteModal.hasRelations ? <AlertTriangle size={22} /> : <Trash2 size={22} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-gray-900 truncate">
                    {deleteModal.hasRelations
                      ? `Cannot Delete ${
                          deleteModal.type === 'category'
                            ? 'Category'
                            : deleteModal.type === 'subcategory'
                            ? 'Subcategory'
                            : 'Select Category'
                        }`
                      : `Delete ${
                          deleteModal.type === 'category'
                            ? 'Main Category'
                            : deleteModal.type === 'subcategory'
                            ? 'Subcategory'
                            : 'Select Category'
                        }?`}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium truncate block">
                    {deleteModal.type === 'category'
                      ? 'Main Category'
                      : deleteModal.type === 'subcategory'
                      ? 'Subcategory'
                      : 'Select Category'}: <strong className="text-gray-800">{deleteModal.item.name}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'category', item: null, isChecking: false, hasRelations: false, childCount: 0, productsCount: 0, isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-200/90 hover:border-rose-300 shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ml-3 group focus:outline-none focus:ring-2 focus:ring-rose-200"
                aria-label="Close modal"
                title="Close (✕)"
              >
                <X size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              {deleteModal.isChecking ? (
                <div className="py-6 text-center space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-[#C2477A]" />
                  <p className="text-gray-500 font-medium text-xs">Checking database relationships...</p>
                </div>
              ) : deleteModal.hasRelations ? (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-semibold text-xs leading-relaxed">
                    This {deleteModal.type === 'category' ? 'category' : deleteModal.type === 'subcategory' ? 'subcategory' : 'select category'} cannot be deleted because it is being used by existing products.
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                      Attached Records:
                    </span>
                    {deleteModal.type === 'category' && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Subcategories attached:</span>
                        <span className="font-black text-gray-900">{deleteModal.childCount}</span>
                      </div>
                    )}
                    {deleteModal.type === 'subcategory' && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Select Categories attached:</span>
                        <span className="font-black text-gray-900">{deleteModal.childCount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Products attached:</span>
                      <span className="font-black text-gray-900">{deleteModal.productsCount}</span>
                    </div>
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed">
                    To prevent breaking product catalogs or customer orders, records with active relations cannot be hard-deleted. You can safely deactivate it instead.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Are you sure you want to permanently delete <strong className="text-gray-900">"{deleteModal.item.name}"</strong>?
                  </p>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs">
                    This record contains 0 products and 0 dependencies. Deletion will remove it from Supabase.
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'category', item: null, isChecking: false, hasRelations: false, childCount: 0, productsCount: 0, isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-white font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>

              {deleteModal.hasRelations ? (
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  disabled={deleteModal.isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {deleteModal.isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <EyeOff size={14} />}
                  <span>Deactivate {deleteModal.type === 'category' ? 'Category' : deleteModal.type === 'subcategory' ? 'Subcategory' : 'Select Category'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmHardDelete}
                  disabled={deleteModal.isChecking || deleteModal.isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {deleteModal.isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Permanently Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. WIPE ALL IMAGES CONFIRMATION MODAL ───────────────────────────── */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl w-full max-w-lg p-6 sm:p-7 relative animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900">
                    Remove All Images from Database?
                  </h3>
                  <span className="text-xs text-rose-600 font-bold block">
                    Complete Database & Admin Panel Image Cleanup
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <p>
                This action will permanently clear all saved image URLs and icons across:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-semibold text-gray-700">
                <li>Categories (<code className="text-rose-600">categories.image</code>, <code className="text-rose-600">categories.icon</code>)</li>
                <li>Subcategories (<code className="text-rose-600">subcategories.image</code>)</li>
                <li>Select Categories / Product Types (<code className="text-rose-600">product_types.image</code>)</li>
                <li>Database Hierarchy Cache (<code className="text-rose-600">salbeau_category_subcategory_hierarchy</code>)</li>
                <li>Products Catalog (<code className="text-rose-600">products.image</code>, <code className="text-rose-600">products.images</code>)</li>
                <li>Brand Logos (<code className="text-rose-600">brands.logo</code>)</li>
              </ul>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                ✓ Category names, hierarchical parent-child relationships, sort order, and products will remain 100% intact.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                disabled={isWipingImages}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeAllImages}
                disabled={isWipingImages}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isWipingImages ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Removing All Images...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Confirm & Remove All Images</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
