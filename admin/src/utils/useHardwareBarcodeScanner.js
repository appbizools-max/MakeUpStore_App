import { useEffect, useRef } from 'react';
import { playBarcodeBeep, validateBarcodeFormat } from './barcodeUtils';

/**
 * useHardwareBarcodeScanner
 * 
 * Automatically captures barcodes scanned by external hardware devices:
 * - USB wired handheld laser/CCD barcode scanners
 * - Bluetooth barcode scanners (HID profile)
 * - Wireless 2.4GHz USB dongle wand scanners
 * - Mobile external hardware scanners
 * 
 * Hardware scanners act as keyboard wedge/HID devices that emit keystrokes
 * in rapid bursts (< 45ms between characters) typically terminating with 'Enter'
 * or a short trailing idle pause.
 * 
 * Features:
 * - Instant complete scanner detection using keyboard/HID events
 * - Automatic trigger without requiring the admin to click Scan or manually focus
 * - Debounces rapid duplicate scans (within 800ms)
 * - Preserves manual keyboard typing
 * - Strips AIM symbology prefixes (e.g., ]C1, ]e0, ]d2, ]Q1, ]E0)
 * 
 * @param {Function} onScan - Callback when a hardware barcode is successfully detected: (barcode, targetElement) => void
 * @param {boolean} enabled - Whether the listener is active
 * @param {number} duplicateDebounceMs - Debounce window for identical scans (default: 800ms)
 */
export function useHardwareBarcodeScanner({ onScan, enabled = true, duplicateDebounceMs = 800 }) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const fastKeystrokesCountRef = useRef(0);
  const trailingTimerRef = useRef(null);
  const lastScanRef = useRef({ code: '', time: 0 });
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const processScannedBuffer = (triggerSource = 'enter', targetElement = null) => {
      let potentialBarcode = bufferRef.current.trim();
      bufferRef.current = '';
      fastKeystrokesCountRef.current = 0;

      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }

      if (!potentialBarcode || potentialBarcode.length < 2) return;

      // Strip standard hardware scanner AIM symbology prefixes if present (e.g., ]C1, ]e0, ]d2, ]Q1, ]E0)
      if (/^\][A-Za-z0-9]{2}/.test(potentialBarcode)) {
        potentialBarcode = potentialBarcode.substring(3).trim();
      }

      // Normalize barcode (strip carriage returns, tabs, non-printable characters)
      potentialBarcode = potentialBarcode.replace(/[\x00-\x1F\x7F]/g, '').trim();

      if (!potentialBarcode || potentialBarcode.length < 2) return;

      // Debounce duplicate scans of identical barcode within debounce window
      const now = Date.now();
      if (
        lastScanRef.current.code === potentialBarcode &&
        now - lastScanRef.current.time < duplicateDebounceMs
      ) {
        return;
      }

      const check = validateBarcodeFormat(potentialBarcode);
      if (check.isValid && onScanRef.current) {
        lastScanRef.current = { code: potentialBarcode, time: now };
        playBarcodeBeep('success');
        onScanRef.current(potentialBarcode, targetElement);
      }
    };

    const handleKeyDown = (e) => {
      // Don't intercept if modifier keys like Ctrl, Alt, Meta are pressed (e.g. shortcuts)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // 1. Enter key: standard scanner termination
      if (e.key === 'Enter') {
        // If we accumulated fast characters (scanner burst), intercept Enter to prevent form submission
        if (bufferRef.current.length >= 2 && fastKeystrokesCountRef.current >= 1) {
          e.preventDefault();
          e.stopPropagation();
          processScannedBuffer('enter', e.target);
          return;
        }

        // If target is inside an input with existing text and user pressed enter, don't clear
        bufferRef.current = '';
        fastKeystrokesCountRef.current = 0;
        return;
      }

      // 2. Keystroke timing analysis:
      // Human typing is usually > 80ms per key.
      // Hardware scanners type at 5ms - 45ms per key.
      const isFastKeystroke = timeDiff < 65;

      if (isFastKeystroke) {
        fastKeystrokesCountRef.current += 1;
      } else if (timeDiff > 100) {
        // Exceeded threshold: reset buffer since this is slow human typing
        bufferRef.current = '';
        fastKeystrokesCountRef.current = 0;
      }

      // Accumulate single printable characters
      if (e.key && e.key.length === 1) {
        bufferRef.current += e.key;

        // Clear previous trailing timer
        if (trailingTimerRef.current) {
          clearTimeout(trailingTimerRef.current);
          trailingTimerRef.current = null;
        }

        // 3. Fallback for scanners configured WITHOUT 'Enter' suffix:
        // If we have received >= 3 fast characters and no new key arrives for 55ms, process buffer
        if (fastKeystrokesCountRef.current >= 3 && bufferRef.current.length >= 3) {
          trailingTimerRef.current = setTimeout(() => {
            processScannedBuffer('trailing-timer', e.target);
          }, 55);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
      }
    };
  }, [enabled, duplicateDebounceMs]);
}
