import React, { useState } from 'react';
import {
  Upload,
  Search,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { searchBeautyImages } from '../services/imageSearchService';
import { optimizeImageForWebP } from '../utils/imageOptimizer';

export const RowImageUploadModal = ({
  isOpen,
  onClose,
  row,
  onSaveImage,
  onUploadImageFile
}) => {
  if (!isOpen || !row) return null;

  const [activeTab, setActiveTab] = useState('upload'); // upload, online
  const [selectedImage, setSelectedImage] = useState(row.image || '');
  const [isUploading, setIsUploading] = useState(false);
  const [onlineQuery, setOnlineQuery] = useState(`${row.brand || ''} ${row.name || ''}`.trim());
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      // 1. Optimize image to WebP < 150KB
      const optimized = await optimizeImageForWebP(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      // 2. Upload via uploadProductImage / uploadImage to Supabase
      if (onUploadImageFile) {
        const publicUrl = await onUploadImageFile(optimized, 'products', `bulk_${Date.now()}`);
        setSelectedImage(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setSelectedImage(e.target.result);
        reader.readAsDataURL(optimized);
      }
    } catch (e) {
      alert(`Image upload error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchOnline = async () => {
    if (!onlineQuery.trim()) return;
    setIsSearchingImages(true);
    try {
      const res = await searchBeautyImages(onlineQuery);
      if (Array.isArray(res)) {
        setOnlineResults(res.map(r => r.url || r.thumb).filter(Boolean));
      }
    } catch (err) {
      alert(`Image search error: ${err.message}`);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleSave = () => {
    onSaveImage(selectedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Product Image Selector</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{row.name || 'Unnamed Product'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 text-xs flex-shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'upload' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload / Local File
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'online' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Search Online Images
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Current Selection Preview */}
          {selectedImage && (
            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200 flex items-center gap-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-16 h-16 rounded-xl object-contain bg-white border border-purple-200 p-1"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase text-purple-700">Active Selection</span>
                <p className="font-mono text-[11px] text-slate-600 truncate mt-0.5">{selectedImage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage('')}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center bg-slate-50 relative group cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <p className="font-bold text-slate-800 text-xs">Choose Image or Drag &amp; Drop Here</p>
              <p className="text-[11px] text-slate-500 mt-1">Automatically converted to WebP &lt; 150KB for rapid storefront loading</p>
            </div>
          )}

          {activeTab === 'online' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={onlineQuery}
                  onChange={(e) => setOnlineQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOnline()}
                  placeholder="e.g. Maybelline SuperStay Lover lipstick"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleSearchOnline}
                  disabled={isSearchingImages}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-xl font-bold shadow-xs hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSearchingImages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </button>
              </div>

              {onlineResults.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto">
                  {onlineResults.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className={`relative aspect-square rounded-xl border-2 p-1 bg-white cursor-pointer transition-all overflow-hidden flex items-center justify-center ${
                        selectedImage === url ? 'border-purple-600 ring-2 ring-purple-600/30' : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <img src={url} alt="Result" className="w-full h-full object-contain" />
                      {selectedImage === url && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20"
          >
            Apply Image
          </button>
        </div>
      </div>
    </div>
  );
};
