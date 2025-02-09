'use client';

import { useAuth } from '@/hooks/use-auth';
import useHydration from '@/hooks/use-hydration';

export default function AppPage() {
  const { user } = useAuth();
  const isHydrated = useHydration();

  return (
    <>
      <div className='bg-muted p-4 rounded-lg'>
        <h2 className='text-lg font-semibold mb-2'>User</h2>
        <pre className='whitespace-pre-wrap break-all'>
          {isHydrated ? (user ? JSON.stringify(user, null, 2) : 'Loading...') : 'Loading...'}
        </pre>
      </div>
    </>
  );
}
