'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { updatePassword } from '@/server/auth';
import { getSubscriptionByEmail, toggleSubscription } from '@/server/mailing-list';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type FormEvent } from 'react';

export default function AccountPage() {
  const { user, signOut, isSigningOut } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const { data: subscription } = useQuery({
    queryKey: queryKey.mailingList.getSubscriptionByEmail({ email: user?.email ?? '' }),
    queryFn: () => withQuery(getSubscriptionByEmail)({ email: user?.email ?? '' }),
    enabled: !!user?.email,
  });
  const { mutate: toggleMailingList, isPending: isToggling } = useMutation({
    mutationFn: (subscribed: boolean) =>
      withQuery(toggleSubscription)({ email: user?.email ?? '', subscribed }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKey.mailingList.getSubscriptionByEmail({ email: user?.email ?? '' }),
      }),
    onError: (error: Error) =>
      toast({
        title: 'Subscription update failed',
        description: error.message,
        variant: 'destructive',
      }),
  });
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsUpdating(true);
    try {
      await withQuery(updatePassword)({
        currentPassword: passwords.currentPassword,
        password: passwords.password,
      });
      setPasswords({ currentPassword: '', password: '', confirmPassword: '' });
      toast({ title: 'Password updated', description: 'Other sessions have been signed out.' });
    } catch (error) {
      toast({
        title: 'Password update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }
  return (
    <div className='mx-auto w-full max-w-2xl space-y-6'>
      <PageTitle
        title='Account settings'
        description='Manage your account, password, and email preferences.'
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p>{user?.email}</p>
          {user?.createdAt && (
            <p className='text-sm text-muted-foreground'>
              Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}
            </p>
          )}
          <Button variant='outline' onClick={() => signOut()} isLoading={isSigningOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use at least 10 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='current-password'>Current password</label>
              <Input
                id='current-password'
                type='password'
                autoComplete='current-password'
                required
                maxLength={128}
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords({ ...passwords, currentPassword: event.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='new-password'>New password</label>
              <Input
                id='new-password'
                type='password'
                autoComplete='new-password'
                required
                minLength={10}
                maxLength={128}
                value={passwords.password}
                onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='confirm-password'>Confirm new password</label>
              <Input
                id='confirm-password'
                type='password'
                autoComplete='new-password'
                required
                minLength={10}
                maxLength={128}
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords({ ...passwords, confirmPassword: event.target.value })
                }
              />
            </div>
            <Button type='submit' isLoading={isUpdating}>
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-between gap-4'>
          <label htmlFor='product-updates'>Product updates</label>
          <Switch
            id='product-updates'
            checked={!!subscription && !subscription.deletedAt}
            onCheckedChange={(checked) => toggleMailingList(checked)}
            disabled={isToggling}
          />
        </CardContent>
      </Card>
    </div>
  );
}
