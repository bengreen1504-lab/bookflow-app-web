import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    // The webhook is called by Stripe with no session at all, and
    // create-intent authenticates callers itself (browser cookie session OR
    // a Supabase access token in the Authorization header, for the native
    // app) — redirecting either to /sign-in for lacking a cookie would break
    // both the intended no-cookie caller and the bearer-token one.
    pathname.startsWith("/api/stripe/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname.startsWith("/dashboard") || pathname.startsWith("/app"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pathname.startsWith("/dashboard") && profile?.role !== "business_owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/app/home";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/app") && profile?.role === "business_owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/overview";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
