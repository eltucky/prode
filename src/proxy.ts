import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/reglas" ||
    pathname === "/torneo" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/invite/");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/grupos", req.url));
  }

  // Pass-through: inject resolved locale as request header
  const locale = resolveLocale(
    req.cookies.get("prode_locale")?.value,
    req.headers.get("accept-language") ?? ""
  );
  const theme = resolveTheme(req.cookies.get("prode_theme")?.value);
  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-theme", theme);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|css|js|woff2?|ttf|eot|otf|txt|xml|json)$).*)",
  ],
};

function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string
): string {
  if (cookieValue === "es" || cookieValue === "en") return cookieValue;
  const firstTag = acceptLanguage.split(",")[0].split(";")[0].trim();
  const code = firstTag.split("-")[0].toLowerCase();
  if (code === "es" || code === "en") return code;
  return "es";
}

function resolveTheme(cookieValue: string | undefined): string {
  if (cookieValue === "dark" || cookieValue === "light" || cookieValue === "pokemon") {
    return cookieValue;
  }
  return "dark";
}
