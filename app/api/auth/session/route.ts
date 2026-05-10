import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, clearSession } from "@/lib/auth/session";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = (decoded as Record<string, unknown>).role as string;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Accès refusé : rôle admin requis" },
        { status: 403 }
      );
    }

    await setSessionCookie(idToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[session] Erreur:", err);
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
