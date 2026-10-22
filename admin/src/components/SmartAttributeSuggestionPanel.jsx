import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import {
  getProductAttributeSuggestions,
  DEFAULT_ATTRIBUTES,
} from '../utils/attributeMasterData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a free-text string for fuzzy matching */
const norm = (s) => (s || '').toLowerCase().trim();

/** Debounce hook — fires after `delay` ms of silence */
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// CATEGORY → EMOJI MAP  (visual cue on the banner)
// ---------------------------------------------------------------------------
const CATEGORY_EMOJI = {
  lipstick: '💄', lip: '💄',
  eye: '👁️', eyeshadow: '👁️', eyeliner: '👁️', mascara: '👁️', kajal: '👁️',
  face: '✨', foundation: '✨', concealer: '✨', compact: '✨', blush: '✨',
  skincare: '🧴', 'skin care': '🧴', serum: '🧴', cream: '🧴', sunscreen: '🌞',
  hair: '💆', shampoo: '💆', conditioner: '💆', 'hair oil': '💆', 'hair care': '💆',
  nail: '💅', 'nail polish': '💅',
  fragrance: '🌸', perfume: '🌸', deo: '🌸', deodorant: '🌸',
  tools: '🖌️', brush: '🖌️', sponge: '🖌️',
};

function getCategoryEmoji(category, subcategory, productName) {
  const texts = [norm(category), norm(subcategory), norm(productName)];
  for (const text of texts) {
    for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
      if (text.includes(key)) return emoji;
    }
  }
  return '🎨';
}

// ---------------------------------------------------------------------------
// Attribute chip colours by group
// ---------------------------------------------------------------------------
const GROUP_STYLE = {
  Appearance:     'bg-pink-50 text-pink-700 border-pink-200',
  'Size & Quantity': 'bg-blue-50 text-blue-700 border-blue-200',
  Formulation:    'bg-purple-50 text-purple-700 border-purple-200',
  Skin:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  Hair:           'bg-amber-50 text-amber-700 border-amber-200',
  Fragrance:      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Other:          'bg-gray-100 text-gray-600 border-gray-200',
};

function chipStyle(group) {
  return GROUP_STYLE[group] || GROUP_STYLE.Other;
}

function getAttrGroup(attrName) {
  const found = DEFAULT_ATTRIBUTES.find(
    (a) => norm(a.name) === norm(attrName),
  );
  return found?.group || 'Other';
}

// ---------------------------------------------------------------------------
// SmartAttributeSuggestionPanel
// ---------------------------------------------------------------------------
/**
 * Props:
 *   productName        {string}
 *   category           {string}
 *   subcategory        {string}
 *   description        {string}
 *   selectedAttributes {string[]}        — attribute name strings already chosen
 *   onChangeAttributes {(string[]) => void}
 *   collapsed          {boolean}
 *   onToggleCollapse   {() => void}
 */
