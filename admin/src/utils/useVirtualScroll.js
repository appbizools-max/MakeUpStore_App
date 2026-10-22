import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-Performance Virtual Scrolling Hook for Big Datasets (up to 100,000+ items)
 * 
 * @param {Object} options
 * @param {number} options.totalItems - Total number of items in dataset
 * @param {number} [options.itemHeight] - Estimated/fixed height per row in pixels (default 56)
 * @param {number} [options.overscan] - Number of extra rows to render above and below (default 6)
 * @param {React.RefObject} options.containerRef - Ref to the scrolling container element
 */
export function useVirtualScroll({
  totalItems,
  totalCount,
  itemHeight = 64,
  rowHeight,
  overscan = 10,
  containerRef
}) {
  const count = typeof totalItems === 'number' ? totalItems : (typeof totalCount === 'number' ? totalCount : 0);
  const actualHeight = rowHeight || itemHeight || 64;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const animationFrameRef = useRef(null);

  // Measure container height on mount and resize
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const updateHeight = () => {
      if (container) {
        setContainerHeight(container.clientHeight || 600);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [containerRef]);

  // Listen to scroll events with requestAnimationFrame throttling for 60fps
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [containerRef]);

  const totalHeight = count * actualHeight;

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const container = containerRef?.current;
    if (!container) return;
    const targetScroll = Math.max(0, Math.min(totalHeight - containerHeight, index * actualHeight));
    container.scrollTo({ top: targetScroll, behavior });
  }, [containerRef, totalHeight, containerHeight, actualHeight]);

  // For smaller datasets (<= 40 rows), avoid virtualization gaps entirely for 100% instant reactivity & visibility
  if (count <= 40) {
    return {
      startIndex: 0,
      endIndex: count,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight,
      visibleCount: count,
      scrollToIndex
    };
  }

  // Calculate visible range for large datasets (50 to 100,000+ items)
  const startIndex = Math.max(0, Math.floor(scrollTop / actualHeight) - overscan);
  const endIndex = Math.min(
    count,
    Math.ceil((scrollTop + containerHeight) / actualHeight) + overscan
  );

  const paddingTop = startIndex * actualHeight;
  const paddingBottom = Math.max(0, (count - endIndex) * actualHeight);

  return {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
    totalHeight,
    visibleCount: endIndex - startIndex,
    scrollToIndex
  };
}
