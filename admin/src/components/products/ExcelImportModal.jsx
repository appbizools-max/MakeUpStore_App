import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  Check,
  Layers,
  Sparkles,
  HelpCircle,
  GitBranch,
  Eye,
  FileText,
  ShieldCheck,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  analyzeWorkbook,
  groupSheetRowsIntoProducts,
  downloadErrorExcel,
  COLUMN_SYNONYMS
} from '../../services/excelProcessorService';
import {
  generateAndDownloadTemplate,
  downloadImportReportExcel
} from '../../utils/excelTemplateGenerator';

export const ExcelImportModal = ({
  isOpen,
  onClose,
  categories = [],
  brands = [],
  existingProducts = [],
  onImportProducts,
  onExportCatalog
}) => {
  if (!isOpen) return null;

  // 6-step wizard state:
  // 1: UPLOAD, 2: MAPPING, 3: RELATIONSHIPS, 4: VALIDATION_PREVIEW, 5: CONFIRMATION, 6: RESULTS
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState({ name: '', size: 0, rows: 0 });
  const [workbookAnalysis, setWorkbookAnalysis] = useState(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [columnMapping, setColumnMapping] = useState({});

  // Relationship mode: 'auto' | 'variants' | 'independent'
  const [relationshipConfig, setRelationshipConfig] = useState({
    mode: 'auto',
    parentSkuCol: 'Parent_SKU',
    variantSkuCol: 'Variant_SKU',
    barcodeCol: 'Barcode',
    shadeCol: 'Shade_Name',
    sizeCol: 'Size_or_Weight'
  });

  // Processed relational entities
  const [processedDataset, setProcessedDataset] = useState(null);

  // Import mode: 'create_and_update' | 'create_only' | 'update_only'
  const [importMode, setImportMode] = useState('create_and_update');
  const [allowBlankOverwrite, setAllowBlankOverwrite] = useState(false);

  // Progress and Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, text: '' });
  const [importResult, setImportResult] = useState(null);

  // Preview filtering: 'all' | 'valid' | 'errors' | 'grouped'
  const [previewFilter, setPreviewFilter] = useState('grouped');
  const [expandedGroupKeys, setExpandedGroupKeys] = useState({});

  // Required Field Definitions for Step 2
  const requiredFields = [
    { key: 'productName', label: 'Product Name' },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'mrp', label: 'MRP' },
    { key: 'generalPrice', label: 'General User Price' }
  ];

  // Helper: check if all required fields are mapped
  const missingRequiredFields = useMemo(() => {
    const mappedValues = Object.values(columnMapping);
    return requiredFields.filter(rf => !mappedValues.includes(rf.key));
  }, [columnMapping]);

  // Step 1: File Selection & Analysis
  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const analysis = await analyzeWorkbook(uploadedFile);
      setWorkbookAnalysis(analysis);

      if (analysis.sheets.length > 0) {
        setSelectedSheetIndex(0);
        const initialMapping = analysis.sheets[0].columnMapping || {};
        setColumnMapping(initialMapping);
        setFileMetadata({
          name: uploadedFile.name,
          size: uploadedFile.size,
          rows: analysis.sheets[0].rowCount
        });
      }
      setStep(2); // advance to column mapping
    } catch (err) {
      alert(`Workbook analysis error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Handle Column Mapping Change
  const handleMapChange = (header, targetField) => {
    setColumnMapping(prev => {
      const updated = { ...prev };
      if (!targetField) {
        delete updated[header];
      } else {
        // Remove targetField if assigned to another header to prevent conflicts
        Object.keys(updated).forEach(k => {
          if (updated[k] === targetField && k !== header) {
            delete updated[k];
          }
        });
        updated[header] = targetField;
      }
      return updated;
    });
  };

  // Transition from Mapping (Step 2) to Relationship Config (Step 3)
  const handleProceedToRelationships = () => {
    if (missingRequiredFields.length > 0) {
      alert(`Please map all required columns before proceeding: ${missingRequiredFields.map(f => f.label).join(', ')}`);
      return;
    }
    setStep(3);
  };

  // Transition from Relationships (Step 3) to Validation Preview (Step 4)
  const handleProceedToPreview = () => {
    if (!workbookAnalysis || !workbookAnalysis.sheets[selectedSheetIndex]) return;
    const currentSheet = workbookAnalysis.sheets[selectedSheetIndex];

    const dataset = groupSheetRowsIntoProducts(
      currentSheet,
      columnMapping,
      existingProducts,
      relationshipConfig
    );

    setProcessedDataset(dataset);
    setStep(4);
  };

  // Step 5 -> Step 6: Execute Batched Database Import
  const handleExecuteImport = async () => {
    if (!processedDataset || !processedDataset.groupedProducts) return;

    // Filter valid parent products to import
    const validGroups = processedDataset.groupedProducts.filter(p => p._valid);
    if (validGroups.length === 0) {
      alert('There are no valid products to import. Please review blocking errors.');
      return;
    }

    setStep(6); // importing progress screen
    setImportProgress({ current: 0, total: validGroups.length, text: 'Preparing batch database ingestion...' });

    try {
      const res = await onImportProducts(validGroups, (progress) => {
        setImportProgress(progress);
      }, {
        importMode,
        allowBlankOverwrite,
        updateExisting: importMode !== 'create_only'
      });

      const failedGroups = processedDataset.groupedProducts.filter(p => !p._valid);
      const failedRawRows = processedDataset.rawNormalizedRows.filter(r => !r._valid);

      setImportResult({
        total: processedDataset.metrics.totalRows,
        productsTotal: validGroups.length,
        productsCreated: res.inserted || 0,
        productsUpdated: res.updated || 0,
        variantsCreated: processedDataset.metrics.newVariants,
        variantsUpdated: processedDataset.metrics.existingVariants,
        skipped: res.skipped || 0,
        failed: (res.failed || 0) + failedGroups.length,
        failedRows: failedRawRows,
        ...res
      });
    } catch (err) {
      alert(`Import failed: ${err.message}`);
      setStep(4);
    }
  };

  // Toggle visual expansion for parent-child groups in preview
  const toggleGroupExpand = (key) => {
    setExpandedGroupKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const metrics = processedDataset?.metrics || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Bulk Product Excel Importer</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Step {step} of 6
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 1 && 'Upload an Excel or CSV file to begin ingestion'}
                {step === 2 && 'Verify and adjust column header mappings'}
                {step === 3 && 'Configure parent product and child variant relationships'}
                {step === 4 && 'Audit validation results, prices, and relational grouping'}
                {step === 5 && 'Select update policies and confirm persistence'}
                {step === 6 && 'Processing and synchronizing catalog with Supabase'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* ========================================================================= */}
          {/* STEP 1: BULK PRODUCT UPLOAD */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6 text-center py-2">
              <div className="max-w-xl mx-auto border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 bg-slate-50 hover:bg-purple-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Choose Excel File or Drag & Drop Here
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV workbooks with parent-child variant grouping
                </p>
                <span className="inline-flex px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-xs group-hover:border-purple-400 group-hover:text-purple-700 transition-colors">
                  Browse Files from Device
                </span>
              </div>

              {/* Template & Export Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={generateAndDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  title="Download official 2-sheet Excel template with canonical columns and instructions"
                >
                  <Download className="w-4 h-4 text-purple-600" />
                  Download Official Excel Template (.xlsx)
                </button>

                {onExportCatalog && (
                  <button
                    type="button"
                    onClick={onExportCatalog}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    title="Export existing database products to Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    Export Existing Products
                  </button>
                )}
              </div>

              {/* Quick Info Box */}
              <div className="max-w-xl mx-auto p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-left flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <strong className="font-bold">Parent–Child Architecture:</strong> Multiple rows sharing the same <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">Parent_SKU</code> will be bundled into a single product with purchasable shade/size variants. Standalone products without variants are also fully supported.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: COLUMN MAPPING */}
          {/* ========================================================================= */}
          {step === 2 && workbookAnalysis && (
            <div className="space-y-5">
              {/* Sheet selector if multi-sheet workbook */}
              {workbookAnalysis.sheets.length > 1 && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <Layers className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-semibold text-purple-900">Select Sheet to Ingest:</span>
                  <select
                    value={selectedSheetIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedSheetIndex(idx);
                      setColumnMapping(workbookAnalysis.sheets[idx].columnMapping || {});
                    }}
                    className="px-3 py-1 bg-white border border-purple-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {workbookAnalysis.sheets.map((s, idx) => (
                      <option key={idx} value={idx}>
                        {s.name} ({s.rowCount} rows)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Missing Required Warning if any */}
              {missingRequiredFields.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Missing required mappings: {missingRequiredFields.map(f => f.label).join(', ')}</span>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Match Excel Headers to Salbeau Schema
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {Object.keys(columnMapping).length} columns mapped
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50/80 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-slate-700">Excel Header</th>
                        <th className="px-4 py-2 text-left font-bold text-slate-700">Sample Cell</th>
                        <th className="px-4 py-2 text-left font-bold text-slate-700">Mapped Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(workbookAnalysis.sheets[selectedSheetIndex]?.headers || []).map((header) => {
                        const currentMapped = columnMapping[header] || '';
                        const sampleRow = workbookAnalysis.sheets[selectedSheetIndex]?.sampleRows?.[0] || {};
                        const sampleVal = sampleRow[header] || '';

                        return (
                          <tr key={header} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-semibold text-slate-900">
                              {header}
                            </td>
                            <td className="px-4 py-2 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                              {String(sampleVal || '-')}
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={currentMapped}
                                onChange={(e) => handleMapChange(header, e.target.value)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 ${
                                  currentMapped
                                    ? 'bg-purple-50/50 border-purple-300 text-purple-900 font-bold'
                                    : 'bg-white border-slate-300 text-slate-500'
                                }`}
                              >
                                <option value="">-- Ignore Column --</option>
                                <optgroup label="Product Identification (Required)">
                                  <option value="productName">Product Name *</option>
                                  <option value="brand">Brand *</option>
                                  <option value="category">Main Category *</option>
                                  <option value="mrp">MRP *</option>
                                  <option value="generalPrice">General User Price *</option>
                                </optgroup>
                                <optgroup label="Hierarchy & Grouping">
                                  <option value="parentSku">Parent SKU (Groups Variants)</option>
                                  <option value="variantSku">Variant SKU</option>
                                  <option value="subcategory">Sub Category</option>
                                  <option value="productType">Product Type / Sub-Type</option>
                                  <option value="barcode">Barcode (EAN / UPC)</option>
                                  <option value="variantBarcode">Variant Barcode</option>
                                </optgroup>
                                <optgroup label="Variants & Shades">
                                  <option value="shadeName">Shade Name / Color</option>
                                  <option value="shadeCode">Shade Code / Number</option>
                                  <option value="sizeOrWeight">Size / Weight / Volume</option>
                                  <option value="variantName">Variant Display Name</option>
                                </optgroup>
                                <optgroup label="Four-Tier Role Pricing">
                                  <option value="salonPrice">Salon Price (Wholesale)</option>
                                  <option value="artistPrice">Makeup Artist Price</option>
                                  <option value="beauticianPrice">Beautician Price</option>
                                </optgroup>
                                <optgroup label="Attributes & Content">
                                  <option value="finish">Finish (Matte, Dewy, etc.)</option>
                                  <option value="coverage">Coverage</option>
                                  <option value="skinType">Skin Type</option>
                                  <option value="ingredients">Ingredients</option>
                                  <option value="howToUse">How to Use</option>
                                  <option value="countryOfOrigin">Country of Origin</option>
                                  <option value="productDescription">Description</option>
                                </optgroup>
                                <optgroup label="Media & Status">
                                  <option value="productImageUrl">Product Image URL</option>
                                  <option value="variantImageUrl">Variant Image URL</option>
                                  <option value="productActive">Product Active (TRUE/FALSE)</option>
                                  <option value="variantActive">Variant Active (TRUE/FALSE)</option>
                                </optgroup>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PRODUCT RELATIONSHIP CONFIGURATION */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  How should products in this file be related?
                </h3>
                <p className="text-xs text-slate-500">
                  Select how Salbeau handles multi-shade cosmetic variations versus standalone items.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRelationshipConfig(prev => ({ ...prev, mode: 'auto' }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    relationshipConfig.mode === 'auto'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">Auto-Detect Relationships</span>
                    {relationshipConfig.mode === 'auto' && <Check className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Rows with matching <code className="font-bold text-slate-700">Parent_SKU</code> form parent products with child variants. Rows without variants remain standalone.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRelationshipConfig(prev => ({ ...prev, mode: 'variants' }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    relationshipConfig.mode === 'variants'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">Parent–Child Variants</span>
                    {relationshipConfig.mode === 'variants' && <Check className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Strictly groups rows sharing Parent_SKU or Product Name + Brand into unified parent catalog items.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRelationshipConfig(prev => ({ ...prev, mode: 'independent' }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    relationshipConfig.mode === 'independent'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">Independent Products</span>
                    {relationshipConfig.mode === 'independent' && <Check className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Treats every Excel row as an independent standalone product with no child grouping.
                  </p>
                </button>
              </div>

              {/* Intelligent SKU Detection Alert */}
              <div className="flex items-center gap-2.5 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-purple-950">Intelligent SKU Auto-Detection Active</div>
                  <div className="text-[11px] text-purple-800 leading-normal">
                    If <code className="font-mono bg-purple-100 px-1 rounded text-purple-900">Parent_SKU</code> or <code className="font-mono bg-purple-100 px-1 rounded text-purple-900">Variant_SKU</code> columns are missing or blank in your Excel file, Salbeau automatically groups variants by Brand &amp; Product Name and generates retail-standard alphanumeric SKUs.
                  </div>
                </div>
              </div>

              {/* Relationship Field Mapping Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configured Identifier Columns
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  <div className="text-[11px]">
                    <span className="text-slate-400 block">Parent SKU Column:</span>
                    <strong className="text-slate-800">
                      {Object.keys(columnMapping).find(k => columnMapping[k] === 'parentSku') || '✨ Auto-Generates (Brand + Name)'}
                    </strong>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-slate-400 block">Variant SKU Column:</span>
                    <strong className="text-slate-800">
                      {Object.keys(columnMapping).find(k => columnMapping[k] === 'variantSku') || '✨ Auto-Generates (Shade/Size)'}
                    </strong>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-slate-400 block">Shade Column:</span>
                    <strong className="text-slate-800">
                      {Object.keys(columnMapping).find(k => columnMapping[k] === 'shadeName') || 'None'}
                    </strong>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-slate-400 block">Barcode Column:</span>
                    <strong className="text-slate-800">
                      {Object.keys(columnMapping).find(k => columnMapping[k] === 'barcode' || columnMapping[k] === 'variantBarcode') || 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: VALIDATION AND PREVIEW */}
          {/* ========================================================================= */}
          {step === 4 && processedDataset && (
            <div className="space-y-4">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Excel Rows</div>
                  <div className="text-lg font-bold text-slate-800">{metrics.totalRows || 0}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-[11px] text-purple-700 font-semibold">Parent Products</div>
                  <div className="text-lg font-bold text-purple-900">
                    {metrics.totalProductGroups || 0}{' '}
                    <span className="text-xs font-normal text-purple-600">
                      ({metrics.newParents || 0} new, {metrics.existingParents || 0} existing)
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold">Total Variants</div>
                  <div className="text-lg font-bold text-emerald-900">
                    {metrics.totalRows || 0}{' '}
                    <span className="text-xs font-normal text-emerald-600">
                      ({metrics.newVariants || 0} new, {metrics.existingVariants || 0} update)
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-[11px] text-rose-700 font-semibold">Blocking Errors</div>
                  <div className="text-lg font-bold text-rose-900">{metrics.invalidRows || 0}</div>
                </div>

                {(metrics.autoGeneratedParentSkus > 0 || metrics.autoGeneratedVariantSkus > 0) && (
                  <div className="col-span-2 md:col-span-4 p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>
                        <strong>Automatic SKU Detection:</strong> {metrics.autoGeneratedParentSkus || 0} Parent SKUs and {metrics.autoGeneratedVariantSkus || 0} Variant SKUs were automatically detected and generated for blank fields.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                      Standardized Format
                    </span>
                  </div>
                )}
              </div>

              {/* View Filter Pills */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('grouped')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewFilter === 'grouped'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Parent–Child Tree ({processedDataset.groupedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Raw Rows ({processedDataset.rawNormalizedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('errors')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewFilter === 'errors'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Errors Only ({metrics.invalidRows || 0})
                  </button>
                </div>

                {metrics.invalidRows > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadErrorExcel(processedDataset.rawNormalizedRows.filter(r => !r._valid), file?.name)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Error Rows Excel
                  </button>
                )}
              </div>

              {/* TREE VIEW: PARENTS & CHILD VARIANTS */}
              {previewFilter === 'grouped' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {processedDataset.groupedProducts.map((p, idx) => {
                    const isExpanded = expandedGroupKeys[p._groupKey] !== false; // expanded by default
                    return (
                      <div key={idx} className="bg-white">
                        {/* Parent Header Row */}
                        <div
                          onClick={() => toggleGroupExpand(p._groupKey)}
                          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
                              {p.brandName} · {p.category}
                            </span>
                            {p.isSkuAutoGenerated ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1" title="SKU automatically generated from Brand and Product Name">
                                <Sparkles className="w-3 h-3 text-purple-600" /> Auto-SKU: {p.sku}
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-200 text-slate-700">
                                SKU: {p.sku}
                              </span>
                            )}
                            {p.isExistingParent ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                Existing Parent (Will Update)
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                                New Parent Product
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-purple-700">
                              {p.shades.length} {p.shades.length === 1 ? 'Variant' : 'Variants'}
                            </span>
                            <span className="font-mono text-slate-700 font-bold">
                              ₹{p.generalPrice}
                            </span>
                          </div>
                        </div>

                        {/* Child Variants List */}
                        {isExpanded && (
                          <div className="pl-8 pr-4 py-1.5 bg-white space-y-1 divide-y divide-slate-50">
                            {p.shades.map((v, vIdx) => (
                              <div key={vIdx} className="py-1.5 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  {v.hexColor && (
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block"
                                      style={{ backgroundColor: v.hexColor }}
                                    />
                                  )}
                                  <strong className="text-slate-800">{v.name}</strong>
                                  {v.isSkuAutoGenerated ? (
                                    <span className="text-purple-700 font-mono font-bold text-[10px] flex items-center gap-0.5" title="Auto-generated variant SKU">
                                      <Sparkles className="w-2.5 h-2.5" /> [{v.sku}]
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono">[{v.sku}]</span>
                                  )}
                                  {v.barcode && <span className="text-slate-500 font-mono">{v.barcode}</span>}
                                  {v.isExisting ? (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">Update</span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">New</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 font-mono text-[11px]">
                                  <span className="text-slate-400 line-through">MRP: ₹{v.mrp}</span>
                                  <span className="text-slate-900 font-bold">General: ₹{v.generalPrice}</span>
                                  <span className="text-purple-700">Salon: ₹{v.salonPrice}</span>
                                  <span className="text-emerald-700">Artist: ₹{v.artistPrice}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RAW ROWS VIEW */}
              {previewFilter !== 'grouped' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">#</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Status</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Parent SKU</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Product Name</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Variant Name</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Variant SKU</th>
                        <th className="px-3 py-2 text-right font-bold text-slate-700">MRP</th>
                        <th className="px-3 py-2 text-right font-bold text-slate-700">General</th>
                        <th className="px-3 py-2 text-right font-bold text-slate-700">Salon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {processedDataset.rawNormalizedRows
                        .filter(r => (previewFilter === 'errors' ? !r._valid : true))
                        .slice(0, 100)
                        .map(r => (
                          <tr key={r._rowIndex} className={!r._valid ? 'bg-rose-50/50' : ''}>
                            <td className="px-3 py-1.5 font-mono text-slate-400">{r._rowIndex}</td>
                            <td className="px-3 py-1.5">
                              {r._valid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span
                                  title={r._errors.join('; ')}
                                  className="inline-flex items-center gap-1 text-rose-600 font-bold cursor-help"
                                >
                                  <AlertCircle className="w-3 h-3" /> {r._errors.length} Err
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-slate-600">{r.parentSku}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-900 truncate max-w-xs">{r.productName}</td>
                            <td className="px-3 py-1.5 text-slate-700">{r.variantName || r.shadeName || '-'}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-600">{r.variantSku}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-400 line-through">₹{r.mrp}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-900 font-bold">₹{r.generalPrice}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-purple-700">₹{r.salonPrice}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: IMPORT CONFIRMATION & POLICY */}
          {/* ========================================================================= */}
          {step === 5 && processedDataset && (
            <div className="space-y-6 max-w-xl mx-auto py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Confirm Catalog Import Policy</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose how existing database products and duplicate barcodes are handled.
                </p>
              </div>

              {/* Policy Radio Options */}
              <div className="space-y-2.5">
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'create_and_update'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="importMode"
                      value="create_and_update"
                      checked={importMode === 'create_and_update'}
                      onChange={() => setImportMode('create_and_update')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Create New & Update Existing Products (Recommended)
                      </strong>
                      <span className="text-[11px] text-slate-500 block leading-normal">
                        Inserts new parent products and child variants. If a product already exists, updates its prices, attributes, and appends any new shades without duplicates.
                      </span>
                    </div>
                  </div>
                </label>

                <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'create_only'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="importMode"
                      value="create_only"
                      checked={importMode === 'create_only'}
                      onChange={() => setImportMode('create_only')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Create New Products Only (Skip Existing)
                      </strong>
                      <span className="text-[11px] text-slate-500 block leading-normal">
                        Only inserts products that do not yet exist in the database. Any matching barcodes or existing Parent SKUs are skipped.
                      </span>
                    </div>
                  </div>
                </label>

                <label className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                  importMode === 'update_only'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="importMode"
                      value="update_only"
                      checked={importMode === 'update_only'}
                      onChange={() => setImportMode('update_only')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        Update Existing Products Only (Do Not Create New)
                      </strong>
                      <span className="text-[11px] text-slate-500 block leading-normal">
                        Only updates products already present in the catalog. Any new product rows are ignored.
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Blank cell guard toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-xs font-bold text-slate-800 block">Protect Non-Blank Values</strong>
                  <span className="text-[11px] text-slate-500">
                    Never overwrite existing database values with blank Excel cells
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={!allowBlankOverwrite}
                  onChange={(e) => setAllowBlankOverwrite(!e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              {/* Exact counts summary box */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-center text-xs text-purple-900">
                Ready to process <strong>{processedDataset.groupedProducts.filter(p => p._valid).length}</strong> parent products containing <strong>{metrics.totalRows || 0}</strong> variants into Supabase.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: IMPORT PROGRESS AND FINAL RESULTS */}
          {/* ========================================================================= */}
          {step === 6 && (
            <div className="py-6 text-center space-y-5 max-w-lg mx-auto">
              {!importResult ? (
                // In-Progress State
                <div className="space-y-4">
                  <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
                  <h3 className="font-bold text-slate-800 text-base">Persisting Products into Database</h3>
                  <p className="text-xs text-slate-500">{importProgress.text || 'Processing batches...'}</p>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {importProgress.current} / {importProgress.total} batches processed (
                    {Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%)
                  </div>
                </div>
              ) : (
                // Final Completed State
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Import & Sync Complete!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Catalog changes successfully persisted to Supabase database.
                    </p>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-semibold">Total Evaluated</div>
                      <div className="text-lg font-bold text-slate-800">{importResult.total || 0}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[11px] text-emerald-700 font-semibold">Created New</div>
                      <div className="text-lg font-bold text-emerald-900">{importResult.productsCreated || importResult.inserted || 0}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="text-[11px] text-purple-700 font-semibold">Updated Existing</div>
                      <div className="text-lg font-bold text-purple-900">{importResult.productsUpdated || importResult.updated || 0}</div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <div className="text-[11px] text-rose-700 font-semibold">Skipped / Failed</div>
                      <div className="text-lg font-bold text-rose-900">{importResult.failed || 0}</div>
                    </div>
                  </div>

                  {/* Actions for Completed Import */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => downloadImportReportExcel(importResult, importResult.failedRows)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                      Download Import Audit Report (.xlsx)
                    </button>

                    {importResult.failedRows && importResult.failedRows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => downloadErrorExcel(importResult.failedRows, file?.name)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        Download Failed Rows ({importResult.failedRows.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Mapping
              </button>
            )}
            {step === 4 && (
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Relationships
              </button>
            )}
            {step === 5 && (
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Preview
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 6 && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceedToRelationships}
                disabled={missingRequiredFields.length > 0}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                Configure Relationships <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleProceedToPreview}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
              >
                Validate & Preview <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={() => setStep(5)}
                disabled={(metrics.validRows || 0) === 0}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                Proceed to Confirmation <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 5 && (
              <button
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm & Submit Import ({processedDataset?.groupedProducts.filter(p => p._valid).length || 0} Products)
              </button>
            )}

            {step === 6 && importResult && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExcelImportModal;