export default function SmartAttributeSuggestionPanel({
  productName = '',
  category = '',
  subcategory = '',
  description = '',
  selectedAttributes = [],
  onChangeAttributes,
  collapsed = false,
  onToggleCollapse,
}) {
  // ── Debounce inputs so we don't re-analyse on every keystroke ─────────────
  const dProductName  = useDebounce(productName,  400);
  const dCategory     = useDebounce(category,     400);
  const dSubcategory  = useDebounce(subcategory,  400);
  const dDescription  = useDebounce(description,  600);

  // ── Custom attribute adder state ───────────────────────────────────────────
  const [customInput, setCustomInput]   = useState('');
  const [showCustom,  setShowCustom]    = useState(false);
  const customRef = useRef(null);

  // ── Analysed suggestion result ────────────────────────────────────────────
  const suggestion = useMemo(() => {
    // Derive extra keywords from description text
    const descWords = dDescription
      .toLowerCase()
      .split(/[\s,./;:()\[\]]+/)
      .filter((w) => w.length > 3);

    // Enrich productType guess from description keywords
    const descDerivedType = descWords.find((w) =>
      ['serum', 'lipstick', 'lipgloss', 'mascara', 'shampoo', 'conditioner',
        'oil', 'cream', 'powder', 'foundation', 'concealer', 'blush',
        'eyeliner', 'kajal', 'eyeshadow', 'perfume', 'deodorant',
        'nail', 'polish', 'primer', 'highlighter', 'bronzer',
        'toner', 'moisturiser', 'moisturizer', 'sunscreen', 'lotion',
        'cleanser', 'scrub', 'mask'].includes(w),
    );

    return getProductAttributeSuggestions({
      category:    dCategory,
      subcategory: dSubcategory,
      productType: descDerivedType || dSubcategory,
      productName: dProductName,
    });
  }, [dProductName, dCategory, dSubcategory, dDescription]);

  // ── Whether we have enough info to show suggestions ───────────────────────
  const hasEnoughContext = Boolean(dProductName || dCategory || dSubcategory);

  // ── All attributes from master that are not already selected ──────────────
  const allAttributeNames = useMemo(
    () => Array.from(new Set(DEFAULT_ATTRIBUTES.map((a) => a.name))),
    [],
  );

  const selectedSet = useMemo(
    () => new Set(selectedAttributes.map(norm)),
    [selectedAttributes],
  );

  // suggested = from analysis, not yet selected
  const suggestedNotSelected = useMemo(
    () => (suggestion.suggested || []).filter((n) => !selectedSet.has(norm(n))),
    [suggestion.suggested, selectedSet],
  );

  // also recommended = not suggested and not selected (secondary pool)
  const otherAvailable = useMemo(
    () =>
      allAttributeNames.filter(
        (n) =>
          !selectedSet.has(norm(n)) &&
          !(suggestion.suggested || []).some((s) => norm(s) === norm(n)),
      ),
    [allAttributeNames, selectedSet, suggestion.suggested],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const addAttr = (name) => {
    if (!selectedSet.has(norm(name))) {
      onChangeAttributes([...selectedAttributes, name]);
    }
  };

  const removeAttr = (name) => {
    onChangeAttributes(selectedAttributes.filter((a) => norm(a) !== norm(name)));
  };

  const addAllSuggested = () => {
    const toAdd = suggestedNotSelected.filter((n) => !selectedSet.has(norm(n)));
    if (toAdd.length > 0) {
      onChangeAttributes([...selectedAttributes, ...toAdd]);
    }
  };

  const clearAll = () => onChangeAttributes([]);

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selectedSet.has(norm(trimmed))) {
      onChangeAttributes([...selectedAttributes, trimmed]);
    }
    setCustomInput('');
    setShowCustom(false);
  };

  // ── Focus custom input on show ────────────────────────────────────────────
  useEffect(() => {
    if (showCustom && customRef.current) {
      setTimeout(() => customRef.current?.focus(), 50);
    }
  }, [showCustom]);

  // ── Nothing to show yet ───────────────────────────────────────────────────
  if (!hasEnoughContext) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-400 font-medium">
        <Lightbulb size={15} className="text-gray-300 shrink-0" />
        <span>
          Start typing a <strong>Product Name</strong> or select a{' '}
          <strong>Category</strong> to get intelligent variant attribute
          suggestions.
        </span>
      </div>
    );
  }

  const emoji = getCategoryEmoji(dCategory, dSubcategory, dProductName);

  return (
    <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-[#FFF5F8] to-[#FFF8FA] shadow-xs overflow-hidden">
      {/* ── Banner Header ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-pink-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CE4270] to-[#E25586] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles size={15} />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-black text-gray-900 flex items-center gap-1.5 flex-wrap">
              <span>{emoji} Smart Attribute Suggestions</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#CE4270] text-white">
                {suggestion.label}
              </span>
              {selectedAttributes.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {selectedAttributes.length} selected
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-gray-500 font-medium mt-0.5">
              Analysed&nbsp;
              {[dProductName && `"${dProductName}"`, dCategory, dSubcategory]
                .filter(Boolean)
                .join(' · ')}
              &nbsp;— Click to{' '}
              {collapsed ? 'expand' : 'collapse'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {collapsed ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* ── Expanded Body ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-4 border-t border-pink-100">

          {/* ── Currently Selected ────────────────────────────────────────── */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Selected Variant Attributes
                <span className="font-bold text-gray-400">
                  ({selectedAttributes.length})
                </span>
              </span>
              {selectedAttributes.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X size={11} /> Clear All
                </button>
              )}
            </div>

            {selectedAttributes.length === 0 ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 italic px-1">
                <AlertCircle size={12} className="shrink-0" />
                No attributes selected. Add from suggestions below or create a
                custom one.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedAttributes.map((name) => {
                  const group = getAttrGroup(name);
                  return (
                    <div
                      key={name}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs ${chipStyle(group)}`}
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttr(name)}
                        className="hover:opacity-70 cursor-pointer -mr-0.5"
                        title={`Remove "${name}"`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Suggested by Analysis ─────────────────────────────────────── */}
          {suggestedNotSelected.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 size={13} className="text-[#CE4270]" />
                  Suggested for {suggestion.label}
                </span>
                <button
                  type="button"
                  onClick={addAllSuggested}
                  className="text-[10px] font-black text-[#CE4270] hover:text-[#b83760] flex items-center gap-1 cursor-pointer transition-colors bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-lg border border-pink-200"
                >
                  <Plus size={11} /> Add All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedNotSelected.map((name) => {
                  const group = getAttrGroup(name);
                  const isDefault =
                    suggestion.defaultAutoSelect?.some(
                      (d) => norm(d) === norm(name),
                    ) ?? false;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addAttr(name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs cursor-pointer hover:opacity-80 transition-all active:scale-95 ${chipStyle(group)}`}
                    >
                      <Plus size={10} />
                      <span>{name}</span>
                      {isDefault && (
                        <span className="text-[8.5px] font-black bg-white/70 px-1 py-0.5 rounded-md ml-0.5 border border-current opacity-70">
                          ★ TOP
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── More Available (collapsible secondary pool) ───────────────── */}
          <MoreAttributesAccordion
            attributes={otherAvailable}
            onAdd={addAttr}
          />

          {/* ── Custom Attribute ──────────────────────────────────────────── */}
          <div className="pt-3 border-t border-pink-100">
            {!showCustom ? (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="text-[11px] font-bold text-[#CE4270] hover:text-[#b83760] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                Add Custom Attribute
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  ref={customRef}
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); }
                    if (e.key === 'Escape') { setShowCustom(false); setCustomInput(''); }
                  }}
                  placeholder="e.g. Grit Level, Bristle Type..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-pink-200 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none text-xs font-semibold text-gray-800 bg-white shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#CE4270] hover:bg-[#b83760] text-white text-xs font-bold disabled:opacity-40 cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1"
                >
                  <Plus size={12} /> Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustom(false); setCustomInput(''); }}
                  className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secondary attributes accordion (keeps the panel from being overwhelming)
// ---------------------------------------------------------------------------
function MoreAttributesAccordion({ attributes, onAdd }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return attributes;
    const q = norm(search);
    return attributes.filter((n) => norm(n).includes(q));
  }, [attributes, search]);

  if (attributes.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <RefreshCw size={12} className="text-gray-400" />
          More Available Attributes
          <span className="text-[10px] text-gray-400 font-medium">
            ({attributes.length})
          </span>
        </span>
        {open ? (
          <ChevronUp size={13} className="text-gray-400" />
        ) : (
          <ChevronDown size={13} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-3.5 pb-3 border-t border-gray-100 bg-white space-y-3 animate-fade-in">
          {/* Search within more */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter attributes..."
            className="w-full mt-2.5 px-3 py-1.5 rounded-xl border border-gray-200 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 outline-none text-xs font-medium bg-gray-50 shadow-2xs"
          />
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {filtered.map((name) => {
              const group = getAttrGroup(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onAdd(name)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-2xs cursor-pointer hover:opacity-80 transition-all active:scale-95 ${chipStyle(group)}`}
                >
                  <Plus size={10} />
                  {name}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <span className="text-xs text-gray-400 italic py-1">
                No attributes match "{search}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
