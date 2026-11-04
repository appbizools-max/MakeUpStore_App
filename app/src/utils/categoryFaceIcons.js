/**
 * categoryFaceIcons.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for 3D Beauty Face Icons across Salbeau MakeUpStore.
 * Provides high-resolution 3D rendered model face avatars for categories.
 * Works offline, loads with zero latency, and provides luxury Nykaa/Tira style visuals.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CATEGORY_3D_FACE_ASSETS = {
  'makeup': require('../../../Assets/category_faces/makeup_3d.jpg'),
  'skincare': require('../../../Assets/category_faces/skincare_3d.jpg'),
  'hair_care': require('../../../Assets/category_faces/hair_care_3d.jpg'),
  'hair_styling': require('../../../Assets/category_faces/hair_styling_3d.jpg'),
  'bath_body': require('../../../Assets/category_faces/bath_body_3d.jpg'),
  'fragrance': require('../../../Assets/category_faces/fragrance_3d.jpg'),
  'mens_grooming': require('../../../Assets/category_faces/mens_grooming_3d.jpg'),
  'nail_care': require('../../../Assets/category_faces/nail_care_3d.jpg'),
  'salon_products': require('../../../Assets/category_faces/salon_products_3d.jpg'),
  'beauty_tools': require('../../../Assets/category_faces/beauty_tools_3d.jpg'),
  'personal_care': require('../../../Assets/category_faces/personal_care_3d.jpg'),
  'beauty_kits': require('../../../Assets/category_faces/beauty_kits_3d.jpg'),
};

/**
 * Maps any category name string (exact or alias) to its corresponding 3D Face image source.
 *
 * @param {string} categoryName
 * @param {string|object} [dbImage] Optional image URL from database
 * @returns {any} React Native Image source (require() object or { uri: string })
 */
export const getCategory3DFaceSource = (categoryName, dbImage) => {
  const key = (categoryName || '').toLowerCase().trim();

  // If a valid custom database image is set and starts with http/data
  if (dbImage && typeof dbImage === 'string' && (dbImage.startsWith('http://') || dbImage.startsWith('https://') || dbImage.startsWith('data:image/'))) {
    return { uri: dbImage };
  }

  // 1. Direct and Alias Matches
  if (key.includes('makeup') || key.includes('cosmetic')) {
    return CATEGORY_3D_FACE_ASSETS['makeup'];
  }
  if (key.includes('skin') || key.includes('facial')) {
    return CATEGORY_3D_FACE_ASSETS['skincare'];
  }
  if (key.includes('hair styling') || key.includes('styling tool')) {
    return CATEGORY_3D_FACE_ASSETS['hair_styling'];
  }
  if (key.includes('hair')) {
    return CATEGORY_3D_FACE_ASSETS['hair_care'];
  }
  if (key.includes('bath') || key.includes('body')) {
    return CATEGORY_3D_FACE_ASSETS['bath_body'];
  }
  if (key.includes('fragrance') || key.includes('perfume') || key.includes('deodorant') || key.includes('cologne')) {
    return CATEGORY_3D_FACE_ASSETS['fragrance'];
  }
  if (key.includes('men') || key.includes('grooming') || key.includes('shaving')) {
    return CATEGORY_3D_FACE_ASSETS['mens_grooming'];
  }
  if (key.includes('nail')) {
    return CATEGORY_3D_FACE_ASSETS['nail_care'];
  }
  if (key.includes('salon') || key.includes('professional')) {
    return CATEGORY_3D_FACE_ASSETS['salon_products'];
  }
  if (key.includes('tool') || key.includes('brush') || key.includes('accessor')) {
    return CATEGORY_3D_FACE_ASSETS['beauty_tools'];
  }
  if (key.includes('personal') || key.includes('hygiene') || key.includes('oral') || key.includes('wellness')) {
    return CATEGORY_3D_FACE_ASSETS['personal_care'];
  }
  if (key.includes('kit') || key.includes('gift') || key.includes('combo')) {
    return CATEGORY_3D_FACE_ASSETS['beauty_kits'];
  }
  if (key.includes('eye')) {
    return CATEGORY_3D_FACE_ASSETS['makeup'];
  }
  if (key.includes('lip')) {
    return CATEGORY_3D_FACE_ASSETS['makeup'];
  }

  // Default fallback to 3D glam makeup face
  return CATEGORY_3D_FACE_ASSETS['makeup'];
};

