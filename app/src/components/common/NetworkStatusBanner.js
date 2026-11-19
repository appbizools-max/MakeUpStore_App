import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Universal Network Status Top Banner for Mobile (Customer App, Driver/Rider App, Staff App)
 * - Detects disconnected/offline and slow internet connections.
 * - Displays an alert banner at the very top of the screen when disconnected or slow.
 * - Automatically displays a green "Back online!" indicator for 3s upon reconnection, then disappears.
 * - Renders NOTHING (null) when the network is healthy.
 */
export const NetworkStatusBanner = () => {
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'slow' | 'offline' | 'restored'
  const wasOfflineRef = useRef(false);
  const restoreTimerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const probeConnection = async () => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Lightweight ping to Supabase or Google DNS/connectivity check
      const res = await fetch(`https://clients3.google.com/generate_204?_t=${startTime}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      if (latency > 2500) {
        setNetworkStatus('slow');
      } else {
        if (wasOfflineRef.current) {
          setNetworkStatus('restored');
          if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
          restoreTimerRef.current = setTimeout(() => {
            setNetworkStatus('online');
            wasOfflineRef.current = false;
          }, 3000);
        } else {
          setNetworkStatus('online');
        }
      }
    } catch (err) {
      // If request timed out or network unreachable
      if (err.name === 'AbortError') {
        setNetworkStatus('slow');
      } else {
        wasOfflineRef.current = true;
        setNetworkStatus('offline');
      }
    }
  };

  useEffect(() => {
    // Initial probe on mount
    probeConnection();

    // Periodic heartbeat probe every 8 seconds
    const interval = setInterval(() => {
      probeConnection();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, []);

  // Smooth slide and fade animation when status changes
  useEffect(() => {
    if (networkStatus !== 'online') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [networkStatus]);

  // When connection is normal, don't show anything
  if (networkStatus === 'online') {
    return null;
  }

  const isOffline = networkStatus === 'offline';
  const isSlow = networkStatus === 'slow';
  const isRestored = networkStatus === 'restored';

  const bgColor = isOffline ? '#E11D48' : isSlow ? '#D97706' : '#059669';

  return (
    <Animated.View
      style={{
        backgroundColor: bgColor,
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 0]
            })
          }
        ],
        paddingVertical: 7,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        zIndex: 9999,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : isSlow ? 'warning-outline' : 'checkmark-circle-outline'}
          size={16}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', flexShrink: 1 }}>
          {isOffline
            ? 'You are offline. Please check your internet.'
            : isSlow
            ? 'Slow internet detected. Updating may take longer.'
            : 'Back online! Connection restored.'}
        </Text>
      </View>

      {isOffline && (
        <TouchableOpacity
          onPress={probeConnection}
          style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center'
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};
