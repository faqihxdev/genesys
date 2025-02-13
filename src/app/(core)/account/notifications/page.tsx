'use client';

import { Spinner } from '@/components/custom/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { acceptProjectInvite, getUserInvites, rejectProjectInvite } from '@/server/invites';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Clock, Mail, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { toast } = useToast();
  const router = useRouter();

  // Query to get user's invites
  const { data: invites, isLoading } = useQuery({
    queryKey: queryKey.invites.getUserInvites(),
    queryFn: withQuery(getUserInvites),
  });

  // Mutation to accept invite
  const { mutate: acceptInvite, isPending: isAccepting } = useMutation({
    mutationFn: withQuery(acceptProjectInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.invites.getUserInvites() });
      toast({
        title: 'Invite accepted',
        description: 'You have been added to the project.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invite',
        variant: 'destructive',
      });
    },
  });

  // Mutation to reject invite
  const { mutate: rejectInvite, isPending: isRejecting } = useMutation({
    mutationFn: withQuery(rejectProjectInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.invites.getUserInvites() });
      toast({
        title: 'Invite rejected',
        description: 'The invite has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject invite',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className='container mx-auto space-y-6'>
      <div className='space-y-4'>
        <h1 className='text-2xl font-semibold'>Notifications</h1>
        <p className='text-muted-foreground text-sm'>
          View and manage your notification preferences, check system alerts, and stay updated with
          important changes across your projects and teams.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Invites</CardTitle>
          <CardDescription>Manage your pending project invitations.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center p-8'>
              <Spinner />
            </div>
          ) : !invites?.length ? (
            <div className='flex flex-col items-center justify-center p-8 text-center'>
              <Mail className='h-12 w-12 text-muted-foreground/50' />
              <h3 className='mt-4 text-lg font-semibold'>No pending invites</h3>
              <p className='text-muted-foreground text-sm mt-1'>
                You don&apos;t have any pending project invitations at the moment.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border'
                >
                  <div className='space-y-1'>
                    <div className='font-medium'>{invite.projectName}</div>
                    <div className='text-sm text-muted-foreground'>
                      Invited by {invite.inviterEmail}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock className='h-3 w-3' />
                      <span>{format(new Date(invite.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 self-end sm:self-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => rejectInvite({ inviteId: invite.id })}
                      disabled={isRejecting}
                    >
                      <X className='h-4 w-4 mr-1' />
                      Reject
                    </Button>
                    <Button
                      size='sm'
                      onClick={() =>
                        acceptInvite(
                          { inviteId: invite.id },
                          {
                            onSuccess: () => router.push(`/project/${invite.projectId}`),
                          }
                        )
                      }
                      disabled={isAccepting}
                    >
                      <Check className='h-4 w-4 mr-1' />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
