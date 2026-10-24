import React from 'react';
import { Columns, Check, X, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';

export const ColumnManagerModal = ({
  isOpen,
  onClose,
  columns = [],
  onToggleColumn,
  onResetColumns
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-300">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Table Column Manager</h3>
              <p className="text-xs text-slate-400">Customize visible columns in Bulk Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-1.5 divide-y divide-slate-100">
          {columns.map((col) => {
            const isMandatory = col.mandatory;
            return (
              <div
                key={col.key}
                className="pt-1.5 first:pt-0 flex items-center justify-between py-2 px-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer select-none"
                onClick={() => {
                  if (!isMandatory) onToggleColumn(col.key);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    col.visible ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {col.visible && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{col.label}</span>
                    {isMandatory && (
                      <span className="ml-2 text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-400">
                  {col.visible ? (
                    <Eye className="w-4 h-4 text-purple-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            onClick={onResetColumns}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
