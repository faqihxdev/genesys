'use client';

import { Button } from '@/components/custom/button';
import { PageTitle } from '@/components/custom/page-title';
import { Spinner } from '@/components/custom/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import useHydration from '@/hooks/use-hydration';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { createClient } from '@/lib/supabase/client';
import { withQuery } from '@/lib/utils';
import { resetPassword, signOut, updatePassword } from '@/server/auth';
import { getSubscriptionByEmail, toggleSubscription } from '@/server/mailing-list';
import { getUserById } from '@/server/users';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { KeyRound, LogOut, Mail, Shield, Sparkles, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Form schemas
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type NewPasswordForm = z.infer<typeof newPasswordSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, signOut: handleSignOut } = useAuth();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'update'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabase = createClient();
  const isHydrated = useHydration();

  // Query to get detailed user data
  const { data: userData, isLoading } = useQuery({
    queryKey: queryKey.users.getUserById({ userId: user?.id ?? '' }),
    queryFn: () => withQuery(getUserById)({ userId: user?.id ?? '' }),
    enabled: !!user?.id,
  });

  // Query to get mailing list status
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: queryKey.mailingList.getSubscriptionByEmail({ email: user?.email ?? '' }),
    queryFn: () => withQuery(getSubscriptionByEmail)({ email: user?.email ?? '' }),
    enabled: !!user?.email,
  });

  // Form for requesting password reset
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: user?.email ?? '',
    },
  });

  // Form for setting new password
  const newPasswordForm = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Mutation for toggling subscription
  const { mutate: toggleMailingList, isPending: isTogglingSubscription } = useMutation({
    mutationFn: (subscribed: boolean) =>
      withQuery(toggleSubscription)({
        email: user?.email ?? '',
        subscribed,
        description: subscription?.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.mailingList.isEmailSubscribed({ email: user?.email ?? '' }),
      });

      queryClient.invalidateQueries({
        queryKey: queryKey.mailingList.getSubscriptionByEmail({ email: user?.email ?? '' }),
      });

      toast({
        title: 'Subscription updated',
        description: 'Your mailing list preferences have been updated.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subscription.',
        variant: 'destructive',
      });
    },
  });

  // Listen for auth state changes and URL parameters
  useEffect(() => {
    // Check for password reset code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setResetStep('update');
      setIsResetDialogOpen(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetStep('update');
        setIsResetDialogOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      handleSignOut();
      router.push('/auth');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const onRequestReset = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        email: data.email,
        redirectTo: `${window.location.origin}/account`,
      });
      toast({
        title: 'Reset link sent',
        description: 'Check your email for the password reset link.',
        variant: 'success',
      });
      resetForm.reset();
      setIsResetDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to send reset link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onUpdatePassword = async (data: NewPasswordForm) => {
    setIsSubmitting(true);
    try {
      await updatePassword({ password: data.password });

      // Refresh the session after password update
      await supabase.auth.refreshSession();

      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
        variant: 'success',
      });

      // Clear the code from URL
      window.history.replaceState({}, '', '/account');

      newPasswordForm.reset();
      setIsResetDialogOpen(false);
      setResetStep('request');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='w-full max-w-2xl mx-auto space-y-6'>
      <PageTitle
        title='Account Settings'
        description='Manage your personal account settings, update profile information, and configure security preferences and authentication options.'
      />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User2 className='h-5 w-5' />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details and preferences</CardDescription>
        </CardHeader>
        {isHydrated && (
          <CardContent>
            {isLoading ? (
              <div className='flex justify-center p-8'>
                <Spinner size='lg' />
              </div>
            ) : !userData ? (
              <div className='text-center text-muted-foreground'>
                Failed to load user data. Please try again.
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='grid gap-1'>
                  <div className='text-sm font-medium'>Email</div>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Mail className='h-4 w-4' />
                    {userData.email}
                  </div>
                </div>

                <div className='grid gap-1'>
                  <div className='text-sm font-medium'>Account Created</div>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Shield className='h-4 w-4' />
                    {format(new Date(user?.created_at ?? Date.now()), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <KeyRound className='h-5 w-5' />
            Account Actions
          </CardTitle>
          <CardDescription>Quick actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border'>
              <div className='space-y-0.5'>
                <div className='font-medium'>Change Password</div>
                <div className='text-sm text-muted-foreground'>
                  Update your password to keep your account secure
                </div>
              </div>
              <Button onClick={() => setIsResetDialogOpen(true)}>Change Password</Button>
            </div>

            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border'>
              <div className='space-y-0.5'>
                <div className='font-medium'>Sign Out</div>
                <div className='text-sm text-muted-foreground'>
                  Sign out of your account on this device
                </div>
              </div>
              <Button
                variant='outline'
                onClick={handleLogout}
                isLoading={isSigningOut}
                loadingText='Signing out...'
              >
                <LogOut className='h-4 w-4 mr-2' />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mailing List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5' />
            Mailing List
          </CardTitle>
          <CardDescription>Email subscription preferences</CardDescription>
        </CardHeader>
        {isHydrated && (
          <CardContent>
            {isLoadingSubscription ? (
              <div className='flex justify-center p-8'>
                <Spinner size='lg' />
              </div>
            ) : (
              <div className='flex items-center justify-between gap-4 p-4 rounded-lg border'>
                <div className='space-y-0.5'>
                  <div className='font-medium'>Product Updates</div>
                  <div className='text-sm text-muted-foreground'>
                    Stay informed about new features and improvements
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {isTogglingSubscription && <Spinner size='sm' />}
                  <Switch
                    checked={subscription ? !subscription.deletedAt : false}
                    onCheckedChange={(checked) => toggleMailingList(checked)}
                    disabled={isTogglingSubscription}
                    aria-label='Toggle mailing list subscription'
                  />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resetStep === 'request' ? 'Reset Password' : 'Set New Password'}
            </DialogTitle>
            <DialogDescription>
              {resetStep === 'request'
                ? 'Enter your email to receive a password reset link.'
                : 'Enter your new password below.'}
            </DialogDescription>
          </DialogHeader>

          {resetStep === 'request' ? (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onRequestReset)} className='space-y-4'>
                <FormField
                  control={resetForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type='email' placeholder='Enter your email' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsResetDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' isLoading={isSubmitting} loadingText='Sending...'>
                    Send Reset Link
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(onUpdatePassword)} className='space-y-4'>
                <FormField
                  control={newPasswordForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input {...field} type='password' placeholder='Enter new password' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newPasswordForm.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type='password' placeholder='Confirm new password' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setIsResetDialogOpen(false);
                      setResetStep('request');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' isLoading={isSubmitting} loadingText='Updating...'>
                    Update Password
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
