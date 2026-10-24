// Beauty Category -> Subcategory -> Leaf Category Data Hierarchy
// Structured for 4-Level Navigation Flow (Nykaa / Tira / Sephora style)

export const CATEGORY_IMAGES = {
  makeup: '',
  skincare: '',
  hairCare: '',
  hairStylingTools: '',
  bathBody: '',
  fragrance: '',
  mensGrooming: '',
  nailCare: '',
  salonProducts: '',
  beautyTools: '',
  personalCare: '',
  beautyKits: '',
  eyeMakeup: '',
};

export const MAIN_CATEGORIES = [
  {
    id: 'cat_makeup',
    dbKey: 'makeup',
    name: 'Makeup',
    image: CATEGORY_IMAGES.makeup,
    fallbackImage: CATEGORY_IMAGES.makeup,
    tagline: 'Bold. Radiant. Iconic.',
    description: 'Elevate your everyday glam with luxury pigments and all-day wear',
    accent: '#C2477A',
    bgLight: '#FFF0F5',
  },
  {
    id: 'cat_skincare',
    dbKey: 'skincare',
    name: 'Skincare',
    image: CATEGORY_IMAGES.skincare,
    fallbackImage: CATEGORY_IMAGES.skincare,
    tagline: 'Glow from Within.',
    description: 'Clinically proven actives, nourishing serums and hydration rituals',
    accent: '#3A8A6A',
    bgLight: '#EEF7F3',
  },
  {
    id: 'cat_hair_care',
    dbKey: 'hair care',
    name: 'Hair Care',
    image: CATEGORY_IMAGES.hairCare,
    fallbackImage: CATEGORY_IMAGES.hairCare,
    tagline: 'Strong. Silky. Vibrant.',
    description: 'Intense repair, scalp wellness, and salon-grade restorative masks',
    accent: '#A0661E',
    bgLight: '#FDF5E8',
  },
  {
    id: 'cat_hair_styling_tools',
    dbKey: 'hair styling tools',
    name: 'Hair Styling Tools',
    image: CATEGORY_IMAGES.hairStylingTools,
    fallbackImage: CATEGORY_IMAGES.hairStylingTools,
    tagline: 'Salon Finish at Home.',
    description: 'Ionic dryers, titanium straighteners and versatile styling wands',
    accent: '#7B3FA0',
    bgLight: '#F5EEF9',
  },
  {
    id: 'cat_bath_body',
    dbKey: 'bath & body',
    name: 'Bath & Body',
    image: CATEGORY_IMAGES.bathBody,
    fallbackImage: CATEGORY_IMAGES.bathBody,
    tagline: 'Pure Indulgence.',
    description: 'Aromatic body washes, ultra-rich butters and exfoliating polishes',
    accent: '#1A7A88',
    bgLight: '#E6F5F7',
  },
  {
    id: 'cat_fragrance',
    dbKey: 'fragrance',
    name: 'Fragrance',
    image: CATEGORY_IMAGES.fragrance,
    fallbackImage: CATEGORY_IMAGES.fragrance,
    tagline: 'Your Signature Scent.',
    description: 'Artisanal perfumes, long-lasting mists and luxurious concentrated oils',
    accent: '#6B2D8A',
    bgLight: '#F3EBF9',
  },
  {
    id: 'cat_mens_grooming',
    dbKey: 'mens grooming',
    name: 'Men’s Grooming',
    image: CATEGORY_IMAGES.mensGrooming,
    fallbackImage: CATEGORY_IMAGES.mensGrooming,
    tagline: 'Sharp. Refined. Confident.',
    description: 'Precision beard care, performance hair waxes and active skincare',
    accent: '#2C3E50',
    bgLight: '#ECEFF1',
  },
  {
    id: 'cat_nail_care',
    dbKey: 'nail care',
    name: 'Nail Care',
    image: CATEGORY_IMAGES.nailCare,
    fallbackImage: CATEGORY_IMAGES.nailCare,
    tagline: 'Chic. Polished. Flawless.',
    description: 'High-shine gel polishes, strengthening treatments and nail art',
    accent: '#B03070',
    bgLight: '#FCE8F3',
  },
  {
    id: 'cat_salon_products',
    dbKey: 'professional salon products',
    name: 'Professional Salon Products',
    image: CATEGORY_IMAGES.salonProducts,
    fallbackImage: CATEGORY_IMAGES.salonProducts,
    tagline: 'Wholesale & Master Formulations.',
    description: 'Keratin systems, developer peroxides, and professional backbar tubs',
    accent: '#455A64',
    bgLight: '#ECEFF1',
  },
  {
    id: 'cat_beauty_tools',
    dbKey: 'beauty tools & accessories',
    name: 'Beauty Tools & Accessories',
    image: CATEGORY_IMAGES.beautyTools,
    fallbackImage: CATEGORY_IMAGES.beautyTools,
    tagline: 'Precision Essentials.',
    description: 'Artistry brushes, velvet blenders, jade rollers and LED mirrors',
    accent: '#D97706',
    bgLight: '#FEF3C7',
  },
  {
    id: 'cat_personal_care',
    dbKey: 'personal care & hygiene',
    name: 'Personal Care & Hygiene',
    image: CATEGORY_IMAGES.personalCare,
    fallbackImage: CATEGORY_IMAGES.personalCare,
    tagline: 'Daily Wellness & Clean Routine.',
    description: 'Intimate hygiene, gentle cottons, oral wellness and hair removal',
    accent: '#059669',
    bgLight: '#ECFDF5',
  },
  {
    id: 'cat_beauty_kits',
    dbKey: 'beauty kits & combos',
    name: 'Beauty Kits & Combos',
    image: CATEGORY_IMAGES.beautyKits,
    fallbackImage: CATEGORY_IMAGES.beautyKits,
    tagline: 'The Ultimate Gift of Beauty.',
    description: 'Curated vanity hampers, festival edition sets and multi-step rituals',
    accent: '#CE4270',
    bgLight: '#FFF0F5',
  },
];

