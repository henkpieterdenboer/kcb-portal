import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Protect all routes except login, activate, reset-password, api/auth, api/ingest, api/admin, and static files
    "/((?!login|activate|reset-password|api-docs|api/auth|api/ingest|api/admin|api/external|_next/static|_next/image|favicon.ico|.*\\.webp$|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
