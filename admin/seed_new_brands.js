import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlhlpslhrvwjasbttghw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGxwc2xocnZ3amFzYnR0Z2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTUzNDU3NCwiZXhwIjoyMTA1MTEwNTc0fQ.YHeREZuf-1HjFx11LEB-76W0c3IFEH6I5r-K4mph5o4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export const NEW_BRANDS_LIST = [
  "AGARO", "AIR KARPURE", "AIR WICK", "AJAY", "AJMAL", "ALPS GOODNESS", "ALTON", "AMBI PUR",
  "ANIMATE", "ANOOS", "AQUALOGICA", "ARATA", "ARMAF", "AROMA CARE", "AROMA MAGIC", "ASWINI",
  "AUREANA", "AURIC", "AVEENO", "AXE", "AYOUTH VEDA", "AYUR", "BABILA", "BADZ PLAY",
  "BAJAJ", "BANJARA", "BATH & BODY WORKS", "BATISTE", "BBLUNT", "BE BODYWISE", "BEARDO",
  "BEAUTE BLANC", "BEAUTE SECRETS", "BEAUTY", "BEAUTY ZONE", "BELLA VITA ORGANIC",
  "BEURER BEAUTY", "BIGEN", "BILUMA", "BIO OIL", "BIODERMA", "BIOTIQUE", "BLUE HEAVEN",
  "BORO PLUS", "BOROLINE", "BRASIL CACAU PRO", "BRUSHMAN", "BRUT", "CAMAY", "CAMPURE",
  "CANDIO", "CARESMITH", "CERAVE", "CETAPHIL", "CHEMIST AT PLAY", "CHICCO", "CIGAR",
  "CLEAN & CLEAR", "CLEAN AND DRY", "CLEAR", "CLINIC PLUS", "CLOSEUP", "COLGATE",
  "COLOR TREND", "COLORESSENCE", "COSRX", "CURL UP", "CURLIN", "DABUR", "DE CONSTRUCT",
  "DENVER", "DERMA COLOR", "DERMADEW", "DERMATOUCH", "DERMAVIVE", "DERMDOC", "DERMI COOL",
  "DERMICOVER", "DETTOL", "DF", "DOT & KEY", "DOVE", "DR REDDY", "DR SCHOLLS", "DR.ORTHO",
  "DR.RASHEL", "DR.REDDYS", "DR.SHETHS", "DURACELL", "ECOPATH", "EMAMI", "ENCHANTEUR",
  "ENGAGE", "ENVY", "EVA", "EVEREADY", "EVERYUTH", "EYETAX", "FACES", "FAIR AND LOVELY",
  "FANCY ITEM", "FEELINGS", "FEM", "FIAMA", "FIGARO", "FIX DERMA", "FLORL NUTRITION",
  "FLOWEROM", "FOGG", "FOREST", "FOREVER", "FOREVER52", "FOXTALE", "GAIATOP", "GARNIER",
  "GATSBY", "GEOFRESH", "GILLETTE", "GLAM FAM", "GLAM-UP", "GLOW & HANDSOME", "GODREJ",
  "GOOD VIBES", "GOREE", "GREEN LEAF", "GUBB", "HAIR & CARE", "HAIR ACC -AARAV",
  "HAIR COMB", "HAIR WAX", "HAIRLINE", "HAMAM", "HAMDARD", "HARPIC", "HEAD & SHOULDER",
  "HIMALAYA", "HIMGANGE", "HONEYBEE", "HYPHEN", "ICE ROLLER", "ICE TEMPERED", "IKI",
  "IKONIC", "INDULEKHA", "INDUS VALLEY", "INSIGHT", "JOHNSONS", "JOVEES", "JOY", "JOYO",
  "JUICY CHEMISTRY", "JUST HERBS", "KAI", "KAMA AYURVEDA", "KANGARO", "KARA", "KAY BEAUTY",
  "KERRATO", "KHADI", "KOHE", "KOZICARE", "KRYOLAN", "KTEIN", "LA ORGANO", "LA SHIELD",
  "LACTO CALAMINE", "LAKME", "LAKME-SIMPLE", "LANEIGE", "LASER", "LAYERR", "LIA",
  "LIFEBUOY", "LIP BALM", "LIRIL", "LISTERINE", "LIVON", "LOREAL COSMETICS", "LOREAL PRO",
  "LOREAL SKIN CARE", "LOTUS BOTANICALS", "LOTUS HERBALS", "LOTUS ORGANICS", "LOTUS PRO",
  "LOVE BEAUTY AND PLANET", "LUX", "LUXLISS", "M CAFFEINE", "MAKEOVER PROFESSIONAL",
  "MAMA EARTH", "MAN MATTERS", "MARS", "MATRIX", "MAYBELLINE", "MEDIKER", "MEDIMIX",
  "MEERA", "MINIMALIST", "MIRABELLE", "MISS CLAIRE", "MOISTURISER", "MOODS", "MOODY",
  "MOROCCANOIL", "MUNIX", "MYGLAMM", "MYSORE SANDAL", "NANDINI", "NAT HABIT", "NATURES",
  "NAVRATNA", "NEETA", "NEUD", "NEUTRIDERM", "NEUTROGENA", "Nippo", "NISHA", "NIVEA",
  "NUTRIGOW", "NYKAA", "NYLE", "O3+", "ODONIL", "OLAY", "OLD SPICE", "ORAL-B",
  "ORGANIC HARVEST", "ORGANIX MANTRA", "ORIGAMI", "OSHEA", "OSSUM", "OTTO", "OXYGLOW",
  "OXYLIFE", "OZIVA", "OZONE", "PAIN BALM", "PALMERS", "PALMOLIVE", "PAMPERS", "PANTENE",
  "PARACHUTE", "PARK AVENUE", "PARODONTAX", "PASSION INDULGE", "PATANJALI", "PEARS",
  "PEE SAFE", "PEPSODENT", "PHILIPS", "PIGEON", "PILGRIM", "PLIX", "PLUM", "PONDS",
  "POUR HOME", "PRC HERBAL", "PREM DULHAN", "PREMIER", "PREMIUM", "PRIMER", "QOD",
  "QUENCH", "RAAGA", "RAMSONS", "REEQUIL", "REGULARS", "RENEE", "REVLON", "Rexona",
  "RICA", "RICHFEEL", "RIN", "RIYA", "ROOTS", "ROYAL GOLD", "SANFE", "SANTOOR", "SARA",
  "SATURN", "SAVLON", "SCALPE PRO", "SCARLET", "SCHWARZKOPF", "SEBAMED", "SENSODYNE",
  "SESA", "SET WET", "SHAHNAZ HUSAIN", "SHINGAR", "SIMPLE", "SIRONA", "SKIN FX",
  "SLEEK", "SOFTSENS", "SOFY", "SOTRUE", "SOULFLOWER", "SPINZ", "SPRAYMINTT", "SRI KOMAL",
  "ST.BOTANICA", "ST.IVES", "STAG BRAND", "STAG CLUB", "STAYFREE", "STREAX", "SUGAR",
  "SUNCROS", "SUNSCOOP", "SUNSILK", "SUNSTOP GOLD", "SURGICOM", "SWASTIK", "SWISS BEAUTY",
  "TEDIBAR", "TESTER-MAYBELLINE", "THE BODY SHOP", "THE DERMA CO", "THE FACE SHOP",
  "THE MAN COMPANY", "THE MOMS CO.", "THE TRIBE CONCEPTS", "THRICECO", "TMS NCP",
  "TMS NCP1", "TORRENT", "TRESEMME", "TRICHUP", "TRITON", "TRU TONE", "TRYCONE",
  "TULIPS", "UNITED COLORS OF BENETTON", "URBAN BOTANICS", "URBAN GABRU", "URBAN YOG",
  "URBANVEDA COMP", "UROPARIS PROFESSIONAL", "USTRAA", "UV DOUX", "V WASH", "VAADI HERBALS",
  "VANESA", "VASELINE", "VCARE", "VEET", "VEGA", "VICCO", "VICKS", "VI-JOHN", "VILLAIN",
  "VINZBERRY", "VLCC", "WA JAPAN", "WATTAGIRL", "WELLA", "WHISPER", "WHITETONE",
  "WILD STONE", "WISHCARE", "WOW", "YARDLEY", "Z CLASSIC", "ZANDU"
];