// Subcategory Map (Level 2 & Level 3)
export const CATEGORY_DETAILS_MAP = {
  // 1. MAKEUP
  'cat_makeup': {
    title: 'Makeup',
    subcategories: [
      {
        id: 'sub_face_makeup',
        name: 'Face Makeup',
        image: '',
        tagline: 'Flawless base, contour & luminous finishes',
        leafCategories: [
          { id: 'leaf_foundation', name: 'Foundation', keywords: ['foundation', 'liquid foundation'] },
          { id: 'leaf_concealer', name: 'Concealer', keywords: ['concealer', 'corrector'] },
          { id: 'leaf_compact', name: 'Compact & Powder', keywords: ['compact', 'powder', 'setting powder'] },
          { id: 'leaf_primer', name: 'Primer', keywords: ['primer', 'base'] },
          { id: 'leaf_blush', name: 'Blush & Highlighter', keywords: ['blush', 'highlighter', 'bronzer', 'contour'] },
          { id: 'leaf_setting_spray', name: 'Setting Spray', keywords: ['setting spray', 'fixer'] }
        ]
      },
      {
        id: 'sub_lip_makeup',
        name: 'Lip Makeup',
        image: '',
        tagline: 'Statement pout with hydration and bold payoff',
        leafCategories: [
          { id: 'leaf_lipstick', name: 'Lipstick', keywords: ['lipstick', 'matte lipstick', 'bullet'] },
          { id: 'leaf_liquid_lipstick', name: 'Liquid Lipstick', keywords: ['liquid lipstick', 'lip ink', 'matte ink'] },
          { id: 'leaf_lip_gloss', name: 'Lip Gloss', keywords: ['lip gloss', 'gloss', 'shine'] },
          { id: 'leaf_lip_liner', name: 'Lip Liner', keywords: ['lip liner', 'lip pencil', 'definer'] },
          { id: 'leaf_lip_balm', name: 'Lip Balm / Tint', keywords: ['lip balm', 'lip tint', 'lip butter', 'lip care'] }
        ]
      },
      {
        id: 'sub_eye_makeup',
        name: 'Eye Makeup',
        image: '',
        tagline: 'Magnetic eyes, winged precision & dramatic volume',
        leafCategories: [
          { id: 'leaf_kajal', name: 'Kajal & Kohl', keywords: ['kajal', 'kohl'] },
          { id: 'leaf_eyeliner', name: 'Eyeliner', keywords: ['eyeliner', 'liquid liner', 'gel liner', 'pen liner'] },
          { id: 'leaf_mascara', name: 'Mascara', keywords: ['mascara', 'lash'] },
          { id: 'leaf_eyeshadow', name: 'Eyeshadow', keywords: ['eyeshadow', 'palette', 'pigment'] },
          { id: 'leaf_eyebrows', name: 'Eyebrow Definers', keywords: ['brow', 'eyebrow', 'brow pencil'] }
        ]
      },
      {
        id: 'sub_nails_group',
        name: 'Nails',
        image: '',
        tagline: 'Salon manicure finishes in vibrant hues',
        leafCategories: [
          { id: 'leaf_nail_polish', name: 'Nail Polish', keywords: ['nail polish', 'nail enamel', 'lacquer'] },
          { id: 'leaf_gel_polish', name: 'Gel Polish', keywords: ['gel polish', 'gel nail', 'uv gel'] },
          { id: 'leaf_nail_remover', name: 'Nail Polish Remover', keywords: ['nail remover', 'acetone'] }
        ]
      },
      {
        id: 'sub_makeup_tools',
        name: 'Makeup Tools',
        image: '',
        tagline: 'Professional blending tools and brushes',
        leafCategories: [
          { id: 'leaf_brushes', name: 'Makeup Brushes', keywords: ['brush', 'brush set', 'kabuki'] },
          { id: 'leaf_sponges', name: 'Beauty Sponges', keywords: ['sponge', 'blender', 'puff'] },
          { id: 'leaf_curlers', name: 'Eyelash Curlers', keywords: ['curler', 'lash curler'] }
        ]
      },
      {
        id: 'sub_makeup_kits',
        name: 'Makeup Kits & Palettes',
        image: '',
        tagline: 'All-in-one vanity editions & bridal essentials',
        leafCategories: [
          { id: 'leaf_all_in_one', name: 'All-In-One Palettes', keywords: ['palette', 'all-in-one', 'combo palette'] },
          { id: 'leaf_bridal_kits', name: 'Bridal Kits', keywords: ['bridal kit', 'makeup kit', 'glam kit'] }
        ]
      }
    ]
  },

  // 2. SKINCARE
  'cat_skincare': {
    title: 'Skincare',
    subcategories: [
      {
        id: 'sub_cleansers',
        name: 'Cleansers & Facewash',
        image: '',
        tagline: 'Deep purify without stripping natural moisture',
        leafCategories: [
          { id: 'leaf_face_wash', name: 'Face Wash', keywords: ['face wash', 'cleanser', 'foaming wash'] },
          { id: 'leaf_micellar', name: 'Micellar Water', keywords: ['micellar', 'cleansing water', 'makeup remover'] },
          { id: 'leaf_scrub', name: 'Face Scrub & Exfoliator', keywords: ['scrub', 'exfoliator', 'peeling'] }
        ]
      },
      {
        id: 'sub_serums',
        name: 'Serums & Treatments',
        image: '',
        tagline: 'High-potency actives for targeted skin concerns',
        leafCategories: [
          { id: 'leaf_face_serum', name: 'Face Serums', keywords: ['serum', 'concentrate', 'ampoule'] },
          { id: 'leaf_vit_c', name: 'Vitamin C & Brightening', keywords: ['vitamin c', 'brightening', 'radiance'] },
          { id: 'leaf_hyaluronic', name: 'Hyaluronic & Hydrating', keywords: ['hyaluronic', 'hydration', 'plumping'] }
        ]
      },
      {
        id: 'sub_moisturizers',
        name: 'Moisturizers & Creams',
        image: '',
        tagline: '24-hour hydration barrier and supple skin',
        leafCategories: [
          { id: 'leaf_day_cream', name: 'Day Cream', keywords: ['day cream', 'moisturizer', 'daily lotion'] },
          { id: 'leaf_night_cream', name: 'Night Cream', keywords: ['night cream', 'repair cream', 'sleeping cream'] },
          { id: 'leaf_face_gel', name: 'Gel Moisturizers', keywords: ['gel', 'water cream', 'aloe'] }
        ]
      },
      {
        id: 'sub_sunscreen',
        name: 'Sun Protection',
        image: '',
        tagline: 'Broad-spectrum UV shields without white cast',
        leafCategories: [
          { id: 'leaf_sunscreen_gel', name: 'Sunscreen Gel & Matte', keywords: ['sunscreen', 'sunblock', 'spf', 'uv'] },
          { id: 'leaf_after_sun', name: 'After Sun & Soothing', keywords: ['after sun', 'soothing gel'] }
        ]
      },
      {
        id: 'sub_masks',
        name: 'Masks & Peels',
        image: '',
        tagline: 'Weekly detox and instant radiance rituals',
        leafCategories: [
          { id: 'leaf_sheet_mask', name: 'Sheet Masks', keywords: ['sheet mask', 'facial mask'] },
          { id: 'leaf_clay_mask', name: 'Clay & Mud Masks', keywords: ['clay mask', 'mud mask', 'detox mask'] }
        ]
      }
    ]
  },

  // 3. HAIR CARE
  'cat_hair_care': {
    title: 'Hair Care',
    subcategories: [
      {
        id: 'sub_shampoo_cond',
        name: 'Shampoo & Conditioner',
        image: '',
        tagline: 'Cleanse and soften for silky, manageable strands',
        leafCategories: [
          { id: 'leaf_shampoo', name: 'Shampoo', keywords: ['shampoo', 'hair wash', 'cleansing rinse'] },
          { id: 'leaf_conditioner', name: 'Conditioner', keywords: ['conditioner', 'rinse'] },
          { id: 'leaf_dry_shampoo', name: 'Dry Shampoo', keywords: ['dry shampoo'] }
        ]
      },
      {
        id: 'sub_hair_treatment',
        name: 'Hair Masks & Spa',
        image: '',
        tagline: 'Intensive protein therapy for damaged and treated hair',
        leafCategories: [
          { id: 'leaf_hair_mask', name: 'Hair Masks & Masques', keywords: ['mask', 'masque', 'absolut repair'] },
          { id: 'leaf_hair_spa', name: 'Hair Spa Creams', keywords: ['hair spa', 'spa cream', 'deep conditioner'] },
          { id: 'leaf_hair_serum', name: 'Hair Serums', keywords: ['hair serum', 'anti frizz', 'heat protectant'] }
        ]
      },
      {
        id: 'sub_hair_oil',
        name: 'Hair Oils & Tonics',
        image: '',
        tagline: 'Traditional and cold-pressed root nourishment',
        leafCategories: [
          { id: 'leaf_hair_oil_pure', name: 'Pure Hair Oils', keywords: ['hair oil', 'argan oil', 'onion oil', 'rosemary'] },
          { id: 'leaf_scalp_tonic', name: 'Scalp Tonics', keywords: ['tonic', 'scalp serum'] }
        ]
      },
      {
        id: 'sub_hair_colour',
        name: 'Hair Colour',
        image: '',
        tagline: 'Rich, multi-dimensional salon and home shades',
        leafCategories: [
          { id: 'leaf_permanent_colour', name: 'Hair Colour Kits', keywords: ['hair colour', 'hair dye', 'colour cream'] },
          { id: 'leaf_root_touchup', name: 'Root Touch-Up', keywords: ['root touch up', 'temporary spray'] }
        ]
      }
    ]
  },

  // 4. HAIR STYLING TOOLS
  'cat_hair_styling_tools': {
    title: 'Hair Styling Tools',
    subcategories: [
      {
        id: 'sub_dryers',
        name: 'Hair Dryers',
        image: '',
        tagline: 'Fast drying ionic tech that seals moisture',
        leafCategories: [
          { id: 'leaf_pro_dryer', name: 'Professional Dryers', keywords: ['dryer', 'blow dryer', 'ionic'] },
          { id: 'leaf_compact_dryer', name: 'Travel Dryers', keywords: ['compact dryer', 'travel dryer'] }
        ]
      },
      {
        id: 'sub_straighteners',
        name: 'Straighteners & Flat Irons',
        image: '',
        tagline: 'Silky smooth glass hair in a single pass',
        leafCategories: [
          { id: 'leaf_ceramic_iron', name: 'Ceramic Straighteners', keywords: ['straightener', 'flat iron', 'ceramic'] },
          { id: 'leaf_titanium_iron', name: 'Titanium Straighteners', keywords: ['titanium straightener', 'pro iron'] }
        ]
      },
      {
        id: 'sub_curlers',
        name: 'Curling Irons & Wands',
        image: '',
        tagline: 'Voluminous beach waves and sculpted curls',
        leafCategories: [
          { id: 'leaf_curling_wand', name: 'Curling Wands', keywords: ['curling wand', 'curler', 'tong'] },
          { id: 'leaf_multi_styler', name: 'Multi-Stylers', keywords: ['multi styler', 'hot air brush'] }
        ]
      }
    ]
  },

  // 5. BATH & BODY
  'cat_bath_body': {
    title: 'Bath & Body',
    subcategories: [
      {
        id: 'sub_body_wash',
        name: 'Shower Gels & Soaps',
        image: '',
        tagline: 'Invigorating lather with botanical essences',
        leafCategories: [
          { id: 'leaf_shower_gel', name: 'Shower Gel', keywords: ['shower gel', 'body wash'] },
          { id: 'leaf_soap_bar', name: 'Artisan Soaps', keywords: ['soap', 'soap bar'] }
        ]
      },
      {
        id: 'sub_body_moisturizer',
        name: 'Body Lotions & Butters',
        image: '',
        tagline: 'Silky softness with shea butter & ceramides',
        leafCategories: [
          { id: 'leaf_body_lotion', name: 'Body Lotions', keywords: ['body lotion', 'body milk'] },
          { id: 'leaf_body_butter', name: 'Body Butters', keywords: ['body butter', 'shea butter'] },
          { id: 'leaf_body_oil', name: 'Body Oils', keywords: ['body oil', 'glowing oil'] }
        ]
      },
      {
        id: 'sub_body_scrubs',
        name: 'Body Scrubs & Polishes',
        image: '',
        tagline: 'Buff away dullness for baby-soft skin',
        leafCategories: [
          { id: 'leaf_sugar_scrub', name: 'Body Scrubs', keywords: ['body scrub', 'sugar scrub', 'coffee scrub'] }
        ]
      }
    ]
  },

  // 6. FRAGRANCE
  'cat_fragrance': {
    title: 'Fragrance',
    subcategories: [
      {
        id: 'sub_womens_perfume',
        name: "Women's Perfumes",
        image: '',
        tagline: 'Floral, oriental & gourmand luxury notes',
        leafCategories: [
          { id: 'leaf_edp_women', name: 'Eau De Parfum (EDP)', keywords: ['perfume', 'edp', 'eau de parfum'] },
          { id: 'leaf_edt_women', name: 'Eau De Toilette (EDT)', keywords: ['edt', 'eau de toilette'] }
        ]
      },
      {
        id: 'sub_body_mists',
        name: 'Body Mists & Deodorants',
        image: '',
        tagline: 'Light, all-day refreshing spritzes',
        leafCategories: [
          { id: 'leaf_body_mist', name: 'Body Mists', keywords: ['body mist', 'fragrance mist'] },
          { id: 'leaf_deodorant', name: 'Deodorants & Roll-Ons', keywords: ['deo', 'deodorant', 'roll on'] }
        ]
      },
      {
        id: 'sub_attars',
        name: 'Attars & Concentrates',
        image: '',
        tagline: 'Pure non-alcoholic concentrated essences',
        leafCategories: [
          { id: 'leaf_attar_oil', name: 'Pure Attar', keywords: ['attar', 'perfume oil', 'concentrated oil'] }
        ]
      }
    ]
  },

  // 7. MEN'S GROOMING
  'cat_mens_grooming': {
    title: 'Men’s Grooming',
    subcategories: [
      {
        id: 'sub_beard_care',
        name: 'Beard Care',
        image: '',
        tagline: 'Shape, soften and condition facial hair',
        leafCategories: [
          { id: 'leaf_beard_oil', name: 'Beard Oil & Balms', keywords: ['beard oil', 'beard balm', 'beard growth'] },
          { id: 'leaf_beard_wash', name: 'Beard Wash', keywords: ['beard wash', 'beard shampoo'] }
        ]
      },
      {
        id: 'sub_shaving',
        name: 'Shaving Essentials',
        image: '',
        tagline: 'Ultra-glide lather and soothing aftershaves',
        leafCategories: [
          { id: 'leaf_shave_foam', name: 'Shaving Foam & Gel', keywords: ['shaving foam', 'shave cream', 'shave gel'] },
          { id: 'leaf_aftershave', name: 'Aftershave Balms', keywords: ['aftershave', 'after shave'] }
        ]
      },
      {
        id: 'sub_men_hair',
        name: 'Men Hair Styling',
        image: '',
        tagline: 'Matte pomades, strong clays and hair waxes',
        leafCategories: [
          { id: 'leaf_hair_wax', name: 'Hair Wax & Pomades', keywords: ['hair wax', 'pomade', 'hair clay', 'styling gel'] }
        ]
      }
    ]
  },

  // 8. NAIL CARE
  'cat_nail_care': {
    title: 'Nail Care',
    subcategories: [
      {
        id: 'sub_nail_lacquers',
        name: 'Nail Polishes',
        image: '',
        tagline: 'Vibrant non-chipping shades and quick-dry formulas',
        leafCategories: [
          { id: 'leaf_lacquer_gloss', name: 'Glossy Enamels', keywords: ['nail polish', 'glossy polish', 'enamel'] },
          { id: 'leaf_lacquer_matte', name: 'Matte & Chrome', keywords: ['matte nail', 'chrome polish', 'glitter'] }
        ]
      },
      {
        id: 'sub_gel_nails',
        name: 'Gel Systems & Treatments',
        image: '',
        tagline: 'Long-wear salon durability and cuticle health',
        leafCategories: [
          { id: 'leaf_gel_system', name: 'Gel Polishes', keywords: ['gel polish', 'gel coat'] },
          { id: 'leaf_nail_treat', name: 'Cuticle & Nail Care', keywords: ['cuticle oil', 'nail strengthener'] }
        ]
      }
    ]
  },

  // 9. PROFESSIONAL SALON PRODUCTS
  'cat_salon_products': {
    title: 'Professional Salon Products',
    subcategories: [
      {
        id: 'sub_salon_hair',
        name: 'Professional Hair Treatments',
        image: '',
        tagline: 'Keratin, botoplex and salon backbar solutions',
        leafCategories: [
          { id: 'leaf_keratin', name: 'Keratin & Smoothening', keywords: ['keratin', 'smoothening', 'botoplex', 'straightening cream'] },
          { id: 'leaf_salon_spa', name: 'Professional Hair Spa', keywords: ['absolut repair', 'hair spa', 'salon tub', 'backbar'] }
        ]
      },
      {
        id: 'sub_salon_colour',
        name: 'Salon Hair Colour & Developers',
        image: '',
        tagline: 'Master shade tubes and calibrated peroxide volumes',
        leafCategories: [
          { id: 'leaf_pro_tube', name: 'Professional Colour Tubes', keywords: ['colour tube', 'majirel', 'inoa'] },
          { id: 'leaf_developer', name: 'Developers & Peroxides', keywords: ['developer', 'peroxide', 'vol 20', 'vol 30'] }
        ]
      },
      {
        id: 'sub_salon_skin',
        name: 'Facial Kits & Skin Solutions',
        image: '',
        tagline: 'Multi-step diamond, gold and bridal facial kits',
        leafCategories: [
          { id: 'leaf_facial_kit', name: 'Salon Facial Kits', keywords: ['facial kit', 'diamond facial', 'gold facial', 'o3+'] }
        ]
      }
    ]
  },

  // 10. BEAUTY TOOLS & ACCESSORIES
  'cat_beauty_tools': {
    title: 'Beauty Tools & Accessories',
    subcategories: [
      {
        id: 'sub_tools_brushes',
        name: 'Makeup Brushes & Kits',
        image: '',
        tagline: 'Dense ultra-soft synthetic bristles for blending',
        leafCategories: [
          { id: 'leaf_brush_set', name: 'Brush Sets', keywords: ['brush set', 'pro brushes'] },
          { id: 'leaf_single_brush', name: 'Individual Face & Eye Brushes', keywords: ['blending brush', 'foundation brush'] }
        ]
      },
      {
        id: 'sub_tools_facial',
        name: 'Facial & Massage Tools',
        image: '',
        tagline: 'Lymphatic drainage and sculpting stones',
        leafCategories: [
          { id: 'leaf_gua_sha', name: 'Gua Sha & Jade Rollers', keywords: ['gua sha', 'jade roller', 'facial roller'] }
        ]
      },
      {
        id: 'sub_tools_sponges',
        name: 'Sponges & Blenders',
        image: '',
        tagline: 'Porous bouncy blenders for streak-free foundation',
        leafCategories: [
          { id: 'leaf_blender_sponge', name: 'Beauty Sponges', keywords: ['blender', 'sponge', 'powder puff'] }
        ]
      }
    ]
  },

  // 11. PERSONAL CARE & HYGIENE
  'cat_personal_care': {
    title: 'Personal Care & Hygiene',
    subcategories: [
      {
        id: 'sub_fem_hygiene',
        name: 'Feminine Hygiene',
        image: '',
        tagline: 'Gentle intimate wellness and pure cotton comfort',
        leafCategories: [
          { id: 'leaf_intimate_wash', name: 'Intimate Washes', keywords: ['intimate wash', 'feminine wash'] },
          { id: 'leaf_pads', name: 'Sanitary Care', keywords: ['pads', 'sanitary napkin', 'tampons'] }
        ]
      },
      {
        id: 'sub_hair_removal',
        name: 'Hair Removal & Razors',
        image: '',
        tagline: 'Painless smooth skin solutions',
        leafCategories: [
          { id: 'leaf_face_razors', name: 'Facial Razors & Wax Strips', keywords: ['razor', 'facial razor', 'wax strips'] }
        ]
      }
    ]
  },

  // 12. BEAUTY KITS & COMBOS
  'cat_beauty_kits': {
    title: 'Beauty Kits & Combos',
    subcategories: [
      {
        id: 'sub_gift_hampers',
        name: 'Luxury Gift Sets & Hampers',
        image: '',
        tagline: 'Elegantly packaged beauty sets for celebrations',
        leafCategories: [
          { id: 'leaf_gift_box', name: 'Curated Gift Boxes', keywords: ['gift set', 'gift box', 'hamper'] },
          { id: 'leaf_combo_duo', name: 'Beauty Duos & Sets', keywords: ['combo', 'duo', 'value pack'] }
        ]
      },
      {
        id: 'sub_travel_kits',
        name: 'Travel Minis & Essentials',
        image: '',
        tagline: 'Carry-on approved beauty favorites',
        leafCategories: [
          { id: 'leaf_mini_set', name: 'Travel Minis', keywords: ['travel kit', 'mini', 'starter kit'] }
        ]
      }
    ]
  }
};

