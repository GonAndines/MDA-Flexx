import { SignJWT, jwtVerify } from "jose";

// Solo depende de `jose` para poder usarse también desde src/proxy.ts.

export const SESSION_COOKIE = "mda_session";
export const SESSION_DAYS = 7;

export type SessionPayload = { uid: number };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta la variable de entorno AUTH_SECRET.");
    return new TextEncoder().encode("clave-de-desarrollo-solo-local");
  }
  return new TextEncoder().encode(s);
}

export function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return typeof payload.uid === "number" ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}
