import React, { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { matchBeautyShade } from '../services/aiColorService';

export const RowAttributeModal = ({
  isOpen,
  onClose,
  row,
  onSaveAttributes
}) => {
  if (!isOpen || !row) return null;

  const categoryLower = (row.category || '').toLowerCase();
  const subcategoryLower = (row.subcategory || '').toLowerCase();
  const productTypeLower = (row.productType || '').toLowerCase();

  const isColorCosmetic =
    categoryLower.includes('makeup') ||
    categoryLower.includes('nail') ||
    subcategoryLower.includes('lip') ||
    subcategoryLower.includes('lipstick') ||
    subcategoryLower.includes('foundation') ||
    subcategoryLower.includes('eye') ||
    subcategoryLower.includes('nail') ||
    productTypeLower.includes('lipstick') ||
    productTypeLower.includes('polish');

  const isFoundation =
    subcategoryLower.includes('foundation') ||
    productTypeLower.includes('foundation') ||
    categoryLower.includes('face');

  const isHairCare =
    categoryLower.includes('hair') ||
    subcategoryLower.includes('shampoo') ||
    subcategoryLower.includes('conditioner');

  const isSkincare =
    categoryLower.includes('skin') ||
    subcategoryLower.includes('serum') ||
    subcategoryLower.includes('cream');

  const [formData, setFormData] = useState({
    shade: row.shade || '',
    colorName: row.colorName || '',
    hexColor: row.hexColor || '',
    colorFamily: row.colorFamily || '',
    undertone: row.attributes?.Undertone || '',
    coverage: row.attributes?.Coverage || '',
    finish: row.attributes?.Finish || '',
    volume: row.attributes?.Volume || '',
    weight: row.attributes?.Weight || '',
    skinType: row.attributes?.['Skin Type'] || '',
    hairType: row.attributes?.['Hair Type'] || '',
    packSize: row.attributes?.['Pack Size'] || '',
    customAttributes: Object.entries(row.attributes || {})
      .filter(([k]) => ![
        'Shade', 'Color', 'Colour', 'Undertone', 'Coverage', 'Finish',
        'Volume', 'Weight', 'Skin Type', 'Hair Type', 'Pack Size'
      ].includes(k))
      .map(([k, v]) => ({ key: k, value: v }))
  });

  const handleHexChange = (hex) => {
    setFormData(prev => {
      const next = { ...prev, hexColor: hex };
      if (/^#?[0-9A-Fa-f]{6}$/.test(hex.trim())) {
        const detected = matchBeautyShade(hex.trim());
        if (!next.colorName) next.colorName = detected.name;
        if (!next.colorFamily) next.colorFamily = detected.family;
      }
      return next;
    });
  };

  const handleAddCustomAttr = () => {
    setFormData(prev => ({
      ...prev,
      customAttributes: [...prev.customAttributes, { key: '', value: '' }]
    }));
  };

  const handleRemoveCustomAttr = (idx) => {
    setFormData(prev => ({
      ...prev,
      customAttributes: prev.customAttributes.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = () => {
    const finalAttributes = {
      ...(formData.undertone ? { Undertone: formData.undertone } : {}),
      ...(formData.coverage ? { Coverage: formData.coverage } : {}),
      ...(formData.finish ? { Finish: formData.finish } : {}),
      ...(formData.volume ? { Volume: formData.volume } : {}),
      ...(formData.weight ? { Weight: formData.weight } : {}),
      ...(formData.skinType ? { 'Skin Type': formData.skinType } : {}),
      ...(formData.hairType ? { 'Hair Type': formData.hairType } : {}),
      ...(formData.packSize ? { 'Pack Size': formData.packSize } : {})
    };

    formData.customAttributes.forEach(ca => {
      if (ca.key.trim() && ca.value.trim()) {
        finalAttributes[ca.key.trim()] = ca.value.trim();
      }
    });

    onSaveAttributes({
      shade: formData.shade,
      colorName: formData.colorName,
      hexColor: formData.hexColor,
      colorFamily: formData.colorFamily,
      attributes: finalAttributes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Product Attributes &amp; Variants</h3>
              <p className="text-[11px] text-slate-400">
                Category: <strong className="text-purple-300 font-semibold">{row.category || 'General'}</strong>
                {row.subcategory ? ` • ${row.subcategory}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Fields */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Color & Shade Section (Shown for color cosmetics) */}
          {isColorCosmetic ? (
            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Cosmetic Shade &amp; Palette Tone</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shade Title / Variant</label>
                  <input
                    type="text"
                    value={formData.shade}
                    onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
                    placeholder="e.g. Lover, Pioneer, Ivory 115"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Color Name</label>
                  <input
                    type="text"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    placeholder="e.g. Dusty Rose"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HEX Swatch</label>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg border border-slate-300 flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: formData.hexColor || '#FFFFFF' }}
                    />
                    <input
                      type="text"
                      value={formData.hexColor}
                      onChange={(e) => handleHexChange(e.target.value)}
                      placeholder="#C9828F"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Color Family</label>
                  <select
                    value={formData.colorFamily}
                    onChange={(e) => setFormData({ ...formData, colorFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="">-- Select Family --</option>
                    <option value="Red">Red</option>
                    <option value="Pink">Pink</option>
                    <option value="Nude">Nude</option>
                    <option value="Coral">Coral</option>
                    <option value="Berry">Berry / Plum</option>
                    <option value="Brown">Brown / Mocha</option>
                    <option value="Foundation">Foundation / Nude</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
              Shade and color swatch fields are hidden because this product category does not require cosmetic color variants.
            </div>
          )}

          {/* Complexion fields if Foundation */}
          {isFoundation && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-200/60">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Undertone</label>
                <select
                  value={formData.undertone}
                  onChange={(e) => setFormData({ ...formData, undertone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="">Select Undertone</option>
                  <option value="Warm">Warm (Yellow/Golden)</option>
                  <option value="Cool">Cool (Pink/Rosy)</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Olive">Olive</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coverage</label>
                <select
                  value={formData.coverage}
                  onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="">Select Coverage</option>
                  <option value="Sheer">Sheer</option>
                  <option value="Medium">Medium</option>
                  <option value="Full">Full Coverage</option>
                  <option value="Buildable">Buildable</option>
                </select>
              </div>
            </div>
          )}

          {/* Volume & Weight Sizing (Always Available) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Volume / Sizing</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                placeholder="e.g. 5ml, 30ml, 100ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Net Weight / Pack</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g. 50g, Pack of 2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* Custom Attributes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Custom Attributes</span>
              <button
                type="button"
                onClick={handleAddCustomAttr}
                className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Attribute
              </button>
            </div>

            {formData.customAttributes.map((ca, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Attribute (e.g. Finish)"
                  value={ca.key}
                  onChange={(e) => {
                    const next = [...formData.customAttributes];
                    next[idx].key = e.target.value;
                    setFormData({ ...formData, customAttributes: next });
                  }}
                  className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Matte)"
                  value={ca.value}
                  onChange={(e) => {
                    const next = [...formData.customAttributes];
                    next[idx].value = e.target.value;
                    setFormData({ ...formData, customAttributes: next });
                  }}
                  className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomAttr(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm"
          >
            Apply Attributes
          </button>
        </div>
      </div>
    </div>
  );
};
