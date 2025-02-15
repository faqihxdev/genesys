import { Button } from '@/components/custom/button';
import { FolderX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
      <div className='rounded-xl bg-muted p-4'>
        <FolderX className='h-12 w-12 text-muted-foreground' />
      </div>
      <div className='space-y-2 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>404 Not Found</h1>
        <p className='text-sm text-muted-foreground'>
          The resource you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
          it.
        </p>
      </div>
      <div className='flex gap-2'>
        <Button>
          <Link href='/project/all'>Projects</Link>
        </Button>
        <Button>
          <Link href='/'>Home</Link>
        </Button>
        <Button>
          <Link href='/account/support'>Support</Link>
        </Button>
      </div>
    </div>
  );
}
