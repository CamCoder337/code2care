import { useState, useEffect } from 'react';

export function useHydrationSafe() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}