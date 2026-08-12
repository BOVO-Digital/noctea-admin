import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { uid } = await params;
  const [userDoc, subDoc] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("subscriptions").doc(uid).get(),
  ]);

  if (!userDoc.exists) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: userDoc.id,
      ...serializeDoc(userDoc.data()!),
      subscription: subDoc.exists ? serializeDoc(subDoc.data()!) : null,
    },
  });
}
