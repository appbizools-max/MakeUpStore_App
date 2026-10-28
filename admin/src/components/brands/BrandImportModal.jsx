import React, { useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
import {
  parseAndValidateBrandExcel,
  downloadBrandImportTemplate,
  downloadBrandImportErrorReport
} from '../../utils/brandUtils';

/**
 * BrandImportModal Component
 * 
 * Implements the 6-step Excel Import workflow:
 * 1. Upload & Drag-and-Drop Excel
 * 2. Parse & Validate
 * 3. Comprehensive Preview Metrics
 * 4. Administrator Choice: "Add New Brands" vs "Update Existing Brands"
 * 5. Confirmation & Safe Batch Processing
 * 6. Results Report with Downloadable Row-Level Audit
 */
export default function BrandImportModal({
  isOpen,
  onClose,
  masterCategories = [],
  existingBrands = [],
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
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isSupported = validExts.some(ext => lowerName.endsWith(ext));

    if (!isSupported) {
      setGeneralError('Please upload an Excel file (.xlsx, .xls) or CSV spreadsheet.');
      return;
    }

    setGeneralError(null);
    setSelectedFile(file);
    setIsValidating(true);
    setImportResults(null);

    try {
      const res = await parseAndValidateBrandExcel(file, masterCategories, existingBrands);
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 tracking-wide">
                Import Brands from Excel
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Batch import or synchronize partner brand master records
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          {/* Action Bar with Download Template */}
          <div className="p-4 rounded-2xl bg-[#FFF8FA] border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-[#C2477A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 text-xs">Use the Standard 8-Column Format</p>
                <p className="text-[11px] text-gray-500">
                  Brand Number, Brand Name, Brand Code, Categories, Logo URL, Visibility, Description, Notes.
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Results Summary State */}
          {importResults ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span>Import Completed Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Processed all valid rows according to your selection. Database and catalog state updated.
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
                  ? 'border-[#C2477A] bg-pink-50/70 scale-[1.01]'
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
              <div className="w-14 h-14 rounded-2xl bg-[#FFF5F8] border border-pink-100 text-[#C2477A] flex items-center justify-center mb-3 shadow-2xs">
                {isValidating ? <Loader2 size={26} className="animate-spin" /> : <Upload size={26} />}
              </div>
              <h4 className="font-extrabold text-sm text-gray-900 mb-1">
                {isValidating ? 'Parsing and Validating File...' : 'Drop your Excel file here or click to browse'}
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
                  <span className="text-[11px] text-gray-400">Pre-import validation completed</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#C2477A] hover:underline font-bold cursor-pointer"
                >
                  Choose another file
                </button>
              </div>

              {/* Validation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <span className="block text-lg font-black text-gray-800">{previewData.totalRows}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Rows</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <span className="block text-lg font-black text-emerald-700">{previewData.validRows}</span>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Valid Rows</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                  <span className="block text-lg font-black text-rose-700">{previewData.invalidRows}</span>
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Invalid Rows</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                  <span className="block text-lg font-black text-amber-700">{previewData.existingBrands}</span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Existing</span>
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="p-3 rounded-2xl bg-[#FFF8FA] border border-pink-100/70 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-600">
                <span>New Brands to Create: <strong className="text-gray-900 font-bold">{previewData.newBrands}</strong></span>
                <span>Duplicate Records: <strong className="text-gray-900 font-bold">{previewData.duplicateRecords}</strong></span>
                <span>Duplicate Codes: <strong className="text-gray-900 font-bold">{previewData.duplicateCodes}</strong></span>
                <span>Category Warnings: <strong className="text-gray-900 font-bold">{previewData.invalidCategories}</strong></span>
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
                        ? 'border-[#C2477A] bg-pink-50/60 ring-2 ring-[#C2477A]/20'
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
                        ? 'border-[#C2477A] bg-pink-50/60 ring-2 ring-[#C2477A]/20'
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
                      Updates matched brands with new categories, logo, or description while preserving permanent Brand Numbers.
                    </p>
                  </div>
                </div>
              </div>

              {previewData.invalidRows > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  <span>{previewData.invalidRows} row(s) contain validation errors and will be skipped.</span>
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
        <div className="p-4 border-t border-pink-100 bg-gray-50/80 flex items-center justify-between">
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
                  <span>Processing {previewData.validRows} Brands...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Confirm & Import ({previewData.validRows} Valid)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
