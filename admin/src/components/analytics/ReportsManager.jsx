import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Search,
  FileText,
  Filter,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  REPORT_TYPES,
  DATE_PRESETS,
  resolveDateRange,
  generateReportData,
  toISTDateString
} from '../../services/analyticsEngine';
import { fetchExpenses } from '../../services/expenseService';

export default function ReportsManager({
  orders = [],
  products = [],
  users = []
}) {
  const [selectedReportId, setSelectedReportId] = useState('detailed_sales');
  const [datePreset, setDatePreset] = useState('this_month');
  const [customStart, setCustomStart] = useState(() => {
    try {
      const d = new Date();
      d.setDate(1);
      return toISTDateString(d);
    } catch (e) {
      return '2026-11-01';
    }
  });
  const [customEnd, setCustomEnd] = useState(() => {
    try {
      return toISTDateString(new Date());
    } catch (e) {
      return '2026-11-19';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (e) { }
    finally {
      setIsLoading(false);
    }
  };

  const selectedReportDef = useMemo(() => {
    return REPORT_TYPES.find(r => r.id === selectedReportId) || REPORT_TYPES[0];
  }, [selectedReportId]);

  // Compute Report Data
  const reportData = useMemo(() => {
    const dateRange = resolveDateRange(datePreset, customStart, customEnd);
    return generateReportData(selectedReportId, {
      orders,
      products,
      expenses,
      users,
      dateRange
    });
  }, [selectedReportId, orders, products, expenses, users, datePreset, customStart, customEnd]);

  // Filter rows by search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return reportData.rows;
    const q = searchQuery.toLowerCase();
    return reportData.rows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(q)
      );
    });
  }, [reportData.rows, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when report or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReportId, searchQuery, datePreset]);

  // EXCEL EXPORT (.xlsx)
  const handleExportExcel = () => {
    if (!reportData.rows.length) {
      alert('No data available to export in the selected range.');
      return;
    }

    const worksheetData = reportData.rows.map(row => {
      const formatted = {};
      reportData.columns.forEach(col => {
        formatted[col.label] = row[col.key];
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    const sheetName = selectedReportDef.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const filename = `Salbeau_${selectedReportId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // CSV EXPORT (.csv)
  const handleExportCsv = () => {
    if (!reportData.rows.length) {
      alert('No data available to export in the selected range.');
      return;
    }

    const headers = reportData.columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = reportData.rows.map(row => {
      return reportData.columns.map(c => {
        const val = row[c.key] !== undefined ? String(row[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Salbeau_${selectedReportId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PRINT FRIENDLY VIEW
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-gray-900 pb-12">
      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D81B60] uppercase tracking-wider mb-1">
            <FileSpreadsheet size={15} />
            <span>Comprehensive Business Auditing & Reports</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Reports & Financial Exports
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            16 Dedicated business intelligence reports with instant Excel (.xlsx), CSV, and Print/PDF export.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export to Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-white border border-pink-200 text-gray-800 hover:bg-pink-50 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-white border border-pink-200 text-gray-800 hover:bg-pink-50 text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── 16 REPORTS SELECTOR & DATE CONTROLS ───────────────────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Report Dropdown */}
          <div className="flex-1">
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              Select Business Report (1 of 16)
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full p-3 rounded-2xl border border-pink-200 bg-pink-50/40 text-xs font-black text-gray-900 outline-none focus:border-[#D81B60] cursor-pointer"
            >
              {REPORT_TYPES.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.category}] {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Presets */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
              Date Filter Window (IST)
            </label>
            <div className="flex items-center gap-2">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="px-3.5 py-3 rounded-2xl border border-pink-200 bg-white text-xs font-bold text-gray-800 outline-none cursor-pointer"
              >
                {DATE_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-pink-100 text-xs font-semibold">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="outline-none text-xs"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="outline-none text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search within Report */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search across ${reportData.rows.length} rows in this report...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-100 focus:border-[#D81B60] text-xs font-medium outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* ── REPORT TABLE CONTAINER ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
        {/* Report Header for Print & Web */}
        <div className="p-6 border-b border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-pink-50/20">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#D81B60] uppercase block">
              Salbeau Beauty Ltd • Official Financial Document
            </span>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">
              {selectedReportDef.name}
            </h3>
          </div>
          <div className="text-right text-[11px] font-bold text-gray-500">
            <div>Report Records: {filteredRows.length} entries</div>
            <div>Generated: {(() => { try { return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }); } catch (e) { return new Date().toLocaleString(); } })()} (IST)</div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-pink-50/60 border-b border-pink-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                {reportData.columns.map(col => (
                  <th
                    key={col.key}
                    className={`py-3.5 px-4 ${col.format === 'currency' ? 'text-right' : 'text-left'}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50/80">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.columns.length} className="py-12 text-center text-gray-400 font-medium">
                    No records found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-pink-50/30 transition-colors">
                    {reportData.columns.map(col => {
                      const val = row[col.key];
                      const isCurrency = col.format === 'currency';
                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 font-semibold text-gray-800 ${isCurrency ? 'text-right font-black text-gray-900' : ''}`}
                        >
                          {isCurrency && typeof val === 'number'
                            ? `₹${val.toLocaleString('en-IN')}`
                            : val !== undefined && val !== null ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-pink-100 flex items-center justify-between text-xs font-bold text-gray-600 print:hidden">
          <span>
            Page {currentPage} of {totalPages} ({filteredRows.length} total rows)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-pink-100 hover:bg-pink-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-pink-100 hover:bg-pink-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
