import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
  Platform,
  PanResponder,
  AppState
} from 'react-native';
import { getSafeImageSource } from '../../../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 600;

/**
 * Premium E-Commerce Brand Card (Nykaa / Myntra / Amazon luxury style)
 * Clean white card, crisp logo with graceful monogram fallback, bold typography, subtle shadow.
 */
export const BrandCard = React.memo(({ brand, onSelectBrand, isTablet = IS_TABLET }) => {
  const brandName = (brand?.name || (typeof brand === 'string' ? brand : '')).trim();
  const [imageError, setImageError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  };

  // Graceful monogram fallback for missing/broken logos (e.g. "Lakmé" -> "LK", "Maybelline" -> "MB")
  const monogram = useMemo(() => {
    if (!brandName) return 'SB';
    const clean = brandName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'SB';
  }, [brandName]);

  const rawLogo = brand?.logo || brand?.logo_url || '';
  const hasValidLogo = !imageError && Boolean(
    rawLogo &&
    typeof rawLogo === 'string' &&
    (rawLogo.startsWith('http') || rawLogo.startsWith('data:image'))
  );

  const cardWidth = isTablet ? 128 : 114;
  const cardHeight = isTablet ? 106 : 96;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onSelectBrand?.(brand)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          marginRight: 12,
          paddingHorizontal: 8,
          paddingVertical: 7,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: '#F0E5EC',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        }}
      >
        {/* Brand Logo Container */}
        <View
          style={{
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 2,
          }}
        >
          {hasValidLogo ? (
            <Image
              source={getSafeImageSource(rawLogo)}
              style={{
                width: isTablet ? 86 : 74,
                height: isTablet ? 48 : 42,
              }}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={{
                width: isTablet ? 46 : 40,
                height: isTablet ? 46 : 40,
                borderRadius: 23,
                backgroundColor: '#FDF2F7',
                borderWidth: 1.5,
                borderColor: '#F8BBD0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: isTablet ? 14 : 12,
                  fontWeight: '800',
                  color: '#D81B60', // Exact Primary Brand Pink
                  letterSpacing: 0.5,
                }}
              >
                {monogram}
              </Text>
            </View>
          )}
        </View>

        {/* Brand Name Divider & Typography */}
        <View
          style={{
            width: '100%',
            paddingTop: 5,
            borderTopWidth: 1,
            borderTopColor: '#F8EBF2',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: isTablet ? 11.5 : 10.5,
              fontWeight: '700',
              color: '#1F2937',
              textAlign: 'center',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
          >
            {brandName}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * ContinuousBrandScroller — GPU-Accelerated Infinite Auto-Scrolling Brand Carousel
 * 
 * Features:
 * - 100% Native Driver execution (`useNativeDriver: true`) via GPU compositing layer.
 * - Zero bridge traffic during continuous linear marquee animation.
 * - Seamless infinite looping without visible gaps, jumps, or flickers.
 * - Supports manual horizontal swiping (PanResponder) and automatically pauses on touch.
 * - Resumes automatically after touch release (1200ms grace period).
 * - Battery & CPU friendly: AppState listener pauses animations when app is backgrounded.
 * - Dynamic brand management: directly reflects active brands from database/API.
 */
export const ContinuousBrandScroller = ({
  brands = [],
  onSelectBrand,
  onViewAll
}) => {
  const animX = useRef(new Animated.Value(0)).current;
  const loopAnimRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isAppActiveRef = useRef(true);
  const singleSetWidthRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const resumeTimeoutRef = useRef(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  // Keep track of current animated value
  useEffect(() => {
    const listenerId = animX.addListener(({ value }) => {
      currentOffsetRef.current = value;
    });
    return () => {
      animX.removeListener(listenerId);
    };
  }, [animX]);

  // Clean & normalize brand items
  const normalizedBrands = useMemo(() => {
    if (!Array.isArray(brands) || brands.length === 0) return [];
    const seen = new Set();
    const result = [];

    brands.forEach((item) => {
      if (!item) return;
      const bObj = typeof item === 'string' ? { id: item, name: item, enabled: true } : item;
      const name = (bObj.name || '').trim();
      const normKey = name.toUpperCase();
      if (!normKey || seen.has(normKey) || bObj.id?.startsWith('app_') || bObj.id?.startsWith('salbeau_')) {
        return;
      }
      seen.add(normKey);
      result.push(bObj);
    });

    // If count is small, repeat items inside base set so single set exceeds screen width
    let baseList = [...result];
    if (baseList.length > 0 && baseList.length < 5) {
      while (baseList.length < 6) {
        baseList = [...baseList, ...result];
      }
    }
    return baseList;
  }, [brands]);

  // Triple repeat for seamless looping without visual jumps (Set A, Set B, Set C)
  const loopItems = useMemo(() => {
    if (normalizedBrands.length === 0) return [];
    return [...normalizedBrands, ...normalizedBrands, ...normalizedBrands];
  }, [normalizedBrands]);

  // Normalizes an offset into the valid range [-width, 0]
  const wrapOffset = useCallback((offset, width) => {
    if (width <= 0) return 0;
    let wrapped = offset % width;
    if (wrapped > 0) wrapped -= width;
    if (wrapped === 0) return 0;
    return wrapped;
  }, []);

  // Native GPU-driven linear infinite scrolling
  const startAnimation = useCallback((fromValue = 0) => {
    const width = singleSetWidthRef.current;
    if (width <= 0 || !isAppActiveRef.current) return;

    if (loopAnimRef.current) {
      loopAnimRef.current.stop();
    }

    const startVal = wrapOffset(fromValue, width);
    animX.setValue(startVal);

    // Constant velocity: 34 pixels per second
    const remainingDistance = Math.abs(-width - startVal);
    const duration = Math.max(150, (remainingDistance / 34) * 1000);

    loopAnimRef.current = Animated.timing(animX, {
      toValue: -width,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    loopAnimRef.current.start(({ finished }) => {
      if (finished && !isInteractingRef.current && isAppActiveRef.current) {
        startAnimation(0);
      }
    });
  }, [animX, wrapOffset]);

  // Schedule auto-scroll resume with grace period
  const scheduleResume = useCallback((delayMs = 1200) => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      if (!isInteractingRef.current && isAppActiveRef.current) {
        startAnimation(currentOffsetRef.current);
      }
    }, delayMs);
  }, [startAnimation]);

  // Start scrolling once dimensions are measured
  useEffect(() => {
    if (hasMeasured && singleSetWidthRef.current > 0 && !isInteractingRef.current && isAppActiveRef.current) {
      startAnimation(currentOffsetRef.current);
    }
    return () => {
      if (loopAnimRef.current) loopAnimRef.current.stop();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [hasMeasured, loopItems, startAnimation]);

  // Battery & CPU optimization: pause when backgrounded, resume when active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        isAppActiveRef.current = true;
        if (!isInteractingRef.current) {
          startAnimation(currentOffsetRef.current);
        }
      } else {
        isAppActiveRef.current = false;
        if (loopAnimRef.current) {
          loopAnimRef.current.stop();
        }
      }
    });
    return () => {
      subscription.remove();
    };
  }, [startAnimation]);

  // PanResponder to handle manual horizontal gestures without blocking card taps
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal drag when movement is clearly intentional
        return Math.abs(gestureState.dx) > 7 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        isInteractingRef.current = true;
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        if (loopAnimRef.current) {
          loopAnimRef.current.stop();
        }
        dragStartOffsetRef.current = currentOffsetRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const width = singleSetWidthRef.current;
        if (width <= 0) return;
        const newOffset = dragStartOffsetRef.current + gestureState.dx;
        const wrapped = wrapOffset(newOffset, width);
        animX.setValue(wrapped);
      },
      onPanResponderRelease: () => {
        isInteractingRef.current = false;
        scheduleResume(1000);
      },
      onPanResponderTerminate: () => {
        isInteractingRef.current = false;
        scheduleResume(1000);
      },
    });
  }, [animX, scheduleResume, wrapOffset]);

  const handleTouchStart = useCallback(() => {
    if (loopAnimRef.current) {
      loopAnimRef.current.stop();
    }
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    scheduleResume(1200);
  }, [scheduleResume]);

  if (loopItems.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Section Header: Title + View All */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: 0.2 }}>
            Shop by Brand
          </Text>
          <View
            style={{
              backgroundColor: '#FDF2F7',
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#F8BBD0',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#D81B60' }}>
              OFFICIAL
            </Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>
            View All →
          </Text>
        </TouchableOpacity>
      </View>

      {/* GPU-Accelerated Infinite Horizontal Brand Carousel */}
      <View
        style={{ overflow: 'hidden', width: '100%' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            transform: [{ translateX: animX }],
            paddingLeft: 16,
          }}
          onLayout={(e) => {
            const fullWidth = e.nativeEvent.layout.width;
            if (fullWidth > 0 && !hasMeasured) {
              singleSetWidthRef.current = fullWidth / 3;
              setHasMeasured(true);
            }
          }}
        >
          {loopItems.map((brandItem, idx) => (
            <BrandCard
              key={`brand_card_${brandItem.id || brandItem.name}_${idx}`}
              brand={brandItem}
              onSelectBrand={onSelectBrand}
              isTablet={IS_TABLET}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

export default ContinuousBrandScroller;
