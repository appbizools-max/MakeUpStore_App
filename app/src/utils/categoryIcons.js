/**
 * categoryIcons.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for beauty category & subcategory FontAwesome 5 icons.
 * Used by HomeScreen (horizontal Shop by Category strip) and CategoryScreen (catalog grid).
 *
 * Icon library: FontAwesome5 from @expo/vector-icons
 * All icon names verified against the FA5 Free glyph map bundled with Expo SDK 51.
 *
 * Mapped to eliminate awkward/mismatched icons:
 *   - 'Hair Care' uses 'cut' (hair shears) instead of 'leaf'
 *   - 'Men's Grooming' uses 'user-tie' (gentleman) instead of 'male' (restroom stick figure)
 *   - 'Beauty Tools & Accessories' uses 'brush' instead of 'tools' (mechanical wrench/hammer)
 *   - 'Fragrance' uses 'air-freshener' (perfume bottle shape) instead of 'spray-can' (graffiti can)
 *   - 'Hair Styling Tools' uses 'wind' (airflow / heat styling) instead of 'magic' (wand)
 *   - 'Professional Salon Products' uses 'crown' (master royal tier) instead of 'award' (medal)
 *   - 'Nail Care' uses 'hand-sparkles' (manicure) instead of 'gem'
 *   - 'Personal Care' uses 'soap' instead of 'pump-soap'
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CATEGORY MAP
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_FA5_MAP = {
  // ── Makeup / Colour Cosmetics ─────────────────────────────────────────────
  'makeup':                             { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },
  'colour cosmetics':                   { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },
  'color cosmetics':                    { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },
  'cosmetics':                          { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },
  'face makeup':                        { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },

  // ── Skincare / Facial Care ────────────────────────────────────────────────
  'skincare':                           { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'skin care':                          { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'skin':                               { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'face care':                          { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'facial':                             { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },

  // ── Hair Care ─────────────────────────────────────────────────────────────
  'hair care':                          { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'haircare':                           { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'hair':                               { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },

  // ── Hair Styling / Styling Tools ──────────────────────────────────────────
  'hair styling':                       { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'hair styling tools':                 { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'hair styling & tools':               { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'styling':                            { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'styling tools':                      { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },

  // ── Bath & Body ───────────────────────────────────────────────────────────
  'bath & body':                        { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'bath and body':                      { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'bath body':                          { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'bath':                               { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'body care':                          { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'body':                               { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'bodycare':                           { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },

  // ── Fragrance / Perfume ───────────────────────────────────────────────────
  'fragrance':                          { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'fragrances':                         { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'perfume':                            { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'perfumes':                           { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'deodorant':                          { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'cologne':                            { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },

  // ── Men's Grooming ────────────────────────────────────────────────────────
  "men's grooming":                     { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'mens grooming':                      { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'men grooming':                       { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'grooming':                           { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'shaving':                            { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },

  // ── Nail Care ─────────────────────────────────────────────────────────────
  'nail care':                          { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nails':                              { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail':                               { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail color':                         { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail polish':                        { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },

  // ── Professional Salon Products ───────────────────────────────────────────
  'salon':                              { icon: 'crown',         color: '#6D28D9', bg: '#EDE9FE' },
  'salon products':                     { icon: 'crown',         color: '#6D28D9', bg: '#EDE9FE' },
  'professional salon products':        { icon: 'crown',         color: '#6D28D9', bg: '#EDE9FE' },
  'professional':                       { icon: 'crown',         color: '#6D28D9', bg: '#EDE9FE' },

  // ── Beauty Tools / Brushes / Accessories ─────────────────────────────────
  'beauty tools':                       { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'beauty tools & accessories':         { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'tools':                              { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'brushes':                            { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'accessories':                        { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'beauty accessories':                 { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'brush':                              { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },

  // ── Personal Care & Hygiene ───────────────────────────────────────────────
  'personal care':                      { icon: 'soap',          color: '#10B981', bg: '#ECFDF5' },
  'personal care & hygiene':            { icon: 'soap',          color: '#10B981', bg: '#ECFDF5' },
  'hygiene':                            { icon: 'soap',          color: '#10B981', bg: '#ECFDF5' },
  'oral care':                          { icon: 'soap',          color: '#10B981', bg: '#ECFDF5' },
  'hand care':                          { icon: 'soap',          color: '#10B981', bg: '#ECFDF5' },

  // ── Beauty Kits / Gift Sets / Combos ─────────────────────────────────────
  'gift sets':                          { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'gift set':                           { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'gifts':                              { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'beauty kits':                        { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'beauty kits & combos':               { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'kits':                               { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },
  'combos':                             { icon: 'gifts',         color: '#DB2777', bg: '#FDF2F8' },

  // ── Eyes / Eye Makeup ─────────────────────────────────────────────────────
  'eyes':                               { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eye':                                { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eye makeup':                         { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eye care':                           { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eyeliner':                           { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eyeshadow':                          { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'mascara':                            { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'kajal':                              { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'kohl':                               { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },

  // ── Lips / Lip Makeup ─────────────────────────────────────────────────────
  'lips':                               { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip':                                { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip care':                           { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lipstick':                           { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip gloss':                          { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip liner':                          { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },

  // ── Foundation / Complexion ───────────────────────────────────────────────
  'foundation':                         { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'complexion':                         { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'concealer':                          { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'bb cream':                           { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'cc cream':                           { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },

  // ── Serum / Treatments ────────────────────────────────────────────────────
  'serum':                              { icon: 'flask',         color: '#0284C7', bg: '#F0F9FF' },
  'treatment':                          { icon: 'flask',         color: '#0284C7', bg: '#F0F9FF' },
  'treatments':                         { icon: 'flask',         color: '#0284C7', bg: '#F0F9FF' },
  'actives':                            { icon: 'flask',         color: '#0284C7', bg: '#F0F9FF' },

  // ── Sun Care / SPF ────────────────────────────────────────────────────────
  'sun care':                           { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },
  'suncare':                            { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },
  'sunscreen':                          { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },
  'spf':                                { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },

  // ── Moisturiser / Cream ───────────────────────────────────────────────────
  'moisturiser':                        { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'moisturizer':                        { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'cream':                              { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'lotion':                             { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },

  // ── Blush / Cheeks ────────────────────────────────────────────────────────
  'blush':                              { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'cheeks':                             { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'bronzer':                            { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'highlighter':                        { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },

  // ── Organic / Natural / Wellness ──────────────────────────────────────────
  'organic':                            { icon: 'seedling',      color: '#16A34A', bg: '#F0FDF4' },
  'natural':                            { icon: 'seedling',      color: '#16A34A', bg: '#F0FDF4' },
  'herbal':                             { icon: 'seedling',      color: '#16A34A', bg: '#F0FDF4' },
  'wellness':                           { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'health':                             { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
};

// Default fallback when no key matches: a clean, elegant cosmetics brush
const DEFAULT_ICON = { icon: 'brush', color: '#C2477A', bg: '#FFF0F5' };

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
// ─────────────────────────────────────────────────────────────────────────────
export const SUBCATEGORY_FA5_ICONS = {
  // Skincare subcategories
  'face wash':                          { icon: 'soap',          color: '#059669', bg: '#ECFDF5' },
  'cleanser':                           { icon: 'soap',          color: '#059669', bg: '#ECFDF5' },
  'toner':                              { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'moisturiser':                        { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'moisturizer':                        { icon: 'tint',          color: '#059669', bg: '#ECFDF5' },
  'serum':                              { icon: 'flask',         color: '#0284C7', bg: '#F0F9FF' },
  'eye cream':                          { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'sunscreen':                          { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },
  'spf':                                { icon: 'sun',           color: '#EA580C', bg: '#FFF7ED' },
  'sheet mask':                         { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'face mask':                          { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'exfoliator':                         { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'scrub':                              { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },

  // Makeup subcategories (Nykaa Style Icons)
  'foundation':                         { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'concealer':                          { icon: 'tint',          color: '#D97706', bg: '#FFFBEB' },
  'compact':                            { icon: 'palette',       color: '#D97706', bg: '#FFFBEB' },
  'compact powder':                     { icon: 'palette',       color: '#D97706', bg: '#FFFBEB' },
  'primer':                             { icon: 'tint',          color: '#C2477A', bg: '#FFF0F5' },
  'blush':                              { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'blush & highlighter':                { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'bronzer':                            { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'highlighter':                        { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'contour':                            { icon: 'palette',       color: '#E11D48', bg: '#FFF1F2' },
  'setting powder':                     { icon: 'brush',         color: '#C2477A', bg: '#FFF0F5' },
  'setting spray':                      { icon: 'air-freshener', color: '#C2477A', bg: '#FFF0F5' },
  'lipstick':                           { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip gloss':                          { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'lip liner':                          { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'liquid lipstick':                    { icon: 'heart',         color: '#E11D48', bg: '#FFF1F2' },
  'eyeliner':                           { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eyeliner & kajal':                   { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eyeshadow':                          { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'mascara':                            { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'kajal':                              { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },
  'eyebrow':                            { icon: 'eye',           color: '#475569', bg: '#F1F5F9' },

  // Hair subcategories (Nykaa Style Icons)
  'spray':                              { icon: 'air-freshener', color: '#9333EA', bg: '#FAF5FF' },
  'hair spray':                         { icon: 'air-freshener', color: '#9333EA', bg: '#FAF5FF' },
  'dry shampoo':                        { icon: 'air-freshener', color: '#7C3AED', bg: '#F5F3FF' },
  'colour':                             { icon: 'palette',       color: '#9333EA', bg: '#FAF5FF' },
  'hair colour':                        { icon: 'palette',       color: '#9333EA', bg: '#FAF5FF' },
  'hair color':                         { icon: 'palette',       color: '#9333EA', bg: '#FAF5FF' },
  'combos':                             { icon: 'gifts',         color: '#7C3AED', bg: '#F5F3FF' },
  'hair combos':                        { icon: 'gifts',         color: '#7C3AED', bg: '#F5F3FF' },
  'gels & waxes':                       { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'styling gel':                        { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'brushes & combs':                    { icon: 'brush',         color: '#7C3AED', bg: '#F5F3FF' },
  'hair fibers':                        { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'kids shampoo & conditioner':         { icon: 'soap',          color: '#0D9488', bg: '#F0FDFA' },
  'postpartum haircare':                { icon: 'spa',           color: '#059669', bg: '#ECFDF5' },
  'shampoo':                            { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'conditioner':                        { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'hair mask':                          { icon: 'cut',           color: '#7C3AED', bg: '#F5F3FF' },
  'hair oil':                           { icon: 'tint',          color: '#7C3AED', bg: '#F5F3FF' },
  'hair serum':                         { icon: 'flask',         color: '#7C3AED', bg: '#F5F3FF' },
  'hair dryer':                         { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'straightener':                       { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },
  'curler':                             { icon: 'wind',          color: '#9333EA', bg: '#FAF5FF' },

  // Bath & Body subcategories
  'body wash':                          { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'shower gel':                         { icon: 'bath',          color: '#0D9488', bg: '#F0FDFA' },
  'body lotion':                        { icon: 'tint',          color: '#0D9488', bg: '#F0FDFA' },
  'body butter':                        { icon: 'tint',          color: '#0D9488', bg: '#F0FDFA' },
  'body scrub':                         { icon: 'soap',          color: '#0D9488', bg: '#F0FDFA' },
  'hand cream':                         { icon: 'soap',          color: '#0D9488', bg: '#F0FDFA' },
  'foot care':                          { icon: 'soap',          color: '#0D9488', bg: '#F0FDFA' },

  // Fragrance subcategories (Nykaa Style Icons)
  'luxury scents':                      { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'for men':                            { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'for women':                          { icon: 'air-freshener', color: '#DB2777', bg: '#FDF2F8' },
  'niche scents':                       { icon: 'crown',         color: '#6D28D9', bg: '#EDE9FE' },
  'floral & fruity':                    { icon: 'spa',           color: '#E11D48', bg: '#FFF1F2' },
  'eau de parfum':                      { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'eau de toilette':                    { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'body mist':                          { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'roll on':                            { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'attar':                              { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'roll on':                            { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },
  'attar':                              { icon: 'air-freshener', color: '#C026D3', bg: '#FDF4FF' },

  // Nail subcategories
  'nail polish':                        { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail paint':                         { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail remover':                       { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail care':                          { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },
  'nail art':                           { icon: 'hand-sparkles', color: '#E11D48', bg: '#FFF1F2' },

  // Men's grooming subcategories
  'face wash for men':                  { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'shaving cream':                      { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'after shave':                        { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'beard oil':                          { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'beard care':                         { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },
  'men moisturizer':                    { icon: 'user-tie',      color: '#334155', bg: '#F1F5F9' },

  // Beauty Tools subcategories
  'makeup brush':                       { icon: 'brush',         color: '#BE185D', bg: '#FDF2F8' },
  'sponge':                             { icon: 'heart',         color: '#BE185D', bg: '#FDF2F8' },
  'beauty blender':                     { icon: 'heart',         color: '#BE185D', bg: '#FDF2F8' },
  'mirror':                             { icon: 'eye',           color: '#BE185D', bg: '#FDF2F8' },
  'tweezer':                            { icon: 'cut',           color: '#475569', bg: '#F1F5F9' },
  'eyelash curler':                     { icon: 'eye',           color: '#BE185D', bg: '#FDF2F8' },
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

// Re-export getSafeImageSource for components importing image helpers
export { getSafeImageSource } from './imageUtils';