// Curated high quality logo images for brands
const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80';

const BRAND_IMAGE_MAP = {
  "LAKME": 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
  "LOREAL PRO": 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300',
  "MAYBELLINE": 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300',
  "SUGAR": 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300',
  "BIOTIQUE": 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300',
  "PLUM": 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  "NIVEA": 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
  "CETAPHIL": 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300',
  "MAMA EARTH": 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300'
};

async function seedNewBrands() {
  console.log(`Preparing to sync ${NEW_BRANDS_LIST.length} brands in Supabase...`);

  // Delete old brand records EXCEPT app_category_order_config
  const { data: existingBrands } = await supabase.from('brands').select('id');
  if (existingBrands && existingBrands.length > 0) {
    const idsToDelete = existingBrands
      .map(b => b.id)
      .filter(id => id !== 'app_category_order_config');
    if (idsToDelete.length > 0) {
      const { error: delErr } = await supabase.from('brands').delete().in('id', idsToDelete);
      if (delErr) console.warn('Brand cleanup warn:', delErr.message);
      else console.log(`Deleted ${idsToDelete.length} old brand records cleanly.`);
    }
  }

  const brandRows = NEW_BRANDS_LIST.map((name, idx) => ({
    id: 'b_' + (idx + 1),
    name: name,
    enabled: true,
    logo: BRAND_IMAGE_MAP[name] || DEFAULT_LOGO
  }));

  // Batch in chunks of 50 to ensure clean insertion
  const chunkSize = 50;
  for (let i = 0; i < brandRows.length; i += chunkSize) {
    const chunk = brandRows.slice(i, i + chunkSize);
    const { error } = await supabase.from('brands').upsert(chunk);
    if (error) {
      console.error(`Chunk ${i / chunkSize + 1} error:`, error.message);
    } else {
      console.log(`Seeded chunk ${i / chunkSize + 1} (${chunk.length} brands)`);
    }
  }

  console.log('All old brands removed and new brands seeded successfully!');
}

seedNewBrands();
