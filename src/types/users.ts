import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * @description Extended user type from Supabase with additional custom fields
 */
export interface User extends Omit<SupabaseUser, 'role' | 'app_metadata' | 'user_metadata'> {
  avatar?: string;
}

/**
 * @description Credentials required for user sign up
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  inviteCode: string;
}

/**
 * @description Credentials required for user sign in
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * @description Password reset request credentials
 */
export interface ResetPasswordCredentials {
  email: string;
}

/**
 * @description New password update credentials
 */
export interface UpdatePasswordCredentials {
  password: string;
}
