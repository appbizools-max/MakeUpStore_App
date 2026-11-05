import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getSubcategoriesForCategory } from '../../config/categoriesHierarchy';
import { CategoryHeader } from './components/CategoryHeader';
import { getSafeImageSource } from '../../utils/imageUtils';

/**
 * Curated authentic cosmetic descriptions for all subcategories
 */
const BEAUTY_DESCRIPTIONS = {
  // Skincare
  'acne & blemish care': 'Target breakouts and help control excess oil.',
  'acne and blemish care': 'Target breakouts and help control excess oil.',
  'acne & blemishes': 'Target breakouts and help control excess oil.',
  'face cleansers': 'Gently cleanse and refresh your skin.',
  'cleansers': 'Gently cleanse and refresh your skin.',
  'face wash': 'Deeply purify and revitalize tired skin.',
  'face moisturizers': 'Hydrate and nourish your skin.',
  'moisturizers': 'Hydrate and nourish your skin.',
  'sunscreen': 'Protect your skin from harmful UV rays.',
  'sun care': 'Broad-spectrum UV protection and skin defense.',
  'face serums': 'Target specific skin concerns with concentrated care.',
  'serums': 'Target specific skin concerns with concentrated care.',
  'face masks': 'Give your skin extra hydration and nourishment.',
  'masks': 'Give your skin extra hydration and nourishment.',
  'toners & mists': 'Restore skin balance and lock in moisture.',
  'eye care': 'Brighten, firm, and refresh the delicate eye area.',
  'lip care': 'Smooth, soothe, and deeply moisturize lips.',
  'exfoliators & scrubs': 'Gently polish away dull surface skin.',

  // Makeup
  'face makeup': 'Create a flawless, smooth, and radiant base.',
  'foundation': 'Seamless coverage with a natural radiant finish.',
  'blusher': 'Add a natural flush of vibrant color to your cheeks.',
  'blush': 'Add a natural flush of vibrant color to your cheeks.',
  'compact': 'Control shine and lock in a silky matte finish.',
  'compact powder': 'Control shine and lock in a silky matte finish.',
  'concealer': 'Effortlessly camouflage spots, redness, and dark circles.',
  'highlighter': 'Glow from within with luminous radiant accents.',
  'primer': 'Smooth pore texture and maximize makeup longevity.',
  'setting spray': 'Keep your finished look intact all day and night.',
  'lip makeup': 'Define and enhance your lips with expressive shades.',
  'lipstick': 'Long-wearing, rich pigment for velvety soft lips.',
  'liquid lipstick': 'Transfer-proof, bold color with intense saturation.',
  'lip gloss': 'High-shine, juicy moisture for visibly plumper lips.',
  'lip liner': 'Sculpt, shape, and prevent feathering with precision.',
  'eye makeup': 'Draw striking focus with intense depth and pigment.',
  'kajal': 'Smudge-proof, deep black strokes for all-day wear.',
  'eyeliner': 'Crisp, razor-sharp lines and dramatic cat-eye wings.',
  'mascara': 'Dramatic length, clump-free lift, and lush volume.',
  'eyeshadow': 'Blendable, highly pigmented palettes for captivating looks.',
  'eyebrow pencil': 'Fill, shape, and define natural-looking brows.',
  'nails': 'Vibrant salon-quality color and strong, healthy nails.',
  'nail polish': 'Chip-resistant, ultra-glossy professional lacquer.',
  'makeup tools': 'Precision brushes, blending sponges, and applicators.',

  // Hair Care
  'shampoo': 'Deeply cleanse your scalp and refresh healthy strands.',
  'conditioner': 'Detangle effortlessly and seal in silky softness.',
  'hair oil': 'Nourish hair roots and stimulate resilient growth.',
  'hair serum': 'Tame frizz and impart mirror-like luminous shine.',
  'hair mask': 'Intensive repair and moisture for damaged strands.',
  'hair color': 'Rich, vibrant shades and radiant multi-tonal shine.',
  'styling cream': 'Lightweight control and flexible, touchable hold.',

  // Fragrance
  'perfume (edp)': 'Long-lasting signature luxury scents for memorable moments.',
  'eau de parfum': 'Long-lasting signature luxury scents for memorable moments.',
  'eau de toilette (edt)': 'Light, vibrant, and invigorating daytime fragrance.',
  'body mist': 'A light, breezy burst of fragrance for all-day freshness.',
  'deodorant': 'Reliable odor protection with an elegant touch of scent.',
  'luxury scents': 'Rare, artisanal olfactory compositions.',

  // Bath & Body
  'body wash & shower gel': 'Rich lather that leaves skin soft, clean, and scented.',
  'body lotion & butter': 'Deep, 24-hour hydration for smooth, supple skin.',
  'body scrubs & polishes': 'Exfoliate gently to reveal glowing, silky skin.',
  'hand & foot care': 'Intensive restorative care for hard-working hands and feet.'
};

