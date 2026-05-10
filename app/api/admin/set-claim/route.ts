import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { email, action } = await req.json();
  if (!email || !action) {
    return NextResponse.json({ error: "Email et action requis" }, { status: 400 });
  }

  try {
    const user = await adminAuth.getUserByEmail(email);
    if (action === "promote") {
      await adminAuth.setCustomUserClaims(user.uid, { role: "admin" });
      return NextResponse.json({ ok: true, message: `${email} promu admin` });
    } else if (action === "revoke") {
      await adminAuth.setCustomUserClaims(user.uid, { role: "user" });
      return NextResponse.json({ ok: true, message: `Accès admin révoqué pour ${email}` });
    }
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (err) {
    console.error("[set-claim]", err);
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
}
