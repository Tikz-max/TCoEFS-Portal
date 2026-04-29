import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route protection map.
 * Keys are path prefixes. Values are the roles allowed to access them.
 * 
 * IMPORTANT: Only dashboard and user-specific routes are protected.
 * Public catalog/info pages under /training, /elearning, /postgraduate are accessible to all.
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/applicant": ["applicant"],
  "/training/dashboard": ["training_participant"],
  "/training/register": ["training_participant"],
  "/training/schedule": ["training_participant"],
  "/training/materials": ["training_participant"],
  "/training/payment": ["training_participant"],
  "/training/certificate": ["training_participant"],
  "/elearning/dashboard": ["elearning_participant"],
  "/elearning/course": ["elearning_participant"],
  "/elearning/certificates": ["elearning_participant"],
  "/admin": [
    "admin",
    "admissions_officer",
    "training_coordinator",
    "e_learning_coordinator",
    "super_admin",
  ],
  "/super-admin": ["super_admin"],
};

/** Routes that must never be accessed while authenticated */
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

/** Default redirect after login per role */
const ROLE_HOME: Record<string, string> = {
  applicant: "/applicant/dashboard",
  training_participant: "/training/dashboard",
  elearning_participant: "/elearning/dashboard",
  admissions_officer: "/admin/dashboard",
  training_coordinator: "/admin/dashboard",
  e_learning_coordinator: "/admin/dashboard",
  payment_verifier: "/admin/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
};

const PARTICIPANT_INTENT_HOME: Record<string, string> = {
  postgraduate: "/applicant/dashboard",
  training: "/training/dashboard",
  elearning: "/elearning/dashboard",
};

function resolveEffectiveRole(
  role: string | undefined,
  registrationIntent: "postgraduate" | "training" | "elearning" | undefined
): string | undefined {
  if (!role) return undefined;
  if (role !== "participant") return role;

  if (registrationIntent === "training") return "training_participant";
  if (registrationIntent === "elearning") return "elearning_participant";
  return "applicant";
}

function resolveHome(
  role: string | undefined,
  registrationIntent: "postgraduate" | "training" | "elearning" | undefined
): string {
  const effectiveRole = resolveEffectiveRole(role, registrationIntent);
  if (effectiveRole) {
    return ROLE_HOME[effectiveRole] ?? "/applicant/dashboard";
  }
  return "/applicant/dashboard";
}

function safeInternalRedirect(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function normalizeRedirectPath(path: string): string {
  if (path === "/applicant") return "/applicant/dashboard";
  if (path === "/training") return "/training/dashboard";
  if (path === "/elearning") return "/elearning/dashboard";
  return path;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Authenticated user hitting an auth page → redirect to their dashboard
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const requestedRedirect = safeInternalRedirect(
      request.nextUrl.searchParams.get("redirect")
    );
    if (requestedRedirect) {
      const normalized = normalizeRedirectPath(requestedRedirect);
      return NextResponse.redirect(new URL(normalized, request.url), {
        status: 303,
      });
    }

    const role = user.user_metadata?.role as string | undefined;
    const registrationIntent = user.user_metadata?.registration_intent as
      | "postgraduate"
      | "training"
      | "elearning"
      | undefined;
    const home = resolveHome(role, registrationIntent);
    return NextResponse.redirect(new URL(home, request.url), { status: 303 });
  }

  // Unauthenticated user hitting a protected route → redirect to login
  const isProtected = Object.keys(PROTECTED_ROUTES).some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    const fullPath = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirect", normalizeRedirectPath(fullPath));
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access: authenticated but wrong role → redirect to own home
  if (user && isProtected) {
    const role = user.user_metadata?.role as string | undefined;
    const registrationIntent = user.user_metadata?.registration_intent as
      | "postgraduate"
      | "training"
      | "elearning"
      | undefined;
    const effectiveRole = resolveEffectiveRole(role, registrationIntent);
    const matchedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
      pathname.startsWith(prefix)
    );
    if (matchedPrefix && effectiveRole) {
      const allowedRoles = PROTECTED_ROUTES[matchedPrefix];
      if (!allowedRoles.includes(effectiveRole)) {
        const home = resolveHome(role, registrationIntent);
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /**
     * Match page routes only. Exclude all /api routes to avoid adding
     * middleware auth round-trips on every client-side data fetch.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|images/|fonts/|icons/).*)",
  ],
};
