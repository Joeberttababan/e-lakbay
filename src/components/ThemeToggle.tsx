import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [isDark, setIsDark] = React.useState(() => {
    // Check if user has a theme preference stored
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isFooterVisible, setIsFooterVisible] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  React.useEffect(() => {
    const checkFooterVisibility = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setIsFooterVisible(false);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if footer is visible in the viewport
      setIsFooterVisible(footerRect.top < windowHeight && footerRect.bottom > 0);
    };

    // Check initially
    checkFooterVisibility();

    // Add scroll listener
    window.addEventListener('scroll', checkFooterVisibility, { passive: true });
    window.addEventListener('resize', checkFooterVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkFooterVisibility);
      window.removeEventListener('resize', checkFooterVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`fixed left-2 md:left-6 z-40 flex h-10 md:h-12 w-10 md:w-12 items-center justify-center rounded-full glass-button text-foreground shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring ${
        isFooterVisible ? 'bottom-52 md:bottom-44' : 'bottom-6'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 md:h-5 md:w-5" />
      ) : (
        <Moon className="h-4 w-4 md:h-5 md:w-5" />
      )}
    </button>
  );
};