// Helper: Normalize strings for fuzzy matching
export const normalizeStr = (str) => (str || '').toLowerCase().trim();

// Live Dynamic Subcategories & Categories Store (Synced real-time from Supabase)
let liveCategoriesList = null;
let liveSubcategoriesList = null;
let liveLeafCategoriesList = null;
let liveHierarchyTimestamp = Date.now();

export const setLiveCategoryHierarchy = (hierarchyData) => {
  if (hierarchyData) {
    if (Array.isArray(hierarchyData.categories)) {
      liveCategoriesList = hierarchyData.categories;
    }
    if (Array.isArray(hierarchyData.subcategories)) {
      liveSubcategoriesList = hierarchyData.subcategories;
    }
    if (Array.isArray(hierarchyData.leafCategories)) {
      liveLeafCategoriesList = hierarchyData.leafCategories;
    }
    liveHierarchyTimestamp = Date.now();
  }
};

export const getLiveHierarchyTimestamp = () => liveHierarchyTimestamp;

// Helper: Find category config by ID, name, or DB key with live database overrides
export const findCategoryConfig = (idOrName) => {
  if (!idOrName) return MAIN_CATEGORIES[0];

  // If already an object representing an active category
  if (typeof idOrName === 'object' && idOrName.name) {
    const nId = normalizeStr(idOrName.id);
    const nName = normalizeStr(idOrName.name);
    const staticBase = MAIN_CATEGORIES.find(sc =>
      normalizeStr(sc.id) === nId ||
      normalizeStr(sc.name) === nName ||
      normalizeStr(sc.dbKey) === nName
    );
    return {
      ...(staticBase || {
        id: idOrName.id,
        dbKey: idOrName.name?.toLowerCase() || '',
        tagline: 'Premium Beauty Collection',
        description: 'Explore verified authentic formulations',
        accent: '#C2477A',
        bgLight: '#FFF0F5'
      }),
      ...idOrName,
      image: idOrName.image || staticBase?.image || MAIN_CATEGORIES[0].fallbackImage,
      fallbackImage: idOrName.image || staticBase?.fallbackImage || MAIN_CATEGORIES[0].fallbackImage,
      enabled: idOrName.enabled !== false
    };
  }

  const query = typeof idOrName === 'string' ? idOrName : (idOrName.name || idOrName.id || '');
  const nq = normalizeStr(query);

  // 1. Check live categories from database
  if (liveCategoriesList && Array.isArray(liveCategoriesList)) {
    const liveMatch = liveCategoriesList.find(c =>
      normalizeStr(c.id) === nq ||
      normalizeStr(c.name) === nq ||
      (c.dbKey && normalizeStr(c.dbKey) === nq)
    );
    if (liveMatch) {
      // Find static config base if available to preserve styling accent & colors
      const staticBase = MAIN_CATEGORIES.find(sc =>
        normalizeStr(sc.name) === normalizeStr(liveMatch.name) ||
        normalizeStr(sc.dbKey) === normalizeStr(liveMatch.name)
      );
      return {
        ...(staticBase || {
          id: liveMatch.id,
          dbKey: liveMatch.name?.toLowerCase() || '',
          tagline: 'Premium Beauty Collection',
          description: 'Explore verified authentic formulations',
          accent: '#C2477A',
          bgLight: '#FFF0F5'
        }),
        id: liveMatch.id,
        name: liveMatch.name,
        image: liveMatch.image || staticBase?.image || MAIN_CATEGORIES[0].fallbackImage,
        fallbackImage: liveMatch.image || staticBase?.fallbackImage || MAIN_CATEGORIES[0].fallbackImage,
        enabled: liveMatch.enabled !== false
      };
    }
  }

  // 2. Check static MAIN_CATEGORIES
  const exact = MAIN_CATEGORIES.find(c =>
    normalizeStr(c.id) === nq ||
    normalizeStr(c.name) === nq ||
    normalizeStr(c.dbKey) === nq
  );
  if (exact) return exact;

  const partial = MAIN_CATEGORIES.find(c =>
    nq.includes(normalizeStr(c.name)) ||
    normalizeStr(c.name).includes(nq) ||
    nq.includes(normalizeStr(c.dbKey))
  );
  return partial || MAIN_CATEGORIES[0];
};

