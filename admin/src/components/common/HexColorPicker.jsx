import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette, Check, Palette } from 'lucide-react';
import {
  MAKEUP_SWATCH_PRESETS,
  EXTENDED_BEAUTY_SHADES,
  normalizeHex,
  isValidHex,
  hexToRgb,
  getBeautyShadeName
} from '../../utils/colorPresets.js';

export {
  MAKEUP_SWATCH_PRESETS,
  EXTENDED_BEAUTY_SHADES,
  normalizeHex,
  isValidHex,
  hexToRgb,
  getBeautyShadeName
};

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
  value = '',
  onChange,
  className = '',
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState(normalizeHex(value));
  const [placement, setPlacement] = useState({
    opensUpward: false,
    alignRight: align === 'right'
  });
  const containerRef = useRef(null);

  // Dynamic smart placement calculation: downward by default, upward if space below is tight
  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Palette height is ~340px. Open upward only when space below is tight and space above is greater
    const opensUpward = spaceBelow < 340 && spaceAbove > spaceBelow;
    const alignRight = align === 'right' || (rect.left + 290 > window.innerWidth);

    setPlacement({
      opensUpward,
      alignRight
    });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePlacement();
      window.addEventListener('resize', updatePlacement);
      window.addEventListener('scroll', updatePlacement, true);
      return () => {
        window.removeEventListener('resize', updatePlacement);
        window.removeEventListener('scroll', updatePlacement, true);
      };
    }
  }, [isOpen, updatePlacement]);

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
        <div className={`absolute ${placement.opensUpward ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} ${placement.alignRight ? 'right-0' : 'left-0'} z-[100] w-72 max-w-[calc(100vw-2rem)] p-4 bg-white rounded-2xl border border-pink-100 shadow-2xl space-y-3 animate-fade-in text-xs font-sans`}>
          
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
