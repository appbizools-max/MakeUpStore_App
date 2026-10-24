import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, X, Image as ImageIcon, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * InlineImageSearchPanel
 * 
 * Integrated Google Custom Search image results panel.
 * Replaces the "open in new tab" behavior with inline image grid.
 * Supports drag-and-drop to Product Photography upload area.
 * 
 * Props:
 * - searchQuery: default search term (e.g. product name)
 * - onSelectImage: callback(imageUrl) when admin clicks an image
 * - onClose: callback to close the panel
 */
export default function InlineImageSearchPanel({ 
  searchQuery = '', 
  onSelectImage, 
  onClose 
}) {
  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startIndex, setStartIndex] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [draggedImage, setDraggedImage] = useState(null);

  // Google Custom Search API configuration
  // TODO: Move these to environment variables or Supabase secrets
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
  const GOOGLE_CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID || '';

  const performSearch = async (searchTerm, start = 1) => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      setError(
        <div className="space-y-2">
          <div>Google Custom Search API not configured.</div>
          <div className="text-xs space-y-1">
            <div>1. Create API key: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></div>
            <div>2. Enable Custom Search API</div>
            <div>3. Create Search Engine: <a href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Programmable Search Engine</a></div>
            <div>4. Add to .env: VITE_GOOGLE_API_KEY and VITE_GOOGLE_CSE_ID</div>
          </div>
        </div>
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', GOOGLE_API_KEY);
      url.searchParams.set('cx', GOOGLE_CSE_ID);
      url.searchParams.set('q', searchTerm);
      url.searchParams.set('searchType', 'image');
      url.searchParams.set('num', '10');
      url.searchParams.set('start', start.toString());
      url.searchParams.set('safe', 'active');
      url.searchParams.set('imgSize', 'large');

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        setResults([]);
        setTotalResults(0);
        setError('No images found. Try different keywords.');
        return;
      }

      const imageResults = data.items.map(item => ({
        link: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        title: item.title || '',
        displayLink: item.displayLink || '',
        contextLink: item.image?.contextLink || '',
        width: item.image?.width || 0,
        height: item.image?.height || 0,
      }));

      setResults(imageResults);
      setTotalResults(parseInt(data.searchInformation?.totalResults || 0));
      setStartIndex(start);
    } catch (err) {
      console.error('Google Image Search error:', err);
      setError(err.message || 'Failed to fetch images. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial search on mount if query provided
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query, 1);
  };

  const handleNextPage = () => {
    if (startIndex + 10 <= totalResults) {
      performSearch(query, startIndex + 10);
    }
  };

  const handlePrevPage = () => {
    if (startIndex > 10) {
      performSearch(query, startIndex - 10);
    }
  };

  const handleImageClick = (imageUrl) => {
    if (onSelectImage) {
      onSelectImage(imageUrl);
    }
  };

  // Drag handlers for drag-and-drop support
  const handleDragStart = (e, imageUrl) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', imageUrl);
    e.dataTransfer.setData('text/html', `<img src="${imageUrl}" />`);
    setDraggedImage(imageUrl);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Google Image Search</h3>
              <p className="text-[10px] text-gray-500">Drag images to Product Photography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Maybelline Superstay Lipstick"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Attribution Notice */}
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50/50 px-2 py-1.5 rounded">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>Ensure you have permission to use images. Drag & drop or click to select.</span>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-600" />
            <span className="text-sm font-medium text-gray-600">Searching Google Images...</span>
          </div>
        )}

        {!isLoading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search className="w-12 h-12 mb-3" />
            <span className="text-sm font-medium text-gray-600">Enter a search term to find product images</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {/* Results Info */}
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>
                Showing {startIndex} - {Math.min(startIndex + results.length - 1, totalResults)} of{' '}
                {totalResults.toLocaleString()} results
              </span>
              {totalResults > 10 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={startIndex <= 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-100"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-600 px-2">
                    Page {Math.ceil(startIndex / 10)}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={startIndex + 10 > totalResults}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-100"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              {results.map((img, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.link)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleImageClick(img.link)}
                  className={`group relative bg-gray-50 border-2 border-gray-200 hover:border-amber-500 rounded-lg overflow-hidden cursor-move transition-all ${
                    draggedImage === img.link ? 'opacity-50 scale-95' : 'hover:shadow-md'
                  }`}
                  title={`Drag to Product Photography or click to select\n${img.title}`}
                >
                  {/* Image Container */}
                  <div className="aspect-square w-full bg-white flex items-center justify-center p-2">
                    <img
                      src={img.thumbnail}
                      alt={img.title}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/200x200?text=Image+Unavailable';
                      }}
                    />
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                    <div className="text-white text-center space-y-2">
                      <div className="text-xs font-semibold line-clamp-2">{img.title}</div>
                      <div className="flex items-center justify-center gap-2 text-[10px]">
                        {img.width > 0 && (
                          <span className="px-2 py-0.5 bg-white/20 rounded">
                            {img.width} × {img.height}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/80 truncate max-w-full">
                        {img.displayLink}
                      </div>
                    </div>
                    <a
                      href={img.contextLink || img.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                      title="View source page"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Drag Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-600/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-white text-[10px] font-bold text-center">
                      ↑ Drag to upload area
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
