import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  X,
  Search,
  Check,
  Palette,
  Barcode,
  ScanBarcode,
  Trash2,
  Sparkles,
  Upload,
  ImageIcon,
  Camera,
  Loader2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  CheckCircle2,
  Tag,
  SlidersHorizontal,
  Package
} from 'lucide-react';
import {
  ATTRIBUTE_GROUPS,
  loadAttributeMasterFromDb,
  loadCategoryAttributeMapFromDb,
  generateCartesianVariants,
  getProductAttributeSuggestions
} from '../../utils/attributeMasterData';

// Only attributes that can legitimately create purchasable product variations
const VARIANT_CAPABLE_ATTRIBUTE_REGEX = /shade|colour|color|size|volume|weight|pack|finish|coverage|formula|formulation|hair type|skin type|fragrance|scent|material|flavour|flavor|length|width/i;

// Informational-only specifications that should NOT be suggested as variant creators
const INFORMATIONAL_ONLY_SPECS = new Set([
  'spf',
  'key ingredient',
  'origin',
  'country of origin',
  'shelf life',
  'skin concern',
  'hair concern',
  'product format',
  'colour family',
  'undertone',
  'benefits',
  'application'
]);

export default function DynamicVariantBuilder({
  hasVariants,
  onToggleHasVariants,
  variants = [],
  onChangeVariants,
  baseProduct = {},
  uploadProductImage,
  roleDiscounts = { general: '0', salon: '26', artist: '30', beautician: '32' },
  category = '',
  subcategory = '',
  productName = '',
  onOpenScanner
}) {
  // Attribute Master list & Category mappings
  const [attributeMaster, setAttributeMaster] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);

  // Selected Attributes for building variants:
  // [{ id, name, group, inputType, selectedValues: [{ id, name, hexColor, code }], availableValues: [...] }]
  const [selectedAttributes, setSelectedAttributes] = useState([]);

  // Draft inputs for adding new values inline: { [attrId]: { name: '', hexColor: '#CE4270', code: '' } }
  const [newValueDrafts, setNewValueDrafts] = useState({});

  // Modals
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customAttrForm, setCustomAttrForm] = useState({
    name: '',
    group: 'Other',
    inputType: 'select',
    initialValues: ''
  });

  const [showBrowseAllModal, setShowBrowseAllModal] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseGroupFilter, setBrowseGroupFilter] = useState('All');

  // Variant image upload loading state
  const [uploadingVariantId, setUploadingVariantId] = useState(null);

  // Main product image fallback (when variant doesn't have an individual custom image)
  const mainProductFallbackImage = useMemo(() => {
    return baseProduct.image || (baseProduct.images && baseProduct.images[0]) || '';
  }, [baseProduct.image, baseProduct.images]);

  // Context change detection
  const previousContextRef = useRef({ category: '', subcategory: '' });
  const [categoryChangedNotice, setCategoryChangedNotice] = useState(null);

  // Load Attribute Master & Category mappings from DB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingAttributes(true);
      try {
        const [attrs, catMap] = await Promise.all([
          loadAttributeMasterFromDb(),
          loadCategoryAttributeMapFromDb()
        ]);
        if (isMounted) {
          setAttributeMaster(attrs || []);
          setCategoryMap(catMap || {});
        }
      } catch (err) {
        console.warn('Failed loading attribute master:', err);
      } finally {
        if (isMounted) setIsLoadingAttributes(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Compute context-aware variant attribute suggestions using Priority:
  // 1. Category/Subcategory -> Attributes Master configuration
  // 2. Existing product/category attribute mappings rules
  // 3. Product Name contextual matching
  const suggestedVariantAttributes = useMemo(() => {
    const rawSuggestions = getProductAttributeSuggestions({
      category,
      subcategory,
      productType: subcategory,
      productName
    });

    const candidateNames = new Set();

    // 1. From category map if exists
    const catKey = (category || '').toLowerCase().trim();
    const subKey = (subcategory || '').toLowerCase().trim();
    if (categoryMap[subKey]?.attributes) {
      categoryMap[subKey].attributes.forEach(a => candidateNames.add(a));
    } else if (categoryMap[catKey]?.attributes) {
      categoryMap[catKey].attributes.forEach(a => candidateNames.add(a));
    }

    // 2. From suggestion rules
    (rawSuggestions.suggested || []).forEach(name => candidateNames.add(name));
    (rawSuggestions.defaultAutoSelect || []).forEach(name => candidateNames.add(name));

    // 3. Filter to ONLY variant-capable attributes (remove informational specifications)
    const filtered = Array.from(candidateNames).filter(attrName => {
      const lower = attrName.toLowerCase().trim();
      if (INFORMATIONAL_ONLY_SPECS.has(lower)) return false;
      return VARIANT_CAPABLE_ATTRIBUTE_REGEX.test(lower);
    });

    // Special safety check: Never suggest "Shade" for Hair Care / Shampoo / Fragrance / Tools
    const isHaircareOrFragranceOrTools = /hair|shampoo|conditioner|perfume|fragrance|brush|sponge|tool|appliance/i.test(
      `${category} ${subcategory} ${productName}`
    );
    const isPureHairColour = /hair colo(u)?r|hair dye/i.test(`${category} ${subcategory} ${productName}`);

    return filtered.filter(attrName => {
      if (isHaircareOrFragranceOrTools && !isPureHairColour) {
        if (/shade|colour/i.test(attrName)) return false;
      }
      return true;
    });
  }, [category, subcategory, productName, categoryMap]);

  // Context change detection to warn admin without silently deleting data
  useEffect(() => {
    const prev = previousContextRef.current;
    if (prev.category && (prev.category !== category || prev.subcategory !== subcategory)) {
      if (variants && variants.length > 0) {
        setCategoryChangedNotice(
          `Category changed to "${category}${subcategory ? ' > ' + subcategory : ''}". Your existing ${variants.length} variant(s) are preserved.`
        );
      }
    }
    previousContextRef.current = { category, subcategory };
  }, [category, subcategory, variants]);

  // Sync selected attributes from existing variants if editing an existing product
  useEffect(() => {
    if (variants && variants.length > 0 && selectedAttributes.length === 0 && attributeMaster.length > 0) {
      const detectedAttrNames = new Set();
      const detectedValuesMap = {};

      variants.forEach(v => {
        if (v.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes).forEach(([attrName, valName]) => {
            if (valName) {
              detectedAttrNames.add(attrName);
              if (!detectedValuesMap[attrName]) detectedValuesMap[attrName] = new Set();
              detectedValuesMap[attrName].add(valName);
            }
          });
        }
      });

      if (detectedAttrNames.size > 0) {
        const reconstructed = [];
        detectedAttrNames.forEach(attrName => {
          const master = attributeMaster.find(a => a.name.toLowerCase() === attrName.toLowerCase()) || {
            id: `attr_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: attrName,
            group: 'Appearance',
            inputType: /shade|colo(u)?r/i.test(attrName) ? 'color_swatch' : 'select',
            values: []
          };

          const selectedVals = Array.from(detectedValuesMap[attrName] || []).map(valName => {
            const existingOpt = (master.values || []).find(v => (typeof v === 'object' ? v.name : v) === valName);
            return existingOpt || { id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: valName };
          });

          reconstructed.push({
            ...master,
            selectedValues: selectedVals
          });
        });
        setSelectedAttributes(reconstructed);
      }
    }
  }, [variants, attributeMaster]);

  // Initial auto-selection of recommended attribute when enabling variants fresh
  const autoSelectDoneRef = useRef(false);
  useEffect(() => {
    if (!hasVariants || autoSelectDoneRef.current || variants.length > 0 || selectedAttributes.length > 0) return;
    if (suggestedVariantAttributes.length > 0 && attributeMaster.length > 0) {
      const firstSuggestedName = suggestedVariantAttributes[0];
      const master = attributeMaster.find(a => a.name.toLowerCase() === firstSuggestedName.toLowerCase()) || {
        id: `attr_${firstSuggestedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: firstSuggestedName,
        group: /shade|colo(u)?r/i.test(firstSuggestedName) ? 'Appearance' : 'Size & Quantity',
        inputType: /shade|colo(u)?r/i.test(firstSuggestedName) ? 'color_swatch' : 'select',
        values: []
      };

      setSelectedAttributes([{ ...master, selectedValues: [] }]);
      autoSelectDoneRef.current = true;
    }
  }, [hasVariants, suggestedVariantAttributes, attributeMaster, variants.length, selectedAttributes.length]);

  // Toggle selection of an attribute
  const handleToggleAttribute = (attrName) => {
    const existingIndex = selectedAttributes.findIndex(
      a => a.name.toLowerCase() === attrName.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Deselect
      setSelectedAttributes(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Select from master or build attribute object
      const master = attributeMaster.find(a => a.name.toLowerCase() === attrName.toLowerCase()) || {
        id: `attr_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: attrName,
        group: /shade|colo(u)?r/i.test(attrName) ? 'Appearance' : 'Size & Quantity',
        inputType: /shade|colo(u)?r/i.test(attrName) ? 'color_swatch' : 'select',
        values: []
      };

      setSelectedAttributes(prev => [...prev, { ...master, selectedValues: [] }]);
    }
  };

  // Add custom attribute modal handler
  const handleAddCustomAttribute = () => {
    const trimmed = customAttrForm.name.trim();
    if (!trimmed) return;

    const initialValuesList = customAttrForm.initialValues
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .map((valStr, i) => ({
        id: `val_cust_${Date.now()}_${i}`,
        name: valStr
      }));

    const newAttr = {
      id: `attr_custom_${Date.now()}`,
      name: trimmed,
      group: customAttrForm.group || 'Other',
      inputType: customAttrForm.inputType || 'select',
      status: 'active',
      values: initialValuesList
    };

    setAttributeMaster(prev => [...prev, newAttr]);
    setSelectedAttributes(prev => [...prev, { ...newAttr, selectedValues: initialValuesList }]);
    setShowAddCustomModal(false);
    setCustomAttrForm({ name: '', group: 'Other', inputType: 'select', initialValues: '' });
  };

  // Toggle a value chip selection inside an attribute
  const handleToggleValue = (attrId, valObj) => {
    setSelectedAttributes(prev => prev.map(attr => {
      if (attr.id !== attrId) return attr;
      const targetName = typeof valObj === 'object' ? valObj.name : valObj;
      const alreadySelected = (attr.selectedValues || []).some(
        v => (typeof v === 'object' ? v.name : v) === targetName
      );

      let updatedSelected;
      if (alreadySelected) {
        updatedSelected = (attr.selectedValues || []).filter(
          v => (typeof v === 'object' ? v.name : v) !== targetName
        );
      } else {
        updatedSelected = [...(attr.selectedValues || []), valObj];
      }

      return {
        ...attr,
        selectedValues: updatedSelected
      };
    }));
  };

  // Add a new value inline to an attribute
  const handleAddNewValueToAttribute = (attrId) => {
    const draft = newValueDrafts[attrId];
    if (!draft || !draft.name.trim()) return;

    const newValName = draft.name.trim();
    const newValObj = {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newValName,
      ...(draft.hexColor ? { hexColor: draft.hexColor } : {}),
      ...(draft.code ? { code: draft.code.trim() } : {})
    };

    // Update master attribute values list and select it immediately
    setAttributeMaster(prev => prev.map(a => {
      if (a.id === attrId) {
        return { ...a, values: [...(a.values || []), newValObj] };
      }
      return a;
    }));

    setSelectedAttributes(prev => prev.map(a => {
      if (a.id === attrId) {
        const currentVals = a.values || [];
        return {
          ...a,
          values: [...currentVals, newValObj],
          selectedValues: [...(a.selectedValues || []), newValObj]
        };
      }
      return a;
    }));

    setNewValueDrafts(prev => ({
      ...prev,
      [attrId]: { name: '', hexColor: '#CE4270', code: '' }
    }));
  };

  // Combinations count
  const validAttributesWithValues = useMemo(() => {
    return selectedAttributes.filter(a => a.selectedValues && a.selectedValues.length > 0);
  }, [selectedAttributes]);

  const combinationsCount = useMemo(() => {
    if (validAttributesWithValues.length === 0) return 0;
    return validAttributesWithValues.reduce((acc, a) => acc * a.selectedValues.length, 1);
  }, [validAttributesWithValues]);

  // Helper to calculate role price from MRP and role discount percentage
  const calcRolePrice = (mrpNum, roleKey, fallback = '') => {
    if (isNaN(mrpNum) || mrpNum <= 0) return fallback;
    const pct = roleDiscounts?.[roleKey];
    if (pct !== undefined && pct !== null && pct !== '' && !isNaN(Number(pct))) {
      return Math.max(0, Math.round(mrpNum * (1 - Number(pct) / 100)));
    }
    return mrpNum;
  };

  // Generate Cartesian Product Variants
  const handleGenerateVariants = () => {
    if (combinationsCount === 0) {
      alert('Please select at least one value for each selected attribute before generating variants.');
      return;
    }

    const generated = generateCartesianVariants(validAttributesWithValues, {
      ...baseProduct,
      roleDiscounts
    });

    // Merge with existing variants to preserve user's entered barcodes/custom prices
    const merged = generated.map(newVar => {
      const existing = (variants || []).find(v => v.name === newVar.name);
      if (existing) {
        return {
          ...newVar,
          ...existing,
          attributes: newVar.attributes,
          selectedCombination: newVar.selectedCombination
        };
      }
      return newVar;
    });

    onChangeVariants(merged);
    setCategoryChangedNotice(null);
  };

  // Add a manual single variant without cartesian matrix
  const handleAddManualVariant = () => {
    const nextNum = (variants || []).length + 1;
    const parentMrp = Number(baseProduct.mrp) || 0;
    const defaultImg = (baseProduct.images && baseProduct.images[0]) || baseProduct.image || '';

    // Seed attributes from selected attributes
    const seedAttrs = {};
    selectedAttributes.forEach(a => {
      seedAttrs[a.name] = a.selectedValues?.[0]?.name || '';
    });

    const newVar = {
      id: `var_${Date.now()}_${nextNum}`,
      name: `Variant ${nextNum}`,
      sku: baseProduct.sku ? `${baseProduct.sku}-V${nextNum}` : `VAR-${Date.now().toString(36)}-${nextNum}`,
      barcode: '',
      image: '',
      mrp: parentMrp || '',
      generalPrice: baseProduct.generalPrice || calcRolePrice(parentMrp, 'general', parentMrp || ''),
      salonPrice: baseProduct.salonPrice || calcRolePrice(parentMrp, 'salon', parentMrp || ''),
      artistPrice: baseProduct.artistPrice || calcRolePrice(parentMrp, 'artist', parentMrp || ''),
      beauticianPrice: baseProduct.beauticianPrice || calcRolePrice(parentMrp, 'beautician', parentMrp || ''),
      active: true,
      attributes: seedAttrs
    };

    onChangeVariants([...(variants || []), newVar]);
  };

  // Recalculate 4-role prices when Variant MRP changes
  const handleVariantMrpChange = (varId, newMrpVal) => {
    const numMrp = Number(newMrpVal);
    onChangeVariants(variants.map(v => {
      if (v.id !== varId) return v;

      if (!isNaN(numMrp) && numMrp > 0) {
        return {
          ...v,
          mrp: newMrpVal,
          generalPrice: calcRolePrice(numMrp, 'general'),
          salonPrice: calcRolePrice(numMrp, 'salon'),
          artistPrice: calcRolePrice(numMrp, 'artist'),
          beauticianPrice: calcRolePrice(numMrp, 'beautician')
        };
      } else {
        return {
          ...v,
          mrp: newMrpVal,
          generalPrice: '',
          salonPrice: '',
          artistPrice: '',
          beauticianPrice: ''
        };
      }
    }));
  };

  // Update a single field on a generated variant
  const handleUpdateVariantField = (varId, field, value) => {
    onChangeVariants(variants.map(v => (v.id === varId ? { ...v, [field]: value } : v)));
  };

  // Delete an individual generated variant
  const handleDeleteVariant = (varId) => {
    onChangeVariants(variants.filter(v => v.id !== varId));
  };

  // Handle Variant Image Upload (uploads via uploadProductImage if provided, without duplicating fallback image)
  const handleVariantImageUpload = async (varId, file) => {
    if (!file) return;
    setUploadingVariantId(varId);
    try {
      if (typeof uploadProductImage === 'function') {
        const uploadedUrl = await uploadProductImage(file);
        if (uploadedUrl) {
          handleUpdateVariantField(varId, 'image', uploadedUrl);
          setUploadingVariantId(null);
          return;
        }
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        handleUpdateVariantField(varId, 'image', e.target.result);
        setUploadingVariantId(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Variant image upload failed, fallback to data URL:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        handleUpdateVariantField(varId, 'image', e.target.result);
        setUploadingVariantId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#F3D7DF] p-6 shadow-xs space-y-5">
      {/* 1. Header with Badge & Variant Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100/70">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            7
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Product Variants</span>
              {hasVariants && (
                <span className="text-[10px] bg-pink-100 text-[#E11D48] px-2 py-0.5 rounded-full font-black">
                  {(variants || []).length} Variants
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              Configure dynamic variant attributes (Shade, Size, Volume, Finish, etc.) and generate sellable variants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasVariants) {
                onToggleHasVariants(false);
                onChangeVariants([]);
              } else {
                onToggleHasVariants(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              hasVariants
                ? 'bg-pink-50 text-[#E11D48] border-pink-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {hasVariants ? 'Variants Enabled' : 'No Variants (Standalone)'}
          </button>

          {hasVariants && (
            <button
              type="button"
              onClick={handleAddManualVariant}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-pink-50 text-[#E11D48] border border-pink-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Add a custom variant row directly"
            >
              <Plus size={13} />
              <span>Add Variant</span>
            </button>
          )}
        </div>
      </div>

      {/* Standalone View */}
      {!hasVariants ? (
        <div className="p-6 bg-[#FFF9FA] rounded-2xl border border-pink-100 text-center">
          <Package size={28} className="mx-auto text-pink-300 mb-2" />
          <p className="font-bold text-xs text-gray-800">Standalone Product (Single Sellable Item)</p>
          <p className="text-[11px] text-gray-500 mt-0.5 max-w-md mx-auto">
            No variants configured. The primary product details and base pricing will be used directly in the catalog.
          </p>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Category Change Preservation Notice */}
          {categoryChangedNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>{categoryChangedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCategoryChangedNotice(null)}
                className="text-amber-700 hover:text-amber-900 font-bold text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 2. SUGGESTED VARIANT ATTRIBUTES CARD */}
          <div className="p-4 rounded-2xl bg-[#FFF9FA] border border-pink-100/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#E11D48]" />
                  <span>Suggested Variant Attributes</span>
                </div>
                <p className="text-[10.5px] text-gray-500 font-medium">
                  Suggested based on Category &amp; Subcategory: <strong>{category || 'Category'}</strong>
                  {subcategory ? ` › ${subcategory}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#E11D48] bg-white border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>Add Custom Attribute</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBrowseAllModal(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <SlidersHorizontal size={12} />
                  <span>Browse Master</span>
                </button>
              </div>
            </div>

            {/* Suggested Attribute Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestedVariantAttributes.map(attrName => {
                const isSelected = selectedAttributes.some(
                  a => a.name.toLowerCase() === attrName.toLowerCase()
                );
                return (
                  <button
                    key={attrName}
                    type="button"
                    onClick={() => handleToggleAttribute(attrName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#E11D48] text-white shadow-2xs'
                        : 'bg-white text-gray-700 border border-pink-200 hover:border-[#E11D48] hover:bg-pink-50/50'
                    }`}
                  >
                    {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                    <span>{attrName}</span>
                  </button>
                );
              })}

              {suggestedVariantAttributes.length === 0 && (
                <span className="text-xs text-gray-400 font-medium">
                  No automated suggestions for this category. Click "+ Add Custom Attribute" to define your own.
                </span>
              )}
            </div>
          </div>

          {/* 3. SELECTED ATTRIBUTES & VALUES CONFIGURATION */}
          {selectedAttributes.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                  Configure Attribute Values ({selectedAttributes.length} selected)
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  Click chips to select/deselect values for variant generation
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {selectedAttributes.map((attr) => {
                  const isColorAttr = /shade|colo(u)?r/i.test(attr.name) || attr.inputType === 'color_swatch';
                  const availableValues = attr.values && attr.values.length > 0
                    ? attr.values
                    : (attributeMaster.find(m => m.name.toLowerCase() === attr.name.toLowerCase())?.values || []);

                  const selectedNamesSet = new Set(
                    (attr.selectedValues || []).map(v => (typeof v === 'object' ? v.name : v))
                  );

                  const draft = newValueDrafts[attr.id] || { name: '', hexColor: '#CE4270', code: '' };

                  return (
                    <div
                      key={attr.id}
                      className="p-4 rounded-2xl border border-pink-100 bg-white shadow-2xs space-y-3"
                    >
                      {/* Attribute Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-pink-100/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                          <span className="font-extrabold text-xs text-gray-900">{attr.name}</span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
                            {attr.group || 'Variant Attribute'}
                          </span>
                          <span className="text-[10px] text-[#E11D48] font-bold">
                            ({attr.selectedValues?.length || 0} selected)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleAttribute(attr.name)}
                          className="text-gray-400 hover:text-rose-600 p-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Remove this attribute"
                        >
                          <X size={13} />
                          <span>Remove</span>
                        </button>
                      </div>

                      {/* Value Chips list */}
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {availableValues.map((val) => {
                          const valName = typeof val === 'object' ? val.name : val;
                          const hex = typeof val === 'object' ? val.hexColor : undefined;
                          const isSelected = selectedNamesSet.has(valName);

                          return (
                            <button
                              key={val.id || valName}
                              type="button"
                              onClick={() => handleToggleValue(attr.id, val)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E11D48] text-white shadow-2xs'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                              }`}
                            >
                              {hex && (
                                <span
                                  className="w-3 h-3 rounded-full border border-white shrink-0 shadow-2xs"
                                  style={{ backgroundColor: hex }}
                                />
                              )}
                              <span>{valName}</span>
                              {isSelected && <Check size={11} className="stroke-[3]" />}
                            </button>
                          );
                        })}

                        {availableValues.length === 0 && (
                          <span className="text-xs text-gray-400 italic">
                            No pre-existing values. Use the input below to add options.
                          </span>
                        )}
                      </div>

                      {/* Inline Value Adder */}
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                        {isColorAttr && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="color"
                              value={draft.hexColor || '#CE4270'}
                              onChange={(e) => setNewValueDrafts({
                                ...newValueDrafts,
                                [attr.id]: { ...draft, hexColor: e.target.value }
                              })}
                              className="w-7 h-7 rounded border border-gray-300 p-0 cursor-pointer"
                              title="Pick shade color"
                            />
                            <span className="text-[10px] font-mono text-gray-500">{draft.hexColor || '#CE4270'}</span>
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder={
                            isColorAttr
                              ? 'Shade name (e.g. Ruby Red, Nude 01, Rose Plum)...'
                              : /volume/i.test(attr.name)
                              ? 'e.g. 50ml, 100ml, 250ml...'
                              : /size/i.test(attr.name)
                              ? 'e.g. Travel Size, Standard, 50g...'
                              : /finish/i.test(attr.name)
                              ? 'e.g. Matte, Satin, Glossy, Dewy...'
                              : `Add new ${attr.name} value...`
                          }
                          value={draft.name || ''}
                          onChange={(e) => setNewValueDrafts({
                            ...newValueDrafts,
                            [attr.id]: { ...draft, name: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewValueToAttribute(attr.id);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold text-gray-900 focus:border-[#E11D48]"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddNewValueToAttribute(attr.id)}
                          disabled={!draft.name?.trim()}
                          className="px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E11D48] border border-pink-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          + Add Value
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. COMBINATIONS SUMMARY & GENERATE BUTTON */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-white to-pink-50 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="font-black text-xs text-gray-900">
                    Variant Combinations: {combinationsCount} Unique Product Variant(s)
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {validAttributesWithValues.map(a => `${a.name} (${a.selectedValues.length})`).join(' × ') || 'Select values to create combinations'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateVariants}
                    disabled={combinationsCount === 0}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#E6005C] hover:from-[#c8123c] hover:to-[#cc0052] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Generate Variants ({combinationsCount})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. GENERATED VARIANTS CARDS LIST (Schema-driven, NOT hardcoded) */}
          {(variants || []).length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                  Generated Product Variants ({(variants || []).length})
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  Set prices, images, and barcodes for each individual variant
                </span>
              </div>

              <div className="space-y-3">
                {(variants || []).map((v, idx) => {
                  const attributesObj = v.attributes || {};
                  const attrEntries = Object.entries(attributesObj);

                  return (
                    <div
                      key={v.id || idx}
                      className="p-4 rounded-2xl border border-pink-100 bg-[#FFF9FA]/60 shadow-2xs space-y-3"
                    >
                      {/* Variant Header with dynamic attribute tags */}
                      <div className="flex items-center justify-between pb-2 border-b border-pink-100/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-pink-100 text-[#E11D48] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-gray-900">
                            {v.name || `Variant ${idx + 1}`}
                          </span>

                          {/* Dynamic Attribute badges (swatches or text pills) */}
                          <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                            {v.hexColor && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: v.hexColor }}
                                title={v.hexColor}
                              />
                            )}

                            {attrEntries.map(([k, valStr]) => (
                              <span
                                key={k}
                                className="text-[10px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200"
                              >
                                {k}: <span className="text-[#E11D48] font-black">{valStr}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Variant image picker with automatic fallback to main product image */}
                          {(() => {
                            const hasCustomImage = Boolean(v.image && v.image.trim() && v.image !== mainProductFallbackImage);
                            const displayImage = hasCustomImage ? v.image : mainProductFallbackImage;
                            const isUploading = uploadingVariantId === v.id;

                            return (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <label
                                  className={`relative w-8 h-8 rounded-lg border overflow-hidden bg-white hover:border-[#E11D48] cursor-pointer shrink-0 shadow-2xs flex items-center justify-center group transition-all ${
                                    hasCustomImage ? 'border-[#E11D48] ring-1 ring-pink-200' : 'border-pink-200'
                                  }`}
                                  title={
                                    hasCustomImage
                                      ? "Variant-specific image (click to replace)"
                                      : displayImage
                                      ? "Using main product image fallback (click to upload variant image)"
                                      : "Upload variant image"
                                  }
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleVariantImageUpload(v.id, e.target.files[0]);
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                  {isUploading ? (
                                    <Loader2 size={13} className="animate-spin text-[#E11D48]" />
                                  ) : displayImage ? (
                                    <img
                                      src={displayImage}
                                      alt={v.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <ImageIcon size={13} className="text-pink-300 group-hover:text-[#E11D48]" />
                                  )}

                                  {/* Hover camera icon overlay */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Camera size={11} />
                                  </div>
                                </label>

                                {/* Reset to main product fallback if custom variant image uploaded */}
                                {hasCustomImage && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateVariantField(v.id, 'image', '')}
                                    className="w-4 h-4 rounded-full bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer text-[9px]"
                                    title="Reset to main product image fallback"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove variant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Responsive Grid of Variant Controls (4-Role Pricing) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
                        {/* Variant Title */}
                        <div className="sm:col-span-2 md:col-span-2 lg:col-span-1">
                          <label className="block text-gray-700 font-bold mb-1 text-[11px] truncate">
                            Variant Title
                          </label>
                          <input
                            type="text"
                            value={v.name || ''}
                            onChange={(e) => handleUpdateVariantField(v.id, 'name', e.target.value)}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-semibold text-gray-900 focus:border-[#E11D48]"
                          />
                        </div>

                        {/* Barcode */}
                        <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
                          <label className="block text-gray-700 font-bold mb-1 text-[11px] truncate">
                            Barcode
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Barcode"
                              value={v.barcode || ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'barcode', e.target.value)}
                              className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-mono text-gray-900 focus:border-[#E11D48]"
                            />
                            <button
                              type="button"
                              onClick={() => onOpenScanner && onOpenScanner(idx)}
                              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E11D48] border border-pink-200 shrink-0 cursor-pointer"
                              title="Scan barcode with camera"
                            >
                              <ScanBarcode size={13} />
                            </button>
                          </div>
                        </div>

                        {/* MRP */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-700 font-bold text-[11px]">MRP (₹)</label>
                            <span className="text-[9px] font-bold text-gray-400">Base</span>
                          </div>
                          <input
                            type="number"
                            placeholder={baseProduct.mrp || 'MRP'}
                            value={v.mrp !== undefined ? v.mrp : ''}
                            onChange={(e) => handleVariantMrpChange(v.id, e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-bold text-gray-900 focus:border-[#E11D48]"
                          />
                        </div>

                        {/* General User Price */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-700 font-bold text-[11px] truncate">General User (₹)</label>
                            {Number(roleDiscounts?.general) > 0 && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                {roleDiscounts.general}%
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder={baseProduct.generalPrice || 'Gen'}
                            value={v.generalPrice !== undefined ? v.generalPrice : ''}
                            onChange={(e) => handleUpdateVariantField(v.id, 'generalPrice', e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-bold text-gray-900 focus:border-[#E11D48]"
                          />
                        </div>

                        {/* Salon Owner Price */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-700 font-bold text-[11px] truncate">Salon Owner (₹)</label>
                            {Number(roleDiscounts?.salon) > 0 && (
                              <span className="text-[9px] font-bold text-[#E11D48] bg-pink-50 px-1 rounded">
                                {roleDiscounts.salon}%
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder={baseProduct.salonPrice || 'Salon'}
                            value={v.salonPrice !== undefined ? v.salonPrice : ''}
                            onChange={(e) => handleUpdateVariantField(v.id, 'salonPrice', e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-bold text-[#E11D48] focus:border-[#E11D48]"
                          />
                        </div>

                        {/* Makeup Artist Price */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-700 font-bold text-[11px] truncate">Makeup Artist (₹)</label>
                            {Number(roleDiscounts?.artist) > 0 && (
                              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded">
                                {roleDiscounts.artist}%
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder={baseProduct.artistPrice || 'Artist'}
                            value={v.artistPrice !== undefined ? v.artistPrice : ''}
                            onChange={(e) => handleUpdateVariantField(v.id, 'artistPrice', e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-bold text-purple-700 focus:border-purple-600"
                          />
                        </div>

                        {/* Beautician Price */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-700 font-bold text-[11px] truncate">Beautician (₹)</label>
                            {Number(roleDiscounts?.beautician) > 0 && (
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
                                {roleDiscounts.beautician}%
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            placeholder={baseProduct.beauticianPrice || 'Beautician'}
                            value={v.beauticianPrice !== undefined ? v.beauticianPrice : ''}
                            onChange={(e) => handleUpdateVariantField(v.id, 'beauticianPrice', e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            className="w-full p-2 rounded-xl border border-pink-100 outline-none bg-white text-xs font-bold text-indigo-700 focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddManualVariant}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-pink-200 hover:border-[#E11D48] text-[#E11D48] hover:bg-pink-50/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Variant Manually</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD CUSTOM ATTRIBUTE
          ===================================================================== */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <h3 className="font-black text-sm text-gray-900">+ Add Custom Attribute</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-800 font-bold mb-1">
                  Attribute Name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pack Type, Fragrance, Material, Length"
                  value={customAttrForm.name}
                  onChange={(e) => setCustomAttrForm({ ...customAttrForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pink-200 font-bold text-gray-900 outline-none focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1">Attribute Group</label>
                <select
                  value={customAttrForm.group}
                  onChange={(e) => setCustomAttrForm({ ...customAttrForm, group: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none"
                >
                  {ATTRIBUTE_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1">Input Type</label>
                <select
                  value={customAttrForm.inputType}
                  onChange={(e) => setCustomAttrForm({ ...customAttrForm, inputType: e.target.value })}
                  className="w-full p-2 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none"
                >
                  <option value="select">Dropdown / Multi-Select</option>
                  <option value="color_swatch">Color Swatch (Shades)</option>
                  <option value="volume">Volume (ml / L)</option>
                  <option value="weight">Weight (g / kg)</option>
                  <option value="text">Custom Text</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1">
                  Initial Values <span className="text-gray-400 font-normal">(Comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50ml, 100ml, 200ml"
                  value={customAttrForm.initialValues}
                  onChange={(e) => setCustomAttrForm({ ...customAttrForm, initialValues: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-gray-900 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl text-gray-600 font-bold text-xs hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomAttribute}
                disabled={!customAttrForm.name.trim()}
                className="px-4 py-2 rounded-xl bg-[#E11D48] text-white font-extrabold text-xs shadow-xs disabled:opacity-40"
              >
                Add Attribute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: BROWSE ALL MASTER ATTRIBUTES
          ===================================================================== */}
      {showBrowseAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-lg w-full p-5 space-y-3 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-pink-100">
              <div>
                <h3 className="font-black text-sm text-gray-900">Browse Attributes Master</h3>
                <p className="text-[10px] text-gray-500">Pick any registered attribute to add to this product</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrowseAllModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search & Group Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attribute..."
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#E11D48]"
                />
              </div>

              <select
                value={browseGroupFilter}
                onChange={(e) => setBrowseGroupFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none"
              >
                <option value="All">All Groups</option>
                {ATTRIBUTE_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Attributes List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {attributeMaster
                .filter(a => {
                  const matchSearch = a.name.toLowerCase().includes(browseSearch.toLowerCase());
                  const matchGroup = browseGroupFilter === 'All' || a.group === browseGroupFilter;
                  return matchSearch && matchGroup;
                })
                .map(a => {
                  const isSelected = selectedAttributes.some(
                    sa => sa.name.toLowerCase() === a.name.toLowerCase()
                  );
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleToggleAttribute(a.name)}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-pink-50 border border-pink-200 text-[#E11D48]'
                          : 'hover:bg-gray-50 border border-transparent text-gray-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{a.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {a.group} • {a.values?.length || 0} preset values
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-[#E11D48] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isSelected ? 'Selected' : '+ Select'}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="pt-2 text-right border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBrowseAllModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