// Helper: Get subcategories for a given main category with live database overrides
export const getSubcategoriesForCategory = (catIdOrName) => {
  const cat = findCategoryConfig(catIdOrName);
  const rawQuery = typeof catIdOrName === 'string' ? catIdOrName : (catIdOrName?.id || catIdOrName?.name || '');
  const nRawQuery = normalizeStr(rawQuery);

  const catId = normalizeStr(cat?.id);
  const catName = normalizeStr(cat?.name);
  const catDbKey = normalizeStr(cat?.dbKey);

  const candidateIds = [catId, catDbKey, nRawQuery].filter(Boolean);
  const candidateNames = [catName, nRawQuery].filter(Boolean);

  // Check if live subcategories were synced from Supabase
  if (liveSubcategoriesList && Array.isArray(liveSubcategoriesList) && liveSubcategoriesList.length > 0) {
    const matched = liveSubcategoriesList.filter(s => {
      if (s.enabled === false) return false;
      const sParentId = normalizeStr(s.categoryId || s.category_id);
      const sCatName = normalizeStr(s.categoryName || s.category_name);

      const matchesId = candidateIds.includes(sParentId);
      const matchesName = candidateNames.includes(sParentId) || (sCatName && candidateNames.includes(sCatName));
      return matchesId || matchesName;
    });

    if (matched.length > 0) {
      return matched
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
        .map(s => {
          // If subcategory has leafCategories in liveLeafCategoriesList
          let matchedLeaves = [];
          if (liveLeafCategoriesList && Array.isArray(liveLeafCategoriesList)) {
            matchedLeaves = liveLeafCategoriesList.filter(l =>
              l.enabled !== false &&
              ((l.subcategoryId && normalizeStr(l.subcategoryId) === normalizeStr(s.id)) ||
              (l.subcategoryId && normalizeStr(l.subcategoryId) === normalizeStr(s.name)))
            );
          }
          if (matchedLeaves.length === 0 && Array.isArray(s.leafCategories) && s.leafCategories.length > 0) {
            matchedLeaves = s.leafCategories.filter(l => l.enabled !== false);
          }

          // If still empty, check static CATEGORY_DETAILS_MAP by checking d.title or d.name
          if (matchedLeaves.length === 0) {
            const staticDetail = CATEGORY_DETAILS_MAP[cat?.id] || Object.values(CATEGORY_DETAILS_MAP).find(d =>
              normalizeStr(d.title) === catName || normalizeStr(d.name) === catName
            );
            const staticMatch = staticDetail?.subcategories?.find(ss =>
              normalizeStr(ss.name) === normalizeStr(s.name) || ss.id === s.id
            );
            if (staticMatch?.leafCategories) {
              matchedLeaves = staticMatch.leafCategories;
            }
          }

          // Append cache invalidation query if image is from Supabase Storage
          let cleanImage = s.image;
          if (cleanImage && cleanImage.includes('/storage/v1/object/public/')) {
            cleanImage = cleanImage.includes('?') ? `${cleanImage}&t=${liveHierarchyTimestamp}` : `${cleanImage}?t=${liveHierarchyTimestamp}`;
          }

          return {
            ...s,
            image: cleanImage || '',
            leafCategories: matchedLeaves
          };
        });
    }
  }

  // Fallback to static CATEGORY_DETAILS_MAP by matching d.title or d.name
  const detail = CATEGORY_DETAILS_MAP[cat?.id] || Object.values(CATEGORY_DETAILS_MAP).find(d =>
    normalizeStr(d.title) === catName || normalizeStr(d.name) === catName
  );
  return detail ? detail.subcategories : [];
};

