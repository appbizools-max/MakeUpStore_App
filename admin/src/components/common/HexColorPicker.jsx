import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Check, Palette } from 'lucide-react';

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

/**
 * Convert HSL to Hex
 */
function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Convert Hex to HSL
 */
function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { h: 340, s: 58, l: 53 };

  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export default function HexColorPicker({
  value = '#CE4270',
  onChange,
  className = '',
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState(normalizeHex(value));
  const containerRef = useRef(null);

  // Sync internal text when external value changes
  useEffect(() => {
    setRawText(normalizeHex(value));
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentHex = isValidHex(rawText) ? rawText : normalizeHex(value);
  const hsl = hexToHsl(currentHex);
  const detectedShadeName = getBeautyShadeName(currentHex);

  const handleTextChange = (e) => {
    let input = e.target.value;
    setRawText(input);
    const formatted = normalizeHex(input);
    if (isValidHex(formatted) && onChange) {
      const shadeName = getBeautyShadeName(formatted);
      onChange(formatted, shadeName);
    }
  };

  const handleSelectPreset = (preset) => {
    setRawText(preset.hex);
    if (onChange) onChange(preset.hex, preset.name);
  };

  const handleHueChange = (e) => {
    const newH = Number(e.target.value);
    const newHex = hslToHex(newH, Math.max(hsl.s, 40), Math.max(hsl.l, 35));
    setRawText(newHex);
    if (onChange) onChange(newHex, getBeautyShadeName(newHex));
  };

  const handleLightnessChange = (e) => {
    const newL = Number(e.target.value);
    const newHex = hslToHex(hsl.h, hsl.s, newL);
    setRawText(newHex);
    if (onChange) onChange(newHex, getBeautyShadeName(newHex));
  };

  // Support native eye dropper API if available (Chrome / Edge)
  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          setRawText(hex);
          if (onChange) onChange(hex, getBeautyShadeName(hex));
        }
      } catch (e) {
        // User canceled eye dropper
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 w-full ${className}`}>
      {/* Clickable Swatch Circle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl border-2 border-white shadow-xs cursor-pointer p-0.5 shrink-0 transition-transform active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#CE4270]/30"
        style={{ backgroundColor: currentHex }}
        title="Click to open HEX color palette"
      />

      {/* Direct Hex Text Input */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          maxLength={7}
          placeholder="#CE4270"
          value={rawText}
          onChange={handleTextChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full py-2 px-2.5 rounded-xl border font-mono text-xs font-bold transition-all outline-none uppercase ${
            isValidHex(normalizeHex(rawText))
              ? 'border-gray-200 bg-white text-gray-800 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20'
              : 'border-rose-300 bg-rose-50 text-rose-800'
          }`}
        />
      </div>

      {/* ===================================================================
          CUSTOM HEX COLOR PALETTE POPOVER (ZERO RGB)
          =================================================================== */}
      {isOpen && (
        <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] p-4 bg-white rounded-2xl border border-pink-100 shadow-2xl space-y-3 animate-fade-in text-xs font-sans`}>
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Palette size={14} className="text-[#CE4270]" />
              <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wide">
                Hex Color Swatch
              </span>
            </div>
            
            {window.EyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                className="p-1 rounded-lg hover:bg-pink-50 text-gray-500 hover:text-[#CE4270] transition-colors cursor-pointer flex items-center gap-1 text-[10.5px] font-bold"
                title="Pick color from screen"
              >
                <Pipette size={13} />
                <span>Pick</span>
              </button>
            )}
          </div>

          {/* Large Hex Color Preview Strip with Shade Name */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="w-10 h-10 rounded-xl border border-white shadow-2xs shrink-0"
              style={{ backgroundColor: currentHex }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase block">
                Selected Shade
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-xs text-[#CE4270] truncate">
                  {detectedShadeName}
                </span>
                <span className="font-mono font-bold text-[11px] text-gray-500">
                  {currentHex}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Hue Spectrum Slider (Changes Hue in HEX) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
              <span>Hue Spectrum</span>
              <span>{hsl.h}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hsl.h}
              onChange={handleHueChange}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
              }}
            />
          </div>

          {/* Lightness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
              <span>Shade Brightness</span>
              <span>{hsl.l}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              value={hsl.l}
              onChange={handleLightnessChange}
              className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-black via-gray-400 to-white"
            />
          </div>

          {/* Curated Cosmetics & Beauty Shade Presets */}
          <div className="space-y-1.5 pt-1 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">
              Cosmetic Shade Presets (HEX)
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {MAKEUP_SWATCH_PRESETS.map((preset) => {
                const isSelected = currentHex.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-6 h-6 rounded-lg border border-black/10 cursor-pointer p-0 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xs"
                    style={{ backgroundColor: preset.hex }}
                    title={`${preset.name} (${preset.hex})`}
                  >
                    {isSelected && <Check size={11} className="text-white drop-shadow" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-gray-400 font-medium">
            <span>Always stored in pure HEX format</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-[#CE4270] hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
