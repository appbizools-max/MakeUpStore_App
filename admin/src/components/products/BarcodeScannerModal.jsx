import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  CameraOff,
  SwitchCamera,
  Flashlight,
  FlashlightOff,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Upload,
  Barcode,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { validateBarcodeFormat, playBarcodeBeep, formatBarcodeName, detectBarcodeType, normalizeBarcode } from '../../utils/barcodeUtils';

/**
 * BarcodeScannerModal
 * Provides live physical barcode scanning with device camera, format detection,
 * duplicate verification, and mobile-friendly controls.
 * Supports ANY 1D and 2D barcode format (EAN, UPC, Code 128, Code 39, QR Code, Data Matrix, etc.).
 */
export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onSelectBarcode,
  onScanSuccess,
  title = 'Scan Product Barcode',
  subtitle = 'Detects any 1D or 2D barcode (EAN, UPC, Code 128, Code 39, QR, Data Matrix, ITF, etc.)',
  checkBarcodeInSupabase,
  excludeProductId = null,
  mode = 'create', // 'create' (checks uniqueness) | 'search' (searches catalog)
  autoSelect = false
}) {
  const [scannerState, setScannerState] = useState('INITIALIZING'); // INITIALIZING, SCANNING, SUCCESS, DUPLICATE, INVALID, FAILED
  const [scannedResult, setScannedResult] = useState(null);
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [formatError, setFormatError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScanTimestampRef = useRef(0);
  const viewportId = 'barcode-scanner-viewport';

  // Comprehensive universal retail & industrial 1D/2D barcode formats (Every format supported by optical engine)
  const supportedFormats = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.AZTEC,
    Html5QrcodeSupportedFormats.CODABAR,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
    Html5QrcodeSupportedFormats.MAXICODE,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.PDF_417,
    Html5QrcodeSupportedFormats.RSS_14,
    Html5QrcodeSupportedFormats.RSS_EXPANDED,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION
  ].filter(f => f !== undefined && f !== null);

  // Stop scanner safely
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    }
  };

  // Start scanner with active camera
  const startCamera = async (cameraIdOrFacing = null) => {
    setScannerState('INITIALIZING');
    setCameraError(null);
    setScannedResult(null);
    setDuplicateProduct(null);
    setFormatError(null);
    setIsTorchOn(false);

    try {
      // Ensure any previous instance is stopped
      await stopScanner();

      // Check cameras
      let cameras = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        setAvailableCameras(cameras || []);
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }

      // Initialize scanner with all formats & hardware-accelerated BarcodeDetector API enabled
      const qrCode = new Html5Qrcode(viewportId, {
        formatsToSupport: supportedFormats,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
      html5QrCodeRef.current = qrCode;

      // Scanning configuration:
      // Omit qrbox so that the scanner reads the ENTIRE camera feed without cropping!
      // This allows barcodes of ANY size, type, or orientation to be detected immediately.
      const config = {
        fps: 25,
        aspectRatio: 1.333333,
        disableFlip: false
      };

      // Determine camera source
      let cameraConfig;
      if (cameraIdOrFacing) {
        cameraConfig = cameraIdOrFacing;
      } else if (selectedCameraId) {
        cameraConfig = selectedCameraId;
      } else if (cameras && cameras.length > 0) {
        // Look for rear / environment camera first
        const rearCamera = cameras.find(c => /back|rear|environment/i.test(c.label));
        cameraConfig = rearCamera ? rearCamera.id : cameras[cameras.length - 1].id;
        setSelectedCameraId(cameraConfig);
      } else {
        cameraConfig = { facingMode: 'environment' };
      }

      await qrCode.start(
        cameraConfig,
        config,
        async (decodedText, decodedResult) => {
          await handleBarcodeDetected(decodedText, decodedResult);
        },
        () => {
          // Frame read cycle during continuous scanning (normal while aiming)
        }
      );

      // Check torch support
      try {
        const capabilities = qrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorchSupport(true);
        } else {
          setHasTorchSupport(false);
        }
      } catch (e) {
        setHasTorchSupport(false);
      }

      setScannerState('SCANNING');
    } catch (err) {
      console.error('Failed to start barcode camera scanner:', err);
      setCameraError(
        err?.message ||
        'Unable to access camera. Please check camera permissions in your browser or choose another device.'
      );
      setScannerState('FAILED');
      playBarcodeBeep('error');
    }
  };

  // Process detected barcode string
  const handleBarcodeDetected = async (rawCode, decodedResult = null) => {
    const cleanCode = normalizeBarcode(rawCode);
    if (!cleanCode) return;

    // Debounce duplicate scans within 1200ms
    const now = Date.now();
    if (now - lastScanTimestampRef.current < 1200) {
      return;
    }
    lastScanTimestampRef.current = now;

    // Stop / pause camera scanner immediately once code is detected to avoid continuous duplicate triggering
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.pause(true);
      }
    } catch (e) {}

    const formatValidation = validateBarcodeFormat(cleanCode);
    const rawFormatName = decodedResult?.result?.format?.formatName;
    const detectedFormatName = formatBarcodeName(rawFormatName) || detectBarcodeType(cleanCode) || formatValidation.barcodeType || 'Standard Barcode';

    // In Search Mode or with autoSelect: immediately complete and return value + format
    if (mode === 'search' || autoSelect) {
      playBarcodeBeep('success');
      if (onScanSuccess) onScanSuccess(cleanCode, detectedFormatName);
      if (onSelectBarcode) onSelectBarcode(cleanCode, detectedFormatName);
      handleClose();
      return;
    }

    // 1. Validate format (accept any non-empty clean barcode)
    if (!formatValidation.isValid && !decodedResult) {
      setFormatError(formatValidation.error);
      setScannedResult({
        code: cleanCode,
        format: detectedFormatName,
        type: 'Invalid Format'
      });
      setScannerState('INVALID');
      playBarcodeBeep('error');
      return;
    }

    // 2. Validate uniqueness against Supabase & Catalog
    setIsCheckingDuplicate(true);
    let isDuplicate = false;
    let existingItem = null;

    try {
      if (checkBarcodeInSupabase) {
        const check = await checkBarcodeInSupabase(cleanCode, excludeProductId);
        if (check && check.exists) {
          isDuplicate = true;
          existingItem = check.product;
        }
      }
    } catch (err) {
      console.warn('Error checking barcode uniqueness:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }

    setScannedResult({
      code: cleanCode,
      format: detectedFormatName,
      type: detectedFormatName
    });

    if (isDuplicate) {
      setDuplicateProduct(existingItem);
      setScannerState('DUPLICATE');
      playBarcodeBeep('error');
    } else {
      setDuplicateProduct(null);
      setScannerState('SUCCESS');
      playBarcodeBeep('success');
    }
  };

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorchSupport) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Switch camera handler
  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1) {
      // Toggle facing mode
      const nextFacing = { facingMode: 'user' };
      await startCamera(nextFacing);
      return;
    }

    const currentIndex = availableCameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    await startCamera(nextCamera.id);
  };

  // Scan again handler
  const handleScanAgain = async () => {
    setScannedResult(null);
    setDuplicateProduct(null);
    setFormatError(null);

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.resume();
        setScannerState('SCANNING');
        return;
      } catch (e) {
        // If resume fails, do a clean restart
      }
    }
    await startCamera();
  };

  // Image file upload fallback with dual-engine detection (Native BarcodeDetector + Html5Qrcode)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerState('INITIALIZING');
    setCameraError(null);

    try {
      await stopScanner();

      // Method 1: Browser native BarcodeDetector (high speed & multi-format support if present)
      if ('BarcodeDetector' in window) {
        try {
          const imageBitmap = await createImageBitmap(file);
          const supported = await window.BarcodeDetector.getSupportedFormats?.().catch(() => []);
          const detector = new window.BarcodeDetector(
            supported && supported.length > 0 ? { formats: supported } : undefined
          );
          const detected = await detector.detect(imageBitmap);
          if (detected && detected.length > 0) {
            const first = detected[0];
            await handleBarcodeDetected(first.rawValue, {
              result: { format: { formatName: first.format || 'BarcodeDetector' } }
            });
            return;
          }
        } catch (nativeErr) {
          console.log('Native BarcodeDetector file scan pass failed, trying Html5Qrcode...', nativeErr);
        }
      }

      // Method 2: Html5Qrcode file scan
      const qrCode = new Html5Qrcode(viewportId, {
        formatsToSupport: supportedFormats,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
      html5QrCodeRef.current = qrCode;

      const decodedText = await qrCode.scanFile(file, true);
      await handleBarcodeDetected(decodedText, { result: { format: { formatName: 'Image Scan' } } });
    } catch (err) {
      console.warn('File barcode scan failed:', err);
      setScannerState('FAILED');
      setCameraError('No readable barcode or QR code could be found in that photo. Please try a clearer picture with good lighting or scan with the live camera.');
      playBarcodeBeep('error');
    }
  };

  // Confirm selection and close
  const handleConfirmBarcode = () => {
    if (scannedResult && scannedResult.code) {
      if (onSelectBarcode) onSelectBarcode(scannedResult.code, scannedResult.format);
      if (onScanSuccess) onScanSuccess(scannedResult.code, scannedResult.format);
      handleClose();
    }
  };

  // Close handler with cleanup
  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  // Manage scanner lifecycle based on modal visibility
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow modal DOM container to render
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-pink-100/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-fade-in my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100 bg-[#FFF2F5]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#CE4270] text-white flex items-center justify-center shadow-xs">
              <Barcode size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] uppercase font-bold bg-[#CE4270]/10 text-[#CE4270] px-2 py-0.5 rounded-full">
                  Universal Scanner
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-pink-100 text-gray-500 hover:text-[#CE4270] flex items-center justify-center transition-colors cursor-pointer border border-pink-100 shrink-0"
            title="Close scanner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Camera Viewport Container */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-950 border-2 border-gray-800 shadow-inner min-h-[280px] flex items-center justify-center">
            {/* HTML5-QRCode Target Element */}
            <div
              id={viewportId}
              className="w-full h-full overflow-hidden flex items-center justify-center"
              style={{ minHeight: '280px' }}
            />

            {/* Viewfinder Overlay: Active while SCANNING */}
            {scannerState === 'SCANNING' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                {/* Visual Viewfinder Box - Adaptive and spacious so any barcode or QR code fits easily */}
                <div className="relative w-full max-w-[380px] h-[200px] sm:h-[220px] border-2 border-[#CE4270]/80 rounded-3xl bg-transparent transition-all shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                  {/* Corner Target Accents */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-[#CE4270] rounded-tl-xl" />
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-[#CE4270] rounded-tr-xl" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-[#CE4270] rounded-bl-xl" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-[#CE4270] rounded-br-xl" />

                  {/* Animated Red Laser Scanning Line */}
                  <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#CE4270] to-transparent shadow-[0_0_12px_3px_rgba(206,66,112,0.85)] animate-pulse top-1/2 -translate-y-1/2" />

                  {/* Top Format Badge */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xs text-[10px] text-pink-200 font-semibold tracking-wide whitespace-nowrap border border-pink-500/20">
                    Universal 1D & 2D Auto-Detect
                  </div>
                </div>

                {/* Viewfinder Tip */}
                <div className="mt-2.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Aim at any barcode or QR code... Auto-detecting</span>
                </div>
              </div>
            )}

            {/* Initializing Spinner */}
            {scannerState === 'INITIALIZING' && (
              <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3 z-20">
                <RefreshCw size={32} className="animate-spin text-[#CE4270]" />
                <div className="text-xs font-bold text-gray-200">Starting Camera & Scanner...</div>
                <div className="text-[10px] text-gray-400">Please allow camera permissions if prompted</div>
              </div>
            )}

            {/* Camera Controls Bar: Switch Camera & Torch */}
            {scannerState === 'SCANNING' && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-auto">
                {hasTorchSupport && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-md ${
                      isTorchOn
                        ? 'bg-amber-400 text-gray-950 shadow-amber-400/30'
                        : 'bg-black/60 hover:bg-black/80 text-white'
                    }`}
                  >
                    {isTorchOn ? <Flashlight size={14} /> : <FlashlightOff size={14} />}
                    <span>{isTorchOn ? 'Flashlight ON' : 'Flashlight'}</span>
                  </button>
                )}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-md"
                    title="Switch front / rear camera"
                  >
                    <SwitchCamera size={14} />
                    <span>Flip Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STATE 1: SUCCESSFULLY SCANNED & UNIQUE */}
          {scannerState === 'SUCCESS' && scannedResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                      Successfully Scanned!
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                      Unique & Valid
                    </span>
                  </div>
                  <div className="mt-1 font-mono font-black text-lg text-emerald-950 tracking-wider break-all bg-white px-3 py-1.5 rounded-xl border border-emerald-200 inline-block shadow-2xs">
                    {scannedResult.code}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">
                    Format: <strong>{scannedResult.format}</strong> • Ready to assign to new product.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={handleConfirmBarcode}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Use Scanned Barcode</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw size={13} />
                  <span>Scan Again</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: DUPLICATE BARCODE DETECTED */}
          {scannerState === 'DUPLICATE' && scannedResult && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                      Duplicate Barcode Detected
                    </span>
                    <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                      Already in Catalog
                    </span>
                  </div>
                  <div className="mt-1 font-mono font-black text-base text-rose-950 tracking-wider break-all bg-white px-2.5 py-1 rounded-xl border border-rose-200 inline-block shadow-2xs">
                    {scannedResult.code}
                  </div>

                  {duplicateProduct && (
                    <div className="mt-2 p-2 rounded-xl bg-white/90 border border-rose-200/80 text-xs">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Existing Assigned Product:
                      </div>
                      <div className="font-extrabold text-gray-900 mt-0.5">
                        {duplicateProduct.name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        Brand: {duplicateProduct.brand_name || duplicateProduct.brandName || 'N/A'} • ID: {duplicateProduct.id}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-rose-700 font-medium mt-1.5 leading-snug">
                    Duplicate barcodes cannot be saved. Please scan a different product or check the existing catalog item.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-rose-100">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 bg-[#CE4270] hover:bg-[#b83760] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <RefreshCw size={14} />
                  <span>Scan Different Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Populate field so user can manually edit it if desired
                    onSelectBarcode(scannedResult.code);
                    handleClose();
                  }}
                  className="bg-white hover:bg-rose-100/60 text-rose-800 border border-rose-300 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Edit Manually</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: INVALID BARCODE FORMAT */}
          {scannerState === 'INVALID' && scannedResult && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                      Invalid Barcode Format
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-amber-950 break-all bg-white px-2.5 py-1 rounded-xl border border-amber-200 inline-block shadow-2xs">
                    {scannedResult.code}
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium mt-1.5">
                    {formatError || 'The scanned barcode contains unsupported characters or invalid length.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-amber-100">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw size={14} />
                  <span>Scan Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBarcode(scannedResult.code);
                    handleClose();
                  }}
                  className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Keep & Edit Manually</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: SCAN FAILED / CAMERA ACCESS ERROR */}
          {scannerState === 'FAILED' && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <CameraOff size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider block">
                    Camera Access Issue
                  </span>
                  <p className="text-[11px] text-gray-600 font-medium mt-1">
                    {cameraError || 'Unable to start camera stream. Ensure camera permissions are enabled in your browser.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="flex-1 bg-[#CE4270] hover:bg-[#b83760] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw size={14} />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-pink-50 text-[#CE4270] border border-pink-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Upload size={14} />
                  <span>Upload Barcode Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Alternative: Upload Barcode Photo / Fallback File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#FFF2F5]/50 border border-pink-100 text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <Info size={13} className="text-[#CE4270] shrink-0" />
              <span>Scanning from gallery photo or screenshot?</span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-[#CE4270] font-bold text-[11px] border border-pink-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            >
              <Upload size={13} />
              <span>Upload Image File</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/70 text-[11px]">
          <span className="text-gray-500 font-medium">
            Supports: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code, Data Matrix, Aztec, PDF-417, ITF-14 & more
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-200 text-gray-700 font-bold border border-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
