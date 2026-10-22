import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

/**
 * SearchableSelect Component
 * 
 * High-performance, accessible, keyboard-friendly searchable select dropdown.
 * - Instant search while typing (case-insensitive, partial matching from beginning, middle, or end).
 * - Alphabetical sorting when no search query is active.
 * - Auto-focuses search input when opened.
 * - Clear button (×) to restore full list.
 * - Full keyboard navigation (Arrow Up, Arrow Down, Enter to select, Esc to close).
 * - Handles large lists with virtual-ready lightweight DOM & internal scroll.
 * - Preserves existing selected item and highlights it with checkmark.
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  labelKey = 'name',
  valueKey = 'name',
  disabled = false,
  className = '',
  buttonClassName = '',
  compact = false,
  id,
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Helper to extract option display label
  const getOptionLabel = useCallback((opt) => {
    if (!opt) return '';
    if (typeof opt === 'string') return opt;
    return opt[labelKey] || opt.name || opt.label || opt.title || String(opt[valueKey] || '');
  }, [labelKey, valueKey]);

  // Helper to extract option value
  const getOptionValue = useCallback((opt) => {
    if (!opt) return '';
    if (typeof opt === 'string') return opt;
    return opt[valueKey] !== undefined ? opt[valueKey] : (opt.id || opt.name || opt.label || '');
  }, [valueKey]);

  // Filtered and sorted options list
  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) return [];

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      // Preserve alphabetical ordering when no search query is active
      return [...options].sort((a, b) => {
        const labelA = getOptionLabel(a);
        const labelB = getOptionLabel(b);
        return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
      });
    }

    // Support partial matching from beginning, middle, or end (e.g. 'aga', 'air', 'aj')
    const startsWithMatches = [];
    const containsMatches = [];

    options.forEach(opt => {
      const label = getOptionLabel(opt);
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.startsWith(query)) {
        startsWithMatches.push(opt);
      } else if (lowerLabel.includes(query)) {
        containsMatches.push(opt);
      }
    });

    // Rank prefix matches first, followed by substring matches
    return [...startsWithMatches, ...containsMatches];
  }, [options, searchQuery, getOptionLabel]);

  // Find currently selected option object or string
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return options.find(opt => {
      return getOptionValue(opt) === value || getOptionLabel(opt) === value;
    }) || null;
  }, [options, value, getOptionValue, getOptionLabel]);

  // Automatically focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Find initial highlighted index matching current value
      const currentIndex = filteredOptions.findIndex(opt => {
        return getOptionValue(opt) === value || getOptionLabel(opt) === value;
      });
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);

      // Micro-task focus to ensure modal/dropdown is rendered
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Scroll highlighted item into view during keyboard navigation
  useEffect(() => {
    if (isOpen && listRef.current && listRef.current.children[highlightedIndex]) {
      const element = listRef.current.children[highlightedIndex];
      element.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Close dropdown when clicking outside
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

  // Select an option and close dropdown
  const handleSelect = (option) => {
    const optValue = getOptionValue(option);
    if (onChange) {
      onChange(optValue, option);
    }
    setIsOpen(false);
  };

  // Keyboard navigation support: Arrow Up, Arrow Down, Enter, Esc
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        return prev < filteredOptions.length - 1 ? prev + 1 : 0;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        return prev > 0 ? prev - 1 : filteredOptions.length - 1;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectedDisplayLabel = selectedOption ? getOptionLabel(selectedOption) : (value || '');

  return (
    <div
      ref={containerRef}
      className="relative w-full text-xs"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button - Matches existing form input styling */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full ${compact ? 'px-3 py-2 text-xs' : 'p-3 text-xs'} rounded-xl border border-pink-100 bg-white font-semibold text-gray-900 shadow-2xs transition-all cursor-pointer flex items-center justify-between text-left outline-none hover:border-[#CE4270]/40 focus:border-[#CE4270] focus:ring-2 focus:ring-[#CE4270]/20 disabled:bg-gray-100 disabled:cursor-not-allowed ${buttonClassName} ${className}`}
      >
        <span className={`truncate mr-2 ${selectedDisplayLabel ? 'text-gray-900 font-bold' : 'text-gray-400 font-normal'}`}>
          {selectedDisplayLabel || placeholder}
        </span>
        <ChevronDown
          size={compact ? 13 : 16}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#CE4270]' : ''}`}
        />
      </button>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-pink-100 shadow-xl overflow-hidden animate-fade-in min-w-[220px] w-full">
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-pink-100/80 bg-gray-50/60 flex items-center gap-2">
            <Search size={14} className="text-[#CE4270] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-xs font-semibold text-gray-900 placeholder-gray-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedIndex(0);
                  searchInputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Scrollable Brands List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 font-medium">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const isSelected = selectedOption
                  ? getOptionValue(selectedOption) === optVal
                  : value === optVal || value === optLabel;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <button
                    key={opt.id || optVal || idx}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3 py-2 rounded-xl text-left font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF2F5] text-[#CE4270]'
                        : isHighlighted
                        ? 'bg-pink-50/60 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{optLabel}</span>
                    {isSelected && (
                      <Check size={14} className="text-[#CE4270] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Footer Count */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10.5px] text-gray-400 font-medium flex items-center justify-between">
            <span>
              {filteredOptions.length} {filteredOptions.length === 1 ? 'brand' : 'brands'} available
            </span>
            <span className="text-[10px] text-gray-400">
              Use ↑↓ to navigate · Enter to select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
