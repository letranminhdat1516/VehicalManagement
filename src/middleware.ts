import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Simple middleware without auth-helpers (since it's deprecated)
  // For production, consider using Supabase SSR helpers
  
  const publicRoutes = ["/login", "/"];
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname === route
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, let the client-side handle auth
  // The useAuth hook will redirect if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
