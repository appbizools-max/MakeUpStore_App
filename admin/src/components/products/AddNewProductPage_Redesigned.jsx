import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Package,
  Search,
  Building2,
  Barcode,
  ScanBarcode,
  Upload,
  ImageIcon,
  Images,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Palette,
  Layers,
  Save,
  FileText,
  X,
  BadgePercent,
  Percent,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Boxes,
  Eye,
  Calculator,
  Tag,
  ShieldCheck,
  Crown,
  User,
  Star,
  Heart,
  Pencil,
  Info,
  MousePointer,
  Sparkle,
  ChevronRight,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ExternalLink,
  Link as LinkIcon,
  Flame,
  TrendingUp,
  Store,
  CheckCheck,
  Clock,
  HelpCircle
} from 'lucide-react';
import { useAdmin, DEFAULT_PRICING_RULES } from '../../context/AdminContext';
import { validateBarcodeFormat, normalizeBarcode, detectBarcodeType } from '../../utils/barcodeUtils';
import {
  normalizeQuantityTiers,
  getDefaultQuantityTiers,
  validateRoleTiers,
  DISCOUNT_ROLES,
  getProductBasePriceForRole,
  getProductRoleDiscount,
  calculateTierFinalPrice,
  getApplicableTierForRole
} from '../../utils/quantityTiersUtils';
import BarcodeScannerModal from './BarcodeScannerModal';
import HexColorPicker, { getBeautyShadeName } from '../common/HexColorPicker';
import { getProductAttributeSuggestions } from '../../utils/attributeMasterData';
import { generateProductDescription } from '../../utils/productDescriptionGenerator';
import SearchableSelect from '../common/SearchableSelect';
import DynamicVariantBuilder from './DynamicVariantBuilder';
import { useHardwareBarcodeScanner } from '../../utils/useHardwareBarcodeScanner';
import { Table, FileSpreadsheet } from 'lucide-react';
import { BulkProductEntryModal } from './BulkProductEntryModal';
import { ExcelImportModal } from './ExcelImportModal';
import { BarcodeLookupReviewModal } from './BarcodeLookupReviewModal';
import BrandFormModal from '../brands/BrandFormModal';
import { lookupBarcodeData } from '../../services/barcodeLookupService';
import { extractColorsFromImage, matchBeautyShade } from '../../services/aiColorService';
import {
  isShadeApplicable,
  getSubcategoriesForCategory,
  getVariantTypesForCategory,
  getCategoryAttributes,
  hexToRgbString,
  rgbToHex
} from '../../services/productEngineService';

