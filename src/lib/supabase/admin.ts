import { createClient as createAdmin } from '@supabase/supabase-js';

/**
 * SERVICE-ROLE client. Server-only. Bypasses RLS by design — use only for
 * platform operations (embedding jobs, analytics, admin). Never import in a
 * route that can be triggered by an end user without an authorization gate.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}