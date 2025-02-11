import { Spinner } from '@/components/custom/loading';
import { getCurrentUser } from '@/server/auth';
import { checkProjectAccess, getProjectById } from '@/server/projects';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

/**
 * Layout component for project routes
 * Handles project data fetching and authorization
 */
export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  // Handle authentication first
  const { data: user, error: userError } = await getCurrentUser();

  if (userError || !user) {
    redirect('/auth');
  }

  const resolvedParams = await params;

  // Skip access checks for all projects page
  if (resolvedParams.id === 'all') {
    return (
      <div className='container mx-auto p-4 md:p-6'>
        <Suspense
          fallback={
            <div className='flex min-h-[200px] items-center justify-center'>
              <Spinner />
            </div>
          }
        >
          <div className='space-y-6'>{children}</div>
        </Suspense>
      </div>
    );
  }

  // Check if project exists and user has access
  const [projectResult, accessResult] = await Promise.all([
    getProjectById({ projectId: resolvedParams.id }),
    checkProjectAccess({ projectId: resolvedParams.id, userId: user.id }),
  ]);

  // Handle project not found
  if (projectResult.error || !projectResult.data) {
    console.error('[ProjectLayout]:', projectResult.error || 'Project not found');
    notFound();
  }

  // Handle access denied
  if (accessResult.error || !accessResult.data) {
    console.error('[ProjectLayout]:', accessResult.error || 'Access denied');
    notFound();
  }

  return (
    <Suspense fallback={<Spinner />}>
      <div className='space-y-6'>{children}</div>
    </Suspense>
  );
}
