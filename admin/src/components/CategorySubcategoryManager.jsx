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
  ChevronRight,
  RefreshCw,
  X,
  Sparkles,
  Tag,
  Save,
  Image as ImageIcon,
  ArrowLeft,
  ExternalLink,
  Package,
  AlertTriangle,
  Folder,
  SlidersHorizontal,
  MoveUp,
  MoveDown,
  ArrowRight
} from 'lucide-react';
import ImageDropzoneUploader from './ImageDropzoneUploader';
import { supabase, supabaseAdmin } from '../config/supabase';
import { useAdmin } from '../context/AdminContext';

// Helper for normalization
const normalizeStr = (val) => {
  if (!val) return '';
  return String(val).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Date formatter
const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

export default function CategorySubcategoryManager({
  onRefreshMaster,
  onNavigateToProducts,
  onAddNewProductWithHierarchy
}) {
  const adminCtx = useAdmin?.() || {};
  const allProducts = adminCtx.products || [];

  // Data states from Supabase
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [leafCategories, setLeafCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Separate Pages State: 'categories' | 'subcategories' | 'select_categories'
  const [currentPage, setCurrentPage] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Full-page form state: null | 'add_category' | 'edit_category' | 'add_subcategory' | 'edit_subcategory' | 'add_select_category' | 'edit_select_category'
  const [formMode, setFormMode] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Search & Filter state per page
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
  const [categorySortBy, setCategorySortBy] = useState('order');

  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [subcategoryStatusFilter, setSubcategoryStatusFilter] = useState('all');
  const [subcategorySortBy, setSubcategorySortBy] = useState('order');

  const [leafSearch, setLeafSearch] = useState('');
  const [leafStatusFilter, setLeafStatusFilter] = useState('all');
  const [leafSortBy, setLeafSortBy] = useState('order');

  // Safe delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: 'category', // 'category' | 'subcategory' | 'leaf'
    item: null,
    childSubsCount: 0,
    childLeavesCount: 0,
    productsCount: 0
  });

  // Full-Page Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: '',
    color: '#FCE4EC',
    tagline: '',
    keywords: '',
    sort_order: 1,
    enabled: true
  });

  const showNotice = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // ── 1. LOAD DATA FROM SUPABASE ──────────────────────────────────────
  const loadHierarchyData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch categories
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;

      let loadedCategories = (catData || []).map((c, i) => ({
        id: c.id,
        name: c.name || '',
        image: c.image || '',
        color: c.color || '#FCE4EC',
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : i + 1,
        enabled: c.enabled !== false,
        created_at: c.created_at
      }));

      // 2. Fetch hierarchy configuration record from brands table
      const { data: configData } = await supabase
        .from('brands')
        .select('id, logo')
        .eq('id', 'salbeau_category_subcategory_hierarchy')
        .maybeSingle();

      let flatSubcategories = [];
      let flatLeafCategories = [];

      if (configData && configData.logo) {
        try {
          const parsedConfig = JSON.parse(configData.logo);
          if (parsedConfig && Array.isArray(parsedConfig.subcategories)) {
            flatSubcategories = parsedConfig.subcategories;
          }
          if (parsedConfig && Array.isArray(parsedConfig.leafCategories)) {
            flatLeafCategories = parsedConfig.leafCategories;
          }
        } catch (_) {}
      }

      // If categories table has images that brands hierarchy does not have, sync them
      loadedCategories = loadedCategories.map(c => {
        let hCat = null;
        try {
          if (configData?.logo) {
            hCat = JSON.parse(configData.logo).categories?.find(hc => hc.id === c.id);
          }
        } catch (_) {}
        return {
          ...c,
          image: c.image || hCat?.image || ''
        };
      });

      setCategories(loadedCategories);
      setSubcategories(flatSubcategories);
      setLeafCategories(flatLeafCategories);

      // Keep selected category and subcategory updated if they exist
      setSelectedCategory(prev => {
        if (!prev) return null;
        return loadedCategories.find(c => c.id === prev.id) || prev;
      });
      setSelectedSubcategory(prev => {
        if (!prev) return null;
        return flatSubcategories.find(s => s.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load category hierarchy:', err);
      showNotice('Failed to load categories. Please check database connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('categories_separate_pages_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadHierarchyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => loadHierarchyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands', filter: 'id=eq.salbeau_category_subcategory_hierarchy' }, () => loadHierarchyData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHierarchyData]);

  // ── 2. PERSIST HIERARCHY TO SUPABASE ────────────────────────────────
  const persistHierarchyToDb = async (newCategories, newSubcategories, newLeafCategories = leafCategories) => {
    setIsSaving(true);
    try {
      const client = supabaseAdmin || supabase;

      // 1. Upsert categories table
      const categoryUpserts = newCategories.map((c, i) => ({
        id: c.id,
        name: c.name,
        image: c.image || '',
        color: c.color || '#FCE4EC',
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : i + 1,
        enabled: c.enabled !== false
      }));

      const { error: catErr } = await client
        .from('categories')
        .upsert(categoryUpserts);

      if (catErr) console.warn('Categories table upsert warning:', catErr);

      // 2. Embed leafCategories in each subcategory
      const enrichedSubcategories = newSubcategories.map((s, i) => {
        const children = newLeafCategories.filter(l =>
          (l.subcategoryId && l.subcategoryId === s.id) ||
          (l.subcategoryId && l.subcategoryId.toLowerCase().trim() === s.name.toLowerCase().trim())
        );
        return {
          ...s,
          sort_order: typeof s.sort_order === 'number' ? s.sort_order : i + 1,
          leafCategories: children
        };
      });

      // 3. Persist to brands table with real-time replication
      const hierarchyPayload = {
        id: 'salbeau_category_subcategory_hierarchy',
        name: 'Salbeau Category & Subcategory Master Hierarchy',
        logo: JSON.stringify({
          categories: newCategories,
          subcategories: enrichedSubcategories,
          leafCategories: newLeafCategories,
          updatedAt: new Date().toISOString()
        }),
        enabled: true
      };

      const { error: hierErr } = await client
        .from('brands')
        .upsert(hierarchyPayload);

      if (hierErr) console.warn('Hierarchy mapping upsert warning:', hierErr);

      // 4. Sync subcategories table
      try {
        const subcategoryUpserts = enrichedSubcategories.map((s, i) => ({
          id: s.id,
          category_id: s.categoryId,
          name: s.name,
          image: s.image || '',
          tagline: s.tagline || '',
          sort_order: typeof s.sort_order === 'number' ? s.sort_order : i + 1,
          enabled: s.enabled !== false
        }));

        await client.from('subcategories').upsert(subcategoryUpserts);
      } catch (_) {}

      setCategories(newCategories);
      setSubcategories(newSubcategories);
      setLeafCategories(newLeafCategories);

      if (typeof onRefreshMaster === 'function') {
        onRefreshMaster();
      }

      return true;
    } catch (err) {
      console.error('Error saving hierarchy to DB:', err);
      showNotice(err.message || 'Failed to save changes.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ── 3. PRODUCT COUNT CALCULATION ENGINE ─────────────────────────────
  const productCountMap = useMemo(() => {
    const map = new Map();
    if (!allProducts || allProducts.length === 0) return map;

    const matchesLeaf = (p, leaf) => {
      const leafName = (leaf.name || '').toLowerCase().trim();
      const nLeaf = normalizeStr(leafName);
      const keywords = (Array.isArray(leaf.keywords) ? leaf.keywords : (leaf.keywords || '').split(','))
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();
      const pKw = Array.isArray(p.searchKeywords) ? p.searchKeywords.join(' ').toLowerCase() : '';
      const fullText = `${pCat} ${pName} ${pKw}`;

      if (leafName && (pName.includes(leafName) || normalizeStr(pName).includes(nLeaf) || pCat.includes(leafName))) {
        return true;
      }
      return keywords.some(k => fullText.includes(k) || normalizeStr(fullText).includes(normalizeStr(k)));
    };

    const matchesSub = (p, sub, parentCat) => {
      const subName = (sub.name || '').toLowerCase().trim();
      const catName = (parentCat?.name || '').toLowerCase().trim();
      const nSub = normalizeStr(subName);
      const nCat = normalizeStr(catName);

      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();
      const pKw = Array.isArray(p.searchKeywords) ? p.searchKeywords.join(' ').toLowerCase() : '';

      if (catName) {
        const inCat = pCat === catName || normalizeStr(pCat) === nCat || normalizeStr(pName).includes(nCat);
        if (!inCat) return false;
      }

      return pName.includes(subName) ||
        normalizeStr(pName).includes(nSub) ||
        pCat.includes(subName) ||
        normalizeStr(pCat).includes(nSub) ||
        pKw.includes(subName);
    };

    const matchesCat = (p, cat) => {
      const catName = (cat.name || '').toLowerCase().trim();
      const nCat = normalizeStr(catName);
      const pCat = (p.category || '').toLowerCase().trim();
      const pName = (p.name || '').toLowerCase().trim();

      return pCat === catName || normalizeStr(pCat) === nCat || normalizeStr(pName).includes(nCat);
    };

    // Calculate Select Categories
    leafCategories.forEach(leaf => {
      const count = allProducts.filter(p => matchesLeaf(p, leaf)).length;
      map.set(`leaf_${leaf.id}`, count);
    });

    // Calculate Subcategories
    subcategories.forEach(sub => {
      const parentCat = categories.find(c => c.id === sub.categoryId || normalizeStr(c.name) === normalizeStr(sub.categoryId));
      const childLeaves = leafCategories.filter(l =>
        (l.subcategoryId && l.subcategoryId === sub.id) ||
        (l.subcategoryId && l.subcategoryId.toLowerCase().trim() === sub.name.toLowerCase().trim())
      );

      const count = allProducts.filter(p => {
        if (matchesSub(p, sub, parentCat)) return true;
        return childLeaves.some(l => matchesLeaf(p, l));
      }).length;

      map.set(`sub_${sub.id}`, count);
    });

    // Calculate Categories
    categories.forEach(cat => {
      const childSubs = subcategories.filter(s =>
        s.categoryId === cat.id || normalizeStr(s.categoryId) === normalizeStr(cat.name)
      );

      const count = allProducts.filter(p => {
        if (matchesCat(p, cat)) return true;
        return childSubs.some(s => matchesSub(p, s, cat));
      }).length;

      map.set(`cat_${cat.id}`, count);
    });

    return map;
  }, [allProducts, categories, subcategories, leafCategories]);

  // ── 4. NAVIGATION FLOW HELPERS ───────────────────────────────────────
  const handleViewSubcategories = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage('subcategories');
    setSubcategorySearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewSelectCategories = (sub) => {
    setSelectedSubcategory(sub);
    setCurrentPage('select_categories');
    setLeafSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProducts = (leaf) => {
    if (typeof onNavigateToProducts === 'function') {
      onNavigateToProducts({
        category: selectedCategory?.name || '',
        subcategory: selectedSubcategory?.name || '',
        selectCategory: leaf?.name || ''
      });
    }
  };

  const handleAddProductFromSelectCategory = (leaf) => {
    if (typeof onAddNewProductWithHierarchy === 'function') {
      onAddNewProductWithHierarchy({
        category: selectedCategory?.name || '',
        subcategory: selectedSubcategory?.name || '',
        selectCategory: leaf?.name || ''
      });
    }
  };

  // Breadcrumb handlers
  const handleGoToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCurrentPage('categories');
    setFormMode(null);
  };

  const handleGoToSubcategories = () => {
    setSelectedSubcategory(null);
    setCurrentPage('subcategories');
    setFormMode(null);
  };

  // ── 5. STATUS TOGGLE (INSTANT SYNC) ─────────────────────────────────
  const handleToggleCategoryStatus = async (cat) => {
    const updated = categories.map(c => c.id === cat.id ? { ...c, enabled: !c.enabled } : c);
    await persistHierarchyToDb(updated, subcategories, leafCategories);
    showNotice(`Category "${cat.name}" is now ${!cat.enabled ? 'Active' : 'Inactive'}. Live on Customer App!`);
  };

  const handleToggleSubcategoryStatus = async (sub) => {
    const updated = subcategories.map(s => s.id === sub.id ? { ...s, enabled: !s.enabled } : s);
    await persistHierarchyToDb(categories, updated, leafCategories);
    showNotice(`Subcategory "${sub.name}" is now ${!sub.enabled ? 'Active' : 'Inactive'}. Live on Customer App!`);
  };

  const handleToggleLeafStatus = async (leaf) => {
    const updated = leafCategories.map(l => l.id === leaf.id ? { ...l, enabled: !l.enabled } : l);
    await persistHierarchyToDb(categories, subcategories, updated);
    showNotice(`Select Category "${leaf.name}" is now ${!leaf.enabled ? 'Active' : 'Inactive'}. Live on Customer App!`);
  };

  // ── 6. REORDER (MOVE UP / DOWN) ─────────────────────────────────────
  const handleMoveCategoryOrder = async (cat, direction) => {
    const list = [...categories];
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    const updated = list.map((c, i) => ({ ...c, sort_order: i + 1 }));
    await persistHierarchyToDb(updated, subcategories, leafCategories);
    showNotice(`Moved "${cat.name}" ${direction} to #${targetIdx + 1}`);
  };

  const handleMoveSubcategoryOrder = async (sub, direction) => {
    const subsInCat = subcategories.filter(s => s.categoryId === selectedCategory?.id);
    const idx = subsInCat.findIndex(s => s.id === sub.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= subsInCat.length) return;

    const temp = subsInCat[idx];
    subsInCat[idx] = subsInCat[targetIdx];
    subsInCat[targetIdx] = temp;

    // Map new sort orders back to full subcategories list
    const updated = subcategories.map(s => {
      const matchIdx = subsInCat.findIndex(x => x.id === s.id);
      return matchIdx !== -1 ? { ...s, sort_order: matchIdx + 1 } : s;
    });

    await persistHierarchyToDb(categories, updated, leafCategories);
    showNotice(`Moved "${sub.name}" ${direction} to #${targetIdx + 1}`);
  };

  const handleMoveLeafOrder = async (leaf, direction) => {
    const leavesInSub = leafCategories.filter(l => l.subcategoryId === selectedSubcategory?.id);
    const idx = leavesInSub.findIndex(l => l.id === leaf.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= leavesInSub.length) return;

    const temp = leavesInSub[idx];
    leavesInSub[idx] = leavesInSub[targetIdx];
    leavesInSub[targetIdx] = temp;

    const updated = leafCategories.map(l => {
      const matchIdx = leavesInSub.findIndex(x => x.id === l.id);
      return matchIdx !== -1 ? { ...l, sort_order: matchIdx + 1 } : l;
    });

    await persistHierarchyToDb(categories, subcategories, updated);
    showNotice(`Moved "${leaf.name}" ${direction} to #${targetIdx + 1}`);
  };

  // ── 7. SAFE DELETION HANDLERS ───────────────────────────────────────
  const initiateDelete = (type, item) => {
    let childSubsCount = 0;
    let childLeavesCount = 0;
    let productsCount = 0;

    if (type === 'category') {
      childSubsCount = subcategories.filter(s => s.categoryId === item.id || normalizeStr(s.categoryId) === normalizeStr(item.name)).length;
      productsCount = productCountMap.get(`cat_${item.id}`) || 0;
    } else if (type === 'subcategory') {
      childLeavesCount = leafCategories.filter(l => l.subcategoryId === item.id || l.subcategoryId === item.name).length;
      productsCount = productCountMap.get(`sub_${item.id}`) || 0;
    } else if (type === 'leaf') {
      productsCount = productCountMap.get(`leaf_${item.id}`) || 0;
    }

    setDeleteConfirm({
      isOpen: true,
      type,
      item,
      childSubsCount,
      childLeavesCount,
      productsCount
    });
  };

  const executeDelete = async () => {
    const { type, item } = deleteConfirm;
    if (!item) return;

    const client = supabaseAdmin || supabase;

    if (type === 'category') {
      const newCats = categories.filter(c => c.id !== item.id);
      try {
        await client.from('categories').delete().eq('id', item.id);
      } catch (_) {}
      await persistHierarchyToDb(newCats, subcategories, leafCategories);
      showNotice(`Category "${item.name}" deleted.`);
    } else if (type === 'subcategory') {
      const newSubs = subcategories.filter(s => s.id !== item.id);
      try {
        await client.from('subcategories').delete().eq('id', item.id);
      } catch (_) {}
      await persistHierarchyToDb(categories, newSubs, leafCategories);
      showNotice(`Subcategory "${item.name}" deleted.`);
    } else if (type === 'leaf') {
      const newLeaves = leafCategories.filter(l => l.id !== item.id);
      await persistHierarchyToDb(categories, subcategories, newLeaves);
      showNotice(`Select Category "${item.name}" deleted.`);
    }

    setDeleteConfirm({ isOpen: false, type: 'category', item: null, childSubsCount: 0, childLeavesCount: 0, productsCount: 0 });
  };

  // ── 8. FULL-PAGE FORM HANDLERS (NO MODALS) ───────────────────────────
  const openAddCategoryForm = () => {
    setFormData({
      id: `cat_${Date.now()}`,
      name: '',
      image: '',
      color: '#FCE4EC',
      tagline: '',
      keywords: '',
      sort_order: categories.length + 1,
      enabled: true
    });
    setEditingItem(null);
    setFormMode('add_category');
  };

  const openEditCategoryForm = (cat) => {
    setFormData({
      id: cat.id,
      name: cat.name || '',
      image: cat.image || '',
      color: cat.color || '#FCE4EC',
      tagline: cat.tagline || '',
      keywords: '',
      sort_order: cat.sort_order || 1,
      enabled: cat.enabled !== false
    });
    setEditingItem(cat);
    setFormMode('edit_category');
  };

  const openAddSubcategoryForm = () => {
    const subsInCat = subcategories.filter(s => s.categoryId === selectedCategory?.id);
    setFormData({
      id: `sub_${Date.now()}`,
      name: '',
      image: '',
      color: '#FCE4EC',
      tagline: '',
      keywords: '',
      sort_order: subsInCat.length + 1,
      enabled: true
    });
    setEditingItem(null);
    setFormMode('add_subcategory');
  };

  const openEditSubcategoryForm = (sub) => {
    setFormData({
      id: sub.id,
      name: sub.name || '',
      image: sub.image || '',
      color: '#FCE4EC',
      tagline: sub.tagline || '',
      keywords: '',
      sort_order: sub.sort_order || 1,
      enabled: sub.enabled !== false
    });
    setEditingItem(sub);
    setFormMode('edit_subcategory');
  };

  const openAddSelectCategoryForm = () => {
    const leavesInSub = leafCategories.filter(l => l.subcategoryId === selectedSubcategory?.id);
    setFormData({
      id: `leaf_${Date.now()}`,
      name: '',
      image: '',
      color: '#FCE4EC',
      tagline: '',
      keywords: '',
      sort_order: leavesInSub.length + 1,
      enabled: true
    });
    setEditingItem(null);
    setFormMode('add_select_category');
  };

  const openEditSelectCategoryForm = (leaf) => {
    setFormData({
      id: leaf.id,
      name: leaf.name || '',
      image: leaf.image || '',
      color: '#FCE4EC',
      tagline: leaf.tagline || '',
      keywords: Array.isArray(leaf.keywords) ? leaf.keywords.join(', ') : (leaf.keywords || ''),
      sort_order: leaf.sort_order || 1,
      enabled: leaf.enabled !== false
    });
    setEditingItem(leaf);
    setFormMode('edit_select_category');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('Please enter a name.', 'error');
      return;
    }

    if (formMode === 'add_category') {
      const newCat = {
        id: formData.id,
        name: formData.name.trim(),
        image: formData.image || '',
        color: formData.color || '#FCE4EC',
        sort_order: Number(formData.sort_order) || categories.length + 1,
        enabled: formData.enabled !== false,
        created_at: new Date().toISOString()
      };
      const ok = await persistHierarchyToDb([...categories, newCat], subcategories, leafCategories);
      if (ok) {
        showNotice(`Category "${newCat.name}" created successfully!`);
        setFormMode(null);
      }
    } else if (formMode === 'edit_category') {
      const updated = categories.map(c => c.id === formData.id ? {
        ...c,
        name: formData.name.trim(),
        image: formData.image || c.image || '',
        sort_order: Number(formData.sort_order) || c.sort_order || 1,
        enabled: formData.enabled !== false
      } : c);
      const ok = await persistHierarchyToDb(updated, subcategories, leafCategories);
      if (ok) {
        showNotice(`Category "${formData.name}" updated successfully!`);
        setFormMode(null);
      }
    } else if (formMode === 'add_subcategory') {
      const newSub = {
        id: formData.id,
        categoryId: selectedCategory.id,
        name: formData.name.trim(),
        image: formData.image || '',
        tagline: formData.tagline || '',
        sort_order: Number(formData.sort_order) || 1,
        enabled: formData.enabled !== false,
        created_at: new Date().toISOString()
      };
      const ok = await persistHierarchyToDb(categories, [...subcategories, newSub], leafCategories);
      if (ok) {
        showNotice(`Subcategory "${newSub.name}" created successfully!`);
        setFormMode(null);
      }
    } else if (formMode === 'edit_subcategory') {
      const updated = subcategories.map(s => s.id === formData.id ? {
        ...s,
        name: formData.name.trim(),
        image: formData.image || s.image || '',
        tagline: formData.tagline || '',
        sort_order: Number(formData.sort_order) || s.sort_order || 1,
        enabled: formData.enabled !== false
      } : s);
      const ok = await persistHierarchyToDb(categories, updated, leafCategories);
      if (ok) {
        showNotice(`Subcategory "${formData.name}" updated successfully!`);
        setFormMode(null);
      }
    } else if (formMode === 'add_select_category') {
      const kw = (formData.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
      const newLeaf = {
        id: formData.id,
        categoryId: selectedCategory.id,
        subcategoryId: selectedSubcategory.id,
        name: formData.name.trim(),
        keywords: kw,
        image: formData.image || '',
        tagline: formData.tagline || '',
        sort_order: Number(formData.sort_order) || 1,
        enabled: formData.enabled !== false,
        created_at: new Date().toISOString()
      };
      const ok = await persistHierarchyToDb(categories, subcategories, [...leafCategories, newLeaf]);
      if (ok) {
        showNotice(`Select Category "${newLeaf.name}" created successfully!`);
        setFormMode(null);
      }
    } else if (formMode === 'edit_select_category') {
      const kw = (formData.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
      const updated = leafCategories.map(l => l.id === formData.id ? {
        ...l,
        name: formData.name.trim(),
        keywords: kw,
        image: formData.image || l.image || '',
        tagline: formData.tagline || '',
        sort_order: Number(formData.sort_order) || l.sort_order || 1,
        enabled: formData.enabled !== false
      } : l);
      const ok = await persistHierarchyToDb(categories, subcategories, updated);
      if (ok) {
        showNotice(`Select Category "${formData.name}" updated successfully!`);
        setFormMode(null);
      }
    }
  };

  // ── 9. FILTERED & SORTED DATA PER PAGE ──────────────────────────────
  const displayedCategories = useMemo(() => {
    let list = [...categories];
    const q = categorySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(c => (c.name || '').toLowerCase().includes(q));
    }
    if (categoryStatusFilter !== 'all') {
      list = list.filter(c => categoryStatusFilter === 'active' ? c.enabled !== false : c.enabled === false);
    }
    list.sort((a, b) => {
      if (categorySortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (categorySortBy === 'products') return (productCountMap.get(`cat_${b.id}`) || 0) - (productCountMap.get(`cat_${a.id}`) || 0);
      if (categorySortBy === 'date') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
    return list;
  }, [categories, categorySearch, categoryStatusFilter, categorySortBy, productCountMap]);

  const displayedSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    let list = subcategories.filter(s =>
      s.categoryId === selectedCategory.id || normalizeStr(s.categoryId) === normalizeStr(selectedCategory.name)
    );
    const q = subcategorySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(s => (s.name || '').toLowerCase().includes(q));
    }
    if (subcategoryStatusFilter !== 'all') {
      list = list.filter(s => subcategoryStatusFilter === 'active' ? s.enabled !== false : s.enabled === false);
    }
    list.sort((a, b) => {
      if (subcategorySortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (subcategorySortBy === 'products') return (productCountMap.get(`sub_${b.id}`) || 0) - (productCountMap.get(`sub_${a.id}`) || 0);
      if (subcategorySortBy === 'date') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
    return list;
  }, [subcategories, selectedCategory, subcategorySearch, subcategoryStatusFilter, subcategorySortBy, productCountMap]);

  const displayedLeafCategories = useMemo(() => {
    if (!selectedSubcategory) return [];
    let list = leafCategories.filter(l =>
      (l.subcategoryId && l.subcategoryId === selectedSubcategory.id) ||
      (l.subcategoryId && l.subcategoryId.toLowerCase().trim() === selectedSubcategory.name.toLowerCase().trim())
    );
    const q = leafSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (Array.isArray(l.keywords) && l.keywords.some(k => k.toLowerCase().includes(q)))
      );
    }
    if (leafStatusFilter !== 'all') {
      list = list.filter(l => leafStatusFilter === 'active' ? l.enabled !== false : l.enabled === false);
    }
    list.sort((a, b) => {
      if (leafSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (leafSortBy === 'products') return (productCountMap.get(`leaf_${b.id}`) || 0) - (productCountMap.get(`leaf_${a.id}`) || 0);
      if (leafSortBy === 'date') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    });
    return list;
  }, [leafCategories, selectedSubcategory, leafSearch, leafStatusFilter, leafSortBy, productCountMap]);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: FULL-PAGE FORMS (NO MODALS!)
  // ══════════════════════════════════════════════════════════════════════
  if (formMode !== null) {
    const isEdit = formMode.startsWith('edit_');
    const isCategory = formMode.includes('category') && !formMode.includes('sub') && !formMode.includes('select');
    const isSubcategory = formMode.includes('subcategory');
    const isLeaf = formMode.includes('select_category');

    const formTitle = isCategory
      ? (isEdit ? `Edit Category: ${editingItem?.name || ''}` : 'Add Category')
      : isSubcategory
      ? (isEdit ? `Edit Subcategory: ${editingItem?.name || ''}` : `Add Subcategory under ${selectedCategory?.name || ''}`)
      : (isEdit ? `Edit Select Category: ${editingItem?.name || ''}` : `Add Select Category under ${selectedSubcategory?.name || ''}`);

    const backLabel = isCategory
      ? 'Categories'
      : isSubcategory
      ? selectedCategory?.name || 'Subcategories'
      : selectedSubcategory?.name || 'Select Categories';

    return (
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-pink-100/80 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="p-2.5 rounded-xl border border-pink-200 bg-[#FFF5F8] text-[#C2477A] hover:bg-[#FFF5F8] transition-colors cursor-pointer"
              title={`Back to ${backLabel}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <button type="button" onClick={handleGoToCategories} className="hover:text-[#C2477A]">Categories</button>
                {selectedCategory && (
                  <>
                    <span>/</span>
                    <button type="button" onClick={handleGoToSubcategories} className="hover:text-[#C2477A]">{selectedCategory.name}</button>
                  </>
                )}
                {selectedSubcategory && (
                  <>
                    <span>/</span>
                    <span className="text-gray-700">{selectedSubcategory.name}</span>
                  </>
                )}
                <span>/</span>
                <span className="text-[#C2477A]">{isEdit ? 'Edit' : 'Create'}</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 mt-0.5">{formTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer flex-1 sm:flex-initial transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isEdit ? 'Save Changes' : isCategory ? 'Create Category' : isSubcategory ? 'Create Subcategory' : 'Create Select Category'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveForm} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-pink-100/80 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-pink-100/60 pb-3">
              {isCategory ? <FolderPlus size={16} className="text-[#C2477A]" /> : isSubcategory ? <Layers size={16} className="text-[#C2477A]" /> : <Tag size={16} className="text-[#C2477A]" />}
              <span>General Information</span>
            </h2>

            {/* Parent Info Banner if Subcategory or Select Category */}
            {isSubcategory && selectedCategory && (
              <div className="p-4 bg-[#FFF8FA] rounded-xl border border-pink-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-pink-200 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedCategory.image ? (
                    <img src={selectedCategory.image} alt={selectedCategory.name} className="w-full h-full object-contain" />
                  ) : (
                    <Folder size={16} className="text-[#C2477A]" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400">Parent Category</span>
                  <div className="text-sm font-bold text-gray-900">{selectedCategory.name}</div>
                </div>
              </div>
            )}

            {isLeaf && selectedCategory && selectedSubcategory && (
              <div className="p-4 bg-[#FFF8FA] rounded-xl border border-pink-100 flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400">Parent Category</span>
                  <div className="text-xs font-bold text-gray-800">{selectedCategory.name}</div>
                </div>
                <div className="text-gray-300">→</div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400">Parent Subcategory</span>
                  <div className="text-xs font-bold text-black">{selectedSubcategory.name}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-700">
                  {isCategory ? 'Category Name' : isSubcategory ? 'Subcategory Name' : 'Select Category Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isCategory ? 'e.g. Makeup, Skin Care, Hair Care...' : isSubcategory ? 'e.g. Face Makeup, Eye Makeup...' : 'e.g. Foundation, Concealer, Compact...'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 outline-none text-sm font-medium transition-all"
                />
              </div>

              {isLeaf && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700">Search Keywords & Aliases</label>
                  <input
                    type="text"
                    placeholder="e.g. liquid foundation, matte finish, base, hd (comma-separated)"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 outline-none text-sm font-medium transition-all"
                  />
                  <span className="text-[11px] text-gray-400">Keywords improve search accuracy and automatically match products</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:border-[#C2477A] focus:ring-2 focus:ring-pink-100 outline-none text-sm font-medium transition-all"
                />
                <span className="text-[11px] text-gray-400">Lower numbers appear first</span>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-xs font-bold text-gray-700">Active / Inactive Status</label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-extrabold ${formData.enabled ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {formData.enabled ? 'Active (Visible in User App)' : 'Inactive (Hidden in User App)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-2 pt-4 border-t border-pink-100/60">
              <label className="text-xs font-bold text-gray-700">
                {isCategory ? 'Category Image' : isSubcategory ? 'Subcategory Image' : 'Select Category Thumbnail'}
              </label>
              <ImageDropzoneUploader
                currentImageUrl={formData.image}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, image: url }))}
                onImageRemoved={() => setFormData(prev => ({ ...prev, image: '' }))}
                label="Visual Asset"
                sublabel="Drag & drop image or browse device. Synced to Supabase Storage & User App."
                prefix={isCategory ? 'cat' : isSubcategory ? 'sub' : 'leaf'}
                entityName={formData.name}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isEdit ? 'Save Changes' : isCategory ? 'Create Category' : isSubcategory ? 'Create Subcategory' : 'Create Select Category'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: PAGE 2 — SUBCATEGORIES MANAGEMENT PAGE
  // ══════════════════════════════════════════════════════════════════════
  if (currentPage === 'subcategories' && selectedCategory) {
    const catProds = productCountMap.get(`cat_${selectedCategory.id}`) || 0;
    const totalSubs = displayedSubcategories.length;

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Toast */}
        {notice && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs animate-fade-in ${
            notice.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="cursor-pointer p-0.5"><X size={14} /></button>
          </div>
        )}

        {/* 1. Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white p-3.5 px-5 rounded-xl border border-pink-100 shadow-2xs">
          <button
            type="button"
            onClick={handleGoToCategories}
            className="hover:text-[#C2477A] flex items-center gap-1.5 cursor-pointer text-gray-700"
          >
            <Folder size={14} className="text-[#C2477A]" />
            <span>Categories</span>
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-[#C2477A] font-black">{selectedCategory.name}</span>
        </div>

        {/* 2. Parent Category Context Banner */}
        <div className="bg-gradient-to-r from-[#FFF5F8] to-white p-6 rounded-2xl border border-pink-100/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-pink-200/80 p-1.5 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {selectedCategory.image ? (
                <img
                  src={selectedCategory.image}
                  alt={selectedCategory.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Folder size={28} className="text-[#C2477A]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-pink-100 text-[#C2477A]">
                  Parent Category
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                  selectedCategory.enabled !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {selectedCategory.enabled !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mt-1">{selectedCategory.name}</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Manage subcategories under this category.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-white px-4 py-2 rounded-xl border border-pink-100 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Subcategories</span>
              <div className="text-base font-black text-gray-900">{totalSubs}</div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-pink-100 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Products</span>
              <div className="text-base font-black text-[#C2477A]">{catProds}</div>
            </div>
            <button
              type="button"
              onClick={openAddSubcategoryForm}
              className="bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              <PlusCircle size={15} />
              <span>+ Add Subcategory</span>
            </button>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100 flex-1 min-w-[220px]">
            <Search size={15} className="text-[#C2477A] shrink-0" />
            <input
              type="text"
              placeholder={`Search subcategories in ${selectedCategory.name}...`}
              value={subcategorySearch}
              onChange={(e) => setSubcategorySearch(e.target.value)}
              className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
            />
            {subcategorySearch && (
              <button type="button" onClick={() => setSubcategorySearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Status:</span>
              <select
                value={subcategoryStatusFilter}
                onChange={(e) => setSubcategoryStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Sort By:</span>
              <select
                value={subcategorySortBy}
                onChange={(e) => setSubcategorySortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
              >
                <option value="order">Display Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="products">Product Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Subcategories Clean Management Cards / List */}
        {displayedSubcategories.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-pink-100 text-center space-y-3">
            <Layers size={36} className="text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700 text-sm">No subcategories found</h3>
            <p className="text-gray-400 text-xs">
              {subcategorySearch ? `No records matching "${subcategorySearch}"` : `Create your first subcategory for ${selectedCategory.name}.`}
            </p>
            <button
              type="button"
              onClick={openAddSubcategoryForm}
              className="px-4 py-2.5 rounded-xl bg-[#C2477A] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <PlusCircle size={14} />
              <span>+ Add Subcategory</span>
            </button>
          </div>
        ) : (
        <div className="bg-white rounded-2xl border border-pink-100/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-pink-100 bg-[#F8F9FF] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 w-16 text-center">Image</th>
                  <th className="py-3.5 px-4">Subcategory Name</th>
                  <th className="py-3.5 px-4 text-center w-36">Select Categories</th>
                  <th className="py-3.5 px-4 text-center w-36">Products</th>
                  <th className="py-3.5 px-4 text-center w-28">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Display Order</th>
                  <th className="py-3.5 px-4 text-right w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100/60 text-xs">
                {displayedSubcategories.map((sub, idx) => {
                  const subProds = productCountMap.get(`sub_${sub.id}`) || 0;
                  const childLeaves = leafCategories.filter(l =>
                    (l.subcategoryId && l.subcategoryId === sub.id) ||
                    (l.subcategoryId && l.subcategoryId.toLowerCase().trim() === sub.name.toLowerCase().trim())
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-[#F8F9FF] transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="w-11 h-11 rounded-xl bg-[#F8F9FF] border border-[#FCE4EC] p-1 flex items-center justify-center overflow-hidden mx-auto shadow-2xs">
                          {sub.image ? (
                            <img
                              src={sub.image}
                              alt={sub.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Layers size={18} className="text-[#C2477A]" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-gray-900 block">{sub.name}</span>
                        {sub.tagline && (
                          <span className="text-[11px] text-gray-400 font-medium line-clamp-1">{sub.tagline}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF5F8] text-black border border-[#FCE4EC]">
                          {childLeaves.length} Select Categories
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigateToProducts?.({ category: selectedCategory?.name, subcategory: sub.name })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFF5F8] text-[#C2477A] border border-pink-100 hover:bg-[#C2477A] hover:text-white transition-all cursor-pointer shadow-2xs group"
                          title="View products in Catalog"
                        >
                          <span>{subProds} Products</span>
                          <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSubcategoryStatus(sub)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-colors ${
                            sub.enabled !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.enabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          <span>{sub.enabled !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                          <span>#{sub.sort_order || idx + 1}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveSubcategoryOrder(sub, 'up')}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-[#C2477A] disabled:opacity-20 cursor-pointer"
                            >
                              <MoveUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSubcategoryOrder(sub, 'down')}
                              disabled={idx === displayedSubcategories.length - 1}
                              className="text-gray-400 hover:text-[#C2477A] disabled:opacity-20 cursor-pointer"
                            >
                              <MoveDown size={11} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewSelectCategories(sub)}
                            className="px-3.5 py-2 rounded-xl bg-[#C2477A] hover:bg-[#9E2D5B] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
                          >
                            <span>View Select Categories</span>
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditSubcategoryForm(sub)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-[#C2477A] hover:text-[#C2477A] text-gray-500 transition-colors cursor-pointer"
                            title="Edit Subcategory"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => initiateDelete('subcategory', sub)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-rose-400 hover:text-rose-600 text-gray-500 transition-colors cursor-pointer"
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
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: PAGE 3 — SELECT CATEGORIES MANAGEMENT PAGE
  // ══════════════════════════════════════════════════════════════════════
  if (currentPage === 'select_categories' && selectedCategory && selectedSubcategory) {
    const subProds = productCountMap.get(`sub_${selectedSubcategory.id}`) || 0;
    const totalLeaves = displayedLeafCategories.length;

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Toast */}
        {notice && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs animate-fade-in ${
            notice.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="cursor-pointer p-0.5"><X size={14} /></button>
          </div>
        )}

        {/* 1. Breadcrumb Trail */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white p-3.5 px-5 rounded-xl border border-pink-100 shadow-2xs flex-wrap">
          <button
            type="button"
            onClick={handleGoToCategories}
            className="hover:text-[#C2477A] flex items-center gap-1.5 cursor-pointer text-gray-700"
          >
            <Folder size={14} className="text-[#C2477A]" />
            <span>Categories</span>
          </button>
          <span className="text-gray-300">/</span>
          <button
            type="button"
            onClick={handleGoToSubcategories}
            className="hover:text-[#C2477A] flex items-center gap-1.5 cursor-pointer text-gray-700"
          >
            <Layers size={14} className="text-[#C2477A]" />
            <span>{selectedCategory.name}</span>
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-emerald-700 font-black">{selectedSubcategory.name}</span>
        </div>

        {/* 2. Parent Context Header */}
        <div className="bg-gradient-to-r from-[#F0FDF4] to-white p-6 rounded-2xl border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200 p-1.5 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {selectedSubcategory.image ? (
                <img
                  src={selectedSubcategory.image}
                  alt={selectedSubcategory.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <Tag size={28} className="text-emerald-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  Subcategory Level
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Parent: <strong className="text-gray-800">{selectedCategory.name}</strong>
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mt-1">{selectedSubcategory.name}</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Manage select categories under this subcategory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-white px-4 py-2 rounded-xl border border-emerald-100 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Select Categories</span>
              <div className="text-base font-black text-emerald-700">{totalLeaves}</div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-emerald-100 text-center shadow-2xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase">Products</span>
              <div className="text-base font-black text-[#C2477A]">{subProds}</div>
            </div>
            <button
              type="button"
              onClick={openAddSelectCategoryForm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              <PlusCircle size={15} />
              <span>+ Add Select Category</span>
            </button>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-pink-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100 flex-1 min-w-[220px]">
            <Search size={15} className="text-[#C2477A] shrink-0" />
            <input
              type="text"
              placeholder={`Search select categories in ${selectedSubcategory.name}...`}
              value={leafSearch}
              onChange={(e) => setLeafSearch(e.target.value)}
              className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
            />
            {leafSearch && (
              <button type="button" onClick={() => setLeafSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Status:</span>
              <select
                value={leafStatusFilter}
                onChange={(e) => setLeafStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Sort By:</span>
              <select
                value={leafSortBy}
                onChange={(e) => setLeafSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
              >
                <option value="order">Display Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="products">Product Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Select Categories Clean Cards / List */}
        {displayedLeafCategories.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-pink-100 text-center space-y-3">
            <Tag size={36} className="text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700 text-sm">No select categories found</h3>
            <p className="text-gray-400 text-xs">
              {leafSearch ? `No records matching "${leafSearch}"` : `Create your first select category for ${selectedSubcategory.name}.`}
            </p>
            <button
              type="button"
              onClick={openAddSelectCategoryForm}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <PlusCircle size={14} />
              <span>+ Add Select Category</span>
            </button>
          </div>
        ) : (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-emerald-100 bg-[#F0FDF4] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 w-16 text-center">Image</th>
                  <th className="py-3.5 px-4">Select Category Name</th>
                  <th className="py-3.5 px-4 text-center w-36">Products</th>
                  <th className="py-3.5 px-4 text-center w-28">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Display Order</th>
                  <th className="py-3.5 px-4 text-right w-72">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/60 text-xs">
                {displayedLeafCategories.map((leaf, idx) => {
                  const leafProds = productCountMap.get(`leaf_${leaf.id}`) || 0;

                  return (
                    <tr key={leaf.id} className="hover:bg-[#F3FAF5] transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] border border-emerald-100 p-1 flex items-center justify-center overflow-hidden mx-auto shadow-2xs">
                          {leaf.image ? (
                            <img
                              src={leaf.image}
                              alt={leaf.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Tag size={18} className="text-emerald-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-gray-900 block">{leaf.name}</span>
                        {Array.isArray(leaf.keywords) && leaf.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {leaf.keywords.slice(0, 4).map((k, ki) => (
                              <span key={ki} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                #{k}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFF5F8] text-[#C2477A] border border-pink-100">
                          {leafProds} Products
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleLeafStatus(leaf)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-colors ${
                            leaf.enabled !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${leaf.enabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          <span>{leaf.enabled !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                          <span>#{leaf.sort_order || idx + 1}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveLeafOrder(leaf, 'up')}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer"
                            >
                              <MoveUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLeafOrder(leaf, 'down')}
                              disabled={idx === displayedLeafCategories.length - 1}
                              className="text-gray-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer"
                            >
                              <MoveDown size={11} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewProducts(leaf)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
                            title="View filtered products in Catalog"
                          >
                            <Package size={13} />
                            <span>View Products →</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddProductFromSelectCategory(leaf)}
                            className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Add Product with this hierarchy"
                          >
                            <PlusCircle size={13} />
                            <span className="hidden sm:inline">Add Product</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditSelectCategoryForm(leaf)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-emerald-600 hover:text-emerald-700 text-gray-500 transition-colors cursor-pointer"
                            title="Edit Select Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => initiateDelete('leaf', leaf)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-rose-400 hover:text-rose-600 text-gray-500 transition-colors cursor-pointer"
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
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: PAGE 1 — CATEGORIES MANAGEMENT PAGE (MAIN PAGE)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Toast Notice */}
      {notice && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs animate-fade-in ${
          notice.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="cursor-pointer p-0.5"><X size={14} /></button>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-pink-100/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C2477A] uppercase tracking-wider mb-1">
            <FolderPlus size={16} />
            <span>Master Catalog Management</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Categories</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage your main product categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddCategoryForm}
          className="bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
        >
          <PlusCircle size={15} />
          <span>+ Add Category</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-pink-100 flex-1 min-w-[240px]">
          <Search size={15} className="text-[#C2477A] shrink-0" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="bg-transparent text-xs outline-none text-gray-900 placeholder-gray-400 font-medium w-full"
          />
          {categorySearch && (
            <button type="button" onClick={() => setCategorySearch('')} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Status:</span>
            <select
              value={categoryStatusFilter}
              onChange={(e) => setCategoryStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Sort By:</span>
            <select
              value={categorySortBy}
              onChange={(e) => setCategorySortBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFF5F8] border border-pink-100 text-[#C2477A] outline-none cursor-pointer"
            >
              <option value="order">Display Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="products">Product Count</option>
              <option value="date">Created Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Clean Categories Cards Grid */}
      {isLoading ? (
        <div className="bg-white p-16 rounded-2xl border border-pink-100 text-center">
          <RefreshCw size={24} className="animate-spin mx-auto text-[#C2477A] mb-2" />
          <span className="text-xs font-semibold text-gray-400">Loading categories...</span>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-pink-100 text-center space-y-3">
          <Folder size={36} className="text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-700 text-sm">No categories found</h3>
          <p className="text-gray-400 text-xs">
            {categorySearch ? `No categories matching "${categorySearch}"` : 'Get started by creating your first category.'}
          </p>
          <button
            type="button"
            onClick={openAddCategoryForm}
            className="px-4 py-2.5 rounded-xl bg-[#C2477A] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle size={14} />
            <span>+ Add Category</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-pink-100 bg-[#FFF5F8] text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 w-16 text-center">Image</th>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4 text-center w-36">Subcategories</th>
                  <th className="py-3.5 px-4 text-center w-36">Products</th>
                  <th className="py-3.5 px-4 text-center w-28">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Display Order</th>
                  <th className="py-3.5 px-4 text-right w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100/60 text-xs">
                {displayedCategories.map((cat, idx) => {
                  const catProds = productCountMap.get(`cat_${cat.id}`) || 0;
                  const childSubs = subcategories.filter(s =>
                    s.categoryId === cat.id || normalizeStr(s.categoryId) === normalizeStr(cat.name)
                  );

                  return (
                    <tr key={cat.id} className="hover:bg-[#FFF9FB] transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="w-11 h-11 rounded-xl bg-[#FFF5F8] border border-pink-100 p-1 flex items-center justify-center overflow-hidden mx-auto shadow-2xs">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Folder size={18} className="text-[#C2477A]" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-gray-900 block">{cat.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF5F8] text-black border border-[#FCE4EC]">
                          {childSubs.length} Subcategories
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigateToProducts?.({ category: cat.name })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFF5F8] text-[#C2477A] border border-pink-100 hover:bg-[#C2477A] hover:text-white transition-all cursor-pointer shadow-2xs group"
                          title="View products in Catalog"
                        >
                          <span>{catProds} Products</span>
                          <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryStatus(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-colors ${
                            cat.enabled !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.enabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          <span>{cat.enabled !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold text-gray-700">
                          <span>#{cat.sort_order || idx + 1}</span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveCategoryOrder(cat, 'up')}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-[#C2477A] disabled:opacity-20 cursor-pointer"
                            >
                              <MoveUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCategoryOrder(cat, 'down')}
                              disabled={idx === displayedCategories.length - 1}
                              className="text-gray-400 hover:text-[#C2477A] disabled:opacity-20 cursor-pointer"
                            >
                              <MoveDown size={11} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewSubcategories(cat)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
                          >
                            <span>View Subcategories</span>
                            <ArrowRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCategoryForm(cat)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-[#C2477A] hover:text-[#C2477A] text-gray-500 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => initiateDelete('category', cat)}
                            className="p-2 rounded-xl border border-gray-200 hover:border-rose-400 hover:text-rose-600 text-gray-500 transition-colors cursor-pointer"
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

      {/* 4. Safe Deletion Confirmation Dialog */}
      {deleteConfirm.isOpen && deleteConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-pink-100 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Delete Confirmation</h3>
                <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                  {deleteConfirm.type === 'category' ? 'Category' : deleteConfirm.type === 'subcategory' ? 'Subcategory' : 'Select Category'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p>
                Are you sure you want to permanently delete <strong className="text-gray-900 font-bold">"{deleteConfirm.item.name}"</strong>?
              </p>

              {(deleteConfirm.childSubsCount > 0 || deleteConfirm.childLeavesCount > 0 || deleteConfirm.productsCount > 0) && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1 mt-3">
                  <div className="font-extrabold flex items-center gap-1.5 text-xs text-rose-700">
                    <AlertCircle size={14} /> Warning: Related Records Exist
                  </div>
                  {deleteConfirm.childSubsCount > 0 && (
                    <div className="text-[11px]">• Contains <strong>{deleteConfirm.childSubsCount} child subcategories</strong></div>
                  )}
                  {deleteConfirm.childLeavesCount > 0 && (
                    <div className="text-[11px]">• Contains <strong>{deleteConfirm.childLeavesCount} select categories</strong></div>
                  )}
                  {deleteConfirm.productsCount > 0 && (
                    <div className="text-[11px]">• Associated with <strong>{deleteConfirm.productsCount} catalog products</strong></div>
                  )}
                  <p className="text-[10px] text-rose-600 pt-1">
                    Deleting it will orphan child items and affect customer navigation.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'category', item: null, childSubsCount: 0, childLeavesCount: 0, productsCount: 0 })}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
