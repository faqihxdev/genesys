'use client';

import { Button } from '@/components/custom/button';
import { FloatingInput } from '@/components/custom/floating-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { getSafeRedirectPath } from '@/lib/redirect';
import { withQuery } from '@/lib/utils';
import { signIn, signUp } from '@/server/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    inviteCode: z.string().min(6, 'Please enter a valid invite code'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

// Extract tab logic into a separate component
const AuthTabs = ({
  onSignInSubmit,
  onSignUpSubmit,
  isSignInLoading,
  isSignUpLoading,
}: {
  onSignInSubmit: (data: SignInFormData) => void;
  onSignUpSubmit: (data: SignUpFormData) => void;
  isSignInLoading: boolean;
  isSignUpLoading: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const activeTab = tab === 'signup' ? 'signup' : 'signin';

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      inviteCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleTabChange = (value: string) => {
    router.push(`/auth?tab=${value}`);
  };

  return (
    <Tabs value={activeTab} className='space-y-6' onValueChange={handleTabChange}>
      <TabsList className='grid w-full grid-cols-2'>
        <TabsTrigger value='signin'>Sign In</TabsTrigger>
        <TabsTrigger value='signup'>Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value='signin' className='space-y-4'>
        <div className='grid gap-4'>
          <form onSubmit={signInForm.handleSubmit(onSignInSubmit)}>
            <div className='grid gap-4'>
              <div>
                <FloatingInput
                  label='Email'
                  type='email'
                  autoCapitalize='none'
                  autoComplete='email'
                  autoCorrect='off'
                  disabled={isSignInLoading}
                  placeholder='name@example.com'
                  error={signInForm.formState.errors.email?.message}
                  {...signInForm.register('email')}
                />
              </div>
              <div>
                <FloatingInput
                  label='Password'
                  type='password'
                  disabled={isSignInLoading}
                  placeholder='Enter your password'
                  error={signInForm.formState.errors.password?.message}
                  {...signInForm.register('password')}
                />
              </div>
              <Button type='submit' isLoading={isSignInLoading} loadingText='Signing in...'>
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>

      <TabsContent value='signup' className='space-y-4'>
        <div className='grid gap-4'>
          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}>
            <div className='grid gap-4'>
              <div>
                <FloatingInput
                  label='Invite Code'
                  type='text'
                  autoCapitalize='none'
                  disabled={isSignUpLoading}
                  placeholder='Enter your invite code'
                  error={signUpForm.formState.errors.inviteCode?.message}
                  {...signUpForm.register('inviteCode')}
                />
              </div>
              <div>
                <FloatingInput
                  label='Email'
                  type='email'
                  autoCapitalize='none'
                  autoComplete='email'
                  autoCorrect='off'
                  disabled={isSignUpLoading}
                  placeholder='name@example.com'
                  error={signUpForm.formState.errors.email?.message}
                  {...signUpForm.register('email')}
                />
              </div>
              <div>
                <FloatingInput
                  label='Password'
                  type='password'
                  disabled={isSignUpLoading}
                  placeholder='Create a password'
                  error={signUpForm.formState.errors.password?.message}
                  {...signUpForm.register('password')}
                />
              </div>
              <div>
                <FloatingInput
                  label='Confirm Password'
                  type='password'
                  disabled={isSignUpLoading}
                  placeholder='Confirm your password'
                  error={signUpForm.formState.errors.confirmPassword?.message}
                  {...signUpForm.register('confirmPassword')}
                />
              </div>
              <Button type='submit' isLoading={isSignUpLoading} loadingText='Creating account...'>
                Create account
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const authCheckHasShownToast = useRef(false);

  // Show toast if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && !authCheckHasShownToast.current) {
      // toast({
      //   title: 'Already logged in',
      //   description: 'You are already logged in to your account',
      // });
      authCheckHasShownToast.current = true;
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sign in mutation
  const { mutate: signInMutation, isPending: isSignInLoading } = useMutation({
    mutationFn: withQuery(signIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.auth.getCurrentUser() });
      toast({
        title: 'Success',
        description: 'Signed in successfully',
        variant: 'success',
      });
      const nextPath = getSafeRedirectPath(
        new URLSearchParams(window.location.search).get('next'),
        '/project/all'
      );
      router.replace(nextPath);
    },
    onError: (error) => {
      toast({
        title: 'Sign In Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Sign up mutation
  const { mutate: signUpMutation, isPending: isSignUpLoading } = useMutation({
    mutationFn: withQuery(signUp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.auth.getCurrentUser() });
      toast({
        title: 'Success',
        description: 'Please check your email to verify your account',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Sign Up Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSignInSubmit = (data: SignInFormData) => {
    signInMutation(data);
  };

  const onSignUpSubmit = (data: SignUpFormData) => {
    const { email, password, inviteCode } = data;
    signUpMutation({ email, password, inviteCode });
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className='flex min-h-[100vh] flex-col items-center justify-center pt-24 pb-10'>
      <div className='mx-auto w-full max-w-[350px] space-y-6'>
        <div className='flex flex-col space-y-1 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Welcome to Genesys</h1>
          <p className='text-sm text-muted-foreground'>Sign in or create an account to continue</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AuthTabs
            onSignInSubmit={onSignInSubmit}
            onSignUpSubmit={onSignUpSubmit}
            isSignInLoading={isSignInLoading}
            isSignUpLoading={isSignUpLoading}
          />
        </Suspense>

        <p className='px-8 text-center text-sm text-muted-foreground'>
          By continuing, you agree to our{' '}
          <Link href='/terms' className='underline underline-offset-4 hover:text-primary'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='underline underline-offset-4 hover:text-primary'>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
