import { useState, useEffect } from 'react';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useViewport(): { size: ViewportSize; width: number } {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const size: ViewportSize =
    width < MOBILE_BREAKPOINT ? 'mobile' :
    width < TABLET_BREAKPOINT ? 'tablet' : 'desktop';

  return { size, width };
}
