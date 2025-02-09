'use client';

import { useEffect, useState } from 'react';

/**
 * @description Hook to safely handle client-side only content and prevent hydration errors
 * @returns {boolean} Returns true when the component is hydrated and running on the client
 * @example
 * ```tsx
 * function Component() {
 *   const isHydrated = useHydration();
 *
 *   return (
 *     <div>
 *       {isHydrated ? (
 *         <ClientOnlyContent />
 *       ) : (
 *         <LoadingFallback />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
const useHydration = (): boolean => {
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};

export default useHydration;
