'use client';

import { Spinner } from '@/components/custom/loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getProjectInvites, removeProjectInvite } from '@/server/invites';
import {
  getProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/server/project-members';
import { isProjectOwner } from '@/server/projects';
import { getUsersByIds } from '@/server/users';
import { withQuery } from '@/utils';
import { queryClient } from '@/utils/query-client';
import { queryKeys } from '@/utils/query-keys';
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
    queryKey: queryKeys.projects.owner(projectId, user?.id),
    queryFn: () => isProjectOwner(projectId, user?.id || ''),
    enabled: !!user?.id,
  });

  // Query to get project members
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: queryKeys.projectMembers.all(projectId),
    queryFn: () => getProjectMembers(projectId),
  });

  // Query to get project invites
  const { data: invites, isLoading: isInvitesLoading } = useQuery({
    queryKey: queryKeys.projectInvites.all(projectId),
    queryFn: () => getProjectInvites(projectId),
    enabled: !!isOwner?.data,
  });

  // Query to get user data for all members
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: queryKeys.users.byIds(members?.data?.map((m) => m.userId) || []),
    queryFn: () => getUsersByIds(members?.data?.map((m) => m.userId) || []),
    enabled: !!members?.data?.length,
  });

  // Create a map of user IDs to emails for easy lookup
  const userEmailMap = new Map(users?.data?.map((u) => [u.id, u.email]));

  // Mutation to remove member
  const removeMemberMutation = useMutation({
    mutationFn: withQuery(removeProjectMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers.all(projectId) });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update member role
  const updateRoleMutation = useMutation({
    mutationFn: withQuery(updateProjectMemberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers.all(projectId) });
      toast({
        title: 'Role updated',
        description: "The member's role has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove invite
  const removeInviteMutation = useMutation({
    mutationFn: withQuery(removeProjectInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectInvites.all(projectId) });
      toast({
        title: 'Invite removed',
        description: 'The invite has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove invite',
        variant: 'destructive',
      });
    },
  });

  if (isMembersLoading || isUsersLoading || (isOwner?.data && isInvitesLoading)) {
    return (
      <div className='flex justify-center p-4'>
        <Spinner />
      </div>
    );
  }

  if (!members?.data) {
    return <div className='text-center p-4 text-muted-foreground'>No members found</div>;
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 py-2 font-medium text-muted-foreground'>
        <div>User</div>
        <div>Role</div>
        <div>Joined</div>
        {isOwner?.data && <div>Actions</div>}
      </div>

      {/* List */}
      <div className='space-y-2'>
        {/* Members */}
        {members.data.map((member) => {
          const email = userEmailMap.get(member.userId) || member.userId;
          const initials = email.split('@')[0].slice(0, 2).toUpperCase();

          return (
            <div
              key={member.userId}
              className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 items-center py-3 hover:bg-muted/50 rounded-lg'
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

              {isOwner?.data && (
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {member.role === 'member' ? (
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
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
                            updateRoleMutation.mutate({
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
                          removeMemberMutation.mutate({
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
        {isOwner?.data &&
          invites?.data?.map((invite) => (
            <div
              key={invite.id}
              className='grid grid-cols-[2fr,1fr,1fr,0.5fr] gap-4 items-center py-3 hover:bg-muted/50 rounded-lg'
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    {invite.email.split('@')[0].slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <span>{invite.email}</span>
                  <Badge variant='secondary' className='w-fit'>
                    <Clock className='h-3 w-3 mr-1' />
                    Pending
                  </Badge>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                <span className='capitalize'>member</span>
              </div>

              <div className='flex items-center text-sm text-muted-foreground'>
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
                      onClick={() => removeInviteMutation.mutate(invite.id)}
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