// Helper: Get leaf categories ("Select Categories") for a given subcategory
export const getLeafCategoriesForSubcategory = (subIdOrName, catIdOrName = null) => {
  const nSub = normalizeStr(typeof subIdOrName === 'string' ? subIdOrName : (subIdOrName?.id || subIdOrName?.name || ''));
  if (!nSub) return [];

  if (liveLeafCategoriesList && Array.isArray(liveLeafCategoriesList)) {
    const liveMatches = liveLeafCategoriesList.filter(l => {
      if (l.enabled === false) return false;
      const lSubId = normalizeStr(l.subcategoryId);
      const lSubName = normalizeStr(l.subcategoryName);
      return lSubId === nSub || lSubName === nSub;
    });
    if (liveMatches.length > 0) return liveMatches;
  }

  if (subIdOrName?.leafCategories && Array.isArray(subIdOrName.leafCategories)) {
    return subIdOrName.leafCategories.filter(l => l.enabled !== false);
  }

  if (catIdOrName) {
    const subs = getSubcategoriesForCategory(catIdOrName);
    const matchedSub = subs.find(s => normalizeStr(s.id) === nSub || normalizeStr(s.name) === nSub);
    if (matchedSub?.leafCategories) {
      return matchedSub.leafCategories.filter(l => l.enabled !== false);
    }
  }

  return [];
};

