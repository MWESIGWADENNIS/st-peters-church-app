import React, { useEffect } from 'react';

export const ThemeManager: React.FC = () => {
  useEffect(() => {
    const checkTheme = () => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      
      if (isSunday) {
        document.documentElement.classList.add('sunday-mode');
        // Optional: Custom meta theme color for mobile status bar
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#800000');
      } else {
        document.documentElement.classList.remove('sunday-mode');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#4B0082');
      }
    };

    checkTheme();
    
    // Check every hour just in case user leaves app open across midnight
    const interval = setInterval(checkTheme, 3600000);
    return () => clearInterval(interval);
  }, []);

  return null;
};
