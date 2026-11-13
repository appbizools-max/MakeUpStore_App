import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ContinuousBrandScroller — Premium Pink Infinite Auto-Scrolling Brand Bar
 * 
 * Requirements:
 * - Solid primary brand pink background matching Salbeau logo (#D81B60).
 * - Clean white typography for brand names.
 * - Rounded pill-shaped cards with consistent spacing & elevation.
 * - Seamless continuous auto-scroll without jumping or visible gaps.
 * - Pauses immediately on touch/interaction; resumes smoothly after release.
 * - Cancels timers/loops when unmounted or off-screen to prevent memory leaks.
 */
export const ContinuousBrandScroller = ({
  brands = [],
  onSelectBrand,
  onViewAll
}) => {
  const scrollRef = useRef(null);
  const currentOffsetRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const contentWidthRef = useRef(0);

  // Normalize list of brand names
  const brandNames = useMemo(() => {
    const defaultList = ['PURE', 'AIR WICK', 'AJAY', 'AJMAL', 'LAKME', 'MAYBELLINE', 'LOREAL', 'SUGAR', 'MAC', 'PLUM'];
    if (!Array.isArray(brands) || brands.length === 0) return defaultList;
    const names = brands
      .map(b => (typeof b === 'string' ? b : (b?.name || '')).toUpperCase().trim())
      .filter(Boolean);
    const combined = Array.from(new Set([...names, ...defaultList]));
    return combined.slice(0, 16);
  }, [brands]);

  // Triple repeat for seamless looping without visual jumps
  const loopItems = useMemo(() => {
    return [...brandNames, ...brandNames, ...brandNames];
  }, [brandNames]);

  // Smooth continuous auto-scrolling loop
  useEffect(() => {
    let lastTime = Date.now();

    const step = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      if (!isInteractingRef.current && contentWidthRef.current > 0 && scrollRef.current) {
        // Continuous speed: ~32 pixels per second
        const pixelsToMove = (32 * delta) / 1000;
        currentOffsetRef.current += pixelsToMove;

        // Reset seamlessly when 1 full set of brands has scrolled
        const singleSetWidth = contentWidthRef.current / 3;
        if (currentOffsetRef.current >= singleSetWidth) {
          currentOffsetRef.current -= singleSetWidth;
        }

        scrollRef.current.scrollTo({
          x: currentOffsetRef.current,
          animated: false
        });
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Pause on user touch, resume 1200ms after user releases
  const handleTouchStart = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 1200);
  }, []);

  const handleScroll = useCallback((event) => {
    const x = event.nativeEvent.contentOffset.x;
    if (isInteractingRef.current) {
      currentOffsetRef.current = x;
    }
  }, []);

  return (
    <View style={{ marginBottom: 18 }}>
      {/* Section Header: Title + View All */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 10
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
          Shop by Brand
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#D81B60' }}>
            View All →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Infinite Horizontal Brand Scroller */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScrollBeginDrag={handleTouchStart}
        onScrollEndDrag={handleTouchEnd}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onContentSizeChange={(w) => {
          contentWidthRef.current = w;
        }}
      >
        {loopItems.map((brandName, idx) => (
          <TouchableOpacity
            key={`brand_pill_${brandName}_${idx}`}
            activeOpacity={0.85}
            onPress={() => onSelectBrand?.(brandName)}
            style={{
              height: 40,
              paddingHorizontal: 22,
              borderRadius: 20,
              backgroundColor: '#D81B60', // Exact Primary Brand Pink
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              shadowColor: '#D81B60',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.28,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '800',
                color: '#FFFFFF', // Clean White Lettering
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {brandName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ContinuousBrandScroller;

