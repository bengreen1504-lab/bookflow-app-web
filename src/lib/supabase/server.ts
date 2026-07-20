import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

// Server Component / Server Action / Route Handler client. Reads and (when
// possible) refreshes the auth cookie. Server Components can't set cookies,
// so the write is a no-op there — middleware.ts is what actually keeps the
// session refreshed on every request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore because
            // middleware.ts refreshes the session on the next request anyway.
          }
        },
      },
    }
  );
}

// Service-role client for privileged server-only operations (Stripe webhook
// writes, etc.) that must bypass RLS. Never import this from client code.
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
