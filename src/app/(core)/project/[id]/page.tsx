import { PageTitle } from '@/components/custom/page-title';
import { getCurrentUser } from '@/server/auth';
import { getProjectById } from '@/server/projects';
import { redirect } from 'next/navigation';

interface OverviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Project overview page
 * Shows project details and key metrics
 */
export default async function OverviewPage({ params }: OverviewPageProps) {
  const { data: user, error: userError } = await getCurrentUser();
  const resolvedParams = await params;

  if (userError || !user) {
    redirect('/auth');
  }

  const { data: project, error: projectError } = await getProjectById({
    projectId: resolvedParams.id,
  });

  if (projectError || !project) {
    redirect('/project/all');
  }

  return (
    <div className='pb-8'>
      <div className='mb-8 space-y-4'>
        <div className='flex items-center justify-between'>
          <PageTitle
            title={`${project.name} Project Overview`}
            description={project.description || 'No description provided for this project.'}
          />
          <div className='text-sm text-muted-foreground'>
            Last updated: {new Date(project.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='rounded-lg border bg-card p-6'>
          <h3 className='font-semibold mb-2'>Personas</h3>
          <div className='text-2xl font-semibold'>0</div>
          <p className='text-sm text-muted-foreground'>Active personas in this project</p>
        </div>

        <div className='rounded-lg border bg-card p-6'>
          <h3 className='font-semibold mb-2'>Funnels</h3>
          <div className='text-2xl font-semibold'>0</div>
          <p className='text-sm text-muted-foreground'>Active funnels in this project</p>
        </div>

        <div className='rounded-lg border bg-card p-6'>
          <h3 className='font-semibold mb-2'>Simulations</h3>
          <div className='text-2xl font-semibold'>0</div>
          <p className='text-sm text-muted-foreground'>Total simulations run</p>
        </div>
      </div>
    </div>
  );
}
