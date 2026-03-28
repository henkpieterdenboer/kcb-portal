import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Protect all routes except login, activate, reset-password, api/auth, api/ingest, and static files
    "/((?!login|activate|reset-password|api/auth|api/ingest|_next/static|_next/image|favicon.ico).*)",
  ],
};
