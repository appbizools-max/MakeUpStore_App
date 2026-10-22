import { supabase } from '../config/supabase';
import { MAKEUP_SWATCH_PRESETS } from '../components/HexColorPicker';

export const ATTRIBUTE_GROUPS = [
  'Appearance',
  'Size & Quantity',
  'Formulation',
  'Skin',
  'Hair',
  'Fragrance',
  'Other'
];

export const DEFAULT_ATTRIBUTES = [
  // 1. Appearance
  {
    id: 'attr_shade',
    name: 'Shade / Colour',
    group: 'Appearance',
    inputType: 'color_swatch',
    status: 'active',
    values: MAKEUP_SWATCH_PRESETS.map((p, i) => ({
      id: `val_shade_${i}`,
      name: p.name,
      hexColor: p.hex,
      code: `S${String(i + 1).padStart(2, '0')}`
    }))
  },
  {
    id: 'attr_shade_code',
    name: 'Shade Code',
    group: 'Appearance',
    inputType: 'text',
    status: 'active',
    values: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].map((v, i) => ({
      id: `val_code_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_colour_family',
    name: 'Colour Family',
    group: 'Appearance',
    inputType: 'select',
    status: 'active',
    values: ['Red', 'Pink', 'Nude', 'Coral', 'Berry / Plum', 'Mauve', 'Brown / Mocha', 'Bronze / Gold', 'Purple', 'Neutral'].map((v, i) => ({
      id: `val_family_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_finish',
    name: 'Finish',
    group: 'Appearance',
    inputType: 'select',
    status: 'active',
    values: ['Matte', 'Satin', 'Glossy', 'Dewy', 'Natural', 'Radiant', 'Shimmer', 'Metallic', 'Glitter'].map((v, i) => ({
      id: `val_finish_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_coverage',
    name: 'Coverage',
    group: 'Appearance',
    inputType: 'select',
    status: 'active',
    values: ['Sheer', 'Light', 'Medium', 'Full', 'Buildable'].map((v, i) => ({
      id: `val_cov_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_undertone',
    name: 'Undertone',
    group: 'Appearance',
    inputType: 'select',
    status: 'active',
    values: ['Warm', 'Cool', 'Neutral', 'Olive', 'Golden', 'Peach', 'Yellow', 'Rosy / Pink'].map((v, i) => ({
      id: `val_ut_${i}`,
      name: v
    }))
  },

  // 2. Size & Quantity
  {
    id: 'attr_size',
    name: 'Size',
    group: 'Size & Quantity',
    inputType: 'select',
    status: 'active',
    values: ['Mini', 'Travel Size', 'Standard', 'Full Size', 'Jumbo', 'Value Size', 'XS', 'S', 'M', 'L', 'XL'].map((v, i) => ({
      id: `val_size_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_volume',
    name: 'Volume',
    group: 'Size & Quantity',
    inputType: 'volume',
    status: 'active',
    values: ['15 ml', '30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml', '250 ml', '500 ml', '1000 ml'].map((v, i) => ({
      id: `val_vol_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_weight',
    name: 'Weight',
    group: 'Size & Quantity',
    inputType: 'weight',
    status: 'active',
    values: ['3 g', '5 g', '7 g', '10 g', '15 g', '20 g', '30 g', '50 g', '75 g', '100 g'].map((v, i) => ({
      id: `val_wt_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_pack_size',
    name: 'Pack Size',
    group: 'Size & Quantity',
    inputType: 'select',
    status: 'active',
    values: ['Single Pack', 'Pack of 2', 'Pack of 3', 'Pack of 4', 'Pack of 5', 'Gift Set', 'Combo Pack'].map((v, i) => ({
      id: `val_pack_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_pack_quantity',
    name: 'Pack Quantity',
    group: 'Size & Quantity',
    inputType: 'select',
    status: 'active',
    values: ['1 pc', '2 pcs', '3 pcs', '4 pcs', '5 pcs', '6 pcs', '12 pcs'].map((v, i) => ({
      id: `val_pqty_${i}`,
      name: v
    }))
  },

  // 3. Formulation
  {
    id: 'attr_formulation',
    name: 'Formulation',
    group: 'Formulation',
    inputType: 'select',
    status: 'active',
    values: ['Liquid', 'Cream', 'Powder', 'Gel', 'Stick', 'Pencil', 'Balm', 'Serum', 'Spray', 'Oil', 'Mousse'].map((v, i) => ({
      id: `val_form_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_texture',
    name: 'Texture',
    group: 'Formulation',
    inputType: 'select',
    status: 'active',
    values: ['Lightweight', 'Velvety', 'Silky', 'Rich Creamy', 'Whipped', 'Watery', 'Gel-based'].map((v, i) => ({
      id: `val_tex_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_product_format',
    name: 'Product Format',
    group: 'Formulation',
    inputType: 'select',
    status: 'active',
    values: ['Bottle with Pump', 'Squeeze Tube', 'Glass Jar', 'Compact with Mirror', 'Dropper Bottle', 'Roll-on', 'Crayon Stick'].map((v, i) => ({
      id: `val_fmt_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_key_ingredient',
    name: 'Key Ingredient',
    group: 'Formulation',
    inputType: 'select',
    status: 'active',
    values: ['Hyaluronic Acid', 'Vitamin C', 'Niacinamide', 'Retinol', 'Salicylic Acid', 'Argan Oil', 'Shea Butter', 'Tea Tree Oil', 'Ceramides', 'Peptides', 'Centella Asiatica', 'Squalane'].map((v, i) => ({
      id: `val_king_${i}`,
      name: v
    }))
  },

  // 4. Skin
  {
    id: 'attr_skin_type',
    name: 'Skin Type',
    group: 'Skin',
    inputType: 'select',
    status: 'active',
    values: ['All Skin Types', 'Normal', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Acne-Prone'].map((v, i) => ({
      id: `val_skin_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_skin_tone',
    name: 'Skin Tone',
    group: 'Skin',
    inputType: 'select',
    status: 'active',
    values: ['Fair', 'Light', 'Light Medium', 'Medium', 'Tan', 'Deep', 'Rich Deep', 'Olive'].map((v, i) => ({
      id: `val_tone_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_skin_concern',
    name: 'Skin Concern',
    group: 'Skin',
    inputType: 'select',
    status: 'active',
    values: ['Acne & Blemishes', 'Anti-Aging', 'Dark Spots & Pigmentation', 'Dryness & Dehydration', 'Dullness', 'Enlarged Pores', 'Redness'].map((v, i) => ({
      id: `val_scon_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_spf',
    name: 'SPF',
    group: 'Skin',
    inputType: 'select',
    status: 'active',
    values: ['No SPF', 'SPF 15', 'SPF 20', 'SPF 30', 'SPF 40', 'SPF 50', 'SPF 50+ PA++++'].map((v, i) => ({
      id: `val_spf_${i}`,
      name: v
    }))
  },

  // 5. Hair
  {
    id: 'attr_hair_type',
    name: 'Hair Type',
    group: 'Hair',
    inputType: 'select',
    status: 'active',
    values: ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick', 'Colour Treated', 'Chemically Treated'].map((v, i) => ({
      id: `val_hair_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_hair_texture',
    name: 'Hair Texture',
    group: 'Hair',
    inputType: 'select',
    status: 'active',
    values: ['Fine', 'Medium', 'Coarse / Thick'].map((v, i) => ({
      id: `val_htex_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_hair_concern',
    name: 'Hair Concern',
    group: 'Hair',
    inputType: 'select',
    status: 'active',
    values: ['Hair Fall', 'Dandruff Control', 'Frizz & Dryness', 'Damage Repair', 'Color Protection', 'Volume & Thinning'].map((v, i) => ({
      id: `val_hcon_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_scalp_type',
    name: 'Scalp Type',
    group: 'Hair',
    inputType: 'select',
    status: 'active',
    values: ['Normal Scalp', 'Oily Scalp', 'Dry & Itchy', 'Sensitive Scalp', 'Flaky Scalp'].map((v, i) => ({
      id: `val_scalp_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_hair_colour',
    name: 'Hair Colour',
    group: 'Hair',
    inputType: 'select',
    status: 'active',
    values: ['Natural Black', 'Dark Brown', 'Light Brown', 'Burgundy', 'Honey Blonde', 'Copper Red', 'Mahogany', 'Ash Blonde'].map((v, i) => ({
      id: `val_hcol_${i}`,
      name: v
    }))
  },

  // 6. Fragrance
  {
    id: 'attr_fragrance',
    name: 'Fragrance',
    group: 'Fragrance',
    inputType: 'select',
    status: 'active',
    values: ['Rose & Oud', 'Vanilla Musk', 'Citrus Breeze', 'Jasmine Bloom', 'Lavender Fields', 'Sandalwood', 'Aqua Fresh', 'Amber Woods'].map((v, i) => ({
      id: `val_frag_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_fragrance_family',
    name: 'Fragrance Family',
    group: 'Fragrance',
    inputType: 'select',
    status: 'active',
    values: ['Floral', 'Oriental / Amber', 'Woody', 'Fresh / Aquatic', 'Gourmand', 'Fruity', 'Spicy / Aromatic'].map((v, i) => ({
      id: `val_ffam_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_scent',
    name: 'Scent',
    group: 'Fragrance',
    inputType: 'select',
    status: 'active',
    values: ['Sweet', 'Spicy', 'Earthy', 'Fruity', 'Warm', 'Musky', 'Powdery', 'Crisp Fresh'].map((v, i) => ({
      id: `val_scnt_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_concentration',
    name: 'Concentration',
    group: 'Fragrance',
    inputType: 'select',
    status: 'active',
    values: ['Eau de Cologne (EDC)', 'Eau de Toilette (EDT)', 'Eau de Parfum (EDP)', 'Parfum / Extrait', 'Body Mist / Deodorant'].map((v, i) => ({
      id: `val_conc_${i}`,
      name: v
    }))
  },

  // 7. Other
  {
    id: 'attr_age_group',
    name: 'Age Group',
    group: 'Other',
    inputType: 'select',
    status: 'active',
    values: ['All Ages', 'Teens (13-19)', 'Young Adults (20-35)', 'Mature (35+)', 'Kids'].map((v, i) => ({
      id: `val_age_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_gender',
    name: 'Gender',
    group: 'Other',
    inputType: 'select',
    status: 'active',
    values: ['Unisex', 'Women', 'Men'].map((v, i) => ({
      id: `val_gen_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_benefits',
    name: 'Benefits',
    group: 'Other',
    inputType: 'select',
    status: 'active',
    values: ['Long-lasting', 'Waterproof', 'Smudge-proof', 'Hydrating & Nourishing', 'Transfer-proof', 'Matte Finish', 'Organic & Vegan', 'Cruelty-Free'].map((v, i) => ({
      id: `val_ben_${i}`,
      name: v
    }))
  },
  {
    id: 'attr_ingredients',
    name: 'Ingredients',
    group: 'Other',
    inputType: 'select',
    status: 'active',
    values: ['Hyaluronic Acid', 'Vitamin C', 'Niacinamide', 'Retinol', 'Salicylic Acid', 'Argan Oil', 'Shea Butter', 'Tea Tree Oil', 'Ceramides'].map((v, i) => ({
      id: `val_ing_${i}`,
      name: v
    }))
  }
];

export const DEFAULT_CATEGORY_ATTRIBUTES_MAP = {
  'Lipstick': ['Shade / Colour', 'Finish', 'Formulation', 'Size'],
  'Liquid Lipstick': ['Shade / Colour', 'Finish', 'Formulation'],
  'Lip Gloss': ['Shade / Colour', 'Finish'],
  'Lip Liner': ['Shade / Colour', 'Finish'],
  'Foundation': ['Shade / Colour', 'Coverage', 'Finish', 'Skin Type', 'Formulation'],
  'Concealer': ['Shade / Colour', 'Coverage', 'Finish', 'Skin Type'],
  'Compact': ['Shade / Colour', 'Coverage', 'Finish'],
  'Blush': ['Shade / Colour', 'Finish', 'Formulation'],
  'Eyeshadow': ['Shade / Colour', 'Finish', 'Formulation'],
  'Eyeliner': ['Shade / Colour', 'Finish', 'Benefits'],
  'Kajal': ['Shade / Colour', 'Benefits'],
  'Mascara': ['Shade / Colour', 'Benefits', 'Formulation'],
  'Nail Polish': ['Shade / Colour', 'Finish'],
  'Shampoo': ['Volume', 'Hair Type', 'Hair Concern', 'Fragrance'],
  'Conditioner': ['Volume', 'Hair Type', 'Hair Concern'],
  'Hair Oil': ['Volume', 'Hair Type', 'Hair Concern'],
  'Hair Serum': ['Volume', 'Hair Type', 'Hair Concern'],
  'Hair Color': ['Hair Colour', 'Formulation', 'Pack Size'],
  'Face Wash': ['Volume', 'Skin Type', 'Skin Concern'],
  'Moisturizer': ['Weight', 'Volume', 'Skin Type', 'Skin Concern'],
  'Sunscreen': ['SPF', 'Volume', 'Skin Type', 'Finish'],
  'Face Serum': ['Volume', 'Skin Concern', 'Ingredients'],
  'Perfume': ['Volume', 'Fragrance', 'Fragrance Family', 'Concentration'],
  'Deodorant': ['Volume', 'Fragrance', 'Gender']
};

/**
 * Maintainable Category / Subcategory / Product Type suggestion rules.
 * Pure variant differentiators only (no duplicates with product specifications or description).
 */
export const PRODUCT_ATTRIBUTE_SUGGESTION_RULES = [
  // 1. Lipstick & Lip Products
  {
    id: 'lipstick',
    label: 'Lipstick',
    match: {
      categories: ['makeup', 'lips', 'lip makeup'],
      subcategories: ['lipstick', 'liquid lipstick', 'matte lipstick', 'lip crayon', 'crayon lipstick', 'bullet lipstick'],
      productTypes: ['lipstick', 'liquid lipstick', 'lip color', 'lip colour'],
      keywords: ['lipstick', 'liquid lip', 'matte lip', 'lip ink', 'lip paint']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Colour Family',
      'Finish',
      'Coverage',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Shade Code',
      'Finish'
    ]
  },
  // 2. Lip Gloss, Balm, Tint & Liner
  {
    id: 'lip_care_gloss',
    label: 'Lip Care & Gloss',
    match: {
      categories: ['makeup', 'lips', 'skincare'],
      subcategories: ['lip gloss', 'lip balm', 'lip oil', 'lip liner', 'lip tint', 'lip plumper', 'lip stain'],
      productTypes: ['lip gloss', 'lip balm', 'lip oil', 'lip liner', 'lip tint'],
      keywords: ['gloss', 'lip balm', 'lip oil', 'lip liner', 'tint', 'plumper']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Finish',
      'Formulation',
      'Fragrance',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Finish'
    ]
  },
  // 3. Foundation
  {
    id: 'foundation',
    label: 'Foundation',
    match: {
      categories: ['makeup', 'face', 'face makeup'],
      subcategories: ['foundation', 'liquid foundation', 'cushion foundation', 'powder foundation', 'stick foundation', 'skin tint'],
      productTypes: ['foundation', 'liquid foundation', 'cushion foundation', 'skin tint'],
      keywords: ['foundation', 'skin tint', 'cushion']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Colour Family',
      'Undertone',
      'Coverage',
      'Finish',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Shade Code',
      'Coverage',
      'Finish'
    ]
  },
  // 4. Concealer & Corrector
  {
    id: 'concealer',
    label: 'Concealer',
    match: {
      categories: ['makeup', 'face'],
      subcategories: ['concealer', 'color corrector', 'corrector', 'camouflage'],
      productTypes: ['concealer', 'color corrector'],
      keywords: ['concealer', 'corrector']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Undertone',
      'Coverage',
      'Finish',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Shade Code',
      'Coverage'
    ]
  },
  // 5. Compact, Setting & Loose Powder
  {
    id: 'compact_powder',
    label: 'Compact & Powder',
    match: {
      categories: ['makeup', 'face'],
      subcategories: ['compact', 'pressed powder', 'loose powder', 'setting powder', 'translucent powder', 'banana powder', 'compact powder'],
      productTypes: ['compact', 'powder', 'setting powder'],
      keywords: ['compact', 'loose powder', 'setting powder', 'pressed powder']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Finish',
      'Coverage',
      'Weight'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Finish'
    ]
  },
  // 6. Blush, Bronzer & Highlighter
  {
    id: 'blush_highlighter',
    label: 'Blush & Highlighter',
    match: {
      categories: ['makeup', 'face'],
      subcategories: ['blush', 'blusher', 'highlighter', 'bronzer', 'contour', 'illuminator', 'cheek tint'],
      productTypes: ['blush', 'highlighter', 'bronzer', 'contour'],
      keywords: ['blush', 'highlighter', 'bronzer', 'contour', 'illuminator']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Colour Family',
      'Finish',
      'Formulation',
      'Weight'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Finish'
    ]
  },
  // 7. Eyeshadow & Eye Palettes
  {
    id: 'eyeshadow',
    label: 'Eyeshadow',
    match: {
      categories: ['makeup', 'eyes', 'eye makeup'],
      subcategories: ['eyeshadow', 'eye shadow', 'eyeshadow palette', 'pigment', 'glitter pigment'],
      productTypes: ['eyeshadow', 'eyeshadow palette', 'eye shadow'],
      keywords: ['eyeshadow', 'shadow palette', 'eye palette']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Colour Family',
      'Finish',
      'Formulation',
      'Weight'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Finish'
    ]
  },
  // 8. Eyeliner, Kajal & Eyebrow
  {
    id: 'eyeliner_kajal',
    label: 'Eyeliner & Kajal',
    match: {
      categories: ['makeup', 'eyes'],
      subcategories: ['eyeliner', 'eye liner', 'kajal', 'kohl', 'eyebrow', 'brow pencil', 'brow pomade', 'brow gel'],
      productTypes: ['eyeliner', 'kajal', 'kohl', 'eyebrow'],
      keywords: ['eyeliner', 'kajal', 'kohl', 'brow']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Finish',
      'Formulation',
      'Weight'
    ],
    defaultAutoSelect: [
      'Shade / Colour'
    ]
  },
  // 9. Mascara
  {
    id: 'mascara',
    label: 'Mascara',
    match: {
      categories: ['makeup', 'eyes'],
      subcategories: ['mascara', 'lash primer'],
      productTypes: ['mascara'],
      keywords: ['mascara', 'lash']
    },
    suggested: [
      'Shade / Colour',
      'Finish',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour'
    ]
  },
  // 10. Nail Polish & Lacquer
  {
    id: 'nail_polish',
    label: 'Nail Polish',
    match: {
      categories: ['nails', 'nail care', 'makeup'],
      subcategories: ['nail polish', 'nail lacquer', 'nail enamel', 'gel nail', 'nail paint'],
      productTypes: ['nail polish', 'nail lacquer', 'nail paint'],
      keywords: ['nail polish', 'nail lacquer', 'nail paint', 'enamel']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Colour Family',
      'Finish',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Shade / Colour',
      'Shade Code',
      'Finish'
    ]
  },
  // 11. Shampoo
  {
    id: 'shampoo',
    label: 'Shampoo',
    match: {
      categories: ['hair', 'haircare', 'hair care'],
      subcategories: ['shampoo', 'anti-dandruff shampoo', 'clarifying shampoo', 'dry shampoo'],
      productTypes: ['shampoo'],
      keywords: ['shampoo']
    },
    suggested: [
      'Hair Type',
      'Hair Concern',
      'Formulation',
      'Texture',
      'Fragrance',
      'Volume'
    ],
    defaultAutoSelect: [
      'Hair Type',
      'Volume'
    ]
  },
  // 12. Conditioner & Hair Mask
  {
    id: 'conditioner_mask',
    label: 'Conditioner & Hair Mask',
    match: {
      categories: ['hair', 'haircare', 'hair care'],
      subcategories: ['conditioner', 'hair mask', 'hair spa', 'leave-in conditioner', 'hair treatment'],
      productTypes: ['conditioner', 'hair mask', 'hair treatment'],
      keywords: ['conditioner', 'hair mask', 'hair spa']
    },
    suggested: [
      'Hair Type',
      'Hair Concern',
      'Formulation',
      'Texture',
      'Fragrance',
      'Volume',
      'Weight'
    ],
    defaultAutoSelect: [
      'Hair Type',
      'Volume'
    ]
  },
  // 13. Hair Oil & Hair Serum
  {
    id: 'hair_oil_serum',
    label: 'Hair Oil & Serum',
    match: {
      categories: ['hair', 'haircare', 'hair care'],
      subcategories: ['hair oil', 'hair serum', 'scalp serum', 'hair tonic'],
      productTypes: ['hair oil', 'hair serum'],
      keywords: ['hair oil', 'hair serum', 'scalp serum']
    },
    suggested: [
      'Hair Type',
      'Hair Concern',
      'Formulation',
      'Fragrance',
      'Volume'
    ],
    defaultAutoSelect: [
      'Hair Concern',
      'Volume'
    ]
  },
  // 14. Hair Color & Dyes
  {
    id: 'hair_color',
    label: 'Hair Color',
    match: {
      categories: ['hair', 'haircare', 'hair care'],
      subcategories: ['hair color', 'hair colour', 'hair dye', 'root touch-up', 'bleach'],
      productTypes: ['hair color', 'hair colour', 'hair dye'],
      keywords: ['hair color', 'hair colour', 'hair dye', 'root touch']
    },
    suggested: [
      'Hair Colour',
      'Shade Code',
      'Formulation',
      'Pack Size',
      'Volume'
    ],
    defaultAutoSelect: [
      'Hair Colour',
      'Shade Code'
    ]
  },
  // 15. Face Serum & Treatments
  {
    id: 'face_serum',
    label: 'Face Serum',
    match: {
      categories: ['skincare', 'skin care', 'skin'],
      subcategories: ['face serum', 'serum', 'essence', 'ampoule', 'face oil'],
      productTypes: ['face serum', 'serum', 'essence'],
      keywords: ['serum', 'essence', 'ampoule', 'face oil']
    },
    suggested: [
      'Skin Type',
      'Skin Concern',
      'Formulation',
      'Texture',
      'Key Ingredient',
      'Volume'
    ],
    defaultAutoSelect: [
      'Skin Type',
      'Volume'
    ]
  },
  // 16. Moisturizer & Day/Night Cream
  {
    id: 'moisturizer',
    label: 'Moisturizer',
    match: {
      categories: ['skincare', 'skin care', 'skin'],
      subcategories: ['moisturizer', 'moisturiser', 'day cream', 'night cream', 'face gel', 'cold cream', 'lotion', 'face cream'],
      productTypes: ['moisturizer', 'cream', 'face cream', 'lotion'],
      keywords: ['moisturizer', 'moisturiser', 'day cream', 'night cream', 'face cream']
    },
    suggested: [
      'Skin Type',
      'Skin Concern',
      'Formulation',
      'Texture',
      'SPF',
      'Volume',
      'Weight'
    ],
    defaultAutoSelect: [
      'Skin Type',
      'Volume'
    ]
  },
  // 17. Face Wash & Cleanser
  {
    id: 'face_wash',
    label: 'Face Wash',
    match: {
      categories: ['skincare', 'skin care', 'skin'],
      subcategories: ['face wash', 'cleanser', 'scrub', 'micellar water', 'makeup remover'],
      productTypes: ['face wash', 'cleanser', 'face scrub'],
      keywords: ['face wash', 'cleanser', 'scrub', 'micellar']
    },
    suggested: [
      'Skin Type',
      'Skin Concern',
      'Formulation',
      'Texture',
      'Volume',
      'Weight'
    ],
    defaultAutoSelect: [
      'Skin Type',
      'Volume'
    ]
  },
  // 18. Sunscreen
  {
    id: 'sunscreen',
    label: 'Sunscreen',
    match: {
      categories: ['skincare', 'skin care', 'skin'],
      subcategories: ['sunscreen', 'sunblock', 'sun gel', 'sun spray', 'spf'],
      productTypes: ['sunscreen', 'sunblock'],
      keywords: ['sunscreen', 'sunblock', 'sun spray']
    },
    suggested: [
      'SPF',
      'Skin Type',
      'Finish',
      'Formulation',
      'Texture',
      'Volume'
    ],
    defaultAutoSelect: [
      'SPF',
      'Volume'
    ]
  },
  // 19. Toner & Face Mist
  {
    id: 'toner_mist',
    label: 'Toner & Mist',
    match: {
      categories: ['skincare', 'skin care', 'skin'],
      subcategories: ['toner', 'face mist', 'thermal water', 'rose water'],
      productTypes: ['toner', 'face mist'],
      keywords: ['toner', 'mist', 'thermal water']
    },
    suggested: [
      'Skin Type',
      'Skin Concern',
      'Formulation',
      'Fragrance',
      'Volume'
    ],
    defaultAutoSelect: [
      'Skin Type',
      'Volume'
    ]
  },
  // 20. Perfume & Fine Fragrance
  {
    id: 'perfume',
    label: 'Perfume',
    match: {
      categories: ['fragrance', 'perfumes', 'scents'],
      subcategories: ['perfume', 'eau de parfum', 'eau de toilette', 'attar', 'cologne', 'fragrance'],
      productTypes: ['perfume', 'edp', 'edt', 'cologne'],
      keywords: ['perfume', 'edp', 'edt', 'cologne', 'parfum']
    },
    suggested: [
      'Volume',
      'Fragrance',
      'Fragrance Family',
      'Concentration',
      'Gender'
    ],
    defaultAutoSelect: [
      'Volume',
      'Fragrance'
    ]
  },
  // 21. Deodorant & Body Mist
  {
    id: 'deodorant_mist',
    label: 'Deodorant & Mist',
    match: {
      categories: ['fragrance', 'bath & body', 'body'],
      subcategories: ['deodorant', 'body mist', 'body spray', 'roll-on', 'antiperspirant'],
      productTypes: ['deodorant', 'body mist', 'body spray', 'roll-on'],
      keywords: ['deodorant', 'body mist', 'body spray', 'roll-on']
    },
    suggested: [
      'Volume',
      'Fragrance',
      'Fragrance Family',
      'Gender'
    ],
    defaultAutoSelect: [
      'Volume',
      'Fragrance'
    ]
  },
  // 22. Tools, Brushes & Accessories
  {
    id: 'tools_accessories',
    label: 'Tools & Accessories',
    match: {
      categories: ['tools', 'accessories', 'appliances', 'brushes'],
      subcategories: ['brush', 'makeup brush', 'sponge', 'beauty blender', 'applicator', 'curler', 'tweezers'],
      productTypes: ['brush', 'sponge', 'applicator', 'tool'],
      keywords: ['brush', 'sponge', 'blender', 'curler', 'tweezers', 'applicator']
    },
    suggested: [
      'Size',
      'Pack Quantity',
      'Pack Size'
    ],
    defaultAutoSelect: [
      'Size'
    ]
  },
  // 23. Generic Category Fallbacks
  {
    id: 'makeup_generic',
    label: 'Makeup',
    match: {
      categories: ['makeup', 'cosmetics', 'color cosmetics']
    },
    suggested: [
      'Shade / Colour',
      'Shade Code',
      'Finish',
      'Formulation',
      'Volume',
      'Weight'
    ],
    defaultAutoSelect: [
      'Shade / Colour'
    ]
  },
  {
    id: 'skincare_generic',
    label: 'Skincare',
    match: {
      categories: ['skincare', 'skin care', 'skin']
    },
    suggested: [
      'Skin Type',
      'Skin Concern',
      'Formulation',
      'Volume',
      'Weight'
    ],
    defaultAutoSelect: [
      'Volume'
    ]
  },
  {
    id: 'haircare_generic',
    label: 'Hair Care',
    match: {
      categories: ['haircare', 'hair care', 'hair']
    },
    suggested: [
      'Hair Type',
      'Hair Concern',
      'Formulation',
      'Volume'
    ],
    defaultAutoSelect: [
      'Volume'
    ]
  },
  {
    id: 'fragrance_generic',
    label: 'Fragrance',
    match: {
      categories: ['fragrance', 'perfumes', 'scents']
    },
    suggested: [
      'Volume',
      'Fragrance',
      'Fragrance Family',
      'Concentration'
    ],
    defaultAutoSelect: [
      'Volume'
    ]
  },
  // 24. Universal Fallback
  {
    id: 'default_general',
    label: 'Product',
    match: {},
    suggested: [
      'Size',
      'Volume',
      'Weight',
      'Pack Size'
    ],
    defaultAutoSelect: [
      'Size'
    ]
  }
];

/**
 * Automatically determine relevant product attributes based on Category, Subcategory, Product Type & Product Name.
 */
export function getProductAttributeSuggestions({ category = '', subcategory = '', productType = '', productName = '' } = {}) {
  const normCat = (category || '').trim().toLowerCase();
  const normSub = (subcategory || '').trim().toLowerCase();
  const normType = (productType || '').trim().toLowerCase();
  const normName = (productName || '').trim().toLowerCase();

  // 1. Highest Priority: Match productType
  if (normType) {
    for (const rule of PRODUCT_ATTRIBUTE_SUGGESTION_RULES) {
      if (rule.match && rule.match.productTypes) {
        if (rule.match.productTypes.some(pt => normType === pt || normType.includes(pt) || pt.includes(normType))) {
          return {
            ruleId: rule.id,
            label: rule.label,
            suggested: rule.suggested,
            defaultAutoSelect: rule.defaultAutoSelect || []
          };
        }
      }
    }
  }

  // 2. Second Priority: Match subcategory
  if (normSub) {
    for (const rule of PRODUCT_ATTRIBUTE_SUGGESTION_RULES) {
      if (rule.match && rule.match.subcategories) {
        if (rule.match.subcategories.some(sc => normSub === sc || normSub.includes(sc) || sc.includes(normSub))) {
          return {
            ruleId: rule.id,
            label: rule.label,
            suggested: rule.suggested,
            defaultAutoSelect: rule.defaultAutoSelect || []
          };
        }
      }
    }
  }

  // 3. Third Priority: Match keywords in product name or subcategory
  for (const rule of PRODUCT_ATTRIBUTE_SUGGESTION_RULES) {
    if (rule.match && rule.match.keywords) {
      const matchInSub = normSub && rule.match.keywords.some(kw => normSub.includes(kw));
      const matchInName = normName && rule.match.keywords.some(kw => normName.includes(kw));
      if (matchInSub || matchInName) {
        return {
          ruleId: rule.id,
          label: rule.label,
          suggested: rule.suggested,
          defaultAutoSelect: rule.defaultAutoSelect || []
        };
      }
    }
  }

  // 4. Fourth Priority: Match category
  if (normCat) {
    for (const rule of PRODUCT_ATTRIBUTE_SUGGESTION_RULES) {
      if (rule.match && rule.match.categories) {
        if (rule.match.categories.some(c => normCat === c || normCat.includes(c) || c.includes(normCat))) {
          return {
            ruleId: rule.id,
            label: rule.label,
            suggested: rule.suggested,
            defaultAutoSelect: rule.defaultAutoSelect || []
          };
        }
      }
    }
  }

  // 5. Universal Fallback
  const fallback = PRODUCT_ATTRIBUTE_SUGGESTION_RULES.find(r => r.id === 'default_general');
  const dynamicLabel = subcategory || category || 'Product';
  return {
    ruleId: 'default_general',
    label: dynamicLabel,
    suggested: fallback ? fallback.suggested : ['Size', 'Volume', 'Weight'],
    defaultAutoSelect: fallback ? fallback.defaultAutoSelect : ['Size']
  };
}

const ATTR_MASTER_STORAGE_KEY = 'salbeau_universal_attribute_master';
const CAT_ATTR_STORAGE_KEY = 'salbeau_category_attributes_map';

/**
 * Load Attribute Master from Supabase (fallback to localStorage, fallback to default)
 */
export async function loadAttributeMasterFromDb() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, logo')
      .eq('id', 'app_attribute_master_config')
      .maybeSingle();

    if (!error && data && data.logo) {
      const parsed = JSON.parse(data.logo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(ATTR_MASTER_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error fetching attribute master from Supabase:', e);
  }

  try {
    const local = localStorage.getItem(ATTR_MASTER_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_ATTRIBUTES;
}

/**
 * Save Attribute Master to Supabase & localStorage
 */
export async function saveAttributeMasterToDb(attributesList) {
  try {
    localStorage.setItem(ATTR_MASTER_STORAGE_KEY, JSON.stringify(attributesList));
    const payload = {
      id: 'app_attribute_master_config',
      name: 'Universal Attribute Master Config',
      logo: JSON.stringify(attributesList),
      enabled: false
    };
    await supabase.from('brands').upsert(payload);
    return { success: true };
  } catch (e) {
    console.warn('Error saving attribute master to Supabase:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Load Category Attributes Map from Supabase (fallback to localStorage, fallback to default)
 */
export async function loadCategoryAttributeMapFromDb() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, logo')
      .eq('id', 'app_category_attributes_config')
      .maybeSingle();

    if (!error && data && data.logo) {
      const parsed = JSON.parse(data.logo);
      if (parsed && typeof parsed === 'object') {
        localStorage.setItem(CAT_ATTR_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error fetching category attribute mapping from Supabase:', e);
  }

  try {
    const local = localStorage.getItem(CAT_ATTR_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {}

  return DEFAULT_CATEGORY_ATTRIBUTES_MAP;
}

/**
 * Save Category Attributes Map to Supabase & localStorage
 */
export async function saveCategoryAttributeMapToDb(categoryMap) {
  try {
    localStorage.setItem(CAT_ATTR_STORAGE_KEY, JSON.stringify(categoryMap));
    const payload = {
      id: 'app_category_attributes_config',
      name: 'Category Attributes Mapping Config',
      logo: JSON.stringify(categoryMap),
      enabled: false
    };
    await supabase.from('brands').upsert(payload);
    return { success: true };
  } catch (e) {
    console.warn('Error saving category attributes map to Supabase:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Generate Cartesian Product of Attribute Values arrays
 * Example:
 * input: [
 *   { attribute: 'Shade', values: [{ name: 'Ruby Red', hexColor: '#C2185B' }, { name: 'Rose Mauve', hexColor: '#AD1457' }] },
 *   { attribute: 'Finish', values: [{ name: 'Matte' }, { name: 'Satin' }] },
 *   { attribute: 'Size', values: [{ name: '5g' }] }
 * ]
 * output: array of generated variant objects with combinations
 */
export function generateCartesianVariants(selectedAttributesWithOptions, baseProduct = {}) {
  const validAttributes = selectedAttributesWithOptions.filter(
    attr => attr.selectedValues && attr.selectedValues.length > 0
  );

  if (validAttributes.length === 0) return [];

  const cartesian = (arrays) => {
    return arrays.reduce((acc, curr) => {
      const res = [];
      acc.forEach(a => {
        curr.forEach(b => {
          res.push([...a, b]);
        });
      });
      return res;
    }, [[]]);
  };

  const valuesArrays = validAttributes.map(attr => 
    attr.selectedValues.map(val => ({
      attributeName: attr.name,
      attributeId: attr.id,
      valueName: typeof val === 'object' ? val.name : val,
      hexColor: typeof val === 'object' ? val.hexColor : undefined,
      code: typeof val === 'object' ? val.code : undefined
    }))
  );

  const combinations = cartesian(valuesArrays);
  const parentMrp = Number(baseProduct.mrp) || 1000;
  const roleDiscounts = baseProduct.roleDiscounts || {};
  const calcRole = (roleKey, fallbackVal) => {
    const pct = roleDiscounts[roleKey];
    if (pct !== undefined && pct !== null && pct !== '' && !isNaN(Number(pct))) {
      return Math.max(0, Math.round(parentMrp * (1 - Number(pct) / 100)));
    }
    return fallbackVal;
  };
  const parentGeneral = baseProduct.generalPrice !== undefined && baseProduct.generalPrice !== ''
    ? Number(baseProduct.generalPrice)
    : calcRole('general', parentMrp);
  const parentSalon = baseProduct.salonPrice !== undefined && baseProduct.salonPrice !== ''
    ? Number(baseProduct.salonPrice)
    : calcRole('salon', parentMrp);
  const parentArtist = baseProduct.artistPrice !== undefined && baseProduct.artistPrice !== ''
    ? Number(baseProduct.artistPrice)
    : calcRole('artist', parentMrp);
  const parentBeautician = baseProduct.beauticianPrice !== undefined && baseProduct.beauticianPrice !== ''
    ? Number(baseProduct.beauticianPrice)
    : calcRole('beautician', parentMrp);
  const parentSku = (baseProduct.sku || '').trim();
  const parentImage = (baseProduct.images && baseProduct.images[0]) || baseProduct.image || '';

  return combinations.map((combo, index) => {
    const variantName = combo.map(c => c.valueName).join(' / ');
    const attributesMap = {};
    let dominantHex = undefined;

    combo.forEach(c => {
      attributesMap[c.attributeName] = c.valueName;
      if (c.hexColor) dominantHex = c.hexColor;
    });

    const skuSuffix = combo
      .map(c => (c.code || c.valueName).replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
      .join('-');

    const variantSku = parentSku ? `${parentSku}-${skuSuffix}` : `VAR-${Date.now().toString(36)}-${index + 1}`;

    return {
      id: `var_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      name: variantName,
      sku: variantSku,
      barcode: '',
      mrp: parentMrp,
      generalPrice: parentGeneral,
      salonPrice: parentSalon,
      artistPrice: parentArtist,
      beauticianPrice: parentBeautician,
      priceOverride: parentMrp,
      image: '',
      active: true,
      hexColor: dominantHex,
      attributes: attributesMap,
      selectedCombination: combo
    };
  });
}
