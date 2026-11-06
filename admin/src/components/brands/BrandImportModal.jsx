import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  Tag,
  BadgePlus,
  ArrowRight
} from 'lucide-react';
import {
  parseAndValidateBrandExcel,
  downloadBrandImportTemplate,
  downloadBrandImportErrorReport
} from '../../utils/brandUtils';

/**
 * BrandImportModal Component
 * 
 * Implements strict Excel Category Mapping & Validation:
 * 1. Upload & Drag-and-Drop Excel (.xlsx, .xls, .csv)
 * 2. Exact Category Matching against Categories List page
 * 3. Proactive Missing Category Detection with One-Click Registration into Categories List
 * 4. Zero default category assignments (preserves exact categories from spreadsheet)
 * 5. Comprehensive Preview Metrics & Row Audit
 * 6. Batch processing with permanent Supabase synchronization
 */
export default function BrandImportModal({
  isOpen,
  onClose,
  masterCategories = [],
  existingBrands = [],
  onAddCategory = null,
  onConfirmImport
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [importMode, setImportMode] = useState('add_new'); // 'add_new' | 'update_existing'
  const [previewData, setPreviewData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  // Missing categories management state
  const [currentMasterCategories, setCurrentMasterCategories] = useState(masterCategories);
  const [isAddingCategories, setIsAddingCategories] = useState(false);
  const [categoryAddSuccess, setCategoryAddSuccess] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setCurrentMasterCategories(masterCategories);
  }, [masterCategories]);

  const runValidation = async (file, cats) => {
    setIsValidating(true);
    setGeneralError(null);
    try {
      const res = await parseAndValidateBrandExcel(file, cats, existingBrands);
      if (!res.success) {
        setGeneralError(res.error || 'Failed to parse Excel file.');
        setPreviewData(null);
      } else {
        setPreviewData(res);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setGeneralError('Error reading spreadsheet: ' + (err.message || 'Corrupt or unreadable file.'));
      setPreviewData(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isSupported = validExts.some(ext => lowerName.endsWith(ext));

    if (!isSupported) {
      setGeneralError('Please upload an Excel file (.xlsx, .xls) or CSV spreadsheet.');
      return;
    }

    setSelectedFile(file);
    setImportResults(null);
    setCategoryAddSuccess(null);
    await runValidation(file, currentMasterCategories);
  };

  // Add all detected missing categories directly to the Categories List page
  const handleAddAllMissingCategories = async () => {
    if (!previewData?.missingCategories || previewData.missingCategories.length === 0) return;
    if (typeof onAddCategory !== 'function') {
      setGeneralError('Category creation service is unavailable. Please navigate to Categories List page to add the missing categories.');
      return;
    }

    setIsAddingCategories(true);
    setGeneralError(null);
    setCategoryAddSuccess(null);

    try {
      const newlyAdded = [];
      for (const catName of previewData.missingCategories) {
        await onAddCategory({
          name: catName,
          enabled: true
        });
        newlyAdded.push({ id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name: catName });
      }

      const updatedMasterCats = [...currentMasterCategories, ...newlyAdded];
      setCurrentMasterCategories(updatedMasterCats);
      setCategoryAddSuccess(`Successfully added ${newlyAdded.length} missing category (${previewData.missingCategories.join(', ')}) to the Categories List! Re-validating...`);

      // Re-validate immediately with the updated category master!
      if (selectedFile) {
        await runValidation(selectedFile, updatedMasterCats);
      }
    } catch (err) {
      console.error('Error adding missing categories:', err);
      setGeneralError('Failed to register categories: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAddingCategories(false);
    }
  };

  const handleProcessImport = async () => {
    if (!previewData || previewData.validRows === 0) return;

    setIsProcessing(true);
    setGeneralError(null);

    try {
      const res = await onConfirmImport(previewData.rows, importMode);
      setImportResults(res);
    } catch (err) {
      console.error('Import processing error:', err);
      setGeneralError('Failed to complete brand import: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResults(null);
    setGeneralError(null);
    setCategoryAddSuccess(null);
  };

  if (!isOpen) return null;

  const hasMissingCategories = Boolean(previewData?.missingCategories && previewData.missingCategories.length > 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-all animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-pink-100 animate-slide-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-white via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-wide">
                Import Brands from Excel
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Exact Category Mapping &bull; Zero Default Fallback &bull; Cloud Synced
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-[#C2477A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar text-xs">
          {/* Action Bar with Download Template */}
          <div className="p-4 rounded-2xl bg-white border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-[#C2477A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 text-xs">Exact Category Matching Required</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Categories must match existing names in Categories List page. Unregistered categories will be identified so you can register them before importing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadBrandImportTemplate}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#C2477A] text-[#C2477A] hover:bg-pink-50 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Download size={14} />
              <span>Download Template</span>
            </button>
          </div>

          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {categoryAddSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle size={16} className="shrink-0 text-emerald-600" />
              <span>{categoryAddSuccess}</span>
            </div>
          )}

          {/* Results Summary State */}
          {importResults ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span>Import Completed & Saved to Database!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  All brands have been accurately mapped to their designated categories and saved permanently to database. Records reflect dynamically across Brand Master, Product Management, and the User App.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                  <span className="block text-xl font-extrabold text-emerald-700">{importResults.created || 0}</span>
                  <span className="text-[11px] font-bold text-gray-600">Created</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                  <span className="block text-xl font-extrabold text-blue-700">{importResults.updated || 0}</span>
                  <span className="text-[11px] font-bold text-gray-600">Updated</span>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <span className="block text-xl font-extrabold text-gray-600">{importResults.skipped || 0}</span>
                  <span className="text-[11px] font-bold text-gray-500">Skipped</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                  <span className="block text-xl font-extrabold text-rose-700">{importResults.failed || 0}</span>
                  <span className="text-[11px] font-bold text-gray-600">Failed</span>
                </div>
              </div>

              {previewData?.invalidRows > 0 && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => downloadBrandImportErrorReport(previewData.rows)}
                    className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Failed Rows Audit (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
          ) : !previewData ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-[#C2477A] bg-white scale-[1.01]'
                  : 'border-pink-200 hover:border-[#C2477A] bg-[#FFFDFE]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-pink-100 text-[#C2477A] flex items-center justify-center mb-3 shadow-2xs">
                {isValidating ? <Loader2 size={26} className="animate-spin text-[#C2477A]" /> : <Upload size={26} />}
              </div>
              <h4 className="font-extrabold text-sm text-gray-900 mb-1">
                {isValidating ? 'Parsing & Matching Categories...' : 'Drop your Excel file here or click to browse'}
              </h4>
              <p className="text-[11px] text-gray-400">
                Supports .XLSX, .XLS, and .CSV workbooks up to 30 MB
              </p>
            </div>
          ) : (
            /* Preview and Mode Selection */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <span className="font-bold text-gray-900 text-xs block">File: {selectedFile?.name}</span>
                  <span className="text-[11px] text-gray-400">Exact category validation complete</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#C2477A] hover:underline font-bold cursor-pointer"
                >
                  Choose another file
                </button>
              </div>

              {/* 5 Standard Preview Metrics (Total, Valid, Duplicates, Invalid Categories, Failed) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <span className="block text-lg font-black text-gray-800">{previewData.totalRows}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Records</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <span className="block text-lg font-black text-emerald-700">{previewData.validRows}</span>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Valid Records</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                  <span className="block text-lg font-black text-amber-700">{previewData.duplicateRecords || 0}</span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Duplicate Brands</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-center">
                  <span className="block text-lg font-black text-purple-700">{previewData.invalidCategories || 0}</span>
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Invalid Categories</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                  <span className="block text-lg font-black text-rose-700">{previewData.invalidRows}</span>
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Failed Records</span>
                </div>
              </div>

              {/* Unregistered Categories Alert & Quick Action */}
              {hasMissingCategories && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 space-y-3 animate-fade-in shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
                          Missing Categories Detected ({previewData.missingCategories.length})
                        </h4>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          Action Required
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        The following categories were provided in your spreadsheet but do not exist in the <strong>Categories List</strong> page. They will not be replaced with any default category:
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {previewData.missingCategories.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300 shadow-2xs"
                          >
                            <Tag size={12} className="text-amber-600" />
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {onAddCategory && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-200/80">
                      <span className="text-[10.5px] text-amber-800 font-medium">
                        Register these categories immediately to update Categories List and validate all rows:
                      </span>
                      <button
                        type="button"
                        disabled={isAddingCategories}
                        onClick={handleAddAllMissingCategories}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                      >
                        {isAddingCategories ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Adding to Categories List...</span>
                          </>
                        ) : (
                          <>
                            <BadgePlus size={14} />
                            <span>Add Missing Categories & Re-validate</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Row-Level Preview Sample (First 8 Rows) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 block">
                    Spreadsheet Import Preview:
                  </label>
                  {previewData.invalidRows > 0 && (
                    <button
                      type="button"
                      onClick={() => downloadBrandImportErrorReport(previewData.rows)}
                      className="text-[11px] font-bold text-[#C2477A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download Error Report (.xlsx)</span>
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Brand Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Reason / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.rows.slice(0, 10).map((r) => (
                        <tr key={r.rowNumber} className={!r.isValid ? 'bg-rose-50/40' : 'hover:bg-gray-50/50'}>
                          <td className="py-2 px-3 text-gray-500 font-mono font-medium">#{r.rowNumber}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{r.brandName || <span className="text-rose-500 italic">Missing</span>}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#C2477A] border border-pink-200">
                              {r.category || (Array.isArray(r.categories) && r.categories[0]) || <span className="text-rose-500 italic">Missing</span>}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold">
                            {r.isValid ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                                Valid
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-[10.5px]">
                            {r.isValid ? (
                              <span className="text-emerald-700">Ready to import</span>
                            ) : (
                              <span className="text-rose-600 font-medium">{r.errors?.join('; ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-gray-900 block">
                  Select Import Action:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('add_new')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      importMode === 'add_new'
                        ? 'border-[#C2477A] bg-white ring-2 ring-[#C2477A]/20'
                        : 'border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-gray-900">Add New Brands</span>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'add_new'}
                        onChange={() => setImportMode('add_new')}
                        className="accent-[#C2477A]"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Creates new brands. Safely skips records that already exist in database without overwriting.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('update_existing')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      importMode === 'update_existing'
                        ? 'border-[#C2477A] bg-white ring-2 ring-[#C2477A]/20'
                        : 'border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-gray-900">Update Existing Brands</span>
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'update_existing'}
                        onChange={() => setImportMode('update_existing')}
                        className="accent-[#C2477A]"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Updates matched brands with exact categories, logo, and metadata while preserving permanent Brand Numbers.
                    </p>
                  </div>
                </div>
              </div>

              {previewData.invalidRows > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  <span>{previewData.invalidRows} row(s) contain validation errors and will be skipped unless resolved.</span>
                  <button
                    type="button"
                    onClick={() => downloadBrandImportErrorReport(previewData.rows)}
                    className="underline font-bold hover:text-amber-900 cursor-pointer"
                  >
                    Download Error Audit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-pink-100 bg-white flex items-center justify-between shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all cursor-pointer"
          >
            {importResults ? 'Close' : 'Cancel'}
          </button>

          {!importResults && previewData && (
            <button
              type="button"
              disabled={isProcessing || previewData.validRows === 0}
              onClick={handleProcessImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C2477A] to-[#E25586] hover:from-[#b83760] hover:to-[#C2477A] disabled:opacity-50 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting & Saving {previewData.validRows} Brands to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Submit & Save to Database ({previewData.validRows} Valid)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
