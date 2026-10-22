/**
 * Barcode utilities for validation, formatting, and audio feedback.
 */

/**
 * Validates product barcode format.
 * Accepts standard 1D/2D barcodes (UPC-A, EAN-13, EAN-8, Code-128, Code-39, ITF-14, SKUs).
 * Disallows whitespace and dangerous/invalid characters.
 */
/**
 * Human-readable mapping for barcode optical detector format names.
 */
export const formatBarcodeName = (formatName) => {
  if (!formatName) return 'Standard Barcode';
  const nameStr = String(formatName).toUpperCase();
  const map = {
    'QR_CODE': 'QR Code (2D)',
    'AZTEC': 'Aztec Code (2D)',
    'CODABAR': 'Codabar (1D)',
    'CODE_39': 'Code 39 (1D)',
    'CODE_93': 'Code 93 (1D)',
    'CODE_128': 'Code 128 (1D)',
    'DATA_MATRIX': 'Data Matrix (2D)',
    'MAXICODE': 'MaxiCode (2D)',
    'ITF': 'ITF / Interleaved 2 of 5',
    'EAN_13': 'EAN-13 (Standard Retail)',
    'EAN_8': 'EAN-8 (Compact Retail)',
    'PDF_417': 'PDF-417 (2D Stacked)',
    'RSS_14': 'GS1 DataBar (RSS-14)',
    'RSS_EXPANDED': 'GS1 DataBar Expanded',
    'UPC_A': 'UPC-A (Retail)',
    'UPC_E': 'UPC-E (Compact Retail)',
    'UPC_EAN_EXTENSION': 'UPC/EAN Extension'
  };
  return map[nameStr] || formatName.replace(/_/g, ' ');
};

/**
 * Intelligently classifies any barcode string by structure, length, and standards.
 */
export const detectBarcodeType = (barcode, opticalFormat = null) => {
  if (opticalFormat && typeof opticalFormat === 'string' && opticalFormat !== 'Standard Barcode') {
    return formatBarcodeName(opticalFormat);
  }
  if (!barcode || typeof barcode !== 'string') return 'Unknown';
  const trimmed = barcode.trim();

  // Web link or URL (frequently used in cosmetic & marketing QR codes)
  if (/^https?:\/\//i.test(trimmed)) {
    return 'QR Code / URL';
  }

  // Pure numeric barcodes (Common retail and shipping standard lengths)
  if (/^\d+$/.test(trimmed)) {
    switch (trimmed.length) {
      case 6:
        return 'UPC-E (6 digits)';
      case 7:
        return 'UPC-E / EAN-7';
      case 8:
        return 'EAN-8 (Compact Retail)';
      case 12:
        return 'UPC-A (Standard Retail)';
      case 13:
        return 'EAN-13 (International Retail)';
      case 14:
        return 'ITF-14 / Shipping';
      default:
        return `Numeric Barcode (${trimmed.length} digits)`;
    }
  }

  // GS1 DataBar / GS1-128 with application identifiers like (01)09501101530003
  if (/^\(\d{2,4}\)/.test(trimmed)) {
    return 'GS1 DataBar / GS1-128';
  }

  // Codabar (typically starts/ends with A, B, C, or D)
  if (/^[A-Da-d][0-9\-$:/.+]+[A-Da-d]$/.test(trimmed)) {
    return 'Codabar';
  }

  // Code-39 standard character set (0-9, A-Z, space, -, ., $, /, +, %)
  if (/^[0-9A-Z\-.$/+% ]+$/.test(trimmed)) {
    return 'Code-39 / Alphanumeric';
  }

  // 2D Matrix or multi-line barcode
  if (trimmed.includes('\n') || trimmed.length > 60) {
    return '2D Matrix / PDF-417';
  }

  return 'Code-128 / Universal Barcode';
};

/**
 * Validates product barcode format for ANY 1D or 2D barcode.
 * Supports all international retail, industrial, and custom formats:
 * UPC-A, UPC-E, EAN-13, EAN-8, Code-128, Code-39, Code-93, ITF-14, Codabar,
 * GS1 DataBar, QR Code, Data Matrix, Aztec, PDF-417, and custom alphanumeric SKUs.
 */
export const validateBarcodeFormat = (barcode) => {
  if (!barcode || typeof barcode !== 'string' || !barcode.trim()) {
    return {
      isValid: false,
      error: 'Barcode number is required.'
    };
  }

  const trimmed = barcode.trim();

  // Disallow non-printable ASCII control characters (ASCII 0-31 except space, and 127)
  // to prevent invisible byte corruption
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Barcode contains non-printable control characters.'
    };
  }

  // Barcode minimum length: 1 character
  if (trimmed.length < 1) {
    return {
      isValid: false,
      error: 'Barcode cannot be empty.'
    };
  }

  // Barcode maximum length: 500 characters (supports dense 2D QR and Data Matrix codes)
  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: 'Barcode exceeds maximum allowed length (500 characters).'
    };
  }

  const barcodeType = detectBarcodeType(trimmed);

  return {
    isValid: true,
    cleanBarcode: trimmed,
    barcodeType,
    error: null
  };
};

/**
 * Synthesizes a crisp, pleasant barcode scanner beep using Web Audio API.
 * Does not require external audio assets.
 */
export const playBarcodeBeep = (type = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'success') {
      // High-pitched pleasant dual-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 note
      osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.08); // E6 note
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'error') {
      // Lower warning tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Ignore audio permission or playback restrictions
  }
};

/**
 * In-Memory Barcode Cache
 * Caches recently searched barcodes for near-instant (0ms) lookup response,
 * debouncing duplicate queries and avoiding repeated network/database requests.
 */
const BARCODE_CACHE_MAX_SIZE = 500;
const BARCODE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const barcodeLookupCache = new Map();

export const getCachedBarcodeLookup = (barcode) => {
  if (!barcode) return null;
  const key = String(barcode).trim().toLowerCase();
  const entry = barcodeLookupCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > BARCODE_CACHE_TTL_MS) {
    barcodeLookupCache.delete(key);
    return null;
  }
  return entry.result;
};

export const setCachedBarcodeLookup = (barcode, result) => {
  if (!barcode) return;
  const key = String(barcode).trim().toLowerCase();
  if (barcodeLookupCache.size >= BARCODE_CACHE_MAX_SIZE) {
    const oldestKey = barcodeLookupCache.keys().next().value;
    barcodeLookupCache.delete(oldestKey);
  }
  barcodeLookupCache.set(key, { result, timestamp: Date.now() });
};

export const clearBarcodeLookupCache = () => {
  barcodeLookupCache.clear();
};

/**
 * Normalizes any scanned or typed barcode:
 * - Trims leading/trailing whitespace
 * - Strips non-printable ASCII control characters
 * - Strips AIM symbology prefixes (e.g., ]C1, ]e0, ]d2, ]Q1, ]E0)
 */
export const normalizeBarcode = (barcode) => {
  if (!barcode || typeof barcode !== 'string') return '';
  let clean = barcode.trim();
  if (/^\][A-Za-z0-9]{2}/.test(clean)) {
    clean = clean.substring(3).trim();
  }
  return clean.replace(/[\x00-\x1F\x7F]/g, '').trim();
};
