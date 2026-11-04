/**
 * SALBEAU MAKEUPSTORE — BEAUTY COLOR PRESETS & UTILITIES
 * Pure JavaScript utility for shade palettes, hex normalization, and perceptual color matching.
 */

// Popular cosmetics / beauty shade presets (HEX format)
export const MAKEUP_SWATCH_PRESETS = [
  { name: 'Salbeau Pink', hex: '#CE4270' },
  { name: 'Ruby Red', hex: '#C2185B' },
  { name: 'Crimson', hex: '#B71C1C' },
  { name: 'Berry Wine', hex: '#880E4F' },
  { name: 'Deep Plum', hex: '#4A148C' },
  { name: 'Rose Mauve', hex: '#AD1457' },
  { name: 'Nude Blush', hex: '#D88A8A' },
  { name: 'Warm Terracotta', hex: '#D85A38' },
  { name: 'Coral Peach', hex: '#F06292' },
  { name: 'Dusty Rose', hex: '#BA68C8' },
  { name: 'Spiced Mocha', hex: '#795548' },
  { name: 'Caramel Nude', hex: '#A1887F' },
  { name: 'Champagne Gold', hex: '#D4AF37' },
  { name: 'Classic Bronze', hex: '#CD7F32' },
  { name: 'Natural Sand', hex: '#E0AC69' },
  { name: 'Rich Espresso', hex: '#3E2723' },
];

// Extended beauty shade database for intelligent nearest-color naming
export const EXTENDED_BEAUTY_SHADES = [
  ...MAKEUP_SWATCH_PRESETS,
  // Pinks & Roses
  { name: 'Rose Petal', hex: '#FF69B4' },
  { name: 'Hot Pink', hex: '#FF1493' },
  { name: 'Bubblegum Pink', hex: '#FF77A9' },
  { name: 'Blush Pink', hex: '#FFB6C1' },
  { name: 'Pastel Rose', hex: '#F8BBD0' },
  { name: 'Magenta Velvet', hex: '#D81B60' },
  { name: 'Barbie Pink', hex: '#E91E63' },
  { name: 'Raspberry', hex: '#C71585' },
  { name: 'Peony Bloom', hex: '#F06292' },
  { name: 'Cherry Blossom', hex: '#FFB7C5' },
  { name: 'Fuchsia Glow', hex: '#FF00FF' },

  // Reds & Berries
  { name: 'Cherry Red', hex: '#D32F2F' },
  { name: 'Scarlet Red', hex: '#FF2400' },
  { name: 'True Red', hex: '#E53935' },
  { name: 'Deep Burgundy', hex: '#800020' },
  { name: 'Merlot', hex: '#722F37' },
  { name: 'Wine Velvet', hex: '#4A0E17' },
  { name: 'Cranberry', hex: '#9E1B32' },
  { name: 'Brick Red', hex: '#CB4154' },
  { name: 'Bordeaux', hex: '#5C0120' },

  // Plums & Purples
  { name: 'Plum Whisper', hex: '#6A1B9A' },
  { name: 'Violet Royale', hex: '#7B1FA2' },
  { name: 'Rich Eggplant', hex: '#311432' },
  { name: 'Mauve Orchid', hex: '#9C27B0' },
  { name: 'Lavender Mist', hex: '#CE93D8' },
  { name: 'Lilac Dream', hex: '#E1BEE7' },

  // Corals, Peaches & Oranges
  { name: 'Sweet Peach', hex: '#FFB07C' },
  { name: 'Sunset Coral', hex: '#FF7F50' },
  { name: 'Papaya Glow', hex: '#FF8A65' },
  { name: 'Apricot', hex: '#FB8C00' },
  { name: 'Burnt Orange', hex: '#CC5500' },
  { name: 'Copper Rust', hex: '#B84528' },
  { name: 'Salmon Nude', hex: '#FA8072' },

  // Nudes, Beiges & Sands
  { name: 'Velvet Nude', hex: '#C58F7E' },
  { name: 'Soft Caramel', hex: '#C68642' },
  { name: 'Warm Beige', hex: '#D7BA9D' },
  { name: 'Porcelain Ivory', hex: '#FBE7D0' },
  { name: 'Fair Ivory', hex: '#FFF0DB' },
  { name: 'Honey Nude', hex: '#E6BC98' },
  { name: 'Almond Buff', hex: '#DFB18B' },
  { name: 'Golden Sand', hex: '#D2A679' },
  { name: 'Bisque', hex: '#FFE4C4' },

  // Browns & Chocolates
  { name: 'Dark Chocolate', hex: '#2E1503' },
  { name: 'Warm Chestnut', hex: '#5D4037' },
  { name: 'Cinnamon Brown', hex: '#8D5B4C' },
  { name: 'Toffee Crunch', hex: '#8B4513' },
  { name: 'Truffle Brown', hex: '#4E3629' },

  // Golds, Bronzes & Shimmers
  { name: 'Warm Copper', hex: '#B87333' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Gilded Amber', hex: '#FFBF00' },
  { name: 'Sunlit Gold', hex: '#E6CA65' },

  // Neutrals & Darks
  { name: 'Midnight Charcoal', hex: '#212121' },
  { name: 'Smoky Slate', hex: '#424242' },
  { name: 'Graphite Black', hex: '#121212' },
  { name: 'Pure White', hex: '#FFFFFF' }
];

/**
 * Validates and formats a hex color string (e.g. 'ce4270' -> '#CE4270')
 */
export function normalizeHex(input) {
  if (!input) return '#CE4270';
  let clean = input.trim();
  if (!clean.startsWith('#')) {
    clean = '#' + clean;
  }
  return clean.toUpperCase();
}

export function isValidHex(hex) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Convert Hex to RGB object
 */
export function hexToRgb(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 206, g: 66, b: 112 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Intelligent beauty shade name matcher.
 * Matches exact presets or finds the closest shade name in beauty space using perceptual redmean color distance.
 */
export function getBeautyShadeName(hex) {
  if (!hex) return '';
  const cleanHex = normalizeHex(hex);

  // 1. Direct exact match check
  const exact = EXTENDED_BEAUTY_SHADES.find(
    s => s.hex.toUpperCase() === cleanHex.toUpperCase()
  );
  if (exact) return exact.name;

  // 2. Perceptually weighted Euclidean RGB distance (redmean formula)
  const target = hexToRgb(cleanHex);
  let bestMatch = null;
  let minDistance = Infinity;

  for (const preset of EXTENDED_BEAUTY_SHADES) {
    const pRgb = hexToRgb(preset.hex);
    const rMean = (target.r + pRgb.r) / 2;
    const deltaR = target.r - pRgb.r;
    const deltaG = target.g - pRgb.g;
    const deltaB = target.b - pRgb.b;
    const dist = Math.sqrt(
      (2 + rMean / 256) * deltaR * deltaR +
      4 * deltaG * deltaG +
      (2 + (255 - rMean) / 256) * deltaB * deltaB
    );

    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = preset.name;
    }
  }

  return bestMatch || 'Custom Shade';
}

