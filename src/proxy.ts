import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

// Chequeo rápido de la cookie para redirigir al login. La autorización real se hace en cada página y acción.
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const enLogin = request.nextUrl.pathname === "/login";

  if (!session && !enLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Las imágenes de /public (logo) quedan afuera: el login las necesita sin sesión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png)$).*)"],
};
