import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect APIs and dashboard via NextAuth middleware
export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const isApiPath = path.startsWith("/api");
        const isDashboard = path.startsWith("/dashboard");
        if (isApiPath || isDashboard) return !!token;
        return true;
      },
    },
    pages: { signIn: "/" },
  }
);

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
