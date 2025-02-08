'use client';

import { useUser } from '@/hooks/use-user';

export default function AppPage() {
  const { session, user } = useUser();

  return (
    <>
      <div className='bg-muted p-4 rounded-lg'>
        <h2 className='text-lg font-semibold mb-2'>User</h2>
        <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className='bg-muted p-4 rounded-lg mt-4'>
        <h2 className='text-lg font-semibold mb-2'>Session</h2>
        <pre className='whitespace-pre-wrap break-all'>{JSON.stringify(session, null, 2)}</pre>
      </div>
    </>
  );
}