// Helper: Filter products dynamically based on hierarchy
export const filterProductsByHierarchy = (allProducts, categoryName, subcategoryName, leafCategory) => {
  if (!allProducts || allProducts.length === 0) return [];

  const normCat = normalizeStr(categoryName);
  const normSub = normalizeStr(subcategoryName);
  const normLeaf = normalizeStr(leafCategory?.name || (typeof leafCategory === 'string' ? leafCategory : ''));
  const keywords = Array.isArray(leafCategory?.keywords) ? leafCategory.keywords.map(k => normalizeStr(k)) : [];

  // Step 1: Filter by leaf keywords or exact leaf name / product_type if provided
  if (keywords.length > 0 || normLeaf) {
    const leafMatches = allProducts.filter(p => {
      const pCat = normalizeStr(p.category);
      const pSub = normalizeStr(p.subcategory || p.sub_category);
      const pType = normalizeStr(p.product_type || p.productType);
      const pFamily = normalizeStr(p.product_family || p.productFamily);
      const pName = normalizeStr(p.name);
      const pBrand = normalizeStr(p.brandName || p.brand_name || p.brand);
      const pKeywords = Array.isArray(p.search_keywords || p.searchKeywords)
        ? (p.search_keywords || p.searchKeywords).map(k => normalizeStr(k)).join(' ')
        : normalizeStr(p.search_keywords || p.searchKeywords);
      const fullText = `${pCat} ${pSub} ${pType} ${pFamily} ${pName} ${pBrand} ${pKeywords}`;

      if (normLeaf) {
        if (pType && (pType === normLeaf || pType.includes(normLeaf) || normLeaf.includes(pType))) return true;
        if (pCat.includes(normLeaf) || pName.includes(normLeaf) || pFamily.includes(normLeaf)) return true;
      }
      return keywords.some(k => fullText.includes(k));
    });

    if (leafMatches.length > 0) return leafMatches;
  }

  // Step 2: Filter by subcategory name
  if (normSub) {
    const subWords = normSub.split(/\s+/).filter(w => w.length > 2 && w !== 'and' && w !== '&');
    const subMatches = allProducts.filter(p => {
      const pCat = normalizeStr(p.category);
      const pSub = normalizeStr(p.subcategory || p.sub_category);
      const pType = normalizeStr(p.product_type || p.productType);
      const pName = normalizeStr(p.name);
      const fullText = `${pCat} ${pSub} ${pType} ${pName}`;
      if (pSub && (pSub === normSub || pSub.includes(normSub) || normSub.includes(pSub))) return true;
      if (fullText.includes(normSub)) return true;
      return subWords.some(w => fullText.includes(w));
    });

    if (subMatches.length > 0) return subMatches;
  }

  // Step 3: Filter by main category name
  if (normCat) {
    const catWords = normCat.split(/\s+/).filter(w => w.length > 2 && w !== 'and' && w !== '&');
    const catMatches = allProducts.filter(p => {
      const pCat = normalizeStr(p.category);
      const pName = normalizeStr(p.name);
      if (pCat === normCat || pCat.includes(normCat) || normCat.includes(pCat)) return true;
      return catWords.some(w => pCat.includes(w) || pName.includes(w));
    });

    if (catMatches.length > 0) return catMatches;
  }

  // If specific category/subcategory/leaf filter was requested but nothing matched, return empty array
  if (normCat || normSub || normLeaf) {
    return [];
  }

  // Fallback: return all products if no filter was specified
  return allProducts;
};
