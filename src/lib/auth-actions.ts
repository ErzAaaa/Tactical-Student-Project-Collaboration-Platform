import { createClient } from '@/lib/supabase/client';

export async function signInWithGitHub() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}