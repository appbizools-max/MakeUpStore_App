import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  FolderPlus,
  Layers,
  Tag,
  Check,
  ChevronRight,
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  inspectCategoryExcelWorkbook,
  buildFlexibleCategoryImportPlan,
  downloadSimpleCategoryTemplate
} from '../../utils/categoryExcelService';

/**
 * CategoryImportModal Component (Redesigned & Simplified)
 * 
 * Key Features:
 * 1. No rigid hierarchy selection upfront.
 * 2. Automatic column detection (Main Category, Subcategory, Select Category).
 * 3. 3 Simple Independent Toggles:
 *    - [✓] Import Main Categories
 *    - [✓] Import Subcategories (with Excel column mapping or parent selector)
 *    - [✓] Import Select Categories (with parent Main & Subcategory selectors)
 * 4. Missing levels/columns are skipped without blocking the import.
 * 5. Instant preview table showing what will be imported.
 * 6. Direct Supabase database persistence with instant product form reflection.
 */
export default function CategoryImportModal({
  isOpen,
  onClose,
  categories = [],
  subcategories = [],
  productTypes = [],
  selectedCategory = null,
  selectedSubcategory = null,
  onConfirmImport
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  // Inspection data from uploaded workbook
  const [inspectionData, setInspectionData] = useState(null);

  // Column mapping states
  const [mapping, setMapping] = useState({
    mainCategoryCol: '',
    subcategoryCol: '',
    selectCategoryCol: '',
    descriptionCol: '',
    orderCol: '',
    statusCol: '',
    imageCol: ''
  });

  // Level Toggles: independently selectable
  const [toggles, setToggles] = useState({
    importMain: true,
    importSub: false,
    importSelect: false
  });

  // Parent configuration for subcategories & select categories
  const [parentConfig, setParentConfig] = useState({
    // Subcategories parent
    subParentMode: 'from_excel', // 'from_excel' | 'fixed'
    subFixedParentId: selectedCategory?.id || categories[0]?.id || '',
    subFixedParentName: selectedCategory?.name || categories[0]?.name || '',

    // Select categories parents
    selectParentCatMode: 'from_excel', // 'from_excel' | 'fixed'
    selectFixedParentCatId: selectedCategory?.id || categories[0]?.id || '',
    selectFixedParentCatName: selectedCategory?.name || categories[0]?.name || '',

    selectParentSubMode: 'from_excel', // 'from_excel' | 'fixed'
    selectFixedParentSubId: selectedSubcategory?.id || '',
    selectFixedParentSubName: selectedSubcategory?.name || ''
  });

  // Import mode
  const [importMode, setImportMode] = useState('add_new'); // 'add_new' | 'update_existing'

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setInspectionData(null);
      setGeneralError(null);
      setImportResults(null);
    }
  }, [isOpen]);

  // Handle file drop/selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const lower = file.name.toLowerCase();
    const isSupported = validExts.some(ext => lower.endsWith(ext));

    if (!isSupported) {
      setGeneralError('Please upload an Excel workbook (.xlsx, .xls) or CSV spreadsheet.');
      return;
    }

    setGeneralError(null);
    setSelectedFile(file);
    setIsValidating(true);
    setImportResults(null);

    try {
      const res = await inspectCategoryExcelWorkbook(file);
      if (!res.success) {
        setGeneralError(res.error || 'Failed to inspect Excel file.');
        setInspectionData(null);
      } else {
        setInspectionData(res);
        const detected = res.detectedMapping || {};

        setMapping({
          mainCategoryCol: detected.mainCategoryCol || '',
          subcategoryCol: detected.subcategoryCol || '',
          selectCategoryCol: detected.selectCategoryCol || '',
          descriptionCol: detected.descriptionCol || '',
          orderCol: detected.orderCol || '',
          statusCol: detected.statusCol || '',
          imageCol: detected.imageCol || ''
        });

        // Smart defaults based on detected columns:
        // - If Main Category detected -> importMain = true
        // - If Subcategory detected -> importSub = true
        // - If Select Category detected -> importSelect = true
        // - If only subcategory is detected (e.g. subcategories only file) -> importMain = false, importSub = true
        const hasMain = Boolean(detected.mainCategoryCol);
        const hasSub = Boolean(detected.subcategoryCol);
        const hasSelect = Boolean(detected.selectCategoryCol);

        if (hasSub && !hasMain && !hasSelect) {
          // Subcategory only file
          setToggles({ importMain: false, importSub: true, importSelect: false });
          setParentConfig(prev => ({ ...prev, subParentMode: 'fixed' }));
        } else if (hasSelect && !hasMain && !hasSub) {
          // Select category only file
          setToggles({ importMain: false, importSub: false, importSelect: true });
          setParentConfig(prev => ({ ...prev, selectParentCatMode: 'fixed', selectParentSubMode: 'fixed' }));
        } else {
          // General / Multi-level
          setToggles({
            importMain: hasMain || (!hasSub && !hasSelect),
            importSub: hasSub,
            importSelect: hasSelect
          });
          setParentConfig(prev => ({
            ...prev,
            subParentMode: hasMain ? 'from_excel' : 'fixed',
            selectParentCatMode: hasMain ? 'from_excel' : 'fixed',
            selectParentSubMode: hasSub ? 'from_excel' : 'fixed'
          }));
        }
      }
    } catch (err) {
      console.error('Error reading workbook:', err);
      setGeneralError('Error reading spreadsheet: ' + (err.message || 'Corrupted file'));
      setInspectionData(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Subcategories available under selected parent category
  const filteredSubcategoriesForSelect = useMemo(() => {
    const parentCatId = parentConfig.selectFixedParentCatId;
    if (!parentCatId) return subcategories;
    return subcategories.filter(s => (s.category_id || s.categoryId) === parentCatId);
  }, [subcategories, parentConfig.selectFixedParentCatId]);

  // Compute live import plan
  const importPlan = useMemo(() => {
    if (!inspectionData || !inspectionData.rawRows) return null;

    return buildFlexibleCategoryImportPlan({
      rawRows: inspectionData.rawRows,
      mapping,
      toggles,
      parentConfig,
      existingHierarchy: { categories, subcategories, productTypes },
      mode: importMode
    });
  }, [inspectionData, mapping, toggles, parentConfig, categories, subcategories, productTypes, importMode]);

  // Execute import
  const handleExecuteImport = async () => {
    if (!importPlan || importPlan.totalToImport === 0) return;

    setIsProcessing(true);
    setGeneralError(null);

    try {
      const res = await onConfirmImport(importPlan.rows, importMode, 'flexible');
      setImportResults(res || {
        created: importPlan.newCount,
        updated: importPlan.existingCount,
        skipped: 0,
        failed: 0
      });
    } catch (err) {
      console.error('Category import error:', err);
      setGeneralError('Failed to save categories to Supabase: ' + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-pink-100 animate-slide-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-wide flex items-center gap-2">
                <span>Import Categories from Excel</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#C2477A]">
                  Smart Column Auto-Map
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Upload any Excel spreadsheet. Select which levels to import with optional parent mapping.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-xs">
          {/* Success Summary View */}
          {importResults ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2.5 font-black text-sm">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                  <span>Categories Saved Successfully to Supabase!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  All category levels have been saved permanently in the database. Parent-child relationships are linked, and changes reflect immediately in product creation dropdowns.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <span className="block text-2xl font-black text-emerald-700">{importResults.created || 0}</span>
                  <span className="text-[11px] font-bold text-gray-600">Created New</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
                  <span className="block text-2xl font-black text-blue-700">{importResults.updated || 0}</span>
                  <span className="text-[11px] font-bold text-gray-600">Updated</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <span className="block text-2xl font-black text-gray-600">{importResults.skipped || 0}</span>
                  <span className="text-[11px] font-bold text-gray-500">Skipped</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                  <span className="block text-2xl font-black text-purple-700">
                    {(importPlan?.summary?.categoriesCount || 0) + (importPlan?.summary?.subcategoriesCount || 0) + (importPlan?.summary?.productTypesCount || 0)}
                  </span>
                  <span className="text-[11px] font-bold text-gray-600">Total Synced</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. File Upload Area */}
              {!selectedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-[#C2477A] bg-pink-50/70 scale-[0.99]'
                      : 'border-pink-200/80 bg-[#FFFDFE] hover:border-[#C2477A] hover:bg-pink-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center shadow-2xs">
                    <Upload size={26} />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-gray-800">
                      Drop your Excel file here or click to browse
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Supports .xlsx, .xls, and .csv files up to 30 MB
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSimpleCategoryTemplate();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-pink-200 hover:border-[#C2477A] text-[#C2477A] text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download Sample Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-pink-200 text-[#C2477A] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate text-xs">{selectedFile.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {inspectionData?.totalRows || 0} rows found in sheet "{inspectionData?.selectedSheet || 'Sheet1'}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-pink-300 text-gray-700 hover:text-[#C2477A] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      Change File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Validation Loader */}
              {isValidating && (
                <div className="p-8 rounded-2xl bg-pink-50/30 border border-pink-100 flex flex-col items-center justify-center gap-2 text-gray-600">
                  <Loader2 size={24} className="animate-spin text-[#C2477A]" />
                  <span className="font-bold text-xs">Analyzing spreadsheet columns and rows...</span>
                </div>
              )}

              {/* 2. Detected Columns & Level Toggles (When file is loaded) */}
              {inspectionData && !isValidating && (
                <div className="space-y-4">
                  {/* Detected Columns Badges */}
                  <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} className="text-[#C2477A]" />
                        <span>Detected Excel Columns ({inspectionData.headers.length})</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">
                        Automatic Mapping Active
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectionData.headers.map((h, i) => {
                        const isMapped = Object.values(mapping).includes(h);
                        return (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isMapped
                                ? 'bg-pink-50 text-[#C2477A] border-pink-200 shadow-2xs'
                                : 'bg-white text-gray-600 border-gray-200'
                            }`}
                          >
                            {h}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Independent Level Selection Cards */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-900 block">
                      Choose Category Levels to Import:
                    </label>

                    {/* LEVEL 1: MAIN CATEGORIES */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      toggles.importMain
                        ? 'bg-[#FFFDFC] border-[#C2477A]/50 ring-1 ring-[#C2477A]/20 shadow-2xs'
                        : 'bg-white border-gray-200 opacity-70 hover:opacity-100'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={toggles.importMain}
                            onChange={(e) => setToggles(prev => ({ ...prev, importMain: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-[#C2477A] focus:ring-[#C2477A] border-gray-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-gray-900">
                                Import Main Categories (Level 1)
                              </span>
                              {mapping.mainCategoryCol ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Detected: "{mapping.mainCategoryCol}"
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                  No direct column
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Extracts primary category catalog items (e.g. Makeup, Skincare, Hair Care).
                            </p>
                          </div>
                        </label>
                      </div>

                      {toggles.importMain && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Source Excel Column for Category Name:
                            </label>
                            <select
                              value={mapping.mainCategoryCol}
                              onChange={(e) => setMapping(prev => ({ ...prev, mainCategoryCol: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-[#C2477A]"
                            >
                              <option value="">— Select Column from Excel —</option>
                              {inspectionData.headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 2: SUBCATEGORIES */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      toggles.importSub
                        ? 'bg-[#FFFDFC] border-[#C2477A]/50 ring-1 ring-[#C2477A]/20 shadow-2xs'
                        : 'bg-white border-gray-200 opacity-70 hover:opacity-100'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={toggles.importSub}
                            onChange={(e) => setToggles(prev => ({ ...prev, importSub: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-[#C2477A] focus:ring-[#C2477A] border-gray-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-gray-900">
                                Import Subcategories (Level 2)
                              </span>
                              {mapping.subcategoryCol ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Detected: "{mapping.subcategoryCol}"
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                  No direct column
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Extracts secondary subcategories (e.g. Lips, Eyes, Cleansers, Shampoos).
                            </p>
                          </div>
                        </label>
                      </div>

                      {toggles.importSub && (
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Source Excel Column for Subcategory Name:
                            </label>
                            <select
                              value={mapping.subcategoryCol}
                              onChange={(e) => setMapping(prev => ({ ...prev, subcategoryCol: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-[#C2477A]"
                            >
                              <option value="">— Select Column from Excel —</option>
                              {inspectionData.headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Parent Main Category Assignment:
                            </label>
                            {mapping.mainCategoryCol ? (
                              <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="subParentMode"
                                    checked={parentConfig.subParentMode === 'from_excel'}
                                    onChange={() => setParentConfig(prev => ({ ...prev, subParentMode: 'from_excel' }))}
                                    className="text-[#C2477A] focus:ring-[#C2477A]"
                                  />
                                  <span>Use column from Excel: <strong className="text-gray-900">{mapping.mainCategoryCol}</strong></span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="subParentMode"
                                    checked={parentConfig.subParentMode === 'fixed'}
                                    onChange={() => setParentConfig(prev => ({ ...prev, subParentMode: 'fixed' }))}
                                    className="text-[#C2477A] focus:ring-[#C2477A]"
                                  />
                                  <span>Assign all to specific category:</span>
                                </label>

                                {parentConfig.subParentMode === 'fixed' && (
                                  <select
                                    value={parentConfig.subFixedParentId}
                                    onChange={(e) => {
                                      const cat = categories.find(c => c.id === e.target.value);
                                      setParentConfig(prev => ({
                                        ...prev,
                                        subFixedParentId: e.target.value,
                                        subFixedParentName: cat?.name || ''
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-pink-200 bg-white text-xs text-gray-900 outline-none mt-1"
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ) : (
                              <div>
                                <select
                                  value={parentConfig.subFixedParentId}
                                  onChange={(e) => {
                                    const cat = categories.find(c => c.id === e.target.value);
                                    setParentConfig(prev => ({
                                      ...prev,
                                      subParentMode: 'fixed',
                                      subFixedParentId: e.target.value,
                                      subFixedParentName: cat?.name || ''
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-[#C2477A]"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  All subcategories in this file will be added under this category.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 3: SELECT CATEGORIES (PRODUCT TYPES) */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      toggles.importSelect
                        ? 'bg-[#FFFDFC] border-purple-400/50 ring-1 ring-purple-500/20 shadow-2xs'
                        : 'bg-white border-gray-200 opacity-70 hover:opacity-100'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={toggles.importSelect}
                            onChange={(e) => setToggles(prev => ({ ...prev, importSelect: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-600 border-gray-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-gray-900">
                                Import Select Categories (Level 3 / Product Types)
                              </span>
                              {mapping.selectCategoryCol ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  ✓ Detected: "{mapping.selectCategoryCol}"
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                  No direct column
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Extracts granular product types (e.g. Matte Lipstick, Liquid Eyeliner, Face Wash).
                            </p>
                          </div>
                        </label>
                      </div>

                      {toggles.importSelect && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Excel Column for Select Category:
                              </label>
                              <select
                                value={mapping.selectCategoryCol}
                                onChange={(e) => setMapping(prev => ({ ...prev, selectCategoryCol: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-purple-600"
                              >
                                <option value="">— Select Column from Excel —</option>
                                {inspectionData.headers.map((h, i) => (
                                  <option key={i} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Parent Main Category:
                              </label>
                              {mapping.mainCategoryCol ? (
                                <select
                                  value={parentConfig.selectParentCatMode === 'from_excel' ? '__from_excel__' : parentConfig.selectFixedParentCatId}
                                  onChange={(e) => {
                                    if (e.target.value === '__from_excel__') {
                                      setParentConfig(prev => ({ ...prev, selectParentCatMode: 'from_excel' }));
                                    } else {
                                      const cat = categories.find(c => c.id === e.target.value);
                                      setParentConfig(prev => ({
                                        ...prev,
                                        selectParentCatMode: 'fixed',
                                        selectFixedParentCatId: e.target.value,
                                        selectFixedParentCatName: cat?.name || ''
                                      }));
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-purple-600"
                                >
                                  <option value="__from_excel__">Use Excel column ({mapping.mainCategoryCol})</option>
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  value={parentConfig.selectFixedParentCatId}
                                  onChange={(e) => {
                                    const cat = categories.find(c => c.id === e.target.value);
                                    setParentConfig(prev => ({
                                      ...prev,
                                      selectParentCatMode: 'fixed',
                                      selectFixedParentCatId: e.target.value,
                                      selectFixedParentCatName: cat?.name || '',
                                      selectFixedParentSubId: '',
                                      selectFixedParentSubName: ''
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-purple-600"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Parent Subcategory:
                              </label>
                              {mapping.subcategoryCol ? (
                                <select
                                  value={parentConfig.selectParentSubMode === 'from_excel' ? '__from_excel__' : parentConfig.selectFixedParentSubId}
                                  onChange={(e) => {
                                    if (e.target.value === '__from_excel__') {
                                      setParentConfig(prev => ({ ...prev, selectParentSubMode: 'from_excel' }));
                                    } else {
                                      const sub = subcategories.find(s => s.id === e.target.value);
                                      setParentConfig(prev => ({
                                        ...prev,
                                        selectParentSubMode: 'fixed',
                                        selectFixedParentSubId: e.target.value,
                                        selectFixedParentSubName: sub?.name || ''
                                      }));
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-purple-600"
                                >
                                  <option value="__from_excel__">Use Excel column ({mapping.subcategoryCol})</option>
                                  {filteredSubcategoriesForSelect.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  value={parentConfig.selectFixedParentSubId}
                                  onChange={(e) => {
                                    const sub = subcategories.find(s => s.id === e.target.value);
                                    setParentConfig(prev => ({
                                      ...prev,
                                      selectParentSubMode: 'fixed',
                                      selectFixedParentSubId: e.target.value,
                                      selectFixedParentSubName: sub?.name || ''
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium text-gray-900 text-xs outline-none focus:border-purple-600"
                                >
                                  <option value="">— Select Parent Subcategory —</option>
                                  {filteredSubcategoriesForSelect.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Import Mode Setting */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-bold text-gray-900 text-xs block">Duplicate Handling:</span>
                      <span className="text-[11px] text-gray-500">
                        {importMode === 'add_new'
                          ? 'Skip existing categories and only create new records.'
                          : 'Update existing matching categories with new details and images.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setImportMode('add_new')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          importMode === 'add_new'
                            ? 'bg-[#C2477A] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Add New Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('update_existing')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          importMode === 'update_existing'
                            ? 'bg-[#C2477A] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Update Existing
                      </button>
                    </div>
                  </div>

                  {/* 5. Live Import Preview Table */}
                  {importPlan && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-gray-900 flex items-center gap-2">
                          <span>Import Preview</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-[#C2477A] border border-pink-200">
                            {importPlan.totalToImport} records ready
                          </span>
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                          <span className="text-emerald-700 font-bold">{importPlan.newCount} New</span>
                          <span>•</span>
                          <span className="text-blue-700 font-bold">{importPlan.existingCount} Existing</span>
                        </div>
                      </div>

                      {importPlan.totalToImport === 0 ? (
                        <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center text-amber-800 text-xs">
                          No category records selected. Enable at least one category level toggle above to import data.
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                          <div className="max-h-52 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-3.5 py-2.5">Row</th>
                                  <th className="px-3.5 py-2.5">Level</th>
                                  <th className="px-3.5 py-2.5">Category Name</th>
                                  <th className="px-3.5 py-2.5">Parent Hierarchy</th>
                                  <th className="px-3.5 py-2.5">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium text-gray-700 bg-white">
                                {importPlan.rows.slice(0, 10).map((r, i) => (
                                  <tr key={i} className="hover:bg-pink-50/30 transition-colors">
                                    <td className="px-3.5 py-2 font-mono text-gray-400 text-[11px]">#{r.rowNumber}</td>
                                    <td className="px-3.5 py-2">
                                      {r.levelType === 'category' && (
                                        <span className="px-2 py-0.5 rounded-md bg-pink-50 text-[#C2477A] border border-pink-200 text-[10px] font-bold">
                                          Main
                                        </span>
                                      )}
                                      {r.levelType === 'subcategory' && (
                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                          Subcategory
                                        </span>
                                      )}
                                      {r.levelType === 'product_type' && (
                                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                          Select Cat
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2 font-bold text-gray-900">{r.name}</td>
                                    <td className="px-3.5 py-2 text-gray-500 text-[11px]">
                                      {r.parentCategory ? (
                                        <span className="flex items-center gap-1">
                                          <span>{r.parentCategory}</span>
                                          {r.parentSubcategory && (
                                            <>
                                              <ChevronRight size={10} className="text-gray-400" />
                                              <span>{r.parentSubcategory}</span>
                                            </>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2">
                                      {r.isExisting ? (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                          {importMode === 'update_existing' ? 'Will Update' : 'Existing (Skip)'}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                          New Record
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {importPlan.totalToImport > 10 && (
                            <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-[10px] font-semibold text-gray-500">
                              Showing first 10 of {importPlan.totalToImport} records to be imported
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResults && (
          <div className="p-4 sm:p-5 border-t border-pink-100 bg-white flex items-center justify-between gap-3 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing || !importPlan || importPlan.totalToImport === 0}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving to Supabase Database...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    Import & Save to Supabase ({importPlan?.totalToImport || 0} records)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
