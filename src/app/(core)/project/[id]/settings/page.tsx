'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { InviteMemberDialog } from './_invite-member-dialog';
import { MemberList } from './_member-list';

export const dynamic = 'force-dynamic';

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

      {/* Add more settings sections here */}
    </div>
  );
}
