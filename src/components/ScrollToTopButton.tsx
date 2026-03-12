import React, { useEffect, useState } from 'react';

interface ScrollToTopButtonProps {
  hideOnPages?: string[];
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ hideOnPages = [] }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 640);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFooterVisibility = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setIsFooterVisible(false);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      setIsFooterVisible(footerRect.top < windowHeight && footerRect.bottom > 0);
    };

    checkFooterVisibility();
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
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
      className={`fixed right-2 md:right-6 z-40 flex h-10 md:h-12 w-10 md:w-12 items-center justify-center rounded-full glass-button text-foreground shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
        isFooterVisible ? 'bottom-52 md:bottom-44' : 'bottom-6'
      } ${
        showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
