'use server';

import env from '@/env';
import {
  ActionResponse,
  ResetPasswordCredentials,
  SignInCredentials,
  SignUpCredentials,
  UpdatePasswordCredentials,
  User,
} from '@/types';
import { createClient } from '@/utils/supabase/server';
import { Session } from '@supabase/supabase-js';

/**
 * @description Sign up a new user with email and password
 * @param credentials - User signup credentials
 */
export async function signUp(credentials: SignUpCredentials): Promise<ActionResponse<User>> {
  try {
    const supabase = await createClient();
    const { email, password, inviteCode } = credentials;

    // Verify invite code first
    const { data: isValid, error: verifyError } = await verifyInviteCode(inviteCode);

    if (verifyError) {
      return {
        data: null,
        error: verifyError,
      };
    }

    if (!isValid) {
      return {
        data: null,
        error: {
          message: 'Invalid invite code',
          status: 400,
        },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[Auth/signUp]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: data.user as User,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/signUp]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign up.',
      },
    };
  }
}

/**
 * @description Sign in a user with email and password
 * @param credentials - User signin credentials
 */
export async function signIn(
  credentials: SignInCredentials
): Promise<ActionResponse<{ user: User }>> {
  try {
    const supabase = await createClient();
    const { email, password } = credentials;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth/signIn]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: {
        user: data.user as User,
      },
      error: null,
    };
  } catch (error) {
    console.error('[Auth/signIn]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign in.',
      },
    };
  }
}

/**
 * @description Sign in a user with Google OAuth
 */
export async function signInWithGoogle(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth/signInWithGoogle]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/signInWithGoogle]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during Google sign in.',
      },
    };
  }
}

/**
 * @description Sign out the current user
 */
export async function signOut(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth/signOut]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/signOut]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign out.',
      },
    };
  }
}

/**
 * @description Request a password reset for a user
 * @param credentials - Password reset credentials
 */
export async function resetPassword(
  credentials: ResetPasswordCredentials
): Promise<ActionResponse> {
  try {
    const { email } = credentials;

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('[Auth/resetPassword]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/resetPassword]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during password reset.',
      },
    };
  }
}

/**
 * @description Update user's password
 * @param credentials - New password credentials
 */
export async function updatePassword(
  credentials: UpdatePasswordCredentials
): Promise<ActionResponse> {
  try {
    const { password } = credentials;

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('[Auth/updatePassword]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/updatePassword]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during password update.',
      },
    };
  }
}

/**
 * @description Get the current authenticated user
 */
export async function getCurrentUser(): Promise<ActionResponse<User>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (error.name == 'AuthSessionMissingError') {
        return {
          data: null,
          error: {
            message: 'No session found',
            status: 401,
          },
        };
      }

      console.error('[Auth/getCurrentUser]:', JSON.stringify(error, null, 2));

      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    return {
      data: user as User,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/getCurrentUser]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while getting user data.',
      },
    };
  }
}

/**
 * @description Refresh the current session
 */
export async function refreshSession(): Promise<
  ActionResponse<{ session: Session | null; user: User | null }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Auth/refreshSession]:', error);
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status,
        },
      };
    }

    // Get authenticated user data
    const { data: user, error: userError } = await getCurrentUser();

    if (userError) {
      console.error('[Auth/refreshSession]: Failed to get authenticated user:', userError);
      return {
        data: null,
        error: userError,
      };
    }

    return {
      data: {
        session,
        user,
      },
      error: null,
    };
  } catch (error) {
    console.error('[Auth/refreshSession]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while refreshing session.',
      },
    };
  }
}

/**
 * @description Verify if the invite code is valid
 * @param code - The invite code to verify
 */
export async function verifyInviteCode(code: string): Promise<ActionResponse<boolean>> {
  try {
    const inviteCode = env.INVITE_CODE;

    if (!inviteCode) {
      console.error('[Auth/verifyInviteCode]: INVITE_CODE not set in environment variables');
      return {
        data: null,
        error: {
          message: 'Server configuration error',
          status: 500,
        },
      };
    }

    console.log('[Auth/verifyInviteCode]:', code, inviteCode);

    return {
      data: code === inviteCode,
      error: null,
    };
  } catch (error) {
    console.error('[Auth/verifyInviteCode]:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while verifying invite code.',
      },
    };
  }
}
