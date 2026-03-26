import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Protect all routes except login, api/auth, api/ingest, and static files
    "/((?!login|api/auth|api/ingest|_next/static|_next/image|favicon.ico).*)",
  ],
};
