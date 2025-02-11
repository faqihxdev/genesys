'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import useHydration from '@/hooks/use-hydration';
import type { ProjectExtended } from '@/server/db/schema/project';
import { getProjectByUserId } from '@/server/projects';
import { withQuery } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Crown, Folder, FolderGit2, Users2 } from 'lucide-react';
import Link from 'next/link';
import { ProjectActions } from './_components/project-actions';
import { ProjectDialog } from './_components/project-dialog';

function ProjectCard({ project }: { project: ProjectExtended }) {
  return (
    <Card className='group relative h-full min-h-[200px] overflow-hidden transition-all hover:border-primary/50 hover:shadow-md'>
      <div className='absolute right-4 top-4'>
        <ProjectActions project={project} />
      </div>
      <CardHeader className='flex h-full flex-col justify-between space-y-4 p-6'>
        <Link href={`/project/${project.id}`} className='flex min-w-0 flex-col gap-3'>
          <div className='rounded-md bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20 w-fit'>
            <Folder className='h-5 w-5 shrink-0' />
          </div>
          <div className='min-w-0 space-y-1.5'>
            <CardTitle className='line-clamp-2 text-xl leading-tight'>{project.name}</CardTitle>
            {project.description && (
              <CardDescription className='line-clamp-3 text-sm/relaxed'>
                {project.description}
              </CardDescription>
            )}
          </div>
        </Link>

        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          {project.role === 'owner' ? (
            <div className='inline-flex items-center rounded-md px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary bg-primary/10 text-primary hover:bg-primary/20'>
              <Crown className='mr-1 h-3.5 w-3.5 shrink-0' />
              Owner
            </div>
          ) : (
            <div className='inline-flex items-center rounded-md px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-muted bg-muted/10 text-muted-foreground hover:bg-muted/20'>
              <Users2 className='mr-1 h-3.5 w-3.5 shrink-0' />
              Member
            </div>
          )}

          {project.isDefault && (
            <div className='inline-flex items-center rounded-md px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary bg-primary/10 text-primary hover:bg-primary/20'>
              Default
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function ProjectCardSkeleton() {
  return (
    <Card className='group relative h-full min-h-[200px] overflow-hidden transition-all hover:border-primary/50 hover:shadow-md'>
      <div className='absolute right-4 top-4'>
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
      <CardHeader className='flex h-full flex-col justify-between space-y-4 p-6'>
        <div className='flex min-w-0 flex-col gap-3'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <div className='min-w-0 space-y-1.5'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3' />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Skeleton className='h-6 w-20 rounded-md' />
          <Skeleton className='h-6 w-16 rounded-md' />
        </div>
      </CardHeader>
    </Card>
  );
}

function ProjectsGrid() {
  const { user } = useAuth();

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects', 'list', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      const result = await withQuery(getProjectByUserId)({ userId: user.id });
      return result;
    },
    enabled: !!user?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch on mount
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
        <p className='text-destructive'>Failed to load projects</p>
        <p className='text-sm text-muted-foreground'>Please try again later</p>
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className='flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50'>
        <div className='rounded-full bg-primary/10 p-4'>
          <FolderGit2 className='h-8 w-8 text-primary' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-xl font-semibold tracking-tight'>No projects found</h3>
          <p className='text-sm text-muted-foreground max-w-[400px]'>
            You haven&apos;t created any projects yet. Create your first project to start generating
            personas and analyzing funnels.
          </p>
        </div>
        <ProjectDialog
          mode='create'
          trigger={
            <Button size='lg' className='mt-2'>
              <FolderGit2 className='mr-2 h-4 w-4' />
              Create your first project
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export default function AllProjectsPage() {
  const isHydrated = useHydration();
  return (
    <div className='pb-8'>
      <div className='mb-8 space-y-2'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>All Projects</h1>
          <ProjectDialog mode='create' />
        </div>
        <p className='text-muted-foreground text-sm'>
          View and manage all your projects in one place. Click on a project to view its details.
        </p>
      </div>
      {isHydrated && <ProjectsGrid />}
    </div>
  );
}
