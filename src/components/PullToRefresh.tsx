import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistance = useMotionValue(0);
  const springPullDistance = useSpring(pullDistance, { damping: 20, stiffness: 200 });
  const startY = useRef(0);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resistance effect
      const distance = Math.min(diff * 0.4, PULL_THRESHOLD + 20);
      pullDistance.set(distance);
      
      if (diff > 10) {
        // Prevent default only if we are actually pulling
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    const currentDistance = pullDistance.get();
    if (currentDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      pullDistance.set(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
    }
    startY.current = 0;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <motion.div
        style={{ height: springPullDistance }}
        className="flex items-center justify-center overflow-hidden bg-gray-50/50"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
          className="text-primary"
        >
          <RefreshCw size={24} />
        </motion.div>
      </motion.div>
      
      <motion.div>
        {children}
      </motion.div>
    </div>
  );
};
