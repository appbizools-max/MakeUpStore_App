import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Search, Tag, Globe, CheckCircle2, Star, FileText,
  X, Plus, Save, Loader2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Edit3, Link
} from 'lucide-react';
import { generateAllRichData } from '../../utils/productRichDataEngine';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function TagList({ items, onRemove, colour = 'pink', mono = false }) {
  const base = {
    pink:   'bg-pink-50 text-[#C2477A] border-pink-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald:'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }[colour] || 'bg-gray-100 text-gray-600 border-gray-200';

  if (!items || items.length === 0)
    return <p className="text-xs text-gray-400 italic py-1">None yet — regenerate to fill.</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-2xs ${base} ${mono ? 'font-mono' : ''}`}
        >
          {item}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="hover:opacity-60 cursor-pointer -mr-0.5"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function AddTagInput({ placeholder, onAdd, colour = 'pink' }) {
  const [val, setVal] = useState('');
  const ring = { pink: 'focus:border-[#C2477A] focus:ring-[#C2477A]/20', indigo: 'focus:border-indigo-500 focus:ring-indigo-200', emerald: 'focus:border-emerald-500 focus:ring-emerald-200' }[colour] || 'focus:border-[#C2477A]';

  const commit = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    // support comma-separated bulk paste
    trimmed.split(',').map(s => s.trim()).filter(Boolean).forEach(onAdd);
    setVal('');
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
        placeholder={placeholder}
        className={`flex-1 px-3 py-1.5 rounded-xl border border-gray-200 ${ring} focus:ring-2 outline-none text-xs font-medium text-gray-800 bg-white shadow-2xs transition-all`}
      />
      <button
        type="button"
        onClick={commit}
        disabled={!val.trim()}
        className="px-3 py-1.5 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white text-xs font-bold disabled:opacity-40 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
      >
        <Plus size={11} /> Add
      </button>
    </div>
  );
}

// ─── Section accordion ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, colour = 'pink', badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const ringColour = { pink: 'border-pink-100', indigo: 'border-indigo-100', emerald: 'border-emerald-100', amber: 'border-amber-100', purple: 'border-purple-100' }[colour] || 'border-gray-100';
  const iconBg = { pink: 'bg-pink-50 text-[#C2477A]', indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' }[colour] || 'bg-gray-100 text-gray-600';

  return (
    <div className={`rounded-2xl border ${ringColour} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={14} />
          </div>
          <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{title}</span>
          {badge !== undefined && badge !== null && (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-50 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GeneratedDataPanel({ product, onSave, onClose }) {
  // Local editable state — initialised from product
  const [data, setData] = useState(() => ({
    searchKeywords:  Array.isArray(product.searchKeywords)  ? [...product.searchKeywords]  : [],
    searchAliases:   Array.isArray(product.searchAliases)   ? [...product.searchAliases]   : [],
    keyPoints:       Array.isArray(product.keyPoints)       ? [...product.keyPoints]       : [],
    benefits:        Array.isArray(product.benefits)        ? [...product.benefits]        : [],
    highlights:      Array.isArray(product.highlights)      ? [...product.highlights]      : [],
    seoTitle:        product.seoTitle        || product.seo_title        || '',
    metaDescription: product.metaDescription || product.meta_description || '',
    urlSlug:         product.urlSlug         || product.url_slug         || '',
  }));

  const [saving,      setSaving]      = useState(false);
  const [saveOk,      setSaveOk]      = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenOk,     setRegenOk]     = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [saveError,   setSaveError]   = useState(null);

  // Refresh from product prop if it changes (e.g. background gen fired)
  useEffect(() => {
    setData({
      searchKeywords:  Array.isArray(product.searchKeywords)  ? [...product.searchKeywords]  : [],
      searchAliases:   Array.isArray(product.searchAliases)   ? [...product.searchAliases]   : [],
      keyPoints:       Array.isArray(product.keyPoints)       ? [...product.keyPoints]       : [],
      benefits:        Array.isArray(product.benefits)        ? [...product.benefits]        : [],
      highlights:      Array.isArray(product.highlights)      ? [...product.highlights]      : [],
      seoTitle:        product.seoTitle        || product.seo_title        || '',
      metaDescription: product.metaDescription || product.meta_description || '',
      urlSlug:         product.urlSlug         || product.url_slug         || '',
    });
    setDirty(false);
  }, [product.id]);

  const update = (field, value) => {
    setData(d => ({ ...d, [field]: value }));
    setDirty(true);
    setSaveOk(false);
  };

  const removeItem = (field, index) => update(field, data[field].filter((_, i) => i !== index));
  const addItem    = (field, value) => {
    if (!value || data[field].some(x => x.toLowerCase() === value.toLowerCase())) return;
    update(field, [...data[field], value]);
  };

  // ── Regenerate ────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback(() => {
    setRegenerating(true);
    setTimeout(() => {
      try {
        const patch = generateAllRichData(product, { preserveExisting: false });
        setData({
          searchKeywords:  patch.searchKeywords,
          searchAliases:   patch.searchAliases,
          keyPoints:       patch.keyPoints,
          benefits:        patch.benefits,
          highlights:      patch.highlights,
          seoTitle:        patch.seoTitle        || '',
          metaDescription: patch.metaDescription || '',
          urlSlug:         patch.urlSlug         || '',
        });
        setDirty(true);
        setRegenOk(true);
        setTimeout(() => setRegenOk(false), 2500);
      } catch (e) {
        console.warn('Regen failed', e);
      } finally {
        setRegenerating(false);
      }
    }, 0);
  }, [product]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        searchKeywords:  data.searchKeywords,
        searchAliases:   data.searchAliases,
        keyPoints:       data.keyPoints,
        benefits:        data.benefits,
        highlights:      data.highlights,
        seoTitle:        data.seoTitle        || undefined,
        metaDescription: data.metaDescription || undefined,
        urlSlug:         data.urlSlug         || undefined,
      });
      setDirty(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (e) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = (
    data.searchKeywords.length === 0 &&
    data.keyPoints.length === 0 &&
    data.benefits.length === 0 &&
    data.highlights.length === 0
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 to-white border-0 p-4 sm:p-5 space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={17} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 flex-wrap">
              Auto-Generated Discovery Data
              {isEmpty && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Not generated yet
                </span>
              )}
              {!isEmpty && !dirty && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={9} /> Synced
                </span>
              )}
              {dirty && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                  ● Unsaved changes
                </span>
              )}
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              {product.name} · {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Regenerate */}
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {regenerating
              ? <Loader2 size={12} className="animate-spin" />
              : regenOk
              ? <CheckCircle2 size={12} className="text-emerald-600" />
              : <RefreshCw size={12} />}
            {regenOk ? 'Regenerated!' : 'Regenerate'}
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`px-4 py-1.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs disabled:opacity-40 ${
              saveOk ? 'bg-emerald-600' : 'bg-[#C2477A] hover:bg-[#b83760]'
            }`}
          >
            {saving
              ? <Loader2 size={12} className="animate-spin" />
              : saveOk
              ? <CheckCircle2 size={12} />
              : <Save size={12} />}
            {saveOk ? 'Saved!' : 'Save Changes'}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          <AlertCircle size={14} className="shrink-0" /> {saveError}
        </div>
      )}

      {isEmpty && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Sparkles size={16} className="text-amber-500 shrink-0" />
          <div>
            <strong>No discovery data generated yet.</strong> Click <strong>Regenerate</strong> above to
            auto-generate keywords, key points, benefits, highlights and SEO from this product's details.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Search Keywords */}
          <Section title="Search Keywords" icon={Tag} colour="pink" badge={data.searchKeywords.length}>
            <TagList items={data.searchKeywords} onRemove={i => removeItem('searchKeywords', i)} colour="pink" mono />
            <AddTagInput
              placeholder="Add keyword (Enter or comma)"
              onAdd={v => addItem('searchKeywords', v.toLowerCase().trim())}
              colour="pink"
            />
          </Section>

          {/* Search Aliases */}
          <Section title="Search Aliases" icon={Globe} colour="indigo" badge={data.searchAliases.length} defaultOpen={false}>
            <p className="text-[11px] text-gray-500">Alternative customer phrases &amp; common spellings.</p>
            <TagList items={data.searchAliases} onRemove={i => removeItem('searchAliases', i)} colour="indigo" mono />
            <AddTagInput
              placeholder="Add alias phrase"
              onAdd={v => addItem('searchAliases', v.toLowerCase().trim())}
              colour="indigo"
            />
          </Section>

          {/* SEO */}
          <Section title="SEO Fields" icon={Link} colour="purple" defaultOpen={false}>
            <div className="space-y-2">
              <div>
                <label className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1 block">SEO Title</label>
                <input
                  type="text"
                  value={data.seoTitle}
                  onChange={e => update('seoTitle', e.target.value)}
                  placeholder="Auto-generated SEO title…"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-xs font-medium bg-white shadow-2xs transition-all"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1 block">Meta Description</label>
                <textarea
                  rows={2}
                  value={data.metaDescription}
                  onChange={e => update('metaDescription', e.target.value)}
                  placeholder="Auto-generated meta description…"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-xs font-medium bg-white shadow-2xs transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-gray-600 uppercase tracking-wider mb-1 block">URL Slug</label>
                <input
                  type="text"
                  value={data.urlSlug}
                  onChange={e => update('urlSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                  placeholder="url-slug-here"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-xs font-mono bg-white shadow-2xs transition-all"
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Key Points */}
          <Section title="Key Points" icon={CheckCircle2} colour="emerald" badge={data.keyPoints.length}>
            <p className="text-[11px] text-gray-400">Shown as bullet points on product detail page. Max 6.</p>
            <div className="space-y-1">
              {data.keyPoints.length === 0
                ? <p className="text-xs text-gray-400 italic py-1">None yet.</p>
                : data.keyPoints.map((kp, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 group">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span className="flex-1 text-xs font-semibold text-gray-800">{kp}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('keyPoints', i)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 cursor-pointer transition-opacity"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
            </div>
            {data.keyPoints.length < 6 && (
              <AddTagInput placeholder="Add key point" onAdd={v => addItem('keyPoints', v)} colour="emerald" />
            )}
          </Section>

          {/* Benefits */}
          <Section title="Benefits" icon={Star} colour="amber" badge={data.benefits.length}>
            <TagList items={data.benefits} onRemove={i => removeItem('benefits', i)} colour="amber" />
            <AddTagInput placeholder="Add benefit" onAdd={v => addItem('benefits', v)} colour="pink" />
          </Section>

          {/* Highlights */}
          <Section title="Product Highlights" icon={Sparkles} colour="pink" badge={data.highlights.length} defaultOpen>
            <div className="space-y-1.5">
              {data.highlights.length === 0
                ? <p className="text-xs text-gray-400 italic py-1">None yet.</p>
                : data.highlights.map((hl, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-pink-50 border border-pink-200 group">
                      <span className="text-[#C2477A] font-extrabold mt-0.5 shrink-0">•</span>
                      <span className="flex-1 text-xs text-gray-700 leading-relaxed">{hl}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('highlights', i)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 cursor-pointer transition-opacity shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
            </div>
            <AddTagInput placeholder="Add highlight sentence" onAdd={v => addItem('highlights', v)} colour="pink" />
          </Section>
        </div>
      </div>

      {/* Bottom save bar */}
      {dirty && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs ${
              saveOk ? 'bg-emerald-600' : 'bg-[#C2477A] hover:bg-[#b83760]'
            }`}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saveOk ? 'Saved!' : 'Save All Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
