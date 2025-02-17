'use client';

import { Button } from '@/components/custom/button';
import { Spinner } from '@/components/custom/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { getProjectInvites, removeProjectInvite } from '@/server/invites';
import {
  getProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/server/project-members';
import { isProjectOwner } from '@/server/projects';
import { getUsersByIds } from '@/server/users';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock, MoreHorizontal, Shield, User } from 'lucide-react';

interface MemberListProps {
  projectId: string;
}

export function MemberList({ projectId }: MemberListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Query to check if current user is owner
  const { data: isOwner } = useQuery({
    queryKey: queryKey.projects.isProjectOwner({ projectId, userId: user?.id ?? '' }),
    queryFn: () => withQuery(isProjectOwner)({ projectId, userId: user?.id ?? '' }),
    enabled: !!user?.id,
  });

  // Query to get project members
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: queryKey.projectMembers.getProjectMembers({ projectId }),
    queryFn: () => withQuery(getProjectMembers)({ projectId }),
  });

  // Query to get project invites
  const { data: invites, isLoading: isInvitesLoading } = useQuery({
    queryKey: queryKey.invites.getProjectInvites({ projectId }),
    queryFn: () => withQuery(getProjectInvites)({ projectId }),
    enabled: !!isOwner,
  });

  // Query to get user data for all members
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: queryKey.users.getUsersByIds({ userIds: members?.map((m) => m.userId) || [] }),
    queryFn: () => withQuery(getUsersByIds)({ userIds: members?.map((m) => m.userId) || [] }),
    enabled: !!members?.length,
  });

  // Create a map of user IDs to emails for easy lookup
  const userEmailMap = new Map(users?.map((u) => [u.id, u.email]));

  // Mutation to remove member
  const { mutate: removeMember } = useMutation({
    mutationFn: withQuery(removeProjectMember),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.projectMembers.getProjectMembers({ projectId }),
      });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update member role
  const { mutate: updateRole } = useMutation({
    mutationFn: withQuery(updateProjectMemberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.projectMembers.getProjectMembers({ projectId }),
      });
      toast({
        title: 'Role updated',
        description: "The member's role has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove invite
  const { mutate: removeInvite } = useMutation({
    mutationFn: withQuery(removeProjectInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.invites.getProjectInvites({ projectId }),
      });
      toast({
        title: 'Invite removed',
        description: 'The invite has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove invite',
        variant: 'destructive',
      });
    },
  });

  if (isMembersLoading || isUsersLoading || (isOwner && isInvitesLoading)) {
    return (
      <div className='flex justify-center p-4'>
        <Spinner />
      </div>
    );
  }

  if (!members) {
    return <div className='text-center p-4 text-muted-foreground'>No members found</div>;
  }

  return (
    <div className='space-y-4'>
      {/* List */}
      <div className='space-y-2'>
        {/* Members */}
        {members.map((member) => {
          const email = userEmailMap.get(member.userId) || member.userId;
          const initials = email.split('@')[0].slice(0, 2).toUpperCase();
          const isCurrentUser = member.userId === user?.id;

          return (
            <div
              key={member.userId}
              className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 items-center py-3 px-3 bg-accent/20 hover:bg-muted/50 rounded-lg text-sm'
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span>{email}</span>
              </div>

              <div className='flex items-center gap-2'>
                {member.role === 'owner' ? (
                  <Shield className='h-4 w-4' />
                ) : (
                  <User className='h-4 w-4' />
                )}
                <span className='capitalize'>{member.role}</span>
              </div>

              <div>{format(new Date(member.createdAt), 'MMM d, yyyy')}</div>

              {isOwner && (
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0' disabled={isCurrentUser}>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {member.role === 'member' ? (
                        <DropdownMenuItem
                          onClick={() =>
                            updateRole({
                              projectId,
                              userId: member.userId,
                              role: 'owner',
                            })
                          }
                        >
                          Make Owner
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            updateRole({
                              projectId,
                              userId: member.userId,
                              role: 'member',
                            })
                          }
                        >
                          Make Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() =>
                          removeMember({
                            projectId,
                            userId: member.userId,
                          })
                        }
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}

        {/* Pending Invites */}
        {isOwner &&
          invites?.map((invite) => (
            <div
              key={invite.id}
              className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 items-center py-3 px-3 bg-accent/20 hover:bg-muted/50 rounded-lg text-sm'
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    {invite.email.split('@')[0].slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{invite.email}</span>
              </div>

              <div className='flex items-center'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant={invite.status === 'pending' ? 'secondary' : 'destructive'}
                        className='w-fit'
                      >
                        <Clock className='h-3 w-3 mr-1' />
                        {invite.status === 'pending' ? 'Pending' : 'Rejected'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Will join as member upon acceptance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className='text-muted-foreground'>
                Invited {format(new Date(invite.createdAt), 'MMM d, yyyy')}
              </div>

              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => removeInvite({ inviteId: invite.id })}
                    >
                      Remove Invite
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
