'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { InviteMemberDialog } from './_components/invite-member-dialog';
import { MemberList } from './_components/member-list';

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className='container mx-auto space-y-6'>
      <div className='space-y-4'>
        <h1 className='text-2xl font-semibold'>Project Settings</h1>
        <p className='text-muted-foreground text-sm'>
          Configure project-specific settings, manage team access, and customize AI persona
          parameters for your marketing campaigns.
        </p>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <div className='space-y-1.5'>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>List of team members and their roles.</CardDescription>
          </div>
          <InviteMemberDialog projectId={params.id} />
        </CardHeader>
        <CardContent>
          <MemberList projectId={params.id} />
        </CardContent>
      </Card>

      {/* Add more settings sections here */}
    </div>
  );
}
