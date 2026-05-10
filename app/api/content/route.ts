import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const status = searchParams.get("status");

  const collections = type === "all"
    ? ["articles", "stories", "conseils", "wellbeing"]
    : [type];

  const allContent: Record<string, unknown>[] = [];
  for (const col of collections) {
    let q = adminDb.collection(col).orderBy("createdAt", "desc").limit(50);
    if (status) q = q.where("status", "==", status) as typeof q;
    const snap = await q.get();
    snap.docs.forEach((d) => allContent.push({ id: d.id, _type: col, ...d.data() }));
  }

  return NextResponse.json({ content: allContent });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { id, collection: col, data } = body;

  if (!col || !data) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const validCollections = ["articles", "stories", "conseils", "wellbeing"];
  if (!validCollections.includes(col)) return NextResponse.json({ error: "Collection invalide" }, { status: 400 });

  if (id) {
    await adminDb.collection(col).doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, id });
  } else {
    const ref = await adminDb.collection(col).add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, collection: col } = await req.json();
  if (!id || !col) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  await adminDb.collection(col).doc(id).delete();
  return NextResponse.json({ ok: true });
}
