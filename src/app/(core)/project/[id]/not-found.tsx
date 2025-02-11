import { Button } from '@/components/ui/button';
import { FolderX } from 'lucide-react';
import Link from 'next/link';

/**
 * Not Found component for project routes
 * Displays when a project is not found or user doesn't have access
 */
export default function ProjectNotFound() {
  return (
    <div className='container mx-auto p-4 md:p-6'>
      <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4'>
        <div className='rounded-xl bg-muted p-4'>
          <FolderX className='h-12 w-12 text-muted-foreground' />
        </div>
        <div className='space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Project Not Found</h1>
          <p className='text-sm text-muted-foreground'>
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
            it.
          </p>
        </div>
        <div className='flex gap-4'>
          <Button variant='outline' asChild>
            <Link href='/project/all'>View All Projects</Link>
          </Button>
          <Button asChild>
            <Link href='/project/all'>Create New Project</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
