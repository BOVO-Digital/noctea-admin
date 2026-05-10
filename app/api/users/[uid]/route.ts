import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { uid } = await params;
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json({ user: { id: doc.id, ...doc.data() } });
}
