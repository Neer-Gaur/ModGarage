// ============================================================================
// Supabase client (singleton)
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
});

/**
 * Upload a single File to a public bucket.
 * Returns the publicly accessible URL.
 */
export async function uploadToBucket(bucket, file, prefix = '') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safePrefix = prefix ? `${prefix.replace(/[^a-zA-Z0-9_-]/g, '')}/` : '';
  const path = `${safePrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
