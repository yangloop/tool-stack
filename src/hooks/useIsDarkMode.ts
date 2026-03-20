import { useEffect, useState } from 'react';

function getCurrentDarkMode() {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.documentElement.classList.contains('dark');
}

export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(getCurrentDarkMode);
  const [isReady, setIsReady] = useState(() => typeof document !== 'undefined');

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    setIsReady(true);

    const updateTheme = () => {
      setIsDark(getCurrentDarkMode());
    };

    updateTheme();

    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(updateTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return { isDark, isReady };
}
