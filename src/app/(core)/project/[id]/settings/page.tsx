'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { InviteMemberDialog } from './_invite-member-dialog';
import { MemberList } from './_member-list';

export const dynamic = 'force-dynamic';

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div className='space-y-1.5'>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>List of team members and their roles.</CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-9 w-9 rounded-md' />
          <Skeleton className='h-9 w-[120px] rounded-md' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 items-center py-3 px-3 bg-accent/20 rounded-lg'
            >
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <Skeleton className='h-4 w-[180px]' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-[100px]' />
              </div>
              <div>
                <Skeleton className='h-4 w-[120px]' />
              </div>
              <div>
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: queryKey.projectMembers.getProjectMembers({ projectId: params.id }),
        }),
        queryClient.refetchQueries({
          queryKey: queryKey.invites.getProjectInvites({ projectId: params.id }),
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className='container mx-auto space-y-6'>
      <PageTitle
        title='Project Settings'
        description='Configure project-specific settings, manage team access, and customize AI persona parameters for your marketing campaigns.'
      />

      {isRefreshing ? (
        <SkeletonCard />
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <div className='space-y-1.5'>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>List of team members and their roles.</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className='h-9 px-3'
                      variant='outline'
                      onClick={handleRefresh}
                      isLoading={isRefreshing}
                      loadingText='Refreshing...'
                    >
                      <RefreshCw className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh member list</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <InviteMemberDialog projectId={params.id} />
            </div>
          </CardHeader>
          <CardContent>
            <MemberList projectId={params.id} />
          </CardContent>
        </Card>
      )}

      {/* Add more settings sections here */}
    </div>
  );
}
