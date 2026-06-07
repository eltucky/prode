import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublic = pathname === "/" || pathname === "/login" || pathname === "/reglas" || pathname === "/torneo" || pathname.startsWith("/api/auth") || pathname.startsWith("/invite/");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/grupos", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|css|js|woff2?|ttf|eot|otf|txt|xml|json)$).*)",
  ],
};
