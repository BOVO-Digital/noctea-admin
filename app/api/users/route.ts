import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") ?? "50");
  const plan = searchParams.get("plan");

  let query = adminDb.collection("users").orderBy("createdAt", "desc").limit(limitParam);
  if (plan) query = query.where("plan", "==", plan) as typeof query;

  const snap = await query.get();
  const users = snap.docs.map((doc) => ({ id: doc.id, ...serializeDoc(doc.data()) }));
  return NextResponse.json({ users, total: users.length });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { uid, updates } = await req.json();
  if (!uid || !updates) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  await adminDb.collection("users").doc(uid).update(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { uid } = await req.json();
  if (!uid) return NextResponse.json({ error: "UID manquant" }, { status: 400 });

  await adminAuth.deleteUser(uid);
  await adminDb.collection("users").doc(uid).delete();
  return NextResponse.json({ ok: true });
}
