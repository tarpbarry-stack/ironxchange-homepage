import { NextResponse } from "next/server";

const ENTRY_COOKIE = "ixi_soft_launch";
const PUBLIC_COMPLIANCE_ROUTES = new Set([
  "/privacy",
  "/terms",
  "/text-consent"
]);

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isCover = pathname === "/";
  const isPublicComplianceRoute = PUBLIC_COMPLIANCE_ROUTES.has(pathname);
  const hasEntered = request.cookies.get(ENTRY_COOKIE)?.value === "entered";

  if (!isCover && !isPublicComplianceRoute && !hasEntered) {
    const cover = request.nextUrl.clone();
    cover.pathname = "/";
    cover.search = "";
    const response = NextResponse.redirect(cover);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[^/]+$).*)"],
};
