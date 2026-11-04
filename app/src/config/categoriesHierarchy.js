// Beauty Category -> Subcategory -> Leaf Category Data Hierarchy
// Structured for 4-Level Navigation Flow (Nykaa / Tira / Sephora style)

export const CATEGORY_IMAGES = {
  makeup: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_makeup.png',
  skincare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_skincare.png',
  hairCare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_hair.png',
  hairStylingTools: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_appliances.png',
  bathBody: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_bath_body.png',
  fragrance: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_fragrance.png',
  mensGrooming: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_mens_grooming.png',
  nailCare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_sub_nail_art.png',
  salonProducts: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_hair.png',
  beautyTools: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_appliances.png',
  personalCare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_wellness.png',
  beautyKits: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_gifting.png',
  babyCare: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_baby_care.png',
  wellness: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_wellness.png',
  eyeMakeup: 'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/nykaa_3d_sub_eyeshadow.png',
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
        id: 'sub_face_cleansers',
        name: 'Face Cleansers',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Deep cleanse.\nFresh, healthy skin.',
        description: 'Deep cleanse.\nFresh, healthy skin.',
        productCount: 108,
        leafCategories: [
          {
            id: 'leaf_gel_cleansers',
            name: 'Gel Cleansers',
            description: 'Gentle, deep-cleansing gel formulas.',
            productCount: 32,
            keywords: ['gel cleanser', 'cleansing gel', 'gel wash'],
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
          },
          {
            id: 'leaf_foam_cleansers',
            name: 'Foam Cleansers',
            description: 'Lightweight foaming cleansers.',
            productCount: 28,
            keywords: ['foam cleanser', 'foaming cleanser', 'foam wash', 'foaming wash'],
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
          },
          {
            id: 'leaf_cream_cleansers',
            name: 'Cream Cleansers',
            description: 'Nourishing and non-drying cleansers.',
            productCount: 18,
            keywords: ['cream cleanser', 'cleansing cream', 'cleansing milk', 'nourishing cleanser'],
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
          },
          {
            id: 'leaf_oil_cleansers',
            name: 'Oil Cleansers',
            description: 'Melt away makeup and impurities.',
            productCount: 16,
            keywords: ['oil cleanser', 'cleansing oil', 'cleansing balm', 'balm'],
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
          },
          {
            id: 'leaf_micellar_cleansers',
            name: 'Micellar Cleansers',
            description: 'Cleanse, refresh and remove makeup.',
            productCount: 14,
            keywords: ['micellar', 'micellar water', 'cleansing water', 'makeup remover'],
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        id: 'sub_face_wash',
        name: 'Face Wash',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Refreshing daily washes for clear, radiant skin.',
        description: 'Pore purifying foaming gels and non-stripping creamy formulas.',
        productCount: 64,
        leafCategories: [
          { id: 'leaf_foaming_wash', name: 'Foaming Face Wash', description: 'Deep pore unclogging lather.', productCount: 24, keywords: ['foaming', 'pore wash'] },
          { id: 'leaf_gentle_wash', name: 'Gentle Gel Wash', description: 'Hydrating non-stripping daily cleanser.', productCount: 20, keywords: ['gentle wash', 'daily wash'] },
          { id: 'leaf_acne_wash', name: 'Anti-Acne & Tea Tree', description: 'Target blemishes and control excess sebum.', productCount: 20, keywords: ['tea tree', 'salicylic', 'acne wash'] }
        ]
      },
      {
        id: 'sub_toners',
        name: 'Toners & Mists',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Balance pH and prime skin for optimal absorption.',
        description: 'Hydrating essences, pore tighteners and calming facial mists.',
        productCount: 42,
        leafCategories: [
          { id: 'leaf_hydrating_toner', name: 'Hydrating Toners', description: 'Hyaluronic acid and moisture replenishing essences.', productCount: 18, keywords: ['hydrating toner', 'essence toner'] },
          { id: 'leaf_exfoliating_toner', name: 'Exfoliating & Clarifying', description: 'AHA BHA toner for smooth refined pores.', productCount: 14, keywords: ['aha toner', 'glycolic', 'pore toner'] },
          { id: 'leaf_face_mists', name: 'Face Mists', description: 'Rose water and refreshing midday hydration sprays.', productCount: 10, keywords: ['mist', 'rose water', 'spray'] }
        ]
      },
      {
        id: 'sub_serums',
        name: 'Face Serums',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'High-potency clinical actives for targeted skin concerns.',
        description: 'Vitamin C brightening, hydrating hyaluronic and youth restoring peptides.',
        productCount: 86,
        leafCategories: [
          { id: 'leaf_vit_c', name: 'Vitamin C & Brightening', description: 'Fade dark spots and boost natural glow.', productCount: 26, keywords: ['vitamin c', 'brightening', 'radiance'] },
          { id: 'leaf_hyaluronic', name: 'Hyaluronic Acid Serums', description: 'Multi-molecular intense hydration & plumpness.', productCount: 22, keywords: ['hyaluronic', 'hydration', 'plumping'] },
          { id: 'leaf_niacinamide', name: 'Niacinamide Serums', description: 'Pore refining and oil balancing treatment.', productCount: 20, keywords: ['niacinamide', 'pore serum', 'blemish'] },
          { id: 'leaf_retinol', name: 'Retinol & Anti-Aging', description: 'Boost collagen and reduce fine lines.', productCount: 18, keywords: ['retinol', 'anti-aging', 'peptide'] }
        ]
      },
      {
        id: 'sub_moisturizers',
        name: 'Face Moisturizers',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: '24-hour hydration barrier and soft supple skin.',
        description: 'Ultralight water gels, restorative ceramides and rich night creams.',
        productCount: 75,
        leafCategories: [
          { id: 'leaf_gel_cream', name: 'Gel Moisturizers', description: 'Ultralight oil-free water gel hydration.', productCount: 28, keywords: ['gel cream', 'water gel', 'oil free'] },
          { id: 'leaf_day_cream', name: 'Day Creams', description: 'Nourishing daily protection with antioxidants.', productCount: 24, keywords: ['day cream', 'daily moisturizer'] },
          { id: 'leaf_night_cream', name: 'Night Creams', description: 'Deep barrier restoration while you sleep.', productCount: 23, keywords: ['night cream', 'repair cream', 'sleeping cream'] }
        ]
      },
      {
        id: 'sub_sunscreen',
        name: 'Sunscreen',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Broad-spectrum UV shields with zero white cast.',
        description: 'Matte invisible gels, hydrating fluid lotions and effortless sun sticks.',
        productCount: 52,
        leafCategories: [
          { id: 'leaf_gel_sunscreen', name: 'Matte Gel Sunscreens', description: 'Invisible, ultra-lightweight water-resistant SPF 50.', productCount: 22, keywords: ['sunscreen', 'gel sunscreen', 'matte spf'] },
          { id: 'leaf_dewy_sunscreen', name: 'Dewy Sunscreen Lotions', description: 'Hydrating glow-finish sun fluids.', productCount: 18, keywords: ['sunscreen lotion', 'dewy spf'] },
          { id: 'leaf_sun_stick', name: 'Sun Sticks & Sprays', description: 'On-the-go reapplication without messing makeup.', productCount: 12, keywords: ['sun stick', 'spf spray', 'mist spf'] }
        ]
      },
      {
        id: 'sub_eye_care',
        name: 'Eye Care',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Target dark circles, puffiness & delicate eye contours.',
        description: 'Firming peptide creams, cooling metal rollers and brightening hydrogel patches.',
        productCount: 29,
        leafCategories: [
          { id: 'leaf_eye_cream', name: 'Under Eye Creams', description: 'Caffeine and peptide firming formulas.', productCount: 16, keywords: ['eye cream', 'caffeine eye', 'under eye'] },
          { id: 'leaf_eye_serum', name: 'Eye Serums & Rollers', description: 'Cooling metal rollerball de-puffing serums.', productCount: 13, keywords: ['eye serum', 'eye roller', 'dark circle'] }
        ]
      },
      {
        id: 'sub_face_masks',
        name: 'Face Masks & Peels',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Weekly detox and instant salon-facial radiance.',
        description: 'Serum-soaked sheet masks, purifying French clays and overnight sleeping masks.',
        productCount: 38,
        leafCategories: [
          { id: 'leaf_sheet_mask', name: 'Sheet Masks', description: 'Serum-drenched biocellulose sheets.', productCount: 20, keywords: ['sheet mask', 'facial mask'] },
          { id: 'leaf_clay_mask', name: 'Clay & Mud Masks', description: 'French green and Kaolin detoxifying clays.', productCount: 18, keywords: ['clay mask', 'mud mask', 'charcoal mask'] }
        ]
      },
      {
        id: 'sub_exfoliators',
        name: 'Exfoliators & Scrubs',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Buff away dull surface cells for velvety soft skin.',
        description: 'Gentle micro-polishes and AHA/BHA chemical exfoliation solutions.',
        productCount: 26,
        leafCategories: [
          { id: 'leaf_face_scrubs', name: 'Face Scrubs', description: 'Gentle micro-walnut & apricot seed exfoliants.', productCount: 14, keywords: ['face scrub', 'facial scrub'] },
          { id: 'leaf_peeling_solutions', name: 'Chemical Peels (AHA BHA)', description: 'Salicylic and glycolic gentle exfoliating solutions.', productCount: 12, keywords: ['peeling solution', 'aha bha', 'chemical peel'] }
        ]
      },
      {
        id: 'sub_lip_care',
        name: 'Lip Care',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
        tagline: 'Buttery lip treatments, sleeping masks & hydration tints.',
        description: 'Deep overnight berry repair, tinted nourishing balms and gentle lip scrubs.',
        productCount: 31,
        leafCategories: [
          { id: 'leaf_lip_balm', name: 'Lip Balms & Butters', description: 'Shea butter and SPF nourishment.', productCount: 18, keywords: ['lip balm', 'lip butter'] },
          { id: 'leaf_lip_sleeping_mask', name: 'Lip Sleeping Masks', description: 'Overnight berry repair and plumping.', productCount: 13, keywords: ['lip mask', 'lip sleeping mask', 'lip treatment'] }
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
  },

  // 13. WELLNESS
  'cat_wellness': {
    title: 'Wellness',
    subcategories: [
      {
        id: 'sub_supplements',
        name: 'Beauty Supplements',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
        tagline: 'Glow from within with clinical collagen & biotin.',
        description: 'Bio-active marine collagen peptides, biotin gummies and glow supplements.',
        productCount: 24,
        leafCategories: [
          { id: 'leaf_collagen', name: 'Collagen & Glutathione', description: 'Marine collagen peptides and brightening actives.', productCount: 14, keywords: ['collagen', 'glutathione'] },
          { id: 'leaf_biotin_hair', name: 'Biotin & Hair Gummies', description: 'Essential vitamins for strong hair & nails.', productCount: 10, keywords: ['biotin', 'hair vitamins', 'gummies'] }
        ]
      },
      {
        id: 'sub_aromatherapy',
        name: 'Aromatherapy & Essential Oils',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80',
        tagline: 'Calming lavender, invigorating tea tree & pure diffusers.',
        description: 'Pure essential oils, therapeutic diffusers and calming soy candles.',
        productCount: 20,
        leafCategories: [
          { id: 'leaf_essential_oils', name: 'Pure Essential Oils', description: 'Cold-pressed steam-distilled pure drops.', productCount: 12, keywords: ['essential oil', 'lavender oil', 'tea tree oil'] },
          { id: 'leaf_diffusers', name: 'Diffusers & Candles', description: 'Soothing ambience and stress relief.', productCount: 8, keywords: ['diffuser', 'scented candle'] }
        ]
      }
    ]
  }
};

// Aliases for alternate category keys
CATEGORY_DETAILS_MAP['cat_hair_styling'] = CATEGORY_DETAILS_MAP['cat_hair_styling_tools'];
CATEGORY_DETAILS_MAP['cat_gift_sets'] = CATEGORY_DETAILS_MAP['cat_beauty_kits'];

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
            image: cleanImage || cat?.image || cat?.fallbackImage || '',
            tagline: s.tagline || s.description || `Explore ${s.name}`,
            leafCategories: matchedLeaves
          };
        });
    }
  }

  // Fallback to static CATEGORY_DETAILS_MAP by matching d.title or d.name
  const detail = CATEGORY_DETAILS_MAP[cat?.id] || Object.values(CATEGORY_DETAILS_MAP).find(d =>
    normalizeStr(d.title) === catName || normalizeStr(d.name) === catName
  );
  if (!detail || !Array.isArray(detail.subcategories)) return [];
  return detail.subcategories.map(s => ({
    ...s,
    image: s.image || cat?.image || cat?.fallbackImage || ''
  }));
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
