import { Button } from '@/components/custom/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className='flex min-h-screen items-center justify-center px-6 py-24'>
      <div className='w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm'>
        <AlertTriangle className='mx-auto h-10 w-10 text-destructive' aria-hidden='true' />
        <h1 className='mt-4 text-2xl font-semibold'>We could not confirm your account</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          The confirmation link may be invalid or expired. Request a new link or try signing in
          again.
        </p>
        <Link href='/auth' className='mt-6 block'>
          <Button className='w-full'>Return to sign in</Button>
        </Link>
      </div>
    </main>
  );
}
