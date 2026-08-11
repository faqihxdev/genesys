import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

import { getSafeRedirectPath } from '@/lib/redirect';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * @description Verifies a Supabase email OTP and redirects to a safe local path.
 * @param request - Incoming authentication confirmation request
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get('next'));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    }

    console.error('[AuthConfirm/GET]: ', error);
  }

  redirect('/auth/error');
}
