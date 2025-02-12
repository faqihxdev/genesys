'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import { InviteMemberDialog } from './_components/invite-member-dialog';
import { MemberList } from './_components/member-list';

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className='container mx-auto p-4 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold'>Project Settings</h1>
        <p className='text-muted-foreground text-sm'>
          Configure project-specific settings, manage team access, and customize AI persona
          parameters for your marketing campaigns.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage who has access to this project and their roles.
            </CardDescription>
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
