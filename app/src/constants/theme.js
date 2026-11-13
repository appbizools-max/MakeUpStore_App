/**
 * Centralized Design Token System - Salbeau Mobile Applications
 * Exact brand primary pink (#D81B60) extracted from the official Salbeau application logo.
 */

export const COLORS = {
  // Brand Primary & Logo Colors
  primary: '#D81B60',
  primaryHover: '#C2185B',
  primaryActive: '#AD1457',
  primaryLight: '#FFF0F5',
  primaryLightBorder: '#FCE4EC',
  primaryMuted: '#F8BBD0',
  primaryGlow: 'rgba(216, 27, 96, 0.25)',

  // Typography & Neutrals
  white: '#FFFFFF',
  black: '#111827',
  darkGrey: '#2D3748',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  // Borders & Surfaces
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderPink: '#FCE4EC',
  background: '#FFFFFF',
  backgroundLight: '#F9FAFB',
  backgroundPinkLight: '#FFF0F5',

  // Functional Status
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  primary: {
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default {
  COLORS,
  SHADOWS,
};

