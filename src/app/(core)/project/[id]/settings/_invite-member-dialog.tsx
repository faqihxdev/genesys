'use client';

import { Button } from '@/components/custom/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { createProjectInvite } from '@/server/invites';
import { searchUsersByEmail } from '@/server/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, MailPlus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface InviteMemberDialogProps {
  projectId: string;
}

interface InviteMember {
  email: string;
  role: 'member' | 'owner';
  hasAccount: boolean;
}

const emailFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export function InviteMemberDialog({ projectId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [inviteList, setInviteList] = useState<InviteMember[]>([]);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  // Mutation to create project invites
  const { mutate: createInviteMutation, isPending: isCreatingInvite } = useMutation({
    mutationFn: withQuery(createProjectInvite),
    onSuccess: () => {
      // Invalidate both project members and invites queries
      queryClient.invalidateQueries({
        queryKey: queryKey.projectMembers.getProjectMembers({ projectId }),
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.invites.getProjectInvites({ projectId }),
      });
    },
  });

  async function onAddEmail(values: EmailFormValues) {
    const email = values.email.toLowerCase();

    // Check if trying to add themselves
    if (user?.email?.toLowerCase() === email) {
      toast({
        title: 'Invalid email',
        description: 'You cannot add yourself as a member.',
        variant: 'destructive',
      });
      return;
    }

    // Check if email is already in the list
    if (inviteList.some((member) => member.email === email)) {
      toast({
        title: 'Already added',
        description: 'This email has already been added to the invite list.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSearching(true);
      // Search for existing user
      const existingUser = await withQuery(searchUsersByEmail)({ projectId, email });

      setInviteList((current) => [
        ...current,
        {
          email,
          role: 'member',
          hasAccount: !!existingUser,
        },
      ]);

      // Reset form
      form.reset();

      toast({
        title: 'Email added',
        description: existingUser
          ? 'User has an existing account and will be added directly.'
          : 'User will be invited to create an account.',
      });
    } catch (error) {
      console.error('[InviteMemberDialog/onAddEmail]:', error);
      toast({
        title: 'Error',
        description: 'Failed to add email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  }

  function updateMemberRole(email: string, role: 'member' | 'owner') {
    setInviteList((current) =>
      current.map((member) => (member.email === email ? { ...member, role } : member))
    );
  }

  function removeMember(email: string) {
    setInviteList((current) => current.filter((member) => member.email !== email));
  }

  async function onSubmit() {
    try {
      // Create invites for each email in the list
      await Promise.all(
        inviteList.map(async (member) => {
          try {
            createInviteMutation({ projectId, email: member.email });
          } catch (error) {
            // Log individual failures but continue with others
            console.error('[InviteMemberDialog/onSubmit]:', error);
            toast({
              title: `Failed to invite ${member.email}`,
              description: error instanceof Error ? error.message : 'An error occurred',
              variant: 'destructive',
            });
          }
        })
      );

      toast({
        title: 'Success',
        description: `Invited ${inviteList.length} member${inviteList.length === 1 ? '' : 's'}.`,
        variant: 'success',
      });

      // Reset and close
      setInviteList([]);
      setOpen(false);
    } catch (error) {
      console.error('[InviteMemberDialog/onSubmit]:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invites. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className='h-4 w-4' />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Invite Project Members</DialogTitle>
          <DialogDescription>
            Users without an account will be invited to create one.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Email Input Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddEmail)} className='flex gap-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormControl>
                      <Input {...field} placeholder='Enter email address' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                disabled={isSearching}
                isLoading={isSearching}
                loadingText='Adding...'
              >
                <MailPlus className='h-4 w-4' />
                Add
              </Button>
            </form>
          </Form>

          {/* Invite List */}
          {inviteList.length > 0 && (
            <div className='space-y-4'>
              <div className='text-sm font-medium'>Members to invite:</div>
              <div className='space-y-2'>
                {inviteList.map((member) => (
                  <div
                    key={member.email}
                    className='flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='flex flex-col'>
                        <span className='font-medium'>{member.email}</span>
                        <Badge
                          variant={member.hasAccount ? 'default' : 'secondary'}
                          className='w-fit'
                        >
                          {member.hasAccount ? <Check className='mr-1 h-3 w-3' /> : null}
                          {member.hasAccount ? 'Has Account' : 'Will be Invited'}
                        </Badge>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Select
                        value={member.role}
                        onValueChange={(value: 'member' | 'owner') =>
                          updateMemberRole(member.email, value)
                        }
                      >
                        <SelectTrigger className='w-[120px]'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='member'>Member</SelectItem>
                          <SelectItem value='owner'>Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => removeMember(member.email)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                setOpen(false);
                setInviteList([]);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={inviteList.length === 0}
              isLoading={isCreatingInvite}
              loadingText='Inviting...'
            >
              <UserPlus className='h-4 w-4' />
              Invite Members
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
