import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ["/", "/sign-in", "/sign-up", "/track", "/api/wearable"];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // If it's a public route, continue
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check if user has completed onboarding
  if (pathname === "/dashboard" || pathname === "/onboarding") {
    // Get the session token from the request
    const token = request.cookies.get("__session")?.value;
    
    if (!token) {
      // No session, redirect to sign-in
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    try {
      // Get user info from Clerk (this would need Clerk's server SDK)
      // For now, we'll use a simpler approach by checking the session
      // In a real implementation, you'd verify the Clerk token and get the user ID
      
      // For demonstration, we'll skip the onboarding check in middleware
      // and handle it in the dashboard component itself
      // This is because Clerk token verification requires their server SDK
      
    } catch (error) {
      console.error("Middleware error:", error);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|favicon.ico).*)",
  ],
};
