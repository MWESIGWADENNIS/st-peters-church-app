import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setIsDismissed(false);
    } else {
      setIsVisible(false);
    }
  }, [isOnline]);

  if (isDismissed || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-accent text-white overflow-hidden sticky top-0 z-[100] shadow-md"
      >
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">
              📶 You are offline — showing saved content
            </span>
          </div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
