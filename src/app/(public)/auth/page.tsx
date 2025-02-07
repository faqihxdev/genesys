'use client';

import { FloatingInput } from '@/components/custom-ui/floating-input';
import Google from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    inviteCode: z.string().min(6, 'Please enter a valid invite code'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const activeTab = tab === 'signup' ? 'signup' : 'signin';
  const { toast } = useToast();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      name: '',
      email: '',
      inviteCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleTabChange = (value: string) => {
    router.push(`/auth?tab=${value}`);
  };

  const onSignInSubmit = (data: SignInFormData) => {
    toast({
      title: 'Sign In Attempt',
      description: `Email: ${data.email}`,
      variant: 'success',
    });
  };

  const onSignUpSubmit = (data: SignUpFormData) => {
    toast({
      title: 'Sign Up Attempt',
      description: `Name: ${data.name}\nEmail: ${data.email}`,
      variant: 'success',
    });
  };

  // Watch password field in signup form to show/hide confirm password
  const signUpPassword = signUpForm.watch('password');
  useEffect(() => {
    setShowConfirmPassword(!!signUpPassword);
  }, [signUpPassword]);

  return (
    <div className='flex min-h-[100vh] flex-col items-center justify-center pt-24 pb-10'>
      <div className='mx-auto w-full max-w-[350px] space-y-6'>
        <div className='flex flex-col space-y-1 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {activeTab === 'signin' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {activeTab === 'signin'
              ? 'Sign in to your account to continue'
              : 'Enter your details to get started'}
          </p>
        </div>

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
                      placeholder='name@example.com'
                      error={signInForm.formState.errors.email?.message}
                      {...signInForm.register('email')}
                    />
                  </div>
                  <div>
                    <FloatingInput
                      label='Password'
                      type='password'
                      placeholder='Enter your password'
                      error={signInForm.formState.errors.password?.message}
                      {...signInForm.register('password')}
                    />
                  </div>
                  <Button type='submit'>Sign in</Button>
                </div>
              </form>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
                </div>
              </div>
              <Button
                variant='outline'
                className='gap-2 bg-white hover:bg-gray-50 dark:hover:bg-white/90'
              >
                <Google className='h-4 w-4' />
                <span className='text-black'>Sign in with Google</span>
              </Button>
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
                      placeholder='Enter your invite code'
                      error={signUpForm.formState.errors.inviteCode?.message}
                      {...signUpForm.register('inviteCode')}
                    />
                  </div>
                  <div>
                    <FloatingInput
                      label='Full Name'
                      type='text'
                      autoCapitalize='words'
                      autoComplete='name'
                      placeholder='John Doe'
                      error={signUpForm.formState.errors.name?.message}
                      {...signUpForm.register('name')}
                    />
                  </div>
                  <div>
                    <FloatingInput
                      label='Email'
                      type='email'
                      autoCapitalize='none'
                      autoComplete='email'
                      autoCorrect='off'
                      placeholder='name@example.com'
                      error={signUpForm.formState.errors.email?.message}
                      {...signUpForm.register('email')}
                    />
                  </div>
                  <div>
                    <FloatingInput
                      label='Password'
                      type='password'
                      placeholder='Create a password'
                      error={signUpForm.formState.errors.password?.message}
                      {...signUpForm.register('password')}
                    />
                  </div>
                  {showConfirmPassword && (
                    <div>
                      <FloatingInput
                        label='Confirm Password'
                        type='password'
                        placeholder='Confirm your password'
                        error={signUpForm.formState.errors.confirmPassword?.message}
                        {...signUpForm.register('confirmPassword')}
                      />
                    </div>
                  )}
                  <Button type='submit'>Create account</Button>
                </div>
              </form>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
                </div>
              </div>
              <Button
                variant='outline'
                className='gap-2 bg-white hover:bg-gray-50 dark:hover:bg-white/90'
              >
                <Google className='h-4 w-4' />
                <span className='text-black'>Sign up with Google</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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
