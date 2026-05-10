import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") ?? "100");

  const snap = await adminDb
    .collection("waitlist")
    .orderBy("createdAt", "desc")
    .limit(limitParam)
    .get();

  const entries = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ entries, total: entries.length });
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  await adminDb.collection("waitlist").doc(id).delete();
  return NextResponse.json({ ok: true });
}
