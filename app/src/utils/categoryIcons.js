/**
 * categoryIcons.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for category → FontAwesome 5 icon mapping.
 * Used by both HomeScreen (small 30px strip tiles) and CategoryScreen (grid cards).
 *
 * Icon library: FontAwesome5 from @expo/vector-icons
 * All icon names verified against the FA5 Free glyph map bundled with Expo SDK 51.
 *
 * Usage:
 *   import { FontAwesome5 } from '@expo/vector-icons';
 *   import { getCategoryFA5Icon, SUBCATEGORY_FA5_ICONS } from '../../utils/categoryIcons';
 *
 *   const { icon, color, bg } = getCategoryFA5Icon('Skincare');
 *   <FontAwesome5 name={icon} size={28} color={color} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CATEGORY MAP
// key  : lowercase trimmed category name (exact + common aliases)
// icon : FontAwesome5 Free icon name (confirmed in FA5Free glyph map)
// color: accent foreground colour matching app palette
// bg   : light background tint for the icon container
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_FA5_MAP = {
  // ── Skincare ──────────────────────────────────────────────────────────────
  'skincare':               { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'skin care':              { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'skin':                   { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'face care':              { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'facial':                 { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },

  // ── Makeup / Colour Cosmetics ─────────────────────────────────────────────
  'makeup':                 { icon: 'paint-brush',   color: '#C2477A', bg: '#FFF0F5' },
  'colour cosmetics':       { icon: 'paint-brush',   color: '#C2477A', bg: '#FFF0F5' },
  'color cosmetics':        { icon: 'paint-brush',   color: '#C2477A', bg: '#FFF0F5' },
  'cosmetics':              { icon: 'paint-brush',   color: '#C2477A', bg: '#FFF0F5' },
  'face makeup':            { icon: 'paint-brush',   color: '#C2477A', bg: '#FFF0F5' },

  // ── Hair Care ─────────────────────────────────────────────────────────────
  'hair care':              { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },
  'haircare':               { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },
  'hair':                   { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },

  // ── Hair Styling / Styling Tools ─────────────────────────────────────────
  'hair styling':           { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'hair styling tools':     { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'hair styling & tools':   { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'styling':                { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'styling tools':          { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },

  // ── Bath & Body ───────────────────────────────────────────────────────────
  'bath & body':            { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'bath and body':          { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'bath body':              { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'bath':                   { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'body care':              { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'body':                   { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },
  'bodycare':               { icon: 'bath',          color: '#1A7A88', bg: '#E6F5F7' },

  // ── Fragrance / Perfume ───────────────────────────────────────────────────
  'fragrance':              { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'fragrances':             { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'perfume':                { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'deodorant':              { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'cologne':                { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },

  // ── Nail Care ─────────────────────────────────────────────────────────────
  'nail care':              { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nails':                  { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail':                   { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail color':             { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail polish':            { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },

  // ── Men's Grooming ────────────────────────────────────────────────────────
  "men's grooming":         { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'mens grooming':          { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  "men grooming":           { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'grooming':               { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'shaving':                { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },

  // ── Beauty Tools / Brushes / Accessories ─────────────────────────────────
  'beauty tools':           { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'tools':                  { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'brushes':                { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'accessories':            { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'beauty accessories':     { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'brush':                  { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },

  // ── Personal Care / Hygiene ───────────────────────────────────────────────
  'personal care':          { icon: 'pump-soap',     color: '#2E7D55', bg: '#E8F5EE' },
  'hygiene':                { icon: 'pump-soap',     color: '#2E7D55', bg: '#E8F5EE' },
  'oral care':              { icon: 'pump-soap',     color: '#2E7D55', bg: '#E8F5EE' },
  'hand care':              { icon: 'pump-soap',     color: '#2E7D55', bg: '#E8F5EE' },

  // ── Wellness / Health ─────────────────────────────────────────────────────
  'wellness':               { icon: 'heartbeat',     color: '#C0392B', bg: '#FDECEA' },
  'health':                 { icon: 'heartbeat',     color: '#C0392B', bg: '#FDECEA' },
  'health & wellness':      { icon: 'heartbeat',     color: '#C0392B', bg: '#FDECEA' },
  'supplements':            { icon: 'heartbeat',     color: '#C0392B', bg: '#FDECEA' },

  // ── Gift Sets / Kits ─────────────────────────────────────────────────────
  'gift sets':              { icon: 'gift',          color: '#C2477A', bg: '#FFF0F5' },
  'gift set':               { icon: 'gift',          color: '#C2477A', bg: '#FFF0F5' },
  'gifts':                  { icon: 'gift',          color: '#C2477A', bg: '#FFF0F5' },
  'beauty kits':            { icon: 'gift',          color: '#C2477A', bg: '#FFF0F5' },
  'kits':                   { icon: 'gift',          color: '#C2477A', bg: '#FFF0F5' },

  // ── Eyes / Eye Makeup ─────────────────────────────────────────────────────
  'eyes':                   { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eye':                    { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eye makeup':             { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eye care':               { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eyeliner':               { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eyeshadow':              { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'mascara':                { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'kajal':                  { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'kohl':                   { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },

  // ── Lips / Lip Makeup ─────────────────────────────────────────────────────
  'lips':                   { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip':                    { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip care':               { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lipstick':               { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip gloss':              { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip liner':              { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },

  // ── Foundation / Complexion ───────────────────────────────────────────────
  'foundation':             { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'complexion':             { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'concealer':              { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'bb cream':               { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'cc cream':               { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },

  // ── Serum / Treatments ────────────────────────────────────────────────────
  'serum':                  { icon: 'flask',         color: '#2980B9', bg: '#E8F3FB' },
  'treatment':              { icon: 'flask',         color: '#2980B9', bg: '#E8F3FB' },
  'treatments':             { icon: 'flask',         color: '#2980B9', bg: '#E8F3FB' },
  'actives':                { icon: 'flask',         color: '#2980B9', bg: '#E8F3FB' },

  // ── Sun Care / SPF ────────────────────────────────────────────────────────
  'sun care':               { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },
  'suncare':                { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },
  'sunscreen':              { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },
  'spf':                    { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },

  // ── Salon Products ────────────────────────────────────────────────────────
  'salon':                  { icon: 'award',         color: '#8E44AD', bg: '#F5EAF9' },
  'salon products':         { icon: 'award',         color: '#8E44AD', bg: '#F5EAF9' },
  'professional':           { icon: 'award',         color: '#8E44AD', bg: '#F5EAF9' },

  // ── Moisturiser / Cream ───────────────────────────────────────────────────
  'moisturiser':            { icon: 'tint',          color: '#27AE60', bg: '#E9F7EF' },
  'moisturizer':            { icon: 'tint',          color: '#27AE60', bg: '#E9F7EF' },
  'cream':                  { icon: 'tint',          color: '#27AE60', bg: '#E9F7EF' },
  'lotion':                 { icon: 'tint',          color: '#27AE60', bg: '#E9F7EF' },

  // ── Blush / Cheeks ────────────────────────────────────────────────────────
  'blush':                  { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'cheeks':                 { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'bronzer':                { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'highlighter':            { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },

  // ── Wellness / Fitness ────────────────────────────────────────────────────
  'fitness':                { icon: 'dumbbell',      color: '#E74C3C', bg: '#FDECEA' },

  // ── Organic / Natural ─────────────────────────────────────────────────────
  'organic':                { icon: 'seedling',      color: '#27AE60', bg: '#E9F7EF' },
  'natural':                { icon: 'seedling',      color: '#27AE60', bg: '#E9F7EF' },
  'herbal':                 { icon: 'seedling',      color: '#27AE60', bg: '#E9F7EF' },
};

// Default fallback when no key matches
const DEFAULT_ICON = { icon: 'star', color: '#C2477A', bg: '#FFF0F5' };

/**
 * Returns FontAwesome5 icon config for a given category name.
 * Tries exact match → partial match → default.
 *
 * @param {string} categoryName
 * @returns {{ icon: string, color: string, bg: string }}
 */