export default function AddNewProductPage({
  onNavigateBack,
  initialProductName = '',
  initialBarcode = '',
  initialBarcodeFormat = '',
  initialCategory = '',
  initialSubcategory = '',
  initialSelectCategory = '',
  editingProduct = null
}) {
  const {
    products = [],
    brands = [],
    categories = [],
    addProduct,
    addBrand,
    saveBulkProducts,
    updateProduct,
    checkBarcodeInSupabase,
    uploadProductImage,
    DEFAULT_PRICING_RULES: contextDefaultPricingRules,
    pricingRules
  } = useAdmin();

  const [isInlineAddBrandOpen, setIsInlineAddBrandOpen] = useState(false);

  // Master Entry & Enrichment Modals State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [barcodeLookupModalOpen, setBarcodeLookupModalOpen] = useState(false);
  const [barcodeLookupResult, setBarcodeLookupResult] = useState(null);
  const [isSearchingBarcodeInfo, setIsSearchingBarcodeInfo] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: initialProductName || '',
    brandName: '',
    brandId: '',
    category: initialCategory || '',
    subcategory: initialSubcategory || '',
    variantType: 'Standard',
    shadeName: '',
    hexColor: '',
    rgb: '',
    size: '',
    gstPercent: '18',
    netQty: '',
    categoryAttributes: {},
    description: '',
    sku: '',
    barcode: initialBarcode || '',
    barcode_format: initialBarcodeFormat || '',
    mrp: '',
    generalPrice: '',
    salonPrice: '',
    artistPrice: '',
    beauticianPrice: '',
    image: '',
    images: [],
    status: editingProduct ? (editingProduct.status || editingProduct.additionalInfo?.status || 'published') : 'published',
    isFeatured: editingProduct ? Boolean(editingProduct.isFeatured || editingProduct.additionalInfo?.isFeatured) : true,
    featuredPriority: editingProduct ? Number(editingProduct.featuredPriority || editingProduct.additionalInfo?.featuredPriority || 0) : 0,
    isTrending: editingProduct ? Boolean(editingProduct.isTrending || editingProduct.additionalInfo?.trendingPriority || 0) : false,
    trendingPriority: editingProduct ? Number(editingProduct.trendingPriority || editingProduct.additionalInfo?.trendingPriority || 0) : 0,
    rating: editingProduct ? Number(editingProduct.rating || editingProduct.additionalInfo?.rating || 4.5) : 4.8,
    reviewCount: editingProduct ? Number(editingProduct.reviewCount || editingProduct.additionalInfo?.reviewCount || 120) : 120,
    showInNewArrivals: editingProduct ? (editingProduct.showInNewArrivals !== false && editingProduct.additionalInfo?.showInNewArrivals !== false) : true,
    isRecommended: editingProduct ? Boolean(editingProduct.isRecommended || editingProduct.additionalInfo?.isRecommended) : true,
    publishedAt: editingProduct ? (editingProduct.publishedAt || editingProduct.additionalInfo?.publishedAt || null) : null,
    shades: [],
    quantityTiers: getDefaultQuantityTiers(),
    searchKeywords: initialSelectCategory ? [initialSelectCategory] : [],
    searchAliases: [],
    keyPoints: [],
    benefits: [],
    highlights: [],
    ingredients: { keyIngredients: [], fullList: '' },
    howToUse: '',
    specifications: {},
    additionalInfo: {},
    seoTitle: '',
    metaDescription: '',
    urlSlug: ''
  });

  // Active Brands list for dropdown: includes active brands plus current selection
  const activeBrandOptions = useMemo(() => {
    return (brands || []).filter(b => {
      return b.enabled !== false || b.id === formData.brandId || b.name === formData.brandName;
    });
  }, [brands, formData.brandId, formData.brandName]);

  // Role discount percentages for all 4 roles
  const [roleDiscounts, setRoleDiscounts] = useState({
    general: '0',
    salon: '10',
    artist: '15',
    beautician: '20'
  });

  // Variant enable/disable state
  const [hasVariants, setHasVariants] = useState(() => {
    if (editingProduct) {
      const s = editingProduct.shades || editingProduct.variants || [];
      return s.length > 0;
    }
    return false;
  });

  // Customer Role switcher in live preview (allows viewing exact customer experience)
  const [previewCustomerRole, setPreviewCustomerRole] = useState('general');

  // Selected role for the live pricing simulator tab
  const [previewRole, setPreviewRole] = useState('general');
  // Sample order quantity input for unit calculation
  const [sampleQty, setSampleQty] = useState('10');

  // Selected variant for preview (null = parent product)
  const [selectedVariantPreviewIndex, setSelectedVariantPreviewIndex] = useState(null);

  // Active quantity tiers role tab: 'general' | 'salon' | 'artist' | 'beautician'
  const [activeTierRole, setActiveTierRole] = useState('general');

  // Dynamic Attributes Inline Expansion State
  const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);

  // Parent Product / Child Products Configuration State
  const [isParentProduct, setIsParentProduct] = useState(() => {
    if (editingProduct) {
      return Boolean(editingProduct.isParentProduct || (editingProduct.shades && editingProduct.shades.length > 0) || editingProduct.is_parent);
    }
    return false;
  });

  const [childProducts, setChildProducts] = useState(() => {
    if (editingProduct && Array.isArray(editingProduct.shades) && editingProduct.shades.length > 0) {
      return editingProduct.shades.map((s, idx) => ({
        id: s.id || `child_${Date.now()}_${idx}`,
        name: s.name || `Child Product ${idx + 1}`,
        barcode: s.barcode || '',
        barcode_format: s.barcode_format || '',
        sku: s.sku || '',
        image: s.image || '',
        images: Array.isArray(s.images) ? s.images : (s.image ? [s.image] : []),
        hexColor: s.hexColor || '#CE4270',
        mrp: s.mrp !== undefined ? String(s.mrp) : (editingProduct.mrp !== undefined ? String(editingProduct.mrp) : ''),
        generalPrice: s.generalPrice !== undefined ? String(s.generalPrice) : '',
        salonPrice: s.salonPrice !== undefined ? String(s.salonPrice) : '',
        artistPrice: s.artistPrice !== undefined ? String(s.artistPrice) : '',
        beauticianPrice: s.beauticianPrice !== undefined ? String(s.beauticianPrice) : '',
        roleDiscounts: s.roleDiscounts || { general: '0', salon: '10', artist: '15', beautician: '20' },
        quantityTiers: s.quantityTiers ? normalizeQuantityTiers(s.quantityTiers) : getDefaultQuantityTiers(),
        attributes: s.attributes || {},
        isExpanded: true,
        activeTierRole: 'general'
      }));
    }
    return [];
  });

  // External Image URL input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Barcode Verification State
  const [barcodeStatus, setBarcodeStatus] = useState({
    isChecking: false,
    exists: false,
    checkedBarcode: '',
    matchedProduct: null,
    formatError: null
  });
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [barcodeScannerTarget, setBarcodeScannerTarget] = useState(null); // null = main, number = variant index
  const [hardwareScanAlert, setHardwareScanAlert] = useState(null);

  // Form submission & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Persistent Draft State
  const DRAFT_STORAGE_KEY = editingProduct?.id ? `salbeau_edit_draft_${editingProduct.id}` : 'salbeau_add_product_draft';
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);
  const [draftLastSaved, setDraftLastSaved] = useState(null);

  // Image Drag & Drop / Upload state
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedPreviewImageIndex, setSelectedPreviewImageIndex] = useState(0);

  // Field-level error validation mapping
  const [fieldErrors, setFieldErrors] = useState({});

  // Fix: Prevent any mouse-wheel, hover, scrolling, or cursor arrow keys from altering number input values
  useEffect(() => {
    const handleGlobalWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    const handleGlobalKeyDown = (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Load persisted draft from localStorage on mount (only for new products or when draft exists)
  useEffect(() => {
    if (!editingProduct) {
      try {
        const savedDraftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraftStr) {
          const savedDraft = JSON.parse(savedDraftStr);
          if (savedDraft && savedDraft.formData) {
            setFormData(prev => ({ ...prev, ...savedDraft.formData }));
            if (savedDraft.roleDiscounts) {
              setRoleDiscounts(savedDraft.roleDiscounts);
            }
            if (savedDraft.hasVariants !== undefined) {
              setHasVariants(savedDraft.hasVariants);
            }
            setDraftRestoredNotice(true);
            if (savedDraft.savedAt) {
              setDraftLastSaved(new Date(savedDraft.savedAt).toLocaleTimeString());
            }
          }
        }
      } catch (err) {
        console.warn('Failed restoring draft from localStorage:', err);
      }
    }
  }, [DRAFT_STORAGE_KEY, editingProduct]);

  // Auto-persist draft to localStorage when data changes
  useEffect(() => {
    if (formSuccess) return;
    const timer = setTimeout(() => {
      const hasContent = Boolean(
        formData.name?.trim() ||
        formData.barcode?.trim() ||
        formData.mrp ||
        formData.description?.trim() ||
        (formData.images && formData.images.length > 0) ||
        (formData.shades && formData.shades.length > 0)
      );
      if (hasContent) {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
            formData,
            roleDiscounts,
            hasVariants,
            savedAt: Date.now()
          }));
          setDraftLastSaved(new Date().toLocaleTimeString());
        } catch (e) {
          console.warn('Error saving draft to localStorage:', e);
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, roleDiscounts, hasVariants, DRAFT_STORAGE_KEY, formSuccess]);

  // Clear draft storage helper
  const clearDraftStorage = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftRestoredNotice(false);
      setDraftLastSaved(null);
    } catch (e) {
      console.warn('Error clearing draft:', e);
    }
  };

  // Auto-detect variant attributes based on product context
  const autoDetectedAttributes = useMemo(() => {
    if (!formData.name && !formData.category && !formData.subcategory) {
      return [];
    }
    const suggestion = getProductAttributeSuggestions({
      category: formData.category,
      subcategory: formData.subcategory,
      productType: formData.subcategory,
      productName: formData.name
    });
    return suggestion.defaultAutoSelect || [];
  }, [formData.name, formData.category, formData.subcategory]);

  // Initial brand selection
  useEffect(() => {
    if (brands && brands.length > 0 && !formData.brandName) {
      setFormData(prev => ({
        ...prev,
        brandName: brands[0].name,
        brandId: brands[0].id || ''
      }));
    }
  }, [brands]);

  // Initial category selection
  useEffect(() => {
    if (categories && categories.length > 0 && !formData.category) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].name || categories[0].title || 'Makeup'
      }));
    }
  }, [categories]);

  // Sync editing product if passed
  useEffect(() => {
    if (editingProduct) {
      const imgs = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
        ? editingProduct.images
        : (editingProduct.image ? [editingProduct.image] : []);

      setFormData(prev => ({
        ...prev,
        id: editingProduct.id,
        name: editingProduct.name || '',
        brandName: editingProduct.brandName || editingProduct.brand || prev.brandName,
        brandId: editingProduct.brandId || prev.brandId,
        category: editingProduct.category || prev.category,
        subcategory: editingProduct.subcategory || '',
        description: editingProduct.description || '',
        sku: editingProduct.sku || '',
        barcode: editingProduct.barcode || prev.barcode,
        barcode_format: editingProduct.barcode_format || prev.barcode_format,
        mrp: editingProduct.mrp !== undefined && editingProduct.mrp !== null ? String(editingProduct.mrp) : '',
        generalPrice: editingProduct.generalPrice !== undefined && editingProduct.generalPrice !== null ? String(editingProduct.generalPrice) : '',
        salonPrice: editingProduct.salonPrice !== undefined && editingProduct.salonPrice !== null ? String(editingProduct.salonPrice) : '',
        artistPrice: editingProduct.artistPrice !== undefined && editingProduct.artistPrice !== null ? String(editingProduct.artistPrice) : '',
        beauticianPrice: editingProduct.beauticianPrice !== undefined && editingProduct.beauticianPrice !== null ? String(editingProduct.beauticianPrice) : '',
        image: editingProduct.image || (imgs[0] || ''),
        images: imgs,
        status: editingProduct.status || editingProduct.additionalInfo?.status || 'published',
        isFeatured: Boolean(editingProduct.isFeatured || editingProduct.additionalInfo?.isFeatured),
        featuredPriority: Number(editingProduct.featuredPriority || editingProduct.additionalInfo?.featuredPriority || 0),
        isTrending: Boolean(editingProduct.isTrending || editingProduct.additionalInfo?.isTrending),
        trendingPriority: Number(editingProduct.trendingPriority || editingProduct.additionalInfo?.trendingPriority || 0),
        rating: Number(editingProduct.rating || editingProduct.additionalInfo?.rating || 4.5),
        reviewCount: Number(editingProduct.reviewCount || editingProduct.additionalInfo?.reviewCount || 120),
        showInNewArrivals: editingProduct.showInNewArrivals !== false && editingProduct.additionalInfo?.showInNewArrivals !== false,
        isRecommended: Boolean(editingProduct.isRecommended || editingProduct.additionalInfo?.isRecommended),
        publishedAt: editingProduct.publishedAt || editingProduct.additionalInfo?.publishedAt || null,
        shades: editingProduct.shades ? [...editingProduct.shades] : (editingProduct.variants ? [...editingProduct.variants] : []),
        quantityTiers: editingProduct.quantityTiers || prev.quantityTiers,
        searchKeywords: Array.isArray(editingProduct.searchKeywords) ? editingProduct.searchKeywords : [],
        searchAliases: Array.isArray(editingProduct.searchAliases) ? editingProduct.searchAliases : [],
        keyPoints: Array.isArray(editingProduct.keyPoints) ? editingProduct.keyPoints : [],
        benefits: Array.isArray(editingProduct.benefits) ? editingProduct.benefits : [],
        highlights: Array.isArray(editingProduct.highlights) ? editingProduct.highlights : [],
        variantType: editingProduct.variantType || editingProduct.additionalInfo?.variantType || 'Standard',
        shadeName: editingProduct.shadeName || editingProduct.shades?.[0]?.name || '',
        hexColor: editingProduct.hexColor || editingProduct.shades?.[0]?.hexColor || '',
        rgb: editingProduct.rgb || hexToRgbString(editingProduct.hexColor || editingProduct.shades?.[0]?.hexColor || ''),
        size: editingProduct.size || editingProduct.specifications?.size || editingProduct.additionalInfo?.size || '',
        gstPercent: String(editingProduct.gst ?? editingProduct.gst_percent ?? editingProduct.specifications?.gst ?? editingProduct.additionalInfo?.gst ?? '18'),
        netQty: editingProduct.net_qty || editingProduct.netQty || editingProduct.specifications?.netQty || editingProduct.additionalInfo?.netQty || '',
        categoryAttributes: editingProduct.categoryAttributes || editingProduct.additionalInfo?.categoryAttributes || {},
        specifications: typeof editingProduct.specifications === 'object' && editingProduct.specifications ? editingProduct.specifications : {}
      }));

      if (editingProduct.discountPercentages) {
        setRoleDiscounts({
          general: String(editingProduct.discountPercentages.general ?? '0'),
          salon: String(editingProduct.discountPercentages.salon ?? '10'),
          artist: String(editingProduct.discountPercentages.artist ?? '15'),
          beautician: String(editingProduct.discountPercentages.beautician ?? '20')
        });
      }

      const existingVars = editingProduct.shades || editingProduct.variants || [];
      setHasVariants(existingVars.length > 0);
    }
  }, [editingProduct]);

  // Searchable Category options
  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(c => ({
        id: c.id || c.name || c.title,
        name: c.name || c.title
      }));
    }
    return [
      { id: 'Makeup', name: 'Makeup' },
      { id: 'Skincare', name: 'Skincare' },
      { id: 'Hair Care', name: 'Hair Care' },
      { id: 'Fragrance', name: 'Fragrance' },
      { id: 'Tools', name: 'Tools' }
    ];
  }, [categories]);

  // Dynamic Dependent Subcategories based on Selected Category
  const availableSubcategories = useMemo(() => {
    const list = getSubcategoriesForCategory(formData.category);
    if (formData.subcategory && !list.includes(formData.subcategory)) {
      return [{ id: formData.subcategory, name: formData.subcategory }, ...list.map(s => ({ id: s, name: s }))];
    }
    return list.map(s => ({ id: s, name: s }));
  }, [formData.category, formData.subcategory]);

  // Dynamic Variant Types based on Category / Subcategory
  const availableVariantTypes = useMemo(() => {
    const list = getVariantTypesForCategory(formData.category, formData.subcategory);
    if (formData.variantType && !list.includes(formData.variantType)) {
      return [{ id: formData.variantType, name: formData.variantType }, ...list.map(v => ({ id: v, name: v }))];
    }
    return list.map(v => ({ id: v, name: v }));
  }, [formData.category, formData.subcategory, formData.variantType]);

  // Category-Specific Dynamic Attributes
  const dynamicCategoryAttributes = useMemo(() => {
    return getCategoryAttributes(formData.category, formData.subcategory);
  }, [formData.category, formData.subcategory]);

  // Shade-applicability flag (strictly false for skincare, haircare, fragrance, tools)
  const shadeApplicable = useMemo(() => {
    return isShadeApplicable(formData.category, formData.subcategory);
  }, [formData.category, formData.subcategory]);

  // Real-time Barcode Verification
  const barcodeCheckTimeoutRef = useRef(null);

  const performBarcodeVerification = async (rawCode, { immediate = false } = {}) => {
    if (barcodeCheckTimeoutRef.current) {
      clearTimeout(barcodeCheckTimeoutRef.current);
      barcodeCheckTimeoutRef.current = null;
    }

    const cleanBarcode = normalizeBarcode(rawCode);
    if (!cleanBarcode) {
      setBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: '',
        matchedProduct: null,
        formatError: null
      });
      return;
    }

    const formatCheck = validateBarcodeFormat(cleanBarcode);
    if (!formatCheck.isValid) {
      setBarcodeStatus({
        isChecking: false,
        exists: false,
        checkedBarcode: cleanBarcode,
        matchedProduct: null,
        formatError: formatCheck.error
      });
      return;
    }

    setBarcodeStatus(prev => ({
      ...prev,
      isChecking: true,
      formatError: null,
      checkedBarcode: cleanBarcode
    }));

    const executeCheck = async () => {
      try {
        const check = await checkBarcodeInSupabase(cleanBarcode, editingProduct?.id);
        const exists = Boolean(check && check.exists);
        setBarcodeStatus({
          isChecking: false,
          exists,
          checkedBarcode: cleanBarcode,
          matchedProduct: check?.product || null,
          formatError: null
        });

        // Unified Barcode Autofill Engine: If barcode does not exist in Supabase, automatically query configured external sources
        if (!exists && !editingProduct && cleanBarcode.length >= 8) {
          setIsSearchingBarcodeInfo(true);
          try {
            const externalData = await lookupBarcodeData(cleanBarcode);
            if (externalData && (externalData.productName || externalData.brand)) {
              setFormData(prev => ({
                ...prev,
                name: prev.name || externalData.productName || '',
                brandName: prev.brandName || externalData.brand || '',
                category: prev.category || externalData.category || '',
                subcategory: prev.subcategory || externalData.subcategory || '',
                image: prev.image || externalData.image || '',
                images: prev.images?.length > 0 ? prev.images : (externalData.image ? [externalData.image] : []),
                description: prev.description || externalData.description || ''
              }));
              setHardwareScanAlert(`Auto-filled product info for barcode ${cleanBarcode} from verified database.`);
              setTimeout(() => setHardwareScanAlert(null), 5000);
            }
          } catch (lookupErr) {
            console.log('Automatic barcode lookup info:', lookupErr);
          } finally {
            setIsSearchingBarcodeInfo(false);
          }
        }
      } catch (err) {
        setBarcodeStatus({
          isChecking: false,
          exists: false,
          checkedBarcode: cleanBarcode,
          matchedProduct: null,
          formatError: null
        });
      }
    };

    if (immediate) {
      executeCheck();
    } else {
      barcodeCheckTimeoutRef.current = setTimeout(executeCheck, 400);
    }
  };

  // Hardware Barcode Scanner listener (USB wired, Bluetooth HID, wireless dongles)
  useHardwareBarcodeScanner({
    enabled: true,
    onScan: (scannedCode) => {
      const cleanCode = normalizeBarcode(scannedCode);
      setHardwareScanAlert(`Scanned Barcode: ${cleanCode}`);
      setTimeout(() => setHardwareScanAlert(null), 4000);

      if (isBarcodeScannerOpen && barcodeScannerTarget !== null) {
        if (typeof barcodeScannerTarget === 'number' && childProducts && childProducts[barcodeScannerTarget]) {
          handleUpdateChildField(barcodeScannerTarget, 'barcode', cleanCode);
        }
        setIsBarcodeScannerOpen(false);
        setBarcodeScannerTarget(null);
        return;
      }

      setFormData(prev => ({ ...prev, barcode: cleanCode }));
      performBarcodeVerification(cleanCode, { immediate: true });
    }
  });

  // Check initial barcode if provided
  useEffect(() => {
    if (initialBarcode) {
      performBarcodeVerification(initialBarcode, { immediate: true });
    }
  }, [initialBarcode]);

  // Barcode External Database Lookup Handler
  const handleFindProductInfoFromBarcode = async () => {
    const raw = (formData.barcode || '').trim();
    if (!raw) {
      alert('Please enter or scan a barcode first.');
      return;
    }
    setIsSearchingBarcodeInfo(true);
    try {
      const res = await lookupBarcodeData(raw);
      setBarcodeLookupResult(res);
      setBarcodeLookupModalOpen(true);
    } catch (e) {
      alert(`Barcode lookup error: ${e.message}`);
    } finally {
      setIsSearchingBarcodeInfo(false);
    }
  };

  const handleAcceptBarcodeInfo = (detectedData) => {
    setFormData(prev => ({
      ...prev,
      name: detectedData.productName || prev.name,
      brandName: detectedData.brand || prev.brandName,
      category: detectedData.category || prev.category,
      subcategory: detectedData.subcategory || prev.subcategory,
      image: detectedData.image || prev.image,
      images: detectedData.image ? [detectedData.image, ...(prev.images || [])] : prev.images,
      description: detectedData.description || prev.description
    }));
  };

  // Pricing calculations & handlers
  const handleMrpChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, mrp: val };
      const numMrp = Number(val);
      if (!isNaN(numMrp) && numMrp > 0) {
        const genPct = Number(roleDiscounts.general) || 0;
        const salPct = Number(roleDiscounts.salon) || 10;
        const artPct = Number(roleDiscounts.artist) || 15;
        const btyPct = Number(roleDiscounts.beautician) || 20;

        updated.generalPrice = String(Math.max(0, Math.round(numMrp * (1 - genPct / 100))));
        updated.salonPrice = String(Math.max(0, Math.round(numMrp * (1 - salPct / 100))));
        updated.artistPrice = String(Math.max(0, Math.round(numMrp * (1 - artPct / 100))));
        updated.beauticianPrice = String(Math.max(0, Math.round(numMrp * (1 - btyPct / 100))));
      }
      return updated;
    });
    if (fieldErrors.mrp) {
      setFieldErrors(prev => ({ ...prev, mrp: null }));
    }
  };

  const handleRoleDiscountChange = (roleKey, pct) => {
    setRoleDiscounts(prev => {
      const updated = { ...prev, [roleKey]: pct };
      const base = Number(formData.mrp);
      if (!isNaN(base) && base > 0) {
        const priceFieldMap = {
          general: 'generalPrice',
          salon: 'salonPrice',
          artist: 'artistPrice',
          beautician: 'beauticianPrice'
        };
        const fieldName = priceFieldMap[roleKey];
        if (fieldName) {
          const newPrice = pct !== '' && !isNaN(Number(pct))
            ? Math.max(0, Math.round(base * (1 - Number(pct) / 100)))
            : base;
          setFormData(f => ({ ...f, [fieldName]: String(newPrice) }));
        }
      }
      return updated;
    });
  };

  const handleRolePriceChange = (roleKey, priceVal) => {
    const numPrice = Number(priceVal);
    const base = Number(formData.mrp);
    const priceFieldMap = {
      general: 'generalPrice',
      salon: 'salonPrice',
      artist: 'artistPrice',
      beautician: 'beauticianPrice'
    };
    const fieldName = priceFieldMap[roleKey];
    setFormData(prev => ({ ...prev, [fieldName]: priceVal }));

    if (base > 0 && !isNaN(numPrice) && numPrice <= base) {
      const calculatedPct = Math.round((1 - numPrice / base) * 100);
      setRoleDiscounts(prev => ({ ...prev, [roleKey]: String(calculatedPct) }));
    }
  };

  // Base price for active role
  const getActiveRoleBasePrice = (roleId) => {
    const mrpNum = Number(formData.mrp) || 0;
    const priceMap = {
      general: formData.generalPrice,
      salon: formData.salonPrice,
      artist: formData.artistPrice,
      beautician: formData.beauticianPrice
    };
    const val = priceMap[roleId];
    if (val !== undefined && val !== '' && !isNaN(Number(val))) {
      return Number(val);
    }
    const pct = Number(roleDiscounts[roleId]) || 0;
    return Math.max(0, Math.round(mrpNum * (1 - pct / 100)));
  };

  // Images Management (No Base64 fallback trap: strictly Supabase Storage or external HTTPS URLs)
  const handleAddImageUrl = (url) => {
    if (!url) return;
    setFormData(prev => {
      const currentImgs = Array.isArray(prev.images) ? [...prev.images] : [];
      if (!currentImgs.includes(url)) {
        currentImgs.push(url);
      }
      return {
        ...prev,
        images: currentImgs,
        image: prev.image || currentImgs[0] || ''
      };
    });
    setImageError(null);
  };

  const handleSetPrimaryImage = (index) => {
    setFormData(prev => {
      const currentImgs = [...(prev.images || [])];
      if (index >= 0 && index < currentImgs.length) {
        const [selected] = currentImgs.splice(index, 1);
        currentImgs.unshift(selected);
        return {
          ...prev,
          image: selected,
          images: currentImgs
        };
      }
      return prev;
    });
    setSelectedPreviewImageIndex(0);
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const currentImgs = [...(prev.images || [])];
      currentImgs.splice(index, 1);
      return {
        ...prev,
        images: currentImgs,
        image: currentImgs[0] || ''
      };
    });
    setSelectedPreviewImageIndex(0);
  };

  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    setImageError(null);
    setIsUploadingImage(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setImageError(`Skipped "${file.name}": Only image files (PNG, JPG, WebP) are supported.`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setImageError(`File "${file.name}" exceeds 10MB limit.`);
          continue;
        }

        try {
          if (uploadProductImage) {
            const uploadedUrl = await uploadProductImage(file);
            if (uploadedUrl) {
              handleAddImageUrl(uploadedUrl);
              continue;
            }
          }
          setImageError('Image upload failed. Storage bucket unavailable. Please provide an image URL instead.');
        } catch (err) {
          console.error('Image upload failed:', err);
          setImageError(`Upload error for "${file.name}": ${err.message || 'Please check your connection and try again.'}`);
        }
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddFromUrl = async () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setImageError('Please enter a valid image URL starting with http:// or https://');
      return;
    }
    setIsUploadingImage(true);
    try {
      if (uploadProductImage) {
        const optimizedUrl = await uploadProductImage(trimmed);
        handleAddImageUrl(optimizedUrl || trimmed);
      } else {
        handleAddImageUrl(trimmed);
      }
    } catch (e) {
      handleAddImageUrl(trimmed);
    } finally {
      setIsUploadingImage(false);
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleOpenImageSearch = () => {
    const parts = [formData.brandName, formData.name, formData.category].filter(Boolean);
    const query = parts.length > 0 ? parts.join(' ') : 'cosmetics makeup product';
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Quantity Tiers for all 4 roles (General User, Salon Owner, Makeup Artist, Beautician)
  const currentRoleTiers = useMemo(() => {
    const all = normalizeQuantityTiers(formData.quantityTiers);
    return all[activeTierRole] || [];
  }, [formData.quantityTiers, activeTierRole]);

  // Inline Tier Handlers for Main Product
  const handleAddPresetTier = (role, minQty, maxQty, discountPercent) => {
    setFormData(prev => {
      const normalized = normalizeQuantityTiers(prev.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      const existingIdx = roleList.findIndex(t => Number(t.minQty) === Number(minQty));
      const newTier = {
        id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        minQty: Number(minQty),
        maxQty: maxQty !== null && maxQty !== undefined && maxQty !== '' ? Number(maxQty) : null,
        additionalDiscount: Number(discountPercent)
      };
      if (existingIdx >= 0) {
        roleList[existingIdx] = newTier;
      } else {
        roleList.push(newTier);
      }
      roleList.sort((a, b) => Number(a.minQty) - Number(b.minQty));
      return {
        ...prev,
        quantityTiers: {
          ...normalized,
          [role]: roleList
        }
      };
    });
  };

  const handleAddBlankTier = (role) => {
    setFormData(prev => {
      const normalized = normalizeQuantityTiers(prev.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      const lastTier = roleList[roleList.length - 1];
      const nextMin = lastTier ? (lastTier.maxQty ? Number(lastTier.maxQty) + 1 : Number(lastTier.minQty) + 5) : 1;
      const newTier = {
        id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        minQty: nextMin,
        maxQty: nextMin + 4,
        additionalDiscount: lastTier ? Math.min(100, Number(lastTier.additionalDiscount) + 3) : 5
      };
      roleList.push(newTier);
      roleList.sort((a, b) => Number(a.minQty) - Number(b.minQty));
      return {
        ...prev,
        quantityTiers: {
          ...normalized,
          [role]: roleList
        }
      };
    });
  };

  const handleUpdateTierField = (role, index, field, val) => {
    setFormData(prev => {
      const normalized = normalizeQuantityTiers(prev.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      if (!roleList[index]) return prev;
      roleList[index] = {
        ...roleList[index],
        [field]: val === '' ? (field === 'maxQty' ? null : '') : (field === 'additionalDiscount' || field === 'minQty' || field === 'maxQty' ? Number(val) : val)
      };
      return {
        ...prev,
        quantityTiers: {
          ...normalized,
          [role]: roleList
        }
      };
    });
  };

  const handleDeleteTier = (role, index) => {
    setFormData(prev => {
      const normalized = normalizeQuantityTiers(prev.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      roleList.splice(index, 1);
      return {
        ...prev,
        quantityTiers: {
          ...normalized,
          [role]: roleList
        }
      };
    });
  };

  // Child Products Management Handlers
  const handleAddChildProduct = () => {
    const parentMrp = formData.mrp || '';
    const parentGen = formData.generalPrice || '';
    const parentSal = formData.salonPrice || '';
    const parentArt = formData.artistPrice || '';
    const parentBeau = formData.beauticianPrice || '';
    const newIdx = childProducts.length + 1;
    const newChild = {
      id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `Variant ${newIdx}`,
      barcode: '',
      barcode_format: '',
      sku: formData.sku ? `${formData.sku}-V${newIdx}` : '',
      image: formData.image || (formData.images && formData.images[0]) || '',
      images: formData.images && formData.images.length > 0 ? [...formData.images] : [],
      hexColor: '#CE4270',
      mrp: parentMrp,
      generalPrice: parentGen,
      salonPrice: parentSal,
      artistPrice: parentArt,
      beauticianPrice: parentBeau,
      roleDiscounts: { ...roleDiscounts },
      quantityTiers: JSON.parse(JSON.stringify(normalizeQuantityTiers(formData.quantityTiers))),
      attributes: { ...(formData.categoryAttributes || {}) },
      isExpanded: true,
      activeTierRole: 'general'
    };
    setChildProducts(prev => [...prev, newChild]);
    if (!isParentProduct) setIsParentProduct(true);
  };

  const handleRemoveChildProduct = (index) => {
    setChildProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleChildExpand = (index) => {
    setChildProducts(prev => prev.map((c, idx) => idx === index ? { ...c, isExpanded: !c.isExpanded } : c));
  };

  const handleUpdateChildField = (index, field, val) => {
    setChildProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleChildRolePriceChange = (childIndex, role, val) => {
    setChildProducts(prev => {
      const updated = [...prev];
      const child = { ...updated[childIndex] };
      const mrpNum = Number(child.mrp || formData.mrp || 0);
      const fieldMap = {
        general: 'generalPrice',
        salon: 'salonPrice',
        artist: 'artistPrice',
        beautician: 'beauticianPrice'
      };
      const fieldName = fieldMap[role];
      child[fieldName] = val;
      if (mrpNum > 0 && val !== '') {
        const pNum = Number(val);
        const disc = Math.max(0, Math.min(100, Math.round(((mrpNum - pNum) / mrpNum) * 100)));
        child.roleDiscounts = { ...(child.roleDiscounts || {}), [role]: String(disc) };
      }
      updated[childIndex] = child;
      return updated;
    });
  };

  const handleChildAddPresetTier = (childIndex, role, minQty, maxQty, discountPercent) => {
    setChildProducts(prev => {
      const updated = [...prev];
      const child = { ...updated[childIndex] };
      const normalized = normalizeQuantityTiers(child.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      const existingIdx = roleList.findIndex(t => Number(t.minQty) === Number(minQty));
      const newTier = {
        id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        minQty: Number(minQty),
        maxQty: maxQty !== null && maxQty !== undefined && maxQty !== '' ? Number(maxQty) : null,
        additionalDiscount: Number(discountPercent)
      };
      if (existingIdx >= 0) {
        roleList[existingIdx] = newTier;
      } else {
        roleList.push(newTier);
      }
      roleList.sort((a, b) => Number(a.minQty) - Number(b.minQty));
      child.quantityTiers = { ...normalized, [role]: roleList };
      updated[childIndex] = child;
      return updated;
    });
  };

  const handleChildAddBlankTier = (childIndex, role) => {
    setChildProducts(prev => {
      const updated = [...prev];
      const child = { ...updated[childIndex] };
      const normalized = normalizeQuantityTiers(child.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      const lastTier = roleList[roleList.length - 1];
      const nextMin = lastTier ? (lastTier.maxQty ? Number(lastTier.maxQty) + 1 : Number(lastTier.minQty) + 5) : 1;
      const newTier = {
        id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        minQty: nextMin,
        maxQty: nextMin + 4,
        additionalDiscount: lastTier ? Math.min(100, Number(lastTier.additionalDiscount) + 3) : 5
      };
      roleList.push(newTier);
      roleList.sort((a, b) => Number(a.minQty) - Number(b.minQty));
      child.quantityTiers = { ...normalized, [role]: roleList };
      updated[childIndex] = child;
      return updated;
    });
  };

  const handleChildUpdateTierField = (childIndex, role, tierIndex, field, val) => {
    setChildProducts(prev => {
      const updated = [...prev];
      const child = { ...updated[childIndex] };
      const normalized = normalizeQuantityTiers(child.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      if (!roleList[tierIndex]) return prev;
      roleList[tierIndex] = {
        ...roleList[tierIndex],
        [field]: val === '' ? (field === 'maxQty' ? null : '') : (field === 'additionalDiscount' || field === 'minQty' || field === 'maxQty' ? Number(val) : val)
      };
      child.quantityTiers = { ...normalized, [role]: roleList };
      updated[childIndex] = child;
      return updated;
    });
  };

  const handleChildDeleteTier = (childIndex, role, tierIndex) => {
    setChildProducts(prev => {
      const updated = [...prev];
      const child = { ...updated[childIndex] };
      const normalized = normalizeQuantityTiers(child.quantityTiers);
      const roleList = [...(normalized[role] || [])];
      roleList.splice(tierIndex, 1);
      child.quantityTiers = { ...normalized, [role]: roleList };
      updated[childIndex] = child;
      return updated;
    });
  };

  // Determine if form is dirty
  const isDirty = useMemo(() => {
    if (formSuccess) return false;
    if (editingProduct) {
      return (
        formData.name !== (editingProduct.name || '') ||
        formData.barcode !== (editingProduct.barcode || '') ||
        String(formData.mrp) !== String(editingProduct.mrp || '') ||
        formData.description !== (editingProduct.description || '') ||
        formData.brandName !== (editingProduct.brandName || editingProduct.brand || '') ||
        formData.category !== (editingProduct.category || '') ||
        formData.subcategory !== (editingProduct.subcategory || '') ||
        (formData.images?.length || 0) !== (editingProduct.images?.length || 0) ||
        (formData.shades?.length || 0) !== ((editingProduct.shades || editingProduct.variants)?.length || 0)
      );
    }
    return Boolean(
      formData.name.trim() ||
      formData.barcode.trim() ||
      formData.mrp ||
      formData.description.trim() ||
      formData.image ||
      (formData.images && formData.images.length > 0) ||
      (formData.shades && formData.shades.length > 0)
    );
  }, [formData, editingProduct, formSuccess]);

  // Window beforeunload guard against accidental tab close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Safe Navigation Back
  const handleBackClick = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onNavigateBack();
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Product Name is required.';
    }
    if (!formData.mrp || Number(formData.mrp) <= 0) {
      errors.mrp = 'Base MRP price must be greater than 0.';
    }

    const mrpNum = Number(formData.mrp);
    const generalPriceNum = formData.generalPrice ? Number(formData.generalPrice) : getActiveRoleBasePrice('general');

    if (generalPriceNum > mrpNum) {
      errors.generalPrice = `General User Price (₹${generalPriceNum}) cannot exceed Base MRP (₹${mrpNum}).`;
    }

    const barcodeVal = formData.barcode ? formData.barcode.trim() : '';
    if (barcodeVal) {
      const formatCheck = validateBarcodeFormat(barcodeVal);
      if (!formatCheck.isValid) {
        errors.barcode = `Invalid Barcode: ${formatCheck.error}`;
      }
      if (barcodeStatus.exists && (!editingProduct || editingProduct.barcode !== barcodeVal)) {
        errors.barcode = 'Duplicate Barcode: Already assigned to another product in the catalog.';
      }
    }

    // Role Quantity Tiers Validation
    const normalizedTiers = normalizeQuantityTiers(formData.quantityTiers);
    for (const roleDef of DISCOUNT_ROLES) {
      const val = validateRoleTiers(normalizedTiers[roleDef.id] || [], roleDef.name);
      if (!val.isValid) {
        errors.tiers = `Quantity Tier Error in ${roleDef.name}: ${val.error}`;
        break;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(Object.values(errors)[0]);
      return false;
    }

    setFieldErrors({});
    setFormError(null);
    return true;
  };

  // Base Save Engine
  const executeSaveProduct = async ({ asDraft = false, newStatus = null }) => {
    const mrpNum = Number(formData.mrp) || 0;
    const generalPriceNum = formData.generalPrice ? Number(formData.generalPrice) : getActiveRoleBasePrice('general');
    const salonPriceNum = formData.salonPrice ? Number(formData.salonPrice) : getActiveRoleBasePrice('salon');
    const artistPriceNum = formData.artistPrice ? Number(formData.artistPrice) : getActiveRoleBasePrice('artist');
    const beauticianPriceNum = formData.beauticianPrice ? Number(formData.beauticianPrice) : getActiveRoleBasePrice('beautician');

    const allImages = formData.images && formData.images.length > 0
      ? formData.images
      : (formData.image ? [formData.image] : []);
    const primaryImage = allImages[0] || formData.image || '';

    const autoSku = formData.sku ? formData.sku.trim() : ('SKU-' + (formData.brandName || 'SAL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-6));

    const sanitizedShades = (isParentProduct && childProducts.length > 0)
      ? childProducts.map((child, idx) => ({
          id: child.id || `child_${Date.now()}_${idx}`,
          name: (child.name || `Variant ${idx + 1}`).trim(),
          sku: child.sku ? child.sku.trim() : `${autoSku}-V${idx + 1}`,
          barcode: child.barcode ? child.barcode.trim() : undefined,
          barcode_format: child.barcode_format || undefined,
          hexColor: child.hexColor || '#CE4270',
          image: child.image || (child.images && child.images[0]) || primaryImage,
          images: child.images && child.images.length > 0 ? child.images : (child.image ? [child.image] : allImages),
          mrp: child.mrp ? Number(child.mrp) : mrpNum,
          generalPrice: child.generalPrice !== undefined && child.generalPrice !== '' ? Number(child.generalPrice) : generalPriceNum,
          salonPrice: child.salonPrice !== undefined && child.salonPrice !== '' ? Number(child.salonPrice) : salonPriceNum,
          artistPrice: child.artistPrice !== undefined && child.artistPrice !== '' ? Number(child.artistPrice) : artistPriceNum,
          beauticianPrice: child.beauticianPrice !== undefined && child.beauticianPrice !== '' ? Number(child.beauticianPrice) : beauticianPriceNum,
          active: true,
          attributes: child.attributes || {},
          roleDiscounts: child.roleDiscounts || roleDiscounts,
          quantityTiers: normalizeQuantityTiers(child.quantityTiers)
        }))
      : (hasVariants ? (formData.shades || []).map((shade, idx) => ({
          id: shade.id || `var_${Date.now()}_${idx}`,
          name: (shade.name || `Variant ${idx + 1}`).trim(),
          code: shade.code ? shade.code.trim() : undefined,
          sku: shade.sku ? shade.sku.trim() : `${autoSku}-V${idx + 1}`,
          barcode: shade.barcode ? shade.barcode.trim() : undefined,
          hexColor: shade.hexColor || (shade.attributes && (shade.attributes.Shade || shade.attributes.Color || shade.attributes.Colour) ? '#CE4270' : undefined),
          image: shade.image || primaryImage,
          images: shade.images || allImages,
          mrp: shade.mrp ? Number(shade.mrp) : mrpNum,
          generalPrice: shade.generalPrice !== undefined && shade.generalPrice !== '' ? Number(shade.generalPrice) : generalPriceNum,
          salonPrice: shade.salonPrice !== undefined && shade.salonPrice !== '' ? Number(shade.salonPrice) : salonPriceNum,
          artistPrice: shade.artistPrice !== undefined && shade.artistPrice !== '' ? Number(shade.artistPrice) : artistPriceNum,
          beauticianPrice: shade.beauticianPrice !== undefined && shade.beauticianPrice !== '' ? Number(shade.beauticianPrice) : beauticianPriceNum,
          active: shade.active !== false,
          attributes: shade.attributes || {}
        })) : []);

    const normalizedTiers = normalizeQuantityTiers(formData.quantityTiers);
    const finalStatus = asDraft ? 'draft' : (newStatus || formData.status || 'published');

    const payload = {
      name: formData.name ? formData.name.trim() : (asDraft ? 'Untitled Draft Product' : 'Untitled Product'),
      parent_id: null,
      brandName: formData.brandName || brands[0]?.name || 'Lakmé',
      brandId: formData.brandId || brands.find(b => b.name === formData.brandName)?.id || '',
      category: formData.category || 'Makeup',
      subcategory: formData.subcategory ? formData.subcategory.trim() : undefined,
      description: formData.description ? formData.description.trim() : undefined,
      sku: autoSku,
      barcode: formData.barcode ? formData.barcode.trim() : '',
      barcode_format: formData.barcode_format || initialBarcodeFormat || undefined,
      mrp: mrpNum,
      generalPrice: generalPriceNum,
      salonPrice: salonPriceNum,
      artistPrice: artistPriceNum,
      beauticianPrice: beauticianPriceNum,
      image: primaryImage,
      images: allImages,
      status: finalStatus,
      isFeatured: Boolean(formData.isFeatured),
      featuredPriority: Number(formData.featuredPriority || 0),
      isTrending: Boolean(formData.isTrending),
      trendingPriority: Number(formData.trendingPriority || 0),
      isRecommended: Boolean(formData.isRecommended),
      rating: Number(formData.rating || 4.8),
      reviewCount: Number(formData.reviewCount || 120),
      publishedAt: formData.publishedAt || (asDraft ? null : new Date().toISOString()),
      showInNewArrivals: formData.showInNewArrivals !== false,
      isParentProduct: Boolean(isParentProduct || childProducts.length > 0),
      shades: sanitizedShades,
      size: formData.size ? formData.size.trim() : undefined,
      gst: Number(formData.gstPercent) || 18,
      net_qty: formData.netQty ? formData.netQty.trim() : undefined,
      variantType: formData.variantType || 'Standard',
      searchKeywords: formData.searchKeywords || [],
      searchAliases: formData.searchAliases || [],
      keyPoints: formData.keyPoints || [],
      benefits: formData.benefits || [],
      highlights: formData.highlights || [],
      specifications: {
        ...(formData.specifications || {}),
        ...(formData.categoryAttributes || {}),
        size: formData.size ? formData.size.trim() : undefined,
        netQty: formData.netQty ? formData.netQty.trim() : undefined,
        gst: formData.gstPercent || '18',
        variantType: formData.variantType || 'Standard',
        shadeName: shadeApplicable && formData.shadeName ? formData.shadeName : undefined,
        hexColor: shadeApplicable && formData.hexColor ? formData.hexColor : undefined,
        rgb: shadeApplicable && formData.rgb ? formData.rgb : undefined
      },
      additionalInfo: {
        ...(formData.additionalInfo || {}),
        size: formData.size ? formData.size.trim() : undefined,
        netQty: formData.netQty ? formData.netQty.trim() : undefined,
        gst: formData.gstPercent || '18',
        variantType: formData.variantType || 'Standard',
        categoryAttributes: formData.categoryAttributes || {},
        shadeName: shadeApplicable && formData.shadeName ? formData.shadeName : null,
        hexColor: shadeApplicable && formData.hexColor ? formData.hexColor : null,
        rgb: shadeApplicable && formData.rgb ? formData.rgb : null,
        status: finalStatus,
        isParentProduct: Boolean(isParentProduct || childProducts.length > 0),
        isFeatured: Boolean(formData.isFeatured),
        isTrending: Boolean(formData.isTrending),
        isRecommended: Boolean(formData.isRecommended),
        showInNewArrivals: formData.showInNewArrivals !== false
      },
      discountPercentages: {
        general: Number(roleDiscounts.general) || 0,
        salon: Number(roleDiscounts.salon) || 0,
        artist: Number(roleDiscounts.artist) || 0,
        beautician: Number(roleDiscounts.beautician) || 0
      },
      quantityTiers: {
        ...normalizedTiers,
        roleDiscounts: {
          general: Number(roleDiscounts.general) || 0,
          salon: Number(roleDiscounts.salon) || 0,
          artist: Number(roleDiscounts.artist) || 0,
          beautician: Number(roleDiscounts.beautician) || 0
        }
      }
    };

    let savedRecord = null;
    if (editingProduct?.id || formData.id) {
      const targetId = editingProduct?.id || formData.id;
      if (updateProduct) {
        await updateProduct(targetId, payload);
        savedRecord = { ...payload, id: targetId };
      } else {
        const res = await addProduct(payload);
        savedRecord = res?.product || payload;
      }
    } else {
      const res = await addProduct(payload);
      savedRecord = res?.product || payload;
    }

    if (savedRecord?.id) {
      setFormData(prev => ({ ...prev, id: savedRecord.id, sku: autoSku, status: finalStatus }));
    } else {
      setFormData(prev => ({ ...prev, sku: autoSku, status: finalStatus }));
    }
    return savedRecord || payload;
  };

  // 1. DRAFT Action Handler: saves as draft to DB & localStorage without requiring full form completion
  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await executeSaveProduct({ asDraft: true });
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        formData: { ...formData, status: 'draft' },
        roleDiscounts,
        hasVariants,
        savedAt: Date.now()
      }));
      setDraftLastSaved(new Date().toLocaleTimeString());
      setFormSuccessMessage('Product draft saved successfully! You can resume editing anytime.');
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setFormError(err.message || 'Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. SAVE PRODUCT Action Handler: validates & saves to catalog without navigating away
  const handleSaveProduct = async () => {
    if (isSubmitting) return;
    setFormError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await executeSaveProduct({ asDraft: false });
      clearDraftStorage();
      setFormSuccessMessage('Product successfully saved to catalog!');
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save product:', err);
      setFormError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. SUBMIT Action Handler: validates, saves to database, updates Products list, and navigates back
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await executeSaveProduct({ asDraft: false, newStatus: 'published' });
      clearDraftStorage();
      setFormSuccess(true);
      setTimeout(() => {
        onNavigateBack();
      }, 800);
    } catch (err) {
      console.error('Failed to submit product:', err);
      setFormError(err.message || 'Failed to submit product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image helpers
  const uploadedImagesList = Array.isArray(formData.images) && formData.images.length > 0
    ? formData.images
    : (formData.image ? [formData.image] : []);

  const previewActiveImage = uploadedImagesList[selectedPreviewImageIndex] ||
    uploadedImagesList[0] ||
    formData.image ||
    '';

  // Live preview values
  const numericMrp = Number(formData.mrp) || 0;
  const activePreviewBasePrice = getActiveRoleBasePrice(previewRole);
  const activePreviewRoleDiscountPct = Number(roleDiscounts[previewRole]) || 0;
  const activePreviewRoleSavings = Math.max(0, numericMrp - activePreviewBasePrice);

  const simQty = Number(sampleQty) || 1;
  const applicableTier = getApplicableTierForRole(formData.quantityTiers, previewRole, simQty);
  const qtyDiscountPct = applicableTier ? Number(applicableTier.additionalDiscount) : 0;
  const finalUnitPrice = calculateTierFinalPrice(activePreviewBasePrice, qtyDiscountPct);
  const qtyDiscountSavings = Math.max(0, activePreviewBasePrice - finalUnitPrice);
  const totalOrderValue = finalUnitPrice * simQty;
  const totalMrpValue = numericMrp * simQty;
  const totalSavings = Math.max(0, totalMrpValue - totalOrderValue);

  // Description character & word stats
  const descCharCount = (formData.description || '').length;
  const descWordCount = (formData.description || '').trim() ? formData.description.trim().split(/\s+/).length : 0;

  // Selected variant in live preview
  const currentPreviewVariant = selectedVariantPreviewIndex !== null && formData.shades[selectedVariantPreviewIndex]
    ? formData.shades[selectedVariantPreviewIndex]
    : null;

  return (
    <div className="w-full min-h-screen bg-[#FFF5F7] text-gray-900 font-sans pb-24">
      {/* =====================================================================
          TOP BREADCRUMB & HEADER BAR
          ===================================================================== */}
      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
          <button
            type="button"
            onClick={handleBackClick}
            className="hover:text-[#E11D48] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Package size={13} className="text-gray-400" />
            <span>Products</span>
          </button>
          <span>&gt;</span>
          <span className="text-gray-700 font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
        </div>

        {/* Page Title & Main Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 text-[#E11D48] flex items-center justify-center shadow-xs">
              <Package size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h1>
                {isDirty && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Configure catalog identity, barcode, media, dynamic variants, and 4-role pricing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* 3 Entry Selection Options */}
            {!editingProduct && (
              <div className="flex items-center gap-1 p-1 bg-white border border-pink-200/80 rounded-xl shadow-xs">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E11D48] text-white shadow-xs"
                >
                  Single Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Table size={13} className="text-purple-600" />
                  <span>Bulk Product Entry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExcelModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  <span>Import Excel</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackClick}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Back to Products</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8">
        {draftRestoredNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Draft Restored:</strong> Restored previously entered product data
                {draftLastSaved ? ` (saved at ${new Date(draftLastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearDraftStorage}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Clear Saved Draft
              </button>
              <button
                type="button"
                onClick={() => setDraftRestoredNotice(false)}
                className="text-amber-500 hover:text-amber-800 p-1"
                aria-label="Dismiss draft notice"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-xs animate-fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
            <button onClick={() => setFormError(null)} className="text-rose-400 hover:text-rose-700 p-0.5">
              <X size={15} />
            </button>
          </div>
        )}

        {formSuccessMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2.5 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
            <button onClick={() => setFormSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 p-0.5">
              <X size={15} />
            </button>
          </div>
        )}

        {formSuccess && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-fade-in">
            <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
            <span>Product successfully validated and added! Returning to products list...</span>
          </div>
        )}

        {hardwareScanAlert && (
          <div className="mb-4 p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
            <Barcode size={16} className="text-sky-600 shrink-0" />
            <span>Hardware Scanner Detected: {hardwareScanAlert}</span>
          </div>
        )}
      </div>

      {/* =====================================================================
          MAIN 2-COLUMN LAYOUT (70% Form Left, 30% Sticky Live Preview Right)
          ===================================================================== */}
      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* =================================================================
              LEFT COLUMN: OPTIMIZED PROGRESSIVE FORM CARDS (lg:col-span-8)
              ================================================================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: CORE PRODUCT DETAILS & CLASSIFICATION */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-pink-100/70">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">
                    Basic Product Information &amp; Categorization
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Enter the primary identity, brand affiliation, and category tree
                  </p>
                </div>
              </div>

              {/* Row 1: Product Name, Brand, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Product Name <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fit Me Matte + Poreless Foundation"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none font-semibold text-gray-900 text-xs shadow-2xs transition-all ${fieldErrors.name
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 ring-2 ring-rose-100'
                      : 'border-pink-100 focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 bg-white'
                      }`}
                  />
                  {fieldErrors.name && (
                    <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-gray-800 font-bold text-xs flex items-center gap-1">
                      <span>Brand</span>
                      <span className="text-[#E11D48]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsInlineAddBrandOpen(true)}
                      className="text-[#C2477A] hover:text-[#b83760] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      <span>Add Brand</span>
                    </button>
                  </div>
                  <SearchableSelect
                    options={activeBrandOptions}
                    value={formData.brandName}
                    searchKeys={['name', 'brandNumber', 'brandCode']}
                    renderTrigger={(selected) => {
                      if (!selected) {
                        return <span className="text-gray-400 font-normal">Select Brand...</span>;
                      }
                      const brandNum = selected.brandNumber || selected.brand_number || '';
                      const brandCode = selected.brandCode || selected.brand_code || '';
                      return (
                        <div className="flex items-center gap-2 overflow-hidden truncate">
                          {selected.logo ? (
                            <img src={selected.logo} alt="" className="w-5 h-5 rounded-md object-contain shrink-0 bg-white border border-gray-200" />
                          ) : (
                            <Store size={14} className="text-[#C2477A] shrink-0" />
                          )}
                          <span className="font-extrabold text-gray-900 truncate">
                            {selected.name}
                          </span>
                          {brandNum && (
                            <span className="text-[10px] font-mono font-bold text-[#C2477A] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200 shrink-0">
                              {brandNum}
                            </span>
                          )}
                          {brandCode && (
                            <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                              {brandCode}
                            </span>
                          )}
                        </div>
                      );
                    }}
                    renderOption={(opt, isSelected) => {
                      const brandNum = opt.brandNumber || opt.brand_number || '';
                      const brandCode = opt.brandCode || opt.brand_code || '';
                      return (
                        <div className="flex items-center justify-between w-full py-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                              {opt.logo ? (
                                <img src={opt.logo} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Store size={12} className="text-gray-300" />
                              )}
                            </div>
                            <span className="font-bold text-xs truncate text-gray-900">
                              {opt.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {brandNum && (
                              <span className="text-[10px] font-mono font-bold text-[#C2477A] bg-[#FFF0F4] px-1.5 py-0.5 rounded border border-pink-200">
                                {brandNum}
                              </span>
                            )}
                            {brandCode && (
                              <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {brandCode}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                    onChange={(selectedName, selectedObj) => {
                      const selected = selectedObj || activeBrandOptions.find(b => b.name === selectedName);
                      setFormData({
                        ...formData,
                        brandName: selectedName,
                        brandId: selected?.id || '',
                        category: selected?.category || formData.category
                      });
                    }}
                    placeholder="Select Brand..."
                    searchPlaceholder="Search brand name, number (BR001), or code (AGA-001)..."
                    emptyMessage="No matching brands found"
                    labelKey="name"
                    valueKey="name"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Category <span className="text-[#E11D48]">*</span>
                  </label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(selectedName) => {
                      setFormData(prev => ({
                        ...prev,
                        category: selectedName,
                        subcategory: '',
                        variantType: selectedName === 'Makeup' ? 'Shade / Swatch' : 'Volume / Size',
                        categoryAttributes: {}
                      }));
                    }}
                    placeholder="Select Category..."
                    searchPlaceholder="Search category..."
                    emptyMessage="No categories found"
                    labelKey="name"
                    valueKey="name"
                  />
                </div>
              </div>

              {/* Row 2: Dependent Subcategory & Variant Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Subcategory ({formData.category || 'All'}) <span className="text-[#E11D48]">*</span>
                  </label>
                  <SearchableSelect
                    options={availableSubcategories}
                    value={formData.subcategory}
                    onChange={(selectedSub) => {
                      setFormData(prev => ({
                        ...prev,
                        subcategory: selectedSub,
                        variantType: prev.category === 'Makeup' ? 'Shade / Swatch' : 'Volume / Size'
                      }));
                    }}
                    placeholder={`Select ${formData.category || ''} Subcategory...`}
                    searchPlaceholder="Search subcategory or type..."
                    emptyMessage="No subcategories found"
                    labelKey="name"
                    valueKey="name"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Variant Type
                  </label>
                  <SearchableSelect
                    options={availableVariantTypes}
                    value={formData.variantType}
                    onChange={(selectedType) => {
                      setFormData(prev => ({ ...prev, variantType: selectedType }));
                    }}
                    placeholder="Select Variant Type..."
                    searchPlaceholder="Search variant type..."
                    emptyMessage="No variant types found"
                    labelKey="name"
                    valueKey="name"
                  />
                </div>
              </div>

              {/* Shade / Swatch handling (ONLY if shade-applicable, strictly hidden for skincare/haircare/fragrance) */}
              {shadeApplicable && !hasVariants && (
                <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-200/80 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Palette size={14} className="text-[#E11D48]" />
                      <span>Single Product Shade Configuration</span>
                    </span>
                    <span className="text-[10px] text-pink-700 bg-pink-100 font-bold px-2 py-0.5 rounded-full">
                      Shade Product
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-800 font-bold mb-1 text-[11px]">
                        Shade Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ruby Woo, 128 Warm Nude"
                        value={formData.shadeName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            shadeName: val,
                            _manualShadeEdited: Boolean(val && val.trim().length > 0)
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white font-semibold text-gray-900 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-800 font-bold mb-1 text-[11px]">
                        HEX Code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.hexColor?.startsWith('#') ? formData.hexColor : '#CE4270'}
                          onInput={(e) => {
                            let val = e.target.value.toUpperCase();
                            if (val && !val.startsWith('#')) val = '#' + val;
                            const matched = matchBeautyShade(val);
                            setFormData(prev => ({
                              ...prev,
                              hexColor: val,
                              rgb: hexToRgbString(val),
                              shadeName: (!prev._manualShadeEdited || !prev.shadeName) && matched?.name ? matched.name : prev.shadeName
                            }));
                          }}
                          onChange={(e) => {
                            let val = e.target.value.toUpperCase();
                            if (val && !val.startsWith('#')) val = '#' + val;
                            const matched = matchBeautyShade(val);
                            setFormData(prev => ({
                              ...prev,
                              hexColor: val,
                              rgb: hexToRgbString(val),
                              shadeName: (!prev._manualShadeEdited || !prev.shadeName) && matched?.name ? matched.name : prev.shadeName
                            }));
                          }}
                          className="w-8 h-8 rounded-lg border border-pink-200 p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          placeholder="#CE4270"
                          value={formData.hexColor}
                          onChange={(e) => {
                            let val = e.target.value.trim().toUpperCase();
                            if (val && !val.startsWith('#')) val = '#' + val;
                            const matched = matchBeautyShade(val);
                            setFormData(prev => ({
                              ...prev,
                              hexColor: val,
                              rgb: hexToRgbString(val),
                              shadeName: (!prev._manualShadeEdited || !prev.shadeName) && matched?.name ? matched.name : prev.shadeName
                            }));
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-pink-200 bg-white font-mono font-bold text-gray-900 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-800 font-bold mb-1 text-[11px]">
                        RGB (Auto-Derived from HEX)
                      </label>
                      <input
                        type="text"
                        readOnly
                        placeholder="Auto-calculated"
                        value={formData.rgb || (formData.hexColor ? hexToRgbString(formData.hexColor) : '')}
                        className="w-full px-3 py-2 rounded-xl border border-pink-100 bg-gray-50 text-gray-600 font-mono text-xs outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: UNIVERSAL BARCODE SCAN & EXISTING PRODUCT DETECTION */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-pink-100/70">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 tracking-tight">
                      Universal Barcode &amp; Existing Product Detection
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Accepts USB/Bluetooth HID scanners, webcam camera scan, or manual entry with instant lookup
                    </p>
                  </div>
                </div>

                {/* Hardware Scanner Status Indicator */}
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10.5px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hardware Scanner Ready</span>
                </div>
              </div>

              {/* Barcode Input Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-800 font-bold text-xs">
                    Retail Barcode (EAN-13, UPC-A, Code 128)
                  </label>
                  {barcodeStatus.isChecking ? (
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium bg-pink-50/80 px-2 py-0.5 rounded-full border border-pink-100">
                      <Loader2 size={10} className="animate-spin text-[#E11D48]" /> Checking catalog database...
                    </span>
                  ) : barcodeStatus.checkedBarcode && !barcodeStatus.exists && !barcodeStatus.formatError ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" /> Barcode unique &amp; verified
                      </span>
                      <button
                        type="button"
                        onClick={handleFindProductInfoFromBarcode}
                        disabled={isSearchingBarcodeInfo}
                        className="text-[10px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Sparkles size={11} className="text-purple-600" />
                        {isSearchingBarcodeInfo ? 'Searching...' : 'Find Product Information'}
                      </button>
                    </div>
                  ) : barcodeStatus.exists ? (
                    <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <AlertCircle size={11} className="text-rose-600" /> Existing product detected
                    </span>
                  ) : null}
                </div>

                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Scan with physical scanner or enter barcode digits..."
                      value={formData.barcode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, barcode: val }));
                        performBarcodeVerification(val, { immediate: false });
                        if (fieldErrors.barcode) setFieldErrors(prev => ({ ...prev, barcode: null }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          performBarcodeVerification(e.target.value, { immediate: true });
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData('text') || '';
                        if (pasted) {
                          const clean = normalizeBarcode(pasted);
                          setTimeout(() => {
                            performBarcodeVerification(clean, { immediate: true });
                          }, 0);
                        }
                      }}
                      className={`w-full py-2.5 pl-3 pr-10 rounded-xl border font-mono font-bold text-gray-900 text-xs outline-none transition-all shadow-2xs ${barcodeStatus.exists
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 ring-2 ring-rose-100'
                        : barcodeStatus.formatError
                          ? 'border-amber-400 bg-amber-50/50'
                          : barcodeStatus.checkedBarcode && !barcodeStatus.exists && !barcodeStatus.formatError
                            ? 'border-emerald-300 bg-emerald-50/20 text-gray-900'
                            : 'border-pink-100 bg-white focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15'
                        }`}
                    />
                    {formData.barcode && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, barcode: '' }));
                          setBarcodeStatus({ isChecking: false, exists: false, checkedBarcode: '', matchedProduct: null, formatError: null });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md"
                        title="Clear barcode"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Camera Scanner Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeScannerTarget(null);
                      setIsBarcodeScannerOpen(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100 text-[#E11D48] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Scan barcode with camera / webcam"
                  >
                    <ScanBarcode size={15} />
                    <span>Camera Scan</span>
                  </button>
                </div>

                {barcodeStatus.formatError && (
                  <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> {barcodeStatus.formatError}
                  </p>
                )}

                {/* NO PRODUCT FOUND STATE: Unique & ready to use */}
                {barcodeStatus.checkedBarcode && !barcodeStatus.exists && !barcodeStatus.formatError && (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                    <span className="font-semibold flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Barcode verified: No matching product found in database. This barcode is unique and ready to assign.</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      {detectBarcodeType(barcodeStatus.checkedBarcode)}
                    </span>
                  </div>
                )}

                {/* PRODUCT FOUND STATE: Rich Existing Product Banner */}
                {barcodeStatus.exists && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5 text-rose-800 text-xs">
                        <AlertCircle size={14} className="text-rose-600" /> Product Already Exists With This Barcode
                      </span>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Duplicate Found
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-rose-200">
                      {barcodeStatus.matchedProduct?.image ? (
                        <img
                          src={barcodeStatus.matchedProduct.image}
                          alt="Existing product"
                          className="w-12 h-12 object-cover rounded-lg border border-pink-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-pink-50 text-[#E11D48] flex items-center justify-center font-bold text-xs shrink-0">
                          <Package size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-xs truncate">
                          {barcodeStatus.matchedProduct?.name || 'Existing Catalog Product'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-semibold">
                          Brand: {barcodeStatus.matchedProduct?.brand_name || barcodeStatus.matchedProduct?.brandName || 'Brand'}
                          {barcodeStatus.matchedProduct?.sku ? ` • SKU: ${barcodeStatus.matchedProduct.sku}` : ''}
                        </div>
                        {barcodeStatus.matchedProduct?.mrp && (
                          <div className="text-[11px] font-mono text-gray-700">
                            Base MRP: ₹{Number(barcodeStatus.matchedProduct.mrp).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10.5px] text-rose-700">
                        Products cannot share duplicate barcodes. Please scan or enter a unique code.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, barcode: '' }));
                          setBarcodeStatus({ isChecking: false, exists: false, checkedBarcode: '', matchedProduct: null, formatError: null });
                        }}
                        className="px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-[11px] cursor-pointer"
                      >
                        Clear Barcode
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-0.5 text-[10.5px] text-gray-400 font-medium flex items-center gap-1.5">
                  <Info size={12} className="text-gray-400 shrink-0" />
                  <span>SKU: {formData.sku || 'Auto-generated systematically on product save'}</span>
                </div>
              </div>
            </div>

            {/* CARD 3: MEDIA & PRODUCT GALLERY */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsDraggingImage(false);
                }
              }}
              onDrop={handleImageDrop}
              className={`bg-white rounded-2xl border transition-all p-6 shadow-xs space-y-4 ${isDraggingImage ? 'border-[#E11D48] ring-2 ring-pink-100 bg-[#FFF9FB]' : 'border-[#F3D7DF]'
                }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100/70">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-gray-900 tracking-tight">
                        Product Media &amp; Gallery
                      </h2>
                      {uploadedImagesList.length > 0 && (
                        <span className="text-[10px] font-bold text-[#E11D48] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full">
                          {uploadedImagesList.length} {uploadedImagesList.length === 1 ? 'image' : 'images'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Upload directly to Supabase storage, manage thumbnails, set primary image, or search Google
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-2.5 py-1.5 rounded-xl border border-pink-200 text-[#E11D48] bg-pink-50/60 hover:bg-pink-100 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <LinkIcon size={12} />
                    <span>Paste URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenImageSearch}
                    className="px-2.5 py-1.5 rounded-xl border border-pink-200 text-[#E11D48] bg-pink-50/60 hover:bg-pink-100 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    title="Search product packshots on Google Images in new tab"
                  >
                    <span>Search Google</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* URL Input Bar */}
              {showUrlInput && (
                <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.example.com/products/packshot.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-pink-200 bg-white font-mono text-xs text-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFromUrl}
                    className="px-3 py-1.5 rounded-lg bg-[#E11D48] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Add Image
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesUpload(e.target.files);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />

              {imageError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
                  <span>{imageError}</span>
                  <button onClick={() => setImageError(null)} className="p-0.5 text-rose-500 hover:text-rose-800">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Compact Dropzone when empty OR Thumbnails strip with + Add More */}
              {uploadedImagesList.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-6 px-4 rounded-xl border-2 border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 transition-all cursor-pointer ${isDraggingImage
                    ? 'border-[#E11D48] bg-pink-50'
                    : 'border-pink-200/90 hover:border-[#E11D48] bg-[#FFF8FA] hover:bg-pink-50/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white text-[#E11D48] flex items-center justify-center shadow-xs border border-pink-100 shrink-0">
                      {isUploadingImage ? (
                        <Loader2 size={20} className="animate-spin text-[#E11D48]" />
                      ) : (
                        <Upload size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {isUploadingImage ? 'Uploading product image to storage...' : 'Drag & drop packshot images here, or browse files'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Supports PNG, JPG, WebP up to 10MB each (Multiple files supported)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#E6005C] text-white text-xs font-bold shadow-2xs pointer-events-none shrink-0"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {uploadedImagesList.map((imgUrl, index) => {
                      const isSelected = selectedPreviewImageIndex === index;
                      const isPrimary = index === 0;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedPreviewImageIndex(index)}
                          className={`group relative w-24 h-28 rounded-2xl border overflow-hidden bg-white shrink-0 shadow-2xs transition-all cursor-pointer ${isSelected ? 'border-[#E11D48] ring-2 ring-pink-200' : 'border-pink-100 hover:border-pink-300'
                            }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Packshot ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />

                          {/* Primary Badge */}
                          {isPrimary ? (
                            <span className="absolute top-1 left-1 bg-[#E11D48] text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                              ★ Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPrimaryImage(index);
                              }}
                              className="absolute top-1 left-1 bg-black/60 hover:bg-[#E11D48] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Set as primary image"
                            >
                              Make Primary
                            </button>
                          )}

                          {/* Index label */}
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.2 rounded backdrop-blur-xs">
                            #{index + 1}
                          </span>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/95 hover:bg-rose-600 text-gray-600 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer opacity-90 group-hover:opacity-100"
                            title="Remove packshot"
                          >
                            <X size={11} className="stroke-[2.5]" />
                          </button>
                        </div>
                      );
                    })}

                    {/* [ + Add More ] Tile */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-24 h-28 rounded-2xl border-2 border-dashed border-pink-200 hover:border-[#E11D48] bg-[#FFF8FA] hover:bg-pink-50/50 flex flex-col items-center justify-center gap-1.5 shrink-0 text-[#E11D48] transition-colors cursor-pointer"
                      title="Upload or drag & drop more packshots"
                    >
                      {isUploadingImage ? (
                        <Loader2 size={20} className="animate-spin text-[#E11D48]" />
                      ) : (
                        <Plus size={20} />
                      )}
                      <span className="text-[10.5px] font-bold">
                        {isUploadingImage ? 'Uploading...' : '+ Add More'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 5: DYNAMIC PRODUCT VARIANTS (SCHEMA-DRIVEN BUILDER) */}
            <DynamicVariantBuilder
              hasVariants={hasVariants}
              onToggleHasVariants={(enabled) => {
                setHasVariants(enabled);
                if (!enabled) {
                  setFormData(prev => ({ ...prev, shades: [] }));
                }
              }}
              variants={formData.shades || []}
              onChangeVariants={(newVariants) => {
                setFormData(prev => ({ ...prev, shades: newVariants }));
                if (newVariants && newVariants.length > 0 && !hasVariants) {
                  setHasVariants(true);
                }
              }}
              baseProduct={{
                ...formData,
                mrp: formData.mrp,
                generalPrice: formData.generalPrice,
                salonPrice: formData.salonPrice,
                artistPrice: formData.artistPrice,
                beauticianPrice: formData.beauticianPrice,
                sku: formData.sku,
                image: formData.image || (formData.images && formData.images[0]) || '',
                images: formData.images,
                roleDiscounts: roleDiscounts
              }}
              uploadProductImage={uploadProductImage}
              roleDiscounts={roleDiscounts}
              category={formData.category}
              subcategory={formData.subcategory}
              productName={formData.name}
              onOpenScanner={(idx) => {
                setBarcodeScannerTarget(idx);
                setIsBarcodeScannerOpen(true);
              }}
            />

            {/* DYNAMIC ATTRIBUTES SECTION (INLINE EXPANDABLE ON CLICK) */}
            {dynamicCategoryAttributes && dynamicCategoryAttributes.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100/70">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      <Sliders size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-gray-900 tracking-tight">
                          Product Attributes ({formData.category || 'All Categories'})
                        </h2>
                        {Object.keys(formData.categoryAttributes || {}).filter(k => formData.categoryAttributes[k]).length > 0 && (
                          <span className="text-[10px] font-bold text-[#E11D48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
                            {Object.keys(formData.categoryAttributes || {}).filter(k => formData.categoryAttributes[k]).length} Configured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Click Attributes button to expand and configure dynamic category specifications inline
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAttributesExpanded(!isAttributesExpanded)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      isAttributesExpanded
                        ? 'bg-[#E11D48] text-white border-[#E11D48]'
                        : 'bg-pink-50/70 hover:bg-pink-100 text-[#E11D48] border-pink-200'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>{isAttributesExpanded ? 'Hide Attributes' : 'Attributes'}</span>
                    {isAttributesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isAttributesExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 animate-fade-in">
                    {dynamicCategoryAttributes.map(attr => {
                      const currentVal = formData.categoryAttributes?.[attr.key] || '';
                      return (
                        <div key={attr.key} className="space-y-1">
                          <label className="block text-gray-800 font-bold text-xs truncate">
                            {attr.label}
                          </label>
                          {attr.type === 'dropdown' ? (
                            <div className="relative">
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    categoryAttributes: {
                                      ...(prev.categoryAttributes || {}),
                                      [attr.key]: val
                                    }
                                  }));
                                }}
                                className="w-full px-3 py-2.5 rounded-xl border border-pink-100 bg-white font-semibold text-gray-900 text-xs outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 appearance-none cursor-pointer"
                              >
                                <option value="">Select {attr.label}...</option>
                                {(attr.options || []).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder={attr.placeholder || `Enter ${attr.label}...`}
                              value={currentVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  categoryAttributes: {
                                    ...(prev.categoryAttributes || {}),
                                    [attr.key]: val
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border border-pink-100 bg-white font-semibold text-gray-900 text-xs outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT SIZE, GST TAX & NET QUANTITY */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-pink-100/70">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  <Package size={14} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">
                    Product Size, Tax &amp; Net Quantity
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Standardized compliance dimensions, applicable GST tax bracket, and sellable net content
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Product Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50 ml, 100 g, 3.8 g, Full Size"
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-100 bg-white font-semibold text-gray-900 text-xs outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Volume or weight dimension</span>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    GST Rate (%) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.gstPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstPercent: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-pink-100 bg-white font-bold text-gray-900 text-xs outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 appearance-none cursor-pointer"
                    >
                      <option value="18">18% (Standard Beauty &amp; Cosmetics GST)</option>
                      <option value="12">12% (Ayurvedic / Specialized Skincare)</option>
                      <option value="5">5% (Essential Healthcare / Herbal)</option>
                      <option value="28">28% (Luxury / Premium Fragrance)</option>
                      <option value="0">0% (Nil / Exempted)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Standard beauty products fall under 18%</span>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    Net Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 pc, 50 ml, 100 g, 1 unit"
                    value={formData.netQty}
                    onChange={(e) => setFormData(prev => ({ ...prev, netQty: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-pink-100 bg-white font-semibold text-gray-900 text-xs outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Units or volume per retail package</span>
                </div>
              </div>
            </div>

            {/* CARD 6: 4-ROLE PRICING & QUANTITY DISCOUNT MATRIX */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-5">
              <div className="flex items-start gap-3 pb-3 border-b border-pink-100/70">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  6
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">
                    4-Role Pricing &amp; Quantity Discount Matrix
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Configure Base MRP and role-specific selling prices (General, Salon, Artist, Beautician) with live dynamic discount calculation
                  </p>
                </div>
              </div>

              {/* Row: MRP and 4 Role Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* MRP */}
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs truncate">
                    Base MRP (₹) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-amber-500">
                      <Tag size={13} />
                    </span>
                    <span className="absolute left-8 font-bold text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="799.00"
                      value={formData.mrp}
                      onChange={(e) => handleMrpChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      className={`w-full pl-12 pr-3 py-2.5 rounded-xl border outline-none font-bold text-gray-900 text-xs shadow-2xs ${fieldErrors.mrp
                        ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-100'
                        : 'border-pink-100 focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 bg-white'
                        }`}
                    />
                  </div>
                  {fieldErrors.mrp && (
                    <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                      {fieldErrors.mrp}
                    </span>
                  )}
                </div>

                {/* General User */}
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs truncate">
                    General User Price (₹) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-teal-600">
                      <User size={13} />
                    </span>
                    <span className="absolute left-8 font-bold text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="699.00"
                      value={formData.generalPrice}
                      onChange={(e) => handleRolePriceChange('general', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      className={`w-full pl-12 pr-3 py-2.5 rounded-xl border outline-none font-bold text-gray-900 text-xs shadow-2xs ${fieldErrors.generalPrice
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-pink-100 focus:border-[#E11D48] bg-white'
                        }`}
                    />
                  </div>
                  <span className="text-[10px] text-teal-700 font-bold block mt-1">
                    {roleDiscounts.general}% discount on MRP
                  </span>
                </div>

                {/* Salon Owner */}
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs truncate">
                    Salon Owner Price (₹) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#CE4270]">
                      <Crown size={13} />
                    </span>
                    <span className="absolute left-8 font-bold text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="649.00"
                      value={formData.salonPrice}
                      onChange={(e) => handleRolePriceChange('salon', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#E11D48] bg-white font-bold text-gray-900 text-xs shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-pink-700 font-bold block mt-1">
                    {roleDiscounts.salon}% discount on MRP
                  </span>
                </div>

                {/* Makeup Artist */}
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs truncate">
                    Makeup Artist Price (₹) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-purple-600">
                      <Star size={13} />
                    </span>
                    <span className="absolute left-8 font-bold text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="629.00"
                      value={formData.artistPrice}
                      onChange={(e) => handleRolePriceChange('artist', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#E11D48] bg-white font-bold text-gray-900 text-xs shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold block mt-1">
                    {roleDiscounts.artist}% discount on MRP
                  </span>
                </div>

                {/* Beautician */}
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs truncate">
                    Beautician Price (₹) <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-rose-600">
                      <Heart size={13} />
                    </span>
                    <span className="absolute left-8 font-bold text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="599.00"
                      value={formData.beauticianPrice}
                      onChange={(e) => handleRolePriceChange('beautician', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                      className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-pink-100 outline-none focus:border-[#E11D48] bg-white font-bold text-gray-900 text-xs shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-rose-700 font-bold block mt-1">
                    {roleDiscounts.beautician}% discount on MRP
                  </span>
                </div>
              </div>

              {/* INLINE QUANTITY DISCOUNT TIERS (ALL 4 ROLES) */}
              <div className="pt-3 border-t border-pink-100/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Inline Quantity Discount Tiers</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-[#E11D48]">
                        All 4 Roles Supported
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Configure independent multi-tier volume discounts for General Users, Salons, Artists, and Beauticians
                    </p>
                  </div>
                </div>

                {/* Role Tabs for Quantity Tiers */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {DISCOUNT_ROLES.map(role => {
                    const isActive = activeTierRole === role.id;
                    const tierCount = (normalizeQuantityTiers(formData.quantityTiers)[role.id] || []).length;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setActiveTierRole(role.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                          isActive
                            ? 'bg-[#E11D48] text-white shadow-md'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{role.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {tierCount} {tierCount === 1 ? 'Tier' : 'Tiers'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets & Add Tier Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-pink-50/60 rounded-xl border border-pink-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-700 mr-1">Quick Range Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetTier(activeTierRole, 1, 2, 3)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 hover:text-[#E11D48] hover:border-pink-300 border border-gray-200 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      + 1–2 (3% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetTier(activeTierRole, 3, 4, 5)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 hover:text-[#E11D48] hover:border-pink-300 border border-gray-200 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      + 3–4 (5% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetTier(activeTierRole, 5, 9, 8)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 hover:text-[#E11D48] hover:border-pink-300 border border-gray-200 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      + 5–9 (8% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetTier(activeTierRole, 10, null, 12)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white text-gray-800 hover:text-[#E11D48] hover:border-pink-300 border border-gray-200 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      + 10+ (12% OFF)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddBlankTier(activeTierRole)}
                    className="px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Custom Tier</span>
                  </button>
                </div>

                {/* Inline Editable Tiers Table with Visible Scrollbar */}
                <div className="border border-pink-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-[#FFF9FA] border-b border-pink-100 text-[11px] font-bold text-gray-600 sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5">Min Qty</th>
                          <th className="p-2.5">Max Qty</th>
                          <th className="p-2.5">Additional Discount (%)</th>
                          <th className="p-2.5">Calculation &amp; Final Unit Price</th>
                          <th className="p-2.5 text-right w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                        {currentRoleTiers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-400 text-xs">
                              <p className="font-semibold text-gray-500">No volume quantity tiers configured for {DISCOUNT_ROLES.find(r => r.id === activeTierRole)?.name}.</p>
                              <p className="text-[11px] text-gray-400 mt-1">Click a quick preset above or "+ Custom Tier" to add inline quantity discounts.</p>
                            </td>
                          </tr>
                        ) : (
                          currentRoleTiers.map((tier, idx) => {
                            const basePrice = getActiveRoleBasePrice(activeTierRole);
                            const tierDisc = Number(tier.additionalDiscount) || 0;
                            const unitPrice = calculateTierFinalPrice(basePrice, tierDisc);
                            return (
                              <tr key={tier.id || idx} className="hover:bg-pink-50/30 transition-colors">
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="1"
                                      value={tier.minQty}
                                      onChange={(e) => handleUpdateTierField(activeTierRole, idx, 'minQty', e.target.value)}
                                      className="w-18 px-2 py-1.5 rounded-lg border border-pink-200 bg-white font-bold text-gray-900 text-xs outline-none focus:border-[#E11D48]"
                                    />
                                    <span className="text-[11px] text-gray-500 font-bold">units</span>
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={tier.minQty || 1}
                                      placeholder="10+ (No max)"
                                      value={tier.maxQty ?? ''}
                                      onChange={(e) => handleUpdateTierField(activeTierRole, idx, 'maxQty', e.target.value)}
                                      className="w-24 px-2 py-1.5 rounded-lg border border-pink-200 bg-white font-semibold text-gray-900 text-xs outline-none focus:border-[#E11D48]"
                                    />
                                    <span className="text-[11px] text-gray-400">units</span>
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <div className="relative flex items-center w-24">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="any"
                                      value={tier.additionalDiscount}
                                      onChange={(e) => handleUpdateTierField(activeTierRole, idx, 'additionalDiscount', e.target.value)}
                                      className="w-full pl-2 pr-6 py-1.5 rounded-lg border border-pink-200 bg-white font-bold text-[#E11D48] text-xs outline-none focus:border-[#E11D48]"
                                    />
                                    <span className="absolute right-2 text-xs font-bold text-gray-400">%</span>
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[11px]">
                                    <span className="text-gray-500 font-mono">
                                      Base ₹{basePrice.toFixed(2)} - {tierDisc}% =
                                    </span>
                                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      ₹{unitPrice.toFixed(2)} / unit
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTier(activeTierRole, idx)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Tier"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* PARENT PRODUCT & CHILD PRODUCTS INLINE BUILDER */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100/70">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    <Boxes size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-gray-900 tracking-tight">
                        Parent &amp; Child Products
                      </h2>
                      {isParentProduct && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Parent Mode Active ({childProducts.length} Children)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Set this product as a Parent and add independent sellable child products (shades/variants) with their own barcodes, images, 4-role pricing, and quantity tiers.
                    </p>
                  </div>
                </div>

                {/* Set as Parent Toggle Switch */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-700">Set as Parent</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isParentProduct;
                      setIsParentProduct(nextVal);
                      if (nextVal && childProducts.length === 0) {
                        handleAddChildProduct();
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isParentProduct ? 'bg-[#E11D48]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isParentProduct ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* When Parent is enabled: Child products list */}
              {isParentProduct ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                    <Info size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Independent Child Products Architecture</p>
                      <p className="text-[11px] text-purple-700 leading-relaxed mt-0.5">
                        Each child product behaves as an independent sellable product in Supabase (`parent_id = &lt;parent_product_id&gt;`) with its own unique barcode, images, attributes, 4-role prices, and independent quantity discounts.
                      </p>
                    </div>
                  </div>

                  {/* Child Products Cards */}
                  <div className="space-y-3">
                    {childProducts.map((child, cIdx) => {
                      const childTiers = normalizeQuantityTiers(child.quantityTiers);
                      const currentChildRoleTiers = childTiers[child.activeTierRole || 'general'] || [];
                      const childRole = child.activeTierRole || 'general';
                      const childMrp = Number(child.mrp || formData.mrp || 0);
                      const childBasePrice = getProductBasePriceForRole(child, childRole, child.roleDiscounts || roleDiscounts, childMrp);

                      return (
                        <div key={child.id || cIdx} className="rounded-2xl border border-pink-200 bg-white overflow-hidden shadow-2xs transition-all">
                          {/* Child Card Header */}
                          <div
                            onClick={() => handleToggleChildExpand(cIdx)}
                            className="p-3.5 bg-[#FFF9FA] border-b border-pink-100 flex items-center justify-between cursor-pointer hover:bg-pink-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#E11D48] text-white font-bold text-xs flex items-center justify-center">
                                {cIdx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900">
                                  {child.name || `Child Product ${cIdx + 1}`}
                                </span>
                                {child.barcode && (
                                  <span className="text-[10px] font-mono font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md border border-pink-200">
                                    {child.barcode}
                                  </span>
                                )}
                                {child.hexColor && (
                                  <span
                                    className="w-4 h-4 rounded-full border border-gray-300 inline-block shadow-2xs"
                                    style={{ backgroundColor: child.hexColor }}
                                    title={child.hexColor}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleChildExpand(cIdx)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                              >
                                {child.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveChildProduct(cIdx)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete Child Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Child Card Expandable Body */}
                          {child.isExpanded && (
                            <div className="p-4 space-y-4 animate-fade-in text-xs">
                              {/* Row 1: Name & Barcode */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-800 font-bold mb-1">
                                    Variant / Shade Name <span className="text-[#E11D48]">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Ruby Red, 50ml, Pack of 2"
                                    value={child.name}
                                    onChange={(e) => handleUpdateChildField(cIdx, 'name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-pink-100 font-bold text-gray-900 text-xs outline-none focus:border-[#E11D48]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-800 font-bold mb-1">
                                    Barcode (Unique)
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      placeholder="e.g. 8901030999999"
                                      value={child.barcode}
                                      onChange={(e) => handleUpdateChildField(cIdx, 'barcode', e.target.value)}
                                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-pink-100 font-mono font-bold text-gray-900 text-xs outline-none focus:border-[#E11D48]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBarcodeScannerTarget(cIdx);
                                        setIsBarcodeScannerOpen(true);
                                      }}
                                      className="absolute right-2 text-[#E11D48] hover:text-[#BE123C]"
                                      title="Scan Barcode"
                                    >
                                      <ScanBarcode size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: 4-Role Prices for Child */}
                              <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 space-y-2">
                                <span className="font-bold text-gray-800 text-[11px] block">
                                  Child Product 4-Role Base Prices (₹):
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  <div>
                                    <label className="text-[10.5px] font-bold text-gray-600 block mb-0.5">MRP</label>
                                    <input
                                      type="number"
                                      placeholder={formData.mrp || '799'}
                                      value={child.mrp}
                                      onChange={(e) => handleUpdateChildField(cIdx, 'mrp', e.target.value)}
                                      className="w-full p-1.5 rounded-lg border border-pink-200 font-bold text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10.5px] font-bold text-teal-700 block mb-0.5">General</label>
                                    <input
                                      type="number"
                                      placeholder={formData.generalPrice || '699'}
                                      value={child.generalPrice}
                                      onChange={(e) => handleChildRolePriceChange(cIdx, 'general', e.target.value)}
                                      className="w-full p-1.5 rounded-lg border border-pink-200 font-bold text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10.5px] font-bold text-pink-700 block mb-0.5">Salon</label>
                                    <input
                                      type="number"
                                      placeholder={formData.salonPrice || '649'}
                                      value={child.salonPrice}
                                      onChange={(e) => handleChildRolePriceChange(cIdx, 'salon', e.target.value)}
                                      className="w-full p-1.5 rounded-lg border border-pink-200 font-bold text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10.5px] font-bold text-purple-700 block mb-0.5">Artist</label>
                                    <input
                                      type="number"
                                      placeholder={formData.artistPrice || '629'}
                                      value={child.artistPrice}
                                      onChange={(e) => handleChildRolePriceChange(cIdx, 'artist', e.target.value)}
                                      className="w-full p-1.5 rounded-lg border border-pink-200 font-bold text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10.5px] font-bold text-rose-700 block mb-0.5">Beautician</label>
                                    <input
                                      type="number"
                                      placeholder={formData.beauticianPrice || '599'}
                                      value={child.beauticianPrice}
                                      onChange={(e) => handleChildRolePriceChange(cIdx, 'beautician', e.target.value)}
                                      className="w-full p-1.5 rounded-lg border border-pink-200 font-bold text-xs bg-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row 3: Child Product Quantity Discount Tiers */}
                              <div className="space-y-2 pt-1 border-t border-pink-100">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-800 text-[11px]">
                                    Child Quantity Discount Tiers:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {DISCOUNT_ROLES.map(r => (
                                      <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => handleUpdateChildField(cIdx, 'activeTierRole', r.id)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                          childRole === r.id
                                            ? 'bg-[#E11D48] text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                      >
                                        {r.shortName} ({(childTiers[r.id] || []).length})
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Child Tiers Quick Presets */}
                                <div className="flex items-center justify-between gap-1 flex-wrap p-2 bg-gray-50 rounded-lg text-[10px]">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleChildAddPresetTier(cIdx, childRole, 1, 2, 3)}
                                      className="px-2 py-0.5 font-bold bg-white border border-gray-200 rounded hover:border-[#E11D48]"
                                    >
                                      + 1–2 (3%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleChildAddPresetTier(cIdx, childRole, 3, 4, 5)}
                                      className="px-2 py-0.5 font-bold bg-white border border-gray-200 rounded hover:border-[#E11D48]"
                                    >
                                      + 3–4 (5%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleChildAddPresetTier(cIdx, childRole, 5, 9, 8)}
                                      className="px-2 py-0.5 font-bold bg-white border border-gray-200 rounded hover:border-[#E11D48]"
                                    >
                                      + 5–9 (8%)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleChildAddPresetTier(cIdx, childRole, 10, null, 12)}
                                      className="px-2 py-0.5 font-bold bg-white border border-gray-200 rounded hover:border-[#E11D48]"
                                    >
                                      + 10+ (12%)
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleChildAddBlankTier(cIdx, childRole)}
                                    className="px-2 py-0.5 bg-[#E11D48] text-white font-bold rounded"
                                  >
                                    + Custom
                                  </button>
                                </div>

                                {/* Child Tiers Table */}
                                <div className="border border-pink-100 rounded-lg overflow-hidden bg-white">
                                  <table className="w-full text-[10.5px] border-collapse">
                                    <thead className="bg-[#FFF9FA] border-b border-pink-100 font-bold text-gray-600">
                                      <tr>
                                        <th className="p-1.5">Min</th>
                                        <th className="p-1.5">Max</th>
                                        <th className="p-1.5">Discount %</th>
                                        <th className="p-1.5">Final Unit Price</th>
                                        <th className="p-1.5 text-right w-10"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {currentChildRoleTiers.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-2 text-center text-gray-400">
                                            No quantity tiers set for {childRole}. Click presets above to add.
                                          </td>
                                        </tr>
                                      ) : (
                                        currentChildRoleTiers.map((tier, tIdx) => {
                                          const disc = Number(tier.additionalDiscount) || 0;
                                          const finalPrice = calculateTierFinalPrice(childBasePrice, disc);
                                          return (
                                            <tr key={tier.id || tIdx}>
                                              <td className="p-1.5">
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={tier.minQty}
                                                  onChange={(e) => handleChildUpdateTierField(cIdx, childRole, tIdx, 'minQty', e.target.value)}
                                                  className="w-14 p-1 rounded border border-gray-200 font-bold"
                                                />
                                              </td>
                                              <td className="p-1.5">
                                                <input
                                                  type="number"
                                                  min={tier.minQty || 1}
                                                  placeholder="10+"
                                                  value={tier.maxQty ?? ''}
                                                  onChange={(e) => handleChildUpdateTierField(cIdx, childRole, tIdx, 'maxQty', e.target.value)}
                                                  className="w-14 p-1 rounded border border-gray-200"
                                                />
                                              </td>
                                              <td className="p-1.5">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  value={tier.additionalDiscount}
                                                  onChange={(e) => handleChildUpdateTierField(cIdx, childRole, tIdx, 'additionalDiscount', e.target.value)}
                                                  className="w-14 p-1 rounded border border-gray-200 font-bold text-[#E11D48]"
                                                /> %
                                              </td>
                                              <td className="p-1.5 font-bold font-mono text-emerald-700">
                                                ₹{finalPrice.toFixed(2)}
                                              </td>
                                              <td className="p-1.5 text-right">
                                                <button
                                                  type="button"
                                                  onClick={() => handleChildDeleteTier(cIdx, childRole, tIdx)}
                                                  className="p-1 text-gray-400 hover:text-rose-600 rounded"
                                                >
                                                  <Trash2 size={13} />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* + Add Child Product Button */}
                  <button
                    type="button"
                    onClick={handleAddChildProduct}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/50 hover:bg-purple-100/50 text-purple-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Plus size={16} />
                    <span>+ Add Child Product</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                  <span>Parent mode is disabled. Toggle "Set as Parent" above to link multiple child products under this parent.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsParentProduct(true);
                      if (childProducts.length === 0) handleAddChildProduct();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Enable &amp; Add Child Product
                  </button>
                </div>
              )}
            </div>

            {/* CARD 7: PUBLISHING & MERCHANDISING CONTROLS */}
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-5">
              <div className="flex items-start gap-3 pb-3 border-b border-pink-100/70">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  7
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">
                    Publishing &amp; Merchandising Controls
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Separated operational lifecycle management from promotional discovery placement
                  </p>
                </div>
              </div>

              {/* SUBSECTION A: PUBLISHING & INVENTORY LIFECYCLE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Section A: Publishing &amp; Catalog Status
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                      Publish Status <span className="text-[#E11D48]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.status || 'published'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full py-2.5 pl-3 pr-8 rounded-xl border border-pink-100 bg-white font-bold text-gray-900 text-xs shadow-2xs outline-none focus:border-[#E11D48] appearance-none"
                      >
                        <option value="published">🟢 Published (Active &amp; Visible)</option>
                        <option value="draft">🟡 Draft (Hidden from Customers)</option>
                        <option value="hidden">⚪ Hidden (Internal Only)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBSECTION B: MERCHANDISING PLACEMENT */}
              <div className="pt-3 border-t border-pink-100/70 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Section B: Merchandising Badges &amp; Storefront Placement
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* New Arrival */}
                  <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${formData.showInNewArrivals !== false
                    ? 'border-[#E11D48] bg-pink-50/40 text-gray-900'
                    : 'border-pink-100 hover:border-pink-200 bg-white text-gray-700'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs">New Arrival</div>
                      <input
                        type="checkbox"
                        checked={formData.showInNewArrivals !== false}
                        onChange={(e) => setFormData({ ...formData, showInNewArrivals: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#E11D48] cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Show in New Arrivals feed</p>
                  </label>

                  {/* Featured Product */}
                  <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${formData.isFeatured
                    ? 'border-[#E11D48] bg-pink-50/40 text-gray-900'
                    : 'border-pink-100 bg-white text-gray-700'
                    }`}>
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs cursor-pointer flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={!!formData.isFeatured}
                          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                          className="w-4 h-4 rounded accent-[#E11D48] cursor-pointer"
                        />
                        <span>Featured</span>
                      </label>
                    </div>
                    {formData.isFeatured && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-gray-500">Priority:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.featuredPriority}
                          onChange={(e) => setFormData({ ...formData, featuredPriority: e.target.value })}
                          onWheel={(e) => e.target.blur()}
                          onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                          className="w-12 px-1 py-0.5 border rounded text-center font-bold bg-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Trending Product */}
                  <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${formData.isTrending
                    ? 'border-[#E11D48] bg-pink-50/40 text-gray-900'
                    : 'border-pink-100 bg-white text-gray-700'
                    }`}>
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs cursor-pointer flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={!!formData.isTrending}
                          onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                          className="w-4 h-4 rounded accent-[#E11D48] cursor-pointer"
                        />
                        <span>Trending</span>
                      </label>
                    </div>
                    {formData.isTrending && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-gray-500">Priority:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.trendingPriority}
                          onChange={(e) => setFormData({ ...formData, trendingPriority: e.target.value })}
                          onWheel={(e) => e.target.blur()}
                          onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                          className="w-12 px-1 py-0.5 border rounded text-center font-bold bg-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Recommended */}
                  <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${formData.isRecommended
                    ? 'border-[#E11D48] bg-pink-50/40 text-gray-900'
                    : 'border-pink-100 hover:border-pink-200 bg-white text-gray-700'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs">Recommended</div>
                      <input
                        type="checkbox"
                        checked={!!formData.isRecommended}
                        onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#E11D48] cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Show in Recommendations</p>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* =================================================================
              RIGHT COLUMN: STICKY PRODUCT SUMMARY & LIVE CUSTOMER PREVIEW (lg:col-span-4)
              ================================================================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-[#F3D7DF] p-5 shadow-xs space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
              {/* Product Summary Header */}
              <div className="flex items-center justify-between pb-3 border-b border-pink-100/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-pink-100 text-[#E11D48] flex items-center justify-center font-bold">
                    <Package size={15} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900 leading-tight">
                      Live Storefront Preview
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Simulated real customer product view
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                  {formData.status === 'published' ? '🟢 Published' : '🟡 Draft'}
                </span>
              </div>

              {/* Interactive Role Switcher in Live Preview */}
              <div className="space-y-1.5 pb-2 border-b border-pink-100/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-600">Simulate View As Role:</span>
                  <span className="text-[10px] text-[#E11D48] font-bold">
                    {DISCOUNT_ROLES.find(r => r.id === previewCustomerRole)?.name}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-center">
                  {DISCOUNT_ROLES.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setPreviewCustomerRole(role.id)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer truncate ${previewCustomerRole === role.id
                        ? 'bg-[#E11D48] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {role.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* =================================================================
                  CONTINUOUS PRODUCT PAGE SIMULATION (FLOW: Images → Info → Price → Status → Description → Variants → Specs → Discounts)
                  ================================================================= */}
              <div className="space-y-4 text-xs">

                {/* 1. PRODUCT IMAGES / GALLERY */}
                <div className="space-y-2">
                  <div className="w-full h-64 rounded-2xl bg-white border border-pink-100 overflow-hidden flex items-center justify-center shadow-2xs relative group">
                    <img
                      src={currentPreviewVariant?.image || previewActiveImage}
                      alt={formData.name || 'Product packshot'}
                      className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Selected Variant Chip Indicator */}
                    {currentPreviewVariant && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          {currentPreviewVariant.hexColor && (
                            <span className="w-2.5 h-2.5 rounded-full border border-white inline-block shrink-0" style={{ backgroundColor: currentPreviewVariant.hexColor }} />
                          )}
                          <span className="truncate">Variant: {currentPreviewVariant.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVariantPreviewIndex(null)}
                          className="text-pink-300 hover:text-white shrink-0 text-[9px] underline cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {uploadedImagesList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {uploadedImagesList.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedVariantPreviewIndex(null);
                            setSelectedPreviewImageIndex(i);
                          }}
                          className={`w-12 h-12 rounded-xl border-2 overflow-hidden bg-white shrink-0 cursor-pointer transition-all ${selectedPreviewImageIndex === i && selectedVariantPreviewIndex === null
                            ? 'border-[#E11D48] ring-2 ring-pink-200'
                            : 'border-gray-200 hover:border-pink-300'
                            }`}
                        >
                          <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. PRODUCT INFORMATION */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold uppercase tracking-wider text-[#E11D48]">
                      {formData.brandName || 'Brand'}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {formData.category || 'Category'} {formData.subcategory ? `› ${formData.subcategory}` : ''}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-gray-900 leading-snug">
                    {formData.name || 'Product Title'}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="flex items-center text-amber-500 font-bold">
                      ★ {formData.rating || 4.8}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400">
                      ({formData.reviewCount || 120} reviews)
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">Verified Salbeau Authenticity</span>
                  </div>
                </div>

                {/* 3. ROLE-BASED PRICE */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/90 to-rose-50/70 border border-pink-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wide">
                      {DISCOUNT_ROLES.find(r => r.id === previewCustomerRole)?.name} Price
                    </span>
                    {numericMrp > getActiveRoleBasePrice(previewCustomerRole) && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E11D48] text-white font-black text-[10px] shadow-2xs">
                        {Math.round((1 - getActiveRoleBasePrice(previewCustomerRole) / numericMrp) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-black text-[#E11D48] font-mono tracking-tight">
                      ₹{getActiveRoleBasePrice(previewCustomerRole).toFixed(2)}
                    </span>
                    {numericMrp > getActiveRoleBasePrice(previewCustomerRole) && (
                      <span className="text-sm text-gray-400 line-through font-mono font-medium">
                        MRP ₹{numericMrp.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {numericMrp > getActiveRoleBasePrice(previewCustomerRole) && (
                    <p className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>You save ₹{(numericMrp - getActiveRoleBasePrice(previewCustomerRole)).toFixed(2)} with role pricing</span>
                    </p>
                  )}
                </div>

                {/* 4. PUBLICATION & CATALOG STATUS */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">Catalog Visibility:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${formData.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : formData.status === 'draft'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                      }`}>
                      {formData.status === 'published' ? 'Live on Storefront' : formData.status === 'draft' ? 'Draft Mode' : formData.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">Catalog Visibility:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      ● Active (Catalog Visible)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/80 text-[10.5px] text-gray-500 font-mono">
                    <div>SKU: <span className="font-bold text-gray-700">{formData.sku || 'Auto-generated'}</span></div>
                    <div>Barcode: <span className="font-bold text-gray-700">{formData.barcode || 'Universal'}</span></div>
                  </div>
                </div>

                {/* 5. PRODUCT DESCRIPTION */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                    Product Description
                  </h4>
                  <div className="p-3 rounded-xl bg-[#FFF9FA] border border-pink-100 text-gray-700 text-xs leading-relaxed whitespace-pre-line">
                    {formData.description ? (
                      formData.description
                    ) : (
                      <span className="text-gray-400 italic">
                        No product description provided yet. Enter copy or use the AI Generator above.
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. VARIANTS / SPECIFICATIONS */}
                {hasVariants && formData.shades && formData.shades.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                        Available Variants ({formData.shades.length})
                      </h4>
                      {selectedVariantPreviewIndex !== null && (
                        <button
                          type="button"
                          onClick={() => setSelectedVariantPreviewIndex(null)}
                          className="text-[#E11D48] font-bold text-[10.5px] hover:underline"
                        >
                          View Main Product
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {formData.shades.map((v, idx) => {
                        const isSelected = selectedVariantPreviewIndex === idx;
                        return (
                          <div
                            key={v.id || idx}
                            onClick={() => setSelectedVariantPreviewIndex(idx)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${isSelected
                              ? 'border-[#E11D48] bg-pink-50 ring-2 ring-pink-200'
                              : 'border-gray-200 hover:border-pink-200 bg-white'
                              }`}
                          >
                            {v.hexColor ? (
                              <div
                                className="w-5 h-5 rounded-full border border-gray-300 shrink-0 shadow-2xs"
                                style={{ backgroundColor: v.hexColor }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-md bg-pink-100 text-[#E11D48] flex items-center justify-center font-bold text-[9px] shrink-0">
                                {idx + 1}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-[11px] truncate">{v.name || `Variant ${idx + 1}`}</div>
                              <div className="font-mono text-[10px] text-[#E11D48] font-bold">
                                ₹{Number(v.generalPrice || v.mrp || numericMrp).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. SPECIFICATIONS & PRODUCT DETAILS */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                    Product Specifications
                  </h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white text-[11px]">
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500">Brand</span>
                      <span className="font-bold text-gray-800">{formData.brandName || 'Brand'}</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500">Category</span>
                      <span className="font-bold text-gray-800">{formData.category || 'Makeup'}</span>
                    </div>
                    {formData.subcategory && (
                      <div className="flex justify-between p-2">
                        <span className="text-gray-500">Subcategory</span>
                        <span className="font-bold text-gray-800">{formData.subcategory}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500">Variants Configured</span>
                      <span className="font-bold text-gray-800">{(formData.shades || []).length} options</span>
                    </div>
                  </div>
                </div>

                {/* 8. APPLICABLE DISCOUNTS & VOLUME TIERS */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                      Volume Discounts ({DISCOUNT_ROLES.find(r => r.id === previewCustomerRole)?.shortName})
                    </h4>
                    <span className="text-[10px] text-[#E11D48] font-bold">
                      {roleDiscounts[previewCustomerRole]}% Base Role Discount
                    </span>
                  </div>

                  {(() => {
                    const normalized = normalizeQuantityTiers(formData.quantityTiers);
                    const roleTiers = normalized[previewCustomerRole] || [];
                    const basePrice = getActiveRoleBasePrice(previewCustomerRole);

                    if (roleTiers.length === 0) {
                      return (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-[11px] text-center">
                          Standard role price (₹{basePrice.toFixed(2)}) applies. No volume tiers currently configured for {DISCOUNT_ROLES.find(r => r.id === previewCustomerRole)?.name}.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5">
                        {roleTiers.map((t, idx) => {
                          const unitP = calculateTierFinalPrice(basePrice, Number(t.additionalDiscount));
                          return (
                            <div key={t.id || idx} className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-gray-900">
                                  Buy {t.minQty}{t.maxQty ? ` - ${t.maxQty}` : '+'} units
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  +{t.additionalDiscount}% Extra Volume Discount
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-black text-emerald-800 text-sm">
                                  ₹{unitP.toFixed(2)}
                                </span>
                                <span className="text-[9.5px] text-gray-500 block">per unit</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================================
          STICKY BOTTOM ACTION BAR - ONLY [Draft], [Save Product], and [Submit]
          ===================================================================== */}
      <div className="mt-8 pt-4 pb-2 sticky bottom-3 z-30">
        <div className="max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-[#F3D7DF]">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>
                {draftLastSaved
                  ? `Draft saved locally (${new Date(draftLastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                  : isDirty
                    ? 'Unsaved changes in product form'
                    : 'All modifications saved'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* 1. DRAFT */}
              <button
                type="button"
                id="btn-bottom-draft"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-[#E11D48] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin text-[#E11D48]" />
                ) : (
                  <Save size={14} />
                )}
                <span>Draft</span>
              </button>

              {/* 2. SAVE PRODUCT */}
              <button
                type="button"
                id="btn-bottom-save-product"
                onClick={handleSaveProduct}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin text-gray-600" />
                ) : (
                  <Check size={15} className="stroke-[2.5]" />
                )}
                <span>Save Product</span>
              </button>

              {/* 3. SUBMIT */}
              <button
                type="button"
                id="btn-bottom-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#E6005C] hover:from-[#c8123c] hover:to-[#cc0052] text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} className="stroke-[3]" />
                    <span>Submit Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          UNSAVED CHANGES MODAL
          ===================================================================== */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-gray-900">Unsaved Changes</h3>
              <p className="text-xs text-gray-500">
                You have unsaved changes on this product form. Leaving now will discard your modifications.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  onNavigateBack();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Discard &amp; Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BARCODE SCANNER MODAL (Camera Scanner & Device Support)
          ===================================================================== */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => {
          setIsBarcodeScannerOpen(false);
          setBarcodeScannerTarget(null);
        }}
        title={
          typeof barcodeScannerTarget === 'number' && formData.shades[barcodeScannerTarget]
            ? `Scan Barcode: ${formData.shades[barcodeScannerTarget]?.name || `Variant #${barcodeScannerTarget + 1}`}`
            : 'Scan Product Barcode'
        }
        subtitle="Detects retail 1D/2D barcodes (EAN-13, EAN-8, UPC-A, Code 128, QR)"
        checkBarcodeInSupabase={checkBarcodeInSupabase}
        onScanSuccess={(detectedCode) => {
          if (typeof barcodeScannerTarget === 'number' && formData.shades[barcodeScannerTarget]) {
            setFormData(prev => ({
              ...prev,
              shades: prev.shades.map((s, idx) => idx === barcodeScannerTarget ? { ...s, barcode: detectedCode } : s)
            }));
          } else {
            setFormData(prev => ({ ...prev, barcode: detectedCode }));
            performBarcodeVerification(detectedCode, { immediate: true });
          }
          setIsBarcodeScannerOpen(false);
          setBarcodeScannerTarget(null);
        }}
      />

      {/* =====================================================================
          MASTER PRODUCT MODULE MODALS: BULK ENTRY, EXCEL IMPORT & BARCODE REVIEW
          ===================================================================== */}
      <BulkProductEntryModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        categories={categories}
        brands={brands}
        existingProducts={products}
        onUploadProductImage={uploadProductImage}
        defaultPricingRules={pricingRules || contextDefaultPricingRules || {}}
        onSubmitBulk={async (validRows, onProgress) => {
          if (saveBulkProducts) {
            await saveBulkProducts(validRows, onProgress);
          }
        }}
      />

      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        categories={categories}
        brands={brands}
        existingProducts={products}
        onImportProducts={async (validRows, onProgress) => {
          if (saveBulkProducts) {
            return await saveBulkProducts(validRows, onProgress);
          }
          return { success: true };
        }}
      />

      <BarcodeLookupReviewModal
        isOpen={barcodeLookupModalOpen}
        onClose={() => setBarcodeLookupModalOpen(false)}
        lookupResult={barcodeLookupResult}
        onAccept={handleAcceptBarcodeInfo}
        categories={categories}
        brands={brands}
      />

      {isInlineAddBrandOpen && (
        <BrandFormModal
          isOpen={isInlineAddBrandOpen}
          onClose={() => setIsInlineAddBrandOpen(false)}
          existingBrands={brands}
          masterCategories={categories}
          onSaveBrand={async (newBrand) => {
            const saved = await addBrand(newBrand);
            setFormData(prev => ({
              ...prev,
              brandName: saved.name,
              brandId: saved.id
            }));
            setIsInlineAddBrandOpen(false);
          }}
        />
      )}
    </div>
  );
}
