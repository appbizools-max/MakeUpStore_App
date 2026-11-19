import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Universal Network Status Top Banner for Admin & Staff Panel
 * - Shows red/rose banner when disconnected (offline).
 * - Shows amber banner when slow network detected.
 * - Shows green banner for 3s when connection is restored.
 * - Completely hides when connection is normal (online).
 */
export default function NetworkStatusBanner() {
  const [networkStatus, setNetworkStatus] = useState('online'); // 'online' | 'slow' | 'offline' | 'restored'
  const wasOfflineRef = useRef(false);
  const restoreTimerRef = useRef(null);

  useEffect(() => {
    // 1. Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setNetworkStatus('offline');
      wasOfflineRef.current = true;
    }

    const handleOffline = () => {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      wasOfflineRef.current = true;
      setNetworkStatus('offline');
    };

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        setNetworkStatus('restored');
        restoreTimerRef.current = setTimeout(() => {
          setNetworkStatus('online');
          wasOfflineRef.current = false;
        }, 3000);
      } else {
        setNetworkStatus('online');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // 2. Check Network Information API (Chrome / Edge / Opera)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const checkConnectionQuality = () => {
      if (!navigator.onLine) {
        handleOffline();
        return;
      }
      if (conn) {
        const is2G = conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
        const isHighRtt = conn.rtt && conn.rtt > 2000;
        if (is2G || isHighRtt) {
          if (networkStatus !== 'offline') setNetworkStatus('slow');
          return;
        }
      }
    };

    if (conn) {
      conn.addEventListener('change', checkConnectionQuality);
      checkConnectionQuality();
    }

    // 3. Periodic lightweight heartbeat & latency probe (every 10s)
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        handleOffline();
        return;
      }

      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        // Ping favicon or lightweight origin resource with cache busting
        const res = await fetch(`/favicon.ico?_ping=${startTime}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;
        if (!res.ok && res.status >= 500) {
          // Server error or unreachable
          if (latency > 2500) setNetworkStatus('slow');
        } else if (latency > 2500) {
          setNetworkStatus('slow');
        } else {
          // Healthy connection
          if (wasOfflineRef.current) {
            handleOnline();
          } else {
            setNetworkStatus('online');
          }
        }
      } catch (err) {
        // Fetch aborted or network disconnected
        if (err.name === 'AbortError') {
          setNetworkStatus('slow');
        } else if (!navigator.onLine) {
          handleOffline();
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (conn) conn.removeEventListener('change', checkConnectionQuality);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      clearInterval(interval);
    };
  }, [networkStatus]);

  // When connection is normal (online and not recently restored/slow): DO NOT SHOW
  if (networkStatus === 'online') {
    return null;
  }

  return (
    <div
      role="alert"
      className={`w-full z-[9999] px-4 py-2 text-xs font-bold text-white flex items-center justify-between gap-3 shadow-md transition-all duration-300 animate-slide-down ${
        networkStatus === 'offline'
          ? 'bg-gradient-to-r from-rose-600 to-rose-700'
          : networkStatus === 'slow'
          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
          : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
      }`}
    >
      <div className="flex items-center gap-2.5 mx-auto">
        {networkStatus === 'offline' && (
          <>
            <div className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <WifiOff size={15} className="shrink-0" />
            <span>You are offline. Please check your internet connection.</span>
          </>
        )}

        {networkStatus === 'slow' && (
          <>
            <AlertTriangle size={15} className="shrink-0 animate-bounce" />
            <span>Slow network detected. Store metrics and live orders may take longer to sync.</span>
          </>
        )}

        {networkStatus === 'restored' && (
          <>
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Back online! Connection restored.</span>
          </>
        )}
      </div>

      {networkStatus === 'offline' && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
          title="Retry connection"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