export const getCategoryFA5Icon = (categoryName) => {
  const key = (categoryName || '').toLowerCase().trim();

  // 1. Exact match
  if (CATEGORY_FA5_MAP[key]) return CATEGORY_FA5_MAP[key];

  // 2. Partial match: map key contained in category name, or vice versa
  for (const [mapKey, cfg] of Object.entries(CATEGORY_FA5_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return cfg;
  }

  // 3. Default
  return DEFAULT_ICON;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCATEGORY ICON MAP
// Covers subcategories that appear in CategoryDetailView / SubcategoryView.
// Same shape as main map.
// ─────────────────────────────────────────────────────────────────────────────
export const SUBCATEGORY_FA5_ICONS = {
  // Skincare subcategories
  'face wash':              { icon: 'pump-soap',     color: '#3A8A6A', bg: '#EEF7F3' },
  'cleanser':               { icon: 'pump-soap',     color: '#3A8A6A', bg: '#EEF7F3' },
  'toner':                  { icon: 'tint',          color: '#3A8A6A', bg: '#EEF7F3' },
  'moisturiser':            { icon: 'tint',          color: '#3A8A6A', bg: '#EEF7F3' },
  'moisturizer':            { icon: 'tint',          color: '#3A8A6A', bg: '#EEF7F3' },
  'serum':                  { icon: 'flask',         color: '#2980B9', bg: '#E8F3FB' },
  'eye cream':              { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'sunscreen':              { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },
  'spf':                    { icon: 'sun',           color: '#E67E22', bg: '#FEF5E4' },
  'sheet mask':             { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'face mask':              { icon: 'spa',           color: '#3A8A6A', bg: '#EEF7F3' },
  'exfoliator':             { icon: 'star',          color: '#3A8A6A', bg: '#EEF7F3' },
  'scrub':                  { icon: 'star',          color: '#3A8A6A', bg: '#EEF7F3' },

  // Makeup subcategories
  'foundation':             { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'concealer':              { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'primer':                 { icon: 'magic',         color: '#C2477A', bg: '#FFF0F5' },
  'blush':                  { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'bronzer':                { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'highlighter':            { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'contour':                { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'setting powder':         { icon: 'palette',       color: '#C2477A', bg: '#FFF0F5' },
  'setting spray':          { icon: 'spray-can',     color: '#C2477A', bg: '#FFF0F5' },
  'lipstick':               { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip gloss':              { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'lip liner':              { icon: 'palette',       color: '#E05585', bg: '#FCEAF2' },
  'eyeliner':               { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eyeshadow':              { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'mascara':                { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'kajal':                  { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },
  'eyebrow':                { icon: 'eye',           color: '#34495E', bg: '#ECF0F4' },

  // Hair subcategories
  'shampoo':                { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },
  'conditioner':            { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },
  'hair mask':              { icon: 'leaf',          color: '#A0661E', bg: '#FDF5E8' },
  'hair oil':               { icon: 'tint',          color: '#A0661E', bg: '#FDF5E8' },
  'hair serum':             { icon: 'flask',         color: '#A0661E', bg: '#FDF5E8' },
  'hair colour':            { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'hair color':             { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'hair dryer':             { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'straightener':           { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'curler':                 { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },
  'hair spray':             { icon: 'spray-can',     color: '#7B3FA0', bg: '#F5EEF9' },
  'styling gel':            { icon: 'magic',         color: '#7B3FA0', bg: '#F5EEF9' },

  // Bath & Body subcategories
  'body wash':              { icon: 'shower',        color: '#1A7A88', bg: '#E6F5F7' },
  'shower gel':             { icon: 'shower',        color: '#1A7A88', bg: '#E6F5F7' },
  'body lotion':            { icon: 'tint',          color: '#1A7A88', bg: '#E6F5F7' },
  'body butter':            { icon: 'tint',          color: '#1A7A88', bg: '#E6F5F7' },
  'body scrub':             { icon: 'star',          color: '#1A7A88', bg: '#E6F5F7' },
  'hand cream':             { icon: 'pump-soap',     color: '#1A7A88', bg: '#E6F5F7' },
  'foot care':              { icon: 'pump-soap',     color: '#1A7A88', bg: '#E6F5F7' },

  // Fragrance subcategories
  'eau de parfum':          { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'eau de toilette':        { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'body mist':              { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'roll on':                { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },
  'attar':                  { icon: 'spray-can',     color: '#8B4DB8', bg: '#F3EBF9' },

  // Nail subcategories
  'nail polish':            { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail paint':             { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail remover':           { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail care':              { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },
  'nail art':               { icon: 'gem',           color: '#D4477A', bg: '#FDE9F2' },

  // Men's grooming subcategories
  'face wash for men':      { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'shaving cream':          { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'after shave':            { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'beard oil':              { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'beard care':             { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },
  'men moisturizer':        { icon: 'male',          color: '#2A6496', bg: '#E8F2FA' },

  // Tools subcategories
  'makeup brush':           { icon: 'paint-brush',   color: '#5A5A8A', bg: '#EDEDF7' },
  'sponge':                 { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'beauty blender':         { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'mirror':                 { icon: 'eye',           color: '#5A5A8A', bg: '#EDEDF7' },
  'tweezer':                { icon: 'tools',         color: '#5A5A8A', bg: '#EDEDF7' },
  'eyelash curler':         { icon: 'eye',           color: '#5A5A8A', bg: '#EDEDF7' },
};

/**
 * Returns FontAwesome5 icon config for a subcategory name.
 * Falls back to getCategoryFA5Icon if no subcategory-specific match.
 *
 * @param {string} subcategoryName
 * @param {string} [parentCategoryName]
 * @returns {{ icon: string, color: string, bg: string }}
 */
export const getSubcategoryFA5Icon = (subcategoryName, parentCategoryName) => {
  const key = (subcategoryName || '').toLowerCase().trim();

  if (SUBCATEGORY_FA5_ICONS[key]) return SUBCATEGORY_FA5_ICONS[key];

  // Partial match within subcategory map
  for (const [mapKey, cfg] of Object.entries(SUBCATEGORY_FA5_ICONS)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return cfg;
  }

  // Fall through to main category map using parent name
  if (parentCategoryName) return getCategoryFA5Icon(parentCategoryName);

  return DEFAULT_ICON;
};
