import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import {
  analyzeWorkbook,
  transformSheetToEntities,
  downloadErrorExcel,
  COLUMN_SYNONYMS
} from '../services/excelProcessorService';
import { generateAndDownloadTemplate } from '../utils/excelTemplateGenerator';

export const ExcelImportModal = ({
  isOpen,
  onClose,
  categories = [],
  brands = [],
  existingProducts = [],
  onImportProducts
}) => {
  if (!isOpen) return null;

  // Multi-step wizard state: 1: UPLOAD, 2: MAPPING, 3: PREVIEW, 4: IMPORTING, 5: COMPLETE
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [workbookAnalysis, setWorkbookAnalysis] = useState(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [columnMapping, setColumnMapping] = useState({});
  const [processedRows, setProcessedRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, text: '' });
  const [importResult, setImportResult] = useState(null);

  // Step 1: Handle File Selection & Analysis
  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const analysis = await analyzeWorkbook(uploadedFile);
      setWorkbookAnalysis(analysis);

      if (analysis.sheets.length > 0) {
        setSelectedSheetIndex(0);
        setColumnMapping(analysis.sheets[0].columnMapping || {});
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
    setColumnMapping(prev => ({
      ...prev,
      [header]: targetField || undefined
    }));
  };

  // Transition from Mapping to Preview
  const handleProceedToPreview = () => {
    if (!workbookAnalysis || !workbookAnalysis.sheets[selectedSheetIndex]) return;
    const currentSheet = workbookAnalysis.sheets[selectedSheetIndex];

    const entities = transformSheetToEntities(currentSheet, columnMapping, existingProducts);
    setProcessedRows(entities);
    setStep(3); // advance to preview
  };

  // Step 3: Execute Batched Import
  const handleExecuteImport = async () => {
    const validRows = processedRows.filter(r => r._valid);
    if (validRows.length === 0) {
      alert('There are no valid products to import.');
      return;
    }

    setStep(4); // importing
    setImportProgress({ current: 0, total: validRows.length, text: 'Starting batch product creation...' });

    try {
      const res = await onImportProducts(validRows, (progress) => {
        setImportProgress(progress);
      });

      const failedCount = processedRows.filter(r => !r._valid).length;

      setImportResult({
        total: processedRows.length,
        created: validRows.length,
        failed: failedCount,
        failedRows: processedRows.filter(r => !r._valid),
        ...res
      });
      setStep(5); // complete
    } catch (err) {
      alert(`Import failed: ${err.message}`);
      setStep(3);
    }
  };

  const validCount = processedRows.filter(r => r._valid).length;
  const errorCount = processedRows.filter(r => !r._valid).length;
  const warningCount = processedRows.filter(r => (r._warnings || []).length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Import Products from Excel</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Step {step} of 5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 1 && 'Upload an Excel or CSV file to analyze'}
                {step === 2 && 'Confirm column header auto-mappings'}
                {step === 3 && 'Review validated products before database submission'}
                {step === 4 && 'Ingesting products into Supabase...'}
                {step === 5 && 'Import complete summary'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 bg-slate-50 hover:bg-purple-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Choose Excel File or Drag & Drop Here
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV workbooks
                </p>
                <span className="inline-flex px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs group-hover:border-purple-400 group-hover:text-purple-700">
                  Browse Files
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={generateAndDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Standard Product Template (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && workbookAnalysis && (
            <div className="space-y-5">
              {/* Sheet selector if multi-sheet */}
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

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Map Excel Headers to Salbeau Product Schema
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-700">Excel Header</th>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-700">Sample Value</th>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-700">Salbeau Catalog Field</th>
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
                                    ? 'bg-purple-50/50 border-purple-300 text-purple-900 font-semibold'
                                    : 'bg-white border-slate-300 text-slate-500'
                                }`}
                              >
                                <option value="">-- Ignore Column --</option>
                                <optgroup label="Required Fields">
                                  <option value="name">Product Name *</option>
                                  <option value="brand">Brand *</option>
                                  <option value="category">Main Category *</option>
                                  <option value="sku">SKU *</option>
                                  <option value="mrp">MRP *</option>
                                  <option value="generalPrice">General Selling Price *</option>
                                  <option value="stock">Stock Quantity *</option>
                                </optgroup>
                                <optgroup label="Variants & Hierarchy">
                                  <option value="subcategory">Sub Category</option>
                                  <option value="productType">Select Category / Product Type</option>
                                  <option value="productGroup">Product Group</option>
                                  <option value="shade">Shade / Variant Name</option>
                                  <option value="colorName">Color Name</option>
                                  <option value="hexColor">Hex Color (#C9828F)</option>
                                  <option value="colorFamily">Color Family</option>
                                  <option value="barcode">Barcode (EAN/UPC)</option>
                                </optgroup>
                                <optgroup label="Role Pricing">
                                  <option value="salonPrice">Salon Price</option>
                                  <option value="artistPrice">Makeup Artist Price</option>
                                  <option value="beauticianPrice">Beautician Price</option>
                                </optgroup>
                                <optgroup label="Media & Details">
                                  <option value="image">Primary Image URL</option>
                                  <option value="description">Description</option>
                                  <option value="status">Status (published/draft)</option>
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

          {/* STEP 3: PREVIEW & AUDIT */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Metric Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-700 font-semibold">Total Rows</div>
                  <div className="text-xl font-bold text-purple-900">{processedRows.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Valid & Ready</div>
                  <div className="text-xl font-bold text-emerald-900">{validCount}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">Blocking Errors</div>
                  <div className="text-xl font-bold text-rose-900">{errorCount}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-xs text-amber-700 font-semibold">Warnings</div>
                  <div className="text-xl font-bold text-amber-900">{warningCount}</div>
                </div>
              </div>

              {/* Sample Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">#</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Status</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Product Name</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Brand</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Shade</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">SKU</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-700">Barcode</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-700">General</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-700">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {processedRows.slice(0, 50).map((r) => (
                      <tr
                        key={r._rowIndex}
                        className={!r._valid ? 'bg-rose-50/50' : (r._warnings.length > 0 ? 'bg-amber-50/20' : '')}
                      >
                        <td className="px-3 py-1.5 font-mono text-slate-400">{r._rowIndex}</td>
                        <td className="px-3 py-1.5">
                          {r._valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span
                              title={r._errors.join('\n')}
                              className="inline-flex items-center gap-1 text-rose-600 font-bold cursor-help"
                            >
                              <AlertCircle className="w-3 h-3" /> {r._errors.length} Err
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900 truncate max-w-xs">{r.productName}</td>
                        <td className="px-3 py-1.5 text-slate-600">{r.brand}</td>
                        <td className="px-3 py-1.5 text-slate-600">{r.shade || '-'}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{r.sku}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{r.barcode || '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-900">₹{r.generalPrice}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-900">{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING PROGRESS */}
          {step === 4 && (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <RefreshCw className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Ingesting Products into Database</h3>
              <p className="text-xs text-slate-500">{importProgress.text || 'Processing chunks...'}</p>

              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%`
                  }}
                />
              </div>
              <div className="text-xs font-mono text-slate-600">
                {importProgress.current} / {importProgress.total} products (
                {Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%)
              </div>
            </div>
          )}

          {/* STEP 5: IMPORT RESULT */}
          {step === 5 && importResult && (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Import Complete!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Successfully created and synchronized products with Supabase Realtime.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-center">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-700 font-semibold">Total Evaluated</div>
                  <div className="text-xl font-bold text-purple-900">{importResult.total}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Successfully Created</div>
                  <div className="text-xl font-bold text-emerald-900">{importResult.created}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">Skipped / Failed</div>
                  <div className="text-xl font-bold text-rose-900">{importResult.failed}</div>
                </div>
              </div>

              {importResult.failed > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => downloadErrorExcel(importResult.failedRows, file?.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Failed Rows Excel ({importResult.failed})
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Fix the annotations in the downloaded file and re-upload.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
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
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Mapping
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceedToPreview}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
              >
                Validate & Preview <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Submit Products ({validCount})
              </button>
            )}

            {step === 5 && (
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
