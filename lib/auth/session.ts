import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "noctea_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<string> {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION,
  });
  return sessionCookie;
}

export async function setSessionCookie(idToken: string): Promise<void> {
  const sessionCookie = await createSessionCookie(idToken);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
    sameSite: "lax",
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function verifySession(): Promise<{
  uid: string;
  email: string;
  role: string;
} | null> {
  const sessionCookie = await getSessionCookie();
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = (decoded as Record<string, unknown>).role as string;
    if (role !== "admin") return null;

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
