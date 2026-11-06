/**
 * Salbeau Centralized Typography System
 * Standardized Manrope typography tokens, font sizes, weights, line heights, and text utilities.
 */
import { StyleSheet, Platform } from 'react-native';

export const FONT_FAMILIES = {
  regular: Platform.select({
    ios: 'Manrope-Regular',
    android: 'Manrope-Regular',
    default: 'Manrope, sans-serif'
  }),
  medium: Platform.select({
    ios: 'Manrope-Medium',
    android: 'Manrope-Medium',
    default: 'Manrope, sans-serif'
  }),
  semiBold: Platform.select({
    ios: 'Manrope-SemiBold',
    android: 'Manrope-SemiBold',
    default: 'Manrope, sans-serif'
  }),
  bold: Platform.select({
    ios: 'Manrope-Bold',
    android: 'Manrope-Bold',
    default: 'Manrope, sans-serif'
  })
};

export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: '#2B1520'
  },
  h2: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: '#2B1520'
  },
  h3: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: '#2B1520'
  },
  h4: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: '#2B1520'
  },

  // Body
  bodyLarge: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#3A2430'
  },
  bodyLargeBold: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
    lineHeight: 22,
    color: '#3A2430'
  },
  bodyMedium: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#3A2430'
  },
  bodyMediumSemiBold: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#3A2430'
  },
  bodyMediumBold: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 13,
    lineHeight: 18,
    color: '#3A2430'
  },

  // Small & Captions
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
    lineHeight: 15,
    color: '#705060'
  },
  captionBold: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 11,
    lineHeight: 15,
    color: '#705060'
  },
  tiny: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 10,
    lineHeight: 13,
    color: '#8E6D7E'
  },
  badge: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },

  // Interactive buttons
  buttonLabel: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2
  },
  buttonLabelSmall: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1
  }
});

export default typography;

