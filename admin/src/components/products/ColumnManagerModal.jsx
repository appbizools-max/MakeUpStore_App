import React, { useMemo } from 'react';
import { Columns, Check, X, Eye, EyeOff, RotateCcw, Sparkles, FileSpreadsheet, CheckCheck } from 'lucide-react';

const GROUP_STYLES = {
  'Product Master': {
    badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    headerBg: 'bg-indigo-50/70 border-indigo-100 text-indigo-950',
    accent: 'text-indigo-600',
    title: 'Group 1: Product Master Identification (Cols 1-10)'
  },
  'Variant Details': {
    badgeBg: 'bg-pink-100 text-pink-700 border-pink-200',
    headerBg: 'bg-pink-50/70 border-pink-100 text-pink-950',
    accent: 'text-pink-600',
    title: 'Group 2: Variant Details & Swatches (Cols 11-16)'
  },
  'Role Pricing': {
    badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
    headerBg: 'bg-purple-50/70 border-purple-100 text-purple-950',
    accent: 'text-purple-600',
    title: 'Group 3: Four-Tier Role-Based Pricing (Cols 17-21)'
  },
  'Attributes': {
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    headerBg: 'bg-emerald-50/70 border-emerald-100 text-emerald-950',
    accent: 'text-emerald-600',
    title: 'Group 4: Cosmetic & Category Attributes (Cols 22-24)'
  },
  'Publication': {
    badgeBg: 'bg-slate-200 text-slate-700 border-slate-300',
    headerBg: 'bg-slate-100 border-slate-200 text-slate-900',
    accent: 'text-slate-600',
    title: 'Group 5: Publication, Media & Status (Cols 25-27)'
  },
  'Controls': {
    badgeBg: 'bg-slate-200 text-slate-700 border-slate-300',
    headerBg: 'bg-slate-50 border-slate-200 text-slate-800',
    accent: 'text-slate-600',
    title: 'Table Row Controls'
  }
};

export const ColumnManagerModal = ({
  isOpen,
  onClose,
  columns = [],
  onToggleColumn,
  onResetColumns
}) => {
  if (!isOpen) return null;

  // Group columns by their logical canonical template groups
  const groupedColumns = useMemo(() => {
    const groups = {};
    const groupOrder = ['Product Master', 'Variant Details', 'Role Pricing', 'Attributes', 'Publication', 'Controls'];

    groupOrder.forEach(g => {
      groups[g] = [];
    });

    columns.forEach(col => {
      const g = col.group || 'Controls';
      if (!groups[g]) groups[g] = [];
      groups[g].push(col);
    });

    return groups;
  }, [columns]);

  const totalVisible = columns.filter(c => c.visible).length;
  const canonicalVisible = columns.filter(c => c.canonicalCol !== null && c.visible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-purple-300 shadow-inner">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Table Column Manager</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> 1:1 Excel Aligned
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {totalVisible} of {columns.length} columns active • {canonicalVisible}/27 canonical columns visible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Info Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-2.5 flex items-center justify-between text-xs text-indigo-950 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              Columns are structured in the identical order as the <strong className="text-indigo-900">3-Sheet Excel Import Template</strong>.
            </span>
          </div>
        </div>

        {/* Scrollable Column Groups List */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          {Object.entries(groupedColumns).map(([groupName, groupCols]) => {
            if (!groupCols || groupCols.length === 0) return null;
            const style = GROUP_STYLES[groupName] || GROUP_STYLES['Controls'];
            const visibleInGroup = groupCols.filter(c => c.visible).length;

            return (
              <div key={groupName} className="pt-4 first:pt-0 space-y-2">
                {/* Group Section Header */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-between ${style.headerBg}`}>
                  <span className="text-xs font-black tracking-wide uppercase">
                    {style.title}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    {visibleInGroup}/{groupCols.length} active
                  </span>
                </div>

                {/* Column Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {groupCols.map((col) => {
                    const isMandatory = col.mandatory;
                    return (
                      <div
                        key={col.key}
                        onClick={() => {
                          if (!isMandatory) onToggleColumn(col.key);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all select-none ${
                          col.visible
                            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-100 opacity-60 hover:opacity-100'
                        } ${isMandatory ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              col.visible
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {col.visible && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {col.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isMandatory && (
                            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Mandatory
                            </span>
                          )}
                          <div className="text-slate-400">
                            {col.visible ? (
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onResetColumns}
            className="px-3.5 py-2 text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            title="Restore default 1:1 view with all canonical template columns enabled"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to 1:1 Template Default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Apply & View Table
          </button>
        </div>
      </div>
    </div>
  );
};
