import React, { useState, useEffect, useMemo } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import HexColorPicker, { getBeautyShadeName, MAKEUP_SWATCH_PRESETS } from './HexColorPicker';
import {
  ATTRIBUTE_GROUPS,
  loadAttributeMasterFromDb,
  loadCategoryAttributeMapFromDb,
  generateCartesianVariants,
  getProductAttributeSuggestions
} from '../utils/attributeMasterData';

/**
 * UniversalVariantBuilder Component
 * 
 * Implements full universal beauty attributes and dynamic multi-variant combinations.
 * Fully compliant with:
 * - NO stock or inventory fields anywhere
 * - Independent dynamic combinations (Cartesian product)
 * - 4-role pricing per variant (General, Salon, Artist, Beautician)
 * - Barcode scan per variant
 * - Image upload per variant with fallback to main product image
 * - Predefined + custom attributes & values
 */
export default function UniversalVariantBuilder({
  hasVariants,
  onToggleHasVariants,
  variants = [],
  onChangeVariants,
  baseProduct = {},
  category = '',
  subcategory = '',
  productType = '',
  productName = '',
  onSyncSpecs,
  onOpenScanner
}) {
  // Attribute Master list & Category mappings
  const [attributeMaster, setAttributeMaster] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);

  // Selected Attributes for this product (array of attribute objects with selectedValues array)
  const [selectedAttributes, setSelectedAttributes] = useState([]);

  // Attribute selector dropdown/modal state
  const [isAttributeSelectorOpen, setIsAttributeSelectorOpen] = useState(false);
  const [attributeSearch, setAttributeSearch] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');

  // Custom attribute adder state
  const [customAttributeName, setCustomAttributeName] = useState('');
  const [customAttributeGroup, setCustomAttributeGroup] = useState('Other');
  const [customAttributeDesc, setCustomAttributeDesc] = useState('');
  const [showAddCustomAttr, setShowAddCustomAttr] = useState(false);

  // New value adder state per attribute: { [attributeId]: { name: '', hexColor: '#C2477A', code: '', unit: 'ml' } }
  const [newValueDrafts, setNewValueDrafts] = useState({});

  // Search filter per attribute value section: { [attributeId]: searchString }
  const [valueSearchTerms, setValueSearchTerms] = useState({});

  // Collapsed attribute value cards: { [attributeId]: boolean }
  const [collapsedCards, setCollapsedCards] = useState({});

  // Load attribute master & category mapping
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoadingAttributes(true);
      const [attrs, catMap] = await Promise.all([
        loadAttributeMasterFromDb(),
        loadCategoryAttributeMapFromDb()
      ]);
      if (mounted) {
        setAttributeMaster(attrs);
        setCategoryMap(catMap);
        setIsLoadingAttributes(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Sync selected attributes from existing variants if editing a product with variants
  useEffect(() => {
    if (variants && variants.length > 0 && selectedAttributes.length === 0 && attributeMaster.length > 0) {
      // Deduce used attributes and values from existing variants
      const detectedAttrNames = new Set();
      const detectedValuesMap = {}; // { attrName: Set(values) }

      variants.forEach(v => {
        if (v.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes).forEach(([attrName, valName]) => {
            detectedAttrNames.add(attrName);
            if (!detectedValuesMap[attrName]) detectedValuesMap[attrName] = new Set();
            detectedValuesMap[attrName].add(valName);
          });
        }
      });

      if (detectedAttrNames.size > 0) {
        const reconstructed = [];
        detectedAttrNames.forEach(attrName => {
          const masterAttr = attributeMaster.find(a => a.name.toLowerCase() === attrName.toLowerCase()) || {
            id: `attr_custom_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: attrName,
            group: 'Other',
            inputType: attrName.toLowerCase().includes('shade') || attrName.toLowerCase().includes('colour') ? 'color_swatch' : 'select',
            values: []
          };

          const valuesList = masterAttr.values || [];
          const selectedVals = Array.from(detectedValuesMap[attrName] || []).map(valName => {
            const existingOpt = valuesList.find(v => (typeof v === 'object' ? v.name : v) === valName);
            return existingOpt || { id: `val_${Date.now()}_${Math.random()}`, name: valName };
          });

          reconstructed.push({
            ...masterAttr,
            selectedValues: selectedVals
          });
        });

        setSelectedAttributes(reconstructed);
      }
    }
  }, [variants, attributeMaster]);

  // Determine relevant attribute suggestions based on Category -> Subcategory -> Product Type -> Product Name
  const suggestionInfo = useMemo(() => {
    return getProductAttributeSuggestions({
      category: category || baseProduct?.category || '',
      subcategory: subcategory || baseProduct?.subcategory || '',
      productType: productType || baseProduct?.productType || '',
      productName: productName || baseProduct?.name || ''
    });
  }, [category, subcategory, productType, productName, baseProduct]);

  // Track the last key for which auto-selection was applied
  const lastAutoSelectKeyRef = React.useRef('');

  // Auto-selection of highly relevant attributes when variants are enabled
  useEffect(() => {
    if (!hasVariants || attributeMaster.length === 0) return;

    const currentKey = `${category}_${subcategory}_${productType}_${suggestionInfo.ruleId}`;

    const hasConfiguredValues = selectedAttributes.some(a => a.selectedValues && a.selectedValues.length > 0);
    const hasVariantsConfigured = variants && variants.length > 0;

    // Apply auto-selection if not configured yet or when starting fresh with variants
    if (lastAutoSelectKeyRef.current !== currentKey && !hasVariantsConfigured && !hasConfiguredValues) {
      lastAutoSelectKeyRef.current = currentKey;

      if (suggestionInfo.defaultAutoSelect && suggestionInfo.defaultAutoSelect.length > 0) {
        const autoSelectedAttrs = suggestionInfo.defaultAutoSelect.map(attrName => {
          const found = attributeMaster.find(a => a.name.toLowerCase() === attrName.toLowerCase());
          if (found) {
            return { ...found, selectedValues: [] };
          }
          return {
            id: `attr_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: attrName,
            group: 'Appearance',
            inputType: attrName.toLowerCase().includes('shade') || attrName.toLowerCase().includes('colour') ? 'color_swatch' : 'select',
            values: [],
            selectedValues: []
          };
        });

        setSelectedAttributes(autoSelectedAttrs);
      }
    }
  }, [hasVariants, category, subcategory, productType, suggestionInfo, attributeMaster, variants, selectedAttributes]);

  // Recommended attributes for current product type that are not yet selected
  const recommendedAttributes = useMemo(() => {
    const selectedNames = new Set(selectedAttributes.map(a => a.name.toLowerCase()));
    return (suggestionInfo.suggested || []).filter(name => !selectedNames.has(name.toLowerCase()));
  }, [suggestionInfo.suggested, selectedAttributes]);

  // Add a recommended attribute pill into selected attributes
  const handleAddRecommendedAttribute = (attrName) => {
    const existingMaster = attributeMaster.find(a => a.name.toLowerCase() === attrName.toLowerCase());
    const attrToAdd = existingMaster || {
      id: `attr_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: attrName,
      group: 'Appearance',
      inputType: attrName.toLowerCase().includes('shade') || attrName.toLowerCase().includes('colour') ? 'color_swatch' : 'select',
      values: [],
      selectedValues: []
    };

    setSelectedAttributes(prev => {
      if (prev.some(a => a.name.toLowerCase() === attrName.toLowerCase())) return prev;
      return [...prev, { ...attrToAdd, selectedValues: [] }];
    });
  };

  // Auto-sync parent specifications when attributes like Finish, Formulation, Coverage, Volume, Skin Type, Hair Type have selected values
  useEffect(() => {
    if (!onSyncSpecs || selectedAttributes.length === 0) return;

    const specsToSync = {};
    selectedAttributes.forEach(attr => {
      const name = attr.name.toLowerCase();
      const firstVal = attr.selectedValues && attr.selectedValues[0];
      const valStr = typeof firstVal === 'object' ? firstVal.name : (firstVal || '');

      if (!valStr) return;

      if (name.includes('finish')) specsToSync.finish = valStr;
      else if (name.includes('formulation')) specsToSync.formulation = valStr;
      else if (name.includes('coverage')) specsToSync.coverage = valStr;
      else if (name.includes('volume') || name.includes('net quantity')) specsToSync.netQuantity = valStr;
      else if (name.includes('skin type')) specsToSync.skinType = valStr;
      else if (name.includes('hair type')) specsToSync.hairType = valStr;
    });

    if (Object.keys(specsToSync).length > 0) {
      onSyncSpecs(specsToSync);
    }
  }, [selectedAttributes, onSyncSpecs]);

  // Filtered attributes in the selector dropdown
  const filteredAttributes = useMemo(() => {
    return attributeMaster.filter(attr => {
      const matchesSearch = attr.name.toLowerCase().includes(attributeSearch.toLowerCase()) ||
        attr.group.toLowerCase().includes(attributeSearch.toLowerCase());
      const matchesGroup = selectedGroupFilter === 'All' || attr.group === selectedGroupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [attributeMaster, attributeSearch, selectedGroupFilter]);

  // Toggle selection of an attribute
  const handleToggleAttribute = (attr) => {
    setSelectedAttributes(prev => {
      const exists = prev.some(a => a.id === attr.id || a.name.toLowerCase() === attr.name.toLowerCase());
      if (exists) {
        return prev.filter(a => a.id !== attr.id && a.name.toLowerCase() !== attr.name.toLowerCase());
      } else {
        return [...prev, { ...attr, selectedValues: [] }];
      }
    });
  };

  // Remove a selected attribute
  const handleRemoveAttribute = (attrId) => {
    setSelectedAttributes(prev => prev.filter(a => a.id !== attrId));
  };

  // Add a brand-new custom attribute
  const handleAddCustomAttribute = () => {
    const trimmed = customAttributeName.trim();
    if (!trimmed) return;
    const newId = `attr_custom_${Date.now()}`;
    const newAttr = {
      id: newId,
      name: trimmed,
      group: customAttributeGroup || 'Other',
      description: customAttributeDesc.trim() || `Defines ${trimmed} variant options`,
      inputType: 'select',
      status: 'active',
      values: []
    };
    setAttributeMaster(prev => [...prev, newAttr]);
    setSelectedAttributes(prev => [...prev, { ...newAttr, selectedValues: [] }]);
    setCustomAttributeName('');
    setCustomAttributeDesc('');
    setShowAddCustomAttr(false);
  };

  // Toggle selection of a value within an attribute
  const handleToggleValue = (attrId, valueObj) => {
    setSelectedAttributes(prev => prev.map(attr => {
      if (attr.id !== attrId) return attr;
      const vName = typeof valueObj === 'object' ? valueObj.name : valueObj;
      const alreadySelected = (attr.selectedValues || []).some(
        v => (typeof v === 'object' ? v.name : v) === vName
      );

      let newSelected;
      if (alreadySelected) {
        newSelected = (attr.selectedValues || []).filter(
          v => (typeof v === 'object' ? v.name : v) !== vName
        );
      } else {
        newSelected = [...(attr.selectedValues || []), valueObj];
      }

      return {
        ...attr,
        selectedValues: newSelected
      };
    }));
  };

  // Add a new value to an attribute inline
  const handleAddNewValueToAttribute = (attrId) => {
    const draft = newValueDrafts[attrId];
    if (!draft || !draft.name.trim()) return;

    const valueName = draft.name.trim();
    const newValueObj = {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: valueName,
      ...(draft.hexColor ? { hexColor: draft.hexColor } : {}),
      ...(draft.code ? { code: draft.code.trim() } : {})
    };

    // 1. Add to Attribute Master
    setAttributeMaster(prev => prev.map(a => {
      if (a.id === attrId) {
        return {
          ...a,
          values: [...(a.values || []), newValueObj]
        };
      }
      return a;
    }));

    // 2. Select it automatically in current product
    setSelectedAttributes(prev => prev.map(a => {
      if (a.id === attrId) {
        return {
          ...a,
          values: [...(a.values || []), newValueObj],
          selectedValues: [...(a.selectedValues || []), newValueObj]
        };
      }
      return a;
    }));

    // Reset draft
    setNewValueDrafts(prev => ({
      ...prev,
      [attrId]: { name: '', hexColor: '#C2477A', code: '' }
    }));
  };

  // Calculated combinations count
  const combinationsCount = useMemo(() => {
    const valid = selectedAttributes.filter(a => a.selectedValues && a.selectedValues.length > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((acc, a) => acc * a.selectedValues.length, 1);
  }, [selectedAttributes]);

  // Generate Cartesian Product Variants
  const handleGenerateVariants = () => {
    if (combinationsCount === 0) {
      alert('Please select at least one value for each selected attribute before generating variants.');
      return;
    }

    const generated = generateCartesianVariants(selectedAttributes, baseProduct);

    // Merge with existing variants to preserve manually configured prices/SKU/barcode if matching combination
    const merged = generated.map(newVar => {
      const existing = (variants || []).find(v => v.name === newVar.name);
      if (existing) {
        return {
          ...newVar,
          ...existing,
          // ensure attributes map is retained
          attributes: newVar.attributes,
          selectedCombination: newVar.selectedCombination
        };
      }
      return newVar;
    });

    onChangeVariants(merged);
  };

  // Update a single field on a generated variant
  const handleUpdateVariantField = (varId, field, value) => {
    onChangeVariants(variants.map(v => (v.id === varId ? { ...v, [field]: value } : v)));
  };

  // Delete an individual generated variant combination
  const handleDeleteVariant = (varId) => {
    onChangeVariants(variants.filter(v => v.id !== varId));
  };

  // Handle Variant Image Upload (Base64)
  const handleVariantImageUpload = (varId, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      handleUpdateVariantField(varId, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* 1. Header with Yes/No Variant Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FFF5F8] text-black flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              6. Product Variants / Attributes
            </h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Configure universal beauty product attributes (Shade, Finish, Formulation, Size, Volume, etc.) and generate role-priced variants.
            </p>
          </div>
        </div>

        {/* Does this product have variants? (○ No / ○ Yes) */}
        <div className="bg-[#FFF8FA] p-2 sm:p-2.5 rounded-2xl border border-pink-200/80 flex items-center gap-4 shrink-0 shadow-2xs">
          <span className="text-xs font-black text-gray-800 pl-1">
            Does this product have variants?
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 select-none">
              <input
                type="radio"
                name="hasVariantsRadio"
                checked={!hasVariants}
                onChange={() => onToggleHasVariants(false)}
                className="w-4 h-4 text-[#C2477A] focus:ring-[#C2477A] border-gray-300 cursor-pointer accent-[#C2477A]"
              />
              <span>No</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#C2477A] select-none">
              <input
                type="radio"
                name="hasVariantsRadio"
                checked={hasVariants}
                onChange={() => onToggleHasVariants(true)}
                className="w-4 h-4 text-[#C2477A] focus:ring-[#C2477A] border-gray-300 cursor-pointer accent-[#C2477A]"
              />
              <span>Yes</span>
            </label>
          </div>
        </div>
      </div>

      {/* When NO: show simple explanation, don't show builder */}
      {!hasVariants && (
        <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/60 text-xs text-gray-500 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={15} className="text-gray-400" />
            <span>This product is configured as a single standard item using the primary Base MRP, barcode, and role discounts above.</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleHasVariants(true)}
            className="text-[#C2477A] font-bold hover:underline cursor-pointer text-xs shrink-0"
          >
            Enable Variants
          </button>
        </div>
      )}

      {/* When YES: Expand Universal Variant Builder */}
      {hasVariants && (
        <div className="space-y-6 animate-fade-in">
          
          {/* STEP 2: AUTOMATIC ATTRIBUTE SUGGESTIONS & SELECTION */}
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-purple-600 to-indigo-600" />
                  <span>Variant Attributes</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium pl-3.5 mt-0.5">
                  Select the attributes that differentiate child variants from each other.
                </p>
              </div>

              {/* + More Attributes button in header as well for quick access */}
              <button
                type="button"
                onClick={() => setIsAttributeSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-black bg-slate-50 hover:bg-[#FFF5F8] border border-slate-200 hover:border-[#FCE4EC] transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Plus size={13} strokeWidth={2.5} className="text-[#C2477A]" />
                <span>+ More Attributes</span>
              </button>
            </div>

            {/* ✨ Recommended for [Subcategory / Product Type] */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#C2477A]" />
                  <span>Recommended for {suggestionInfo.label}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Click to add to Selected Attributes
                </span>
              </div>

              {/* Recommended Pills */}
              {recommendedAttributes.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {recommendedAttributes.map(attrName => (
                    <button
                      key={attrName}
                      type="button"
                      onClick={() => handleAddRecommendedAttribute(attrName)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF5F8] hover:bg-[#FDF2F8]/90 text-black border border-[#FCE4EC]/80 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                      title={`Add ${attrName} to selected attributes`}
                    >
                      <Plus size={13} className="text-[#C2477A] group-hover:rotate-90 transition-transform duration-200" strokeWidth={2.5} />
                      <span>{attrName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFF5F8]/50 border border-[#FCE4EC] text-xs text-black font-semibold">
                  <CheckCircle2 size={14} className="text-[#C2477A] shrink-0" />
                  <span>All recommended attributes for {suggestionInfo.label} are selected below.</span>
                </div>
              )}
            </div>

            {/* SELECTED ATTRIBUTES */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Selected Attributes {selectedAttributes.length > 0 && `(${selectedAttributes.length})`}
                </span>
                {selectedAttributes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAttributes([])}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedAttributes.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedAttributes.map(attr => (
                    <span
                      key={attr.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C2477A] text-white font-bold text-xs shadow-2xs transition-all hover:bg-[#9E2D5B]"
                    >
                      <Check size={12} strokeWidth={3} className="text-purple-200" />
                      <span>{attr.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(attr.id)}
                        className="text-purple-200 hover:text-white hover:bg-purple-800 rounded p-0.5 ml-0.5 transition-colors cursor-pointer"
                        title={`Remove ${attr.name}`}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}

                  {/* [+ More Attributes] Button alongside selected chips */}
                  <button
                    type="button"
                    onClick={() => setIsAttributeSelectorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black hover:text-black bg-[#FFF5F8] hover:bg-[#FDF2F8] border border-[#FCE4EC] transition-all cursor-pointer shadow-2xs ml-auto"
                  >
                    <Plus size={13} strokeWidth={2.5} className="text-[#C2477A]" />
                    <span>+ More Attributes</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
                    <span>No attributes selected. Click any recommended attribute above to begin.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAttributeSelectorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black hover:text-black bg-[#FFF5F8] hover:bg-[#FDF2F8] border border-[#FCE4EC] transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <Plus size={13} strokeWidth={2.5} className="text-[#C2477A]" />
                    <span>+ More Attributes</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ADVANCED ATTRIBUTE LIBRARY MODAL DIALOG */}
          {isAttributeSelectorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
                
                {/* Modal Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF5F8] text-[#C2477A] flex items-center justify-center font-bold">
                      <SlidersHorizontal size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        All Product Attributes Library
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Browse the complete attribute library or add custom attributes for uncommon products.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAttributeSelectorOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search & Category Filter Navigation */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3 shrink-0">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search attributes (e.g. Scent, Pack Size, SPF, Undertone)..."
                      value={attributeSearch}
                      onChange={(e) => setAttributeSearch(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#C2477A] focus:ring-3 focus:ring-[#C2477A]/10 shadow-2xs transition-all"
                    />
                    {attributeSearch && (
                      <button
                        type="button"
                        onClick={() => setAttributeSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedGroupFilter('All')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        selectedGroupFilter === 'All'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      All
                    </button>
                    {ATTRIBUTE_GROUPS.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroupFilter(g)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          selectedGroupFilter === g
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Attribute Grid */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-6 custom-scrollbar">
                  {ATTRIBUTE_GROUPS.filter(g => selectedGroupFilter === 'All' || selectedGroupFilter === g).map(groupName => {
                    const groupAttrs = filteredAttributes.filter(a => a.group === groupName);
                    if (groupAttrs.length === 0) return null;
                    return (
                      <div key={groupName} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            {groupName}
                          </span>
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {groupAttrs.length} available
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {groupAttrs.map(attr => {
                            const isChecked = selectedAttributes.some(a => a.id === attr.id || a.name.toLowerCase() === attr.name.toLowerCase());
                            const tooltipText = attr.description || `Defines the ${attr.name.toLowerCase()} variant of the product.`;

                            return (
                              <div
                                key={attr.id}
                                onClick={() => handleToggleAttribute(attr)}
                                title={tooltipText}
                                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-150 min-h-[46px] select-none ${
                                  isChecked
                                    ? 'bg-[#FFF5F8]/70 border-[#C2477A] text-purple-950 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#F8B4CB] hover:bg-[#FFF5F8]/20 hover:shadow-2xs'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 ${
                                    isChecked
                                      ? 'bg-[#C2477A] border border-[#C2477A] text-white scale-100 shadow-2xs'
                                      : 'border-2 border-slate-300 bg-white group-hover:border-[#C2477A]'
                                  }`}
                                >
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </div>

                                <span className={`truncate flex-1 ${isChecked ? 'font-bold text-purple-950' : 'text-slate-700'}`}>
                                  {attr.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {filteredAttributes.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <Search size={24} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">No attributes match your search</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try searching with another keyword or add a custom attribute below.</p>
                    </div>
                  )}
                </div>

                {/* Inline Custom Attribute Creation Form */}
                {showAddCustomAttr && (
                  <div className="border-t border-[#FCE4EC] bg-[#FFF5F8]/40 p-4 sm:p-5 space-y-3 shrink-0 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus size={14} className="text-[#C2477A]" />
                        <span>Create New Custom Attribute</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomAttr(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Attribute Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Scent, SPF, Pack Size"
                          value={customAttributeName}
                          onChange={(e) => setCustomAttributeName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/10 shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Category
                        </label>
                        <select
                          value={customAttributeGroup}
                          onChange={(e) => setCustomAttributeGroup(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-[#C2477A] shadow-2xs"
                        >
                          {ATTRIBUTE_GROUPS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Optional Description
                        </label>
                        <input
                          type="text"
                          placeholder="Short description or usage tip..."
                          value={customAttributeDesc}
                          onChange={(e) => setCustomAttributeDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-[#C2477A] focus:ring-2 focus:ring-[#C2477A]/10 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomAttr(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomAttribute}
                        disabled={!customAttributeName.trim()}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Add Attribute
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="border-t border-slate-100 px-5 sm:px-6 py-3.5 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomAttr(true)}
                    className="text-xs font-bold text-[#C2477A] hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#FFF5F8] text-[#C2477A] group-hover:bg-[#FDF2F8] flex items-center justify-center transition-colors">
                      <Plus size={13} strokeWidth={2.5} />
                    </div>
                    <span>Add Custom Attribute</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAttributeSelectorOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAttributeSelectorOpen(false)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Done</span>
                      {selectedAttributes.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
                          · {selectedAttributes.length} selected
                        </span>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: ATTRIBUTE VALUES CONFIGURATION CARDS */}
          {selectedAttributes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="uppercase tracking-wider">
                  Select Attribute Values ({selectedAttributes.length} Attributes Active)
                </span>
                <span className="text-[11px] text-[#C2477A]">
                  {combinationsCount} potential {combinationsCount === 1 ? 'combination' : 'combinations'}
                </span>
              </div>

              {selectedAttributes.map(attr => {
                const isCollapsed = collapsedCards[attr.id];
                const search = valueSearchTerms[attr.id] || '';
                const draft = newValueDrafts[attr.id] || { name: '', hexColor: '#C2477A', code: '' };
                const selectedCount = (attr.selectedValues || []).length;
                const availableValues = (attr.values || []).filter(v => {
                  const name = typeof v === 'object' ? v.name : v;
                  return name.toLowerCase().includes(search.toLowerCase());
                });

                return (
                  <div
                    key={attr.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCollapsedCards(prev => ({ ...prev, [attr.id]: !prev[attr.id] }))}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                        <h4 className="font-black text-xs text-gray-900 tracking-wide uppercase">
                          {attr.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                          {attr.group}
                        </span>
                        <span className="text-[10px] font-bold text-[#C2477A] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                          {selectedCount} selected
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(attr.id)}
                          className="text-gray-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                          title="Remove attribute from product"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-3 animate-fade-in">
                        {/* Search & Values checklist */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder={`Search ${attr.name.toLowerCase()} options...`}
                              value={search}
                              onChange={(e) => setValueSearchTerms(prev => ({ ...prev, [attr.id]: e.target.value }))}
                              className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:border-[#C2477A]"
                            />
                          </div>
                          {selectedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, selectedValues: [] } : a));
                              }}
                              className="text-[10px] font-bold text-gray-400 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* VALUES LIST */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                          {availableValues.map((val, vIdx) => {
                            const valName = typeof val === 'object' ? val.name : val;
                            const isChecked = (attr.selectedValues || []).some(
                              v => (typeof v === 'object' ? v.name : v) === valName
                            );
                            const hex = typeof val === 'object' ? val.hexColor : null;

                            return (
                              <button
                                key={val.id || vIdx}
                                type="button"
                                onClick={() => handleToggleValue(attr.id, val)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  isChecked
                                    ? 'bg-[#FFF2F5] border-[#C2477A] text-[#C2477A] ring-1 ring-[#C2477A]/20'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {hex && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                                    style={{ backgroundColor: hex }}
                                  />
                                )}
                                <span>{valName}</span>
                                {isChecked && <Check size={12} className="text-[#C2477A]" strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* INLINE ADD NEW VALUE FOR THIS ATTRIBUTE */}
                        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 shrink-0">
                            + Add New {attr.name}:
                          </span>

                          <input
                            type="text"
                            placeholder={attr.inputType === 'volume' ? 'e.g. 120 ml' : attr.inputType === 'weight' ? 'e.g. 45 g' : `New ${attr.name.toLowerCase()}...`}
                            value={draft.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewValueDrafts(prev => ({
                                ...prev,
                                [attr.id]: {
                                  ...draft,
                                  name: val
                                }
                              }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewValueToAttribute(attr.id);
                              }
                            }}
                            className="flex-1 min-w-[140px] p-1.5 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#C2477A]"
                          />

                          {/* If color swatch attribute (Shade): show HexColorPicker */}
                          {attr.inputType === 'color_swatch' && (
                            <div className="w-48">
                              <HexColorPicker
                                value={draft.hexColor || '#C2477A'}
                                onChange={(hex, autoName) => {
                                  setNewValueDrafts(prev => ({
                                    ...prev,
                                    [attr.id]: {
                                      ...draft,
                                      hexColor: hex,
                                      name: autoName || draft.name
                                    }
                                  }));
                                }}
                                align="left"
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAddNewValueToAttribute(attr.id)}
                            disabled={!draft.name.trim()}
                            className="px-3 py-1.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-40 cursor-pointer active:scale-95"
                          >
                            + Add Value
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* GENERATE VARIANTS ACTION BAR */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 border border-[#FCE4EC] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h4 className="font-black text-xs text-gray-900 uppercase tracking-wide">
                    Ready to Generate Product Variants
                  </h4>
                  <p className="text-[11px] text-gray-600 font-medium">
                    Combines all selected values into {combinationsCount} unique variants. You can configure prices, barcodes, SKU, and images for each below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVariants}
                  disabled={combinationsCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Sparkles size={15} />
                  <span>Generate Variants ({combinationsCount})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATED VARIANTS MATRIX TABLE */}
          {variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                    Configured Variants ({variants.length})
                  </h3>
                  <span className="text-[10px] text-black bg-[#FFF5F8] px-2 py-0.5 rounded-full font-bold">
                    Zero inventory/stock fields
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onChangeVariants([])}
                    className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Clear All Variants
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-pink-100 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-[10.5px] tracking-wider border-b border-pink-100">
                      <th className="py-3 px-3 min-w-[160px]">VARIANT NAME</th>
                      <th className="py-3 px-2 min-w-[120px]">SKU</th>
                      <th className="py-3 px-2 min-w-[140px]">BARCODE</th>
                      <th className="py-3 px-2 min-w-[85px]">MRP (₹)</th>
                      <th className="py-3 px-2 min-w-[85px]">GENERAL (₹)</th>
                      <th className="py-3 px-2 min-w-[85px]">SALON (₹)</th>
                      <th className="py-3 px-2 min-w-[85px]">ARTIST (₹)</th>
                      <th className="py-3 px-2 min-w-[85px]">BEAUTICIAN (₹)</th>
                      <th className="py-3 px-2 min-w-[70px] text-center">IMAGE</th>
                      <th className="py-3 px-2 min-w-[65px] text-center">STATUS</th>
                      <th className="py-3 px-2 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {variants.map((v, vIdx) => {
                      return (
                        <tr key={v.id || vIdx} className="hover:bg-[#FFF9FA]/60 transition-colors">
                          {/* Variant Name */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {v.hexColor && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                                  style={{ backgroundColor: v.hexColor }}
                                />
                              )}
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => handleUpdateVariantField(v.id, 'name', e.target.value)}
                                className="font-bold text-xs text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#C2477A] outline-none w-full"
                              />
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={v.sku || ''}
                              placeholder="SKU"
                              onChange={(e) => handleUpdateVariantField(v.id, 'sku', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-gray-200 text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* Barcode + Scan */}
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={v.barcode || ''}
                                placeholder="Barcode"
                                data-shade-barcode-idx={vIdx}
                                onChange={(e) => handleUpdateVariantField(v.id, 'barcode', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-200 text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                              />
                              <button
                                type="button"
                                onClick={() => onOpenScanner && onOpenScanner(vIdx)}
                                className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#C2477A] transition-colors cursor-pointer shrink-0"
                                title="Scan barcode with camera"
                              >
                                <ScanBarcode size={13} />
                              </button>
                            </div>
                          </td>

                          {/* MRP */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={v.mrp ?? ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'mrp', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* General Price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={v.generalPrice ?? ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'generalPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* Salon Price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={v.salonPrice ?? ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'salonPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-pink-100 bg-[#FFF9FA] text-xs font-bold text-[#C2477A] outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* Artist Price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={v.artistPrice ?? ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'artistPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-pink-100 bg-[#FFF9FA] text-xs font-bold text-[#C2477A] outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* Beautician Price */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={v.beauticianPrice ?? ''}
                              onChange={(e) => handleUpdateVariantField(v.id, 'beauticianPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-pink-100 bg-[#FFF9FA] text-xs font-bold text-[#C2477A] outline-none focus:border-[#C2477A]"
                            />
                          </td>

                          {/* Image */}
                          <td className="py-2.5 px-2 text-center">
                            <label className="relative inline-block cursor-pointer group">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleVariantImageUpload(v.id, e.target.files[0])}
                                className="hidden"
                              />
                              {v.image ? (
                                <img
                                  src={v.image}
                                  alt={v.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shadow-2xs group-hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#C2477A] group-hover:border-[#C2477A] transition-colors">
                                  <ImageIcon size={14} />
                                </div>
                              )}
                            </label>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateVariantField(v.id, 'active', v.active === false ? true : false)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                v.active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {v.active !== false ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Actions: Delete Combination */}
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete this variant combination"
                            >
                              <Trash2 size={13} />
                            </button>
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
    </div>
  );
}