/**
 * CategoryDetailView (Level 2)
 * Premium, minimal white-and-pink UI/UX matching reference layout:
 * 1. Category Header with parent link, category icon & title, search and cart
 * 2. Shop by Category soft-pink banner with Explore All action
 * 3. Real-time subcategory search bar
 * 4. Clean rounded subcategory cards with title, description, and pink chevron
 */
export const CategoryDetailView = ({
  category,
  onSelectSubcategory,
  onBack,
  onViewAllProducts,
  liveSubcategories = null,
  liveLeafCategories = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize category name & key
  const categoryName = category?.name || 'Category';
  const categoryIconName = useMemo(() => {
    const n = (categoryName || '').toLowerCase();
    if (n.includes('skin')) return 'leaf-outline';
    if (n.includes('make') || n.includes('cosmet')) return 'brush-outline';
    if (n.includes('hair')) return 'cut-outline';
    if (n.includes('fragran') || n.includes('perfum')) return 'flask-outline';
    if (n.includes('bath') || n.includes('body')) return 'water-outline';
    if (n.includes('nail')) return 'sparkles-outline';
    if (n.includes('men')) return 'man-outline';
    return 'sparkles-outline';
  }, [categoryName]);

  // Dynamic Subcategories: Live DB first, fallback to category hierarchy
  const subcategories = useMemo(() => {
    if (liveSubcategories && Array.isArray(liveSubcategories) && liveSubcategories.length > 0) {
      const nCatId    = (category?.id     || '').toLowerCase().trim();
      const nCatName  = (category?.name   || '').toLowerCase().trim();
      const nCatDbKey = (category?.dbKey  || '').toLowerCase().trim();
      const matched = liveSubcategories.filter(s => {
        if (s.enabled === false) return false;
        const sCatId   = (s.categoryId   || s.category_id   || '').toLowerCase().trim();
        const sCatName = (s.categoryName || s.category_name || '').toLowerCase().trim();
        return (nCatId && sCatId === nCatId) ||
               (nCatName && (sCatId === nCatName || sCatName === nCatName)) ||
               (nCatDbKey && sCatId === nCatDbKey);
      });
      if (matched.length > 0) {
        return matched
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
          .map(s => {
            let childLeaves = [];
            if (liveLeafCategories && Array.isArray(liveLeafCategories)) {
              const sId   = (s.id   || '').toLowerCase().trim();
              const sName = (s.name || '').toLowerCase().trim();
              childLeaves = liveLeafCategories.filter(l => {
                if (l.enabled === false) return false;
                const lSubId   = (l.subcategoryId   || '').toLowerCase().trim();
                const lSubName = (l.subcategoryName || '').toLowerCase().trim();
                return (sId && lSubId === sId) || (sName && (lSubId === sName || lSubName === sName));
              });
            }
            if (childLeaves.length === 0 && Array.isArray(s.leafCategories)) {
              childLeaves = s.leafCategories.filter(l => l.enabled !== false);
            }
            return { ...s, leafCategories: childLeaves };
          });
      }
    }
    return getSubcategoriesForCategory(category);
  }, [category, liveSubcategories, liveLeafCategories]);

  // Real-time search filtered subcategories
  const filteredSubcategories = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return subcategories;
    return subcategories.filter(s => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || s.tagline || BEAUTY_DESCRIPTIONS[name] || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [subcategories, searchQuery]);

  // Helper for subtitle / 1-line description
  const getSubcategoryDescription = (sub) => {
    if (sub.description && sub.description.trim()) return sub.description.trim();
    if (sub.tagline && sub.tagline.trim()) return sub.tagline.trim();
    const clean = (sub.name || '').trim().toLowerCase();
    if (BEAUTY_DESCRIPTIONS[clean]) return BEAUTY_DESCRIPTIONS[clean];
    for (const [k, desc] of Object.entries(BEAUTY_DESCRIPTIONS)) {
      if (clean.includes(k) || k.includes(clean)) return desc;
    }
    return `Discover authentic ${sub.name || 'cosmetic'} essentials.`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. UNIFIED CATEGORY HEADER ───────────────────────────── */}
      <CategoryHeader
        parentTitle="Categories"
        title={categoryName}
        categoryIcon={categoryIconName}
        categoryImage={category?.image || null}
        onBack={onBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110
        }}
        className="bg-white flex-1"
      >
        {/* ── 2. "SHOP BY CATEGORY" LUXURY RIBBON BANNER ───────────── */}
        <View
          style={{
            backgroundColor: '#FFF0F5',
            borderColor: '#F6DCE6',
            borderWidth: 1.2,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1
          }}
        >
          {/* Left: 3D Category Icon Avatar */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              borderColor: '#F8B4D9',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              flexShrink: 0,
              shadowColor: '#C2477A',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1
            }}
          >
            {category?.image ? (
              <Image
                source={getSafeImageSource(category.image)}
                style={{ width: '84%', height: '84%' }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name={categoryIconName} size={22} color="#C2477A" />
            )}
          </View>

          {/* Center: Title & Subtitle */}
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{ color: '#1F2937', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}
              numberOfLines={1}
            >
              Shop by Category
            </Text>
            <Text
              style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginTop: 2 }}
              numberOfLines={1}
            >
              Find the right {categoryName.toLowerCase()} for your routine
            </Text>
          </View>

          {/* Right: Explore All -> Outline Pill */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onViewAllProducts}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#C2477A',
              borderWidth: 1.3,
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 13,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0
            }}
          >
            <Text style={{ color: '#C2477A', fontSize: 12, fontWeight: '800' }}>
              Explore All
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#C2477A" />
          </TouchableOpacity>
        </View>

        {/* ── 3. SEARCH SUBCATEGORIES INPUT ────────────────────────── */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#F0E3EA',
            borderWidth: 1.2,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 46,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#C2477A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1
          }}
        >
          <Ionicons name="search" size={18} color="#C2477A" style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${categoryName.toLowerCase()} categories...`}
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              color: '#1F2937',
              fontSize: 13.5,
              fontWeight: '500',
              paddingVertical: 0
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={17} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── 4. VERTICAL SUBCATEGORY CARDS LIST ───────────────────── */}
        <View className="space-y-3">
          {filteredSubcategories.map((sub) => {
            const description = getSubcategoryDescription(sub);
            return (
              <TouchableOpacity
                key={sub.id || sub.name}
                activeOpacity={0.7}
                onPress={() => onSelectSubcategory && onSelectSubcategory(sub)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#F0E3EA',
                  borderWidth: 1.2,
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#C2477A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1
                }}
              >
                {/* Left: Title & 1-line Description */}
                <View style={{ flex: 1, paddingRight: 14 }}>
                  <Text
                    style={{ color: '#1F2937', fontSize: 15.5, fontWeight: '800' }}
                    numberOfLines={1}
                  >
                    {sub.name}
                  </Text>
                  <Text
                    style={{ color: '#6B7280', fontSize: 12.5, fontWeight: '500', marginTop: 4, lineHeight: 18 }}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                </View>

                {/* Right: Soft Circular Pink Arrow Button (>) */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FFF0F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Ionicons name="chevron-forward" size={16} color="#C2477A" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty state when search yields no matches */}
        {filteredSubcategories.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FFF0F5',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <Ionicons name="search-outline" size={26} color="#C2477A" />
            </View>
            <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>
              No categories match "{searchQuery}"
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 12.5, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
              Try searching for something else or explore all products directly.
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              style={{
                marginTop: 14,
                backgroundColor: '#C2477A',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                Reset Search
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryDetailView;
