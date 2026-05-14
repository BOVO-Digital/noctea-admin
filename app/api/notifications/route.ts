import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import { serializeDoc } from "@/lib/firestore-serialize";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const snap = await adminDb
    .collection("notification_jobs")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const jobs = snap.docs.map((doc) => ({ id: doc.id, ...serializeDoc(doc.data()) }));
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { title, body: msgBody, imageUrl, deepLink, target, scheduledAt } = body;

  if (!title || !msgBody) {
    return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
  }

  const job = {
    title,
    body: msgBody,
    imageUrl: imageUrl ?? null,
    deepLink: deepLink ?? null,
    target: target ?? "all",
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: scheduledAt ? "scheduled" : "pending",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: session.uid,
  };

  const ref = await adminDb.collection("notification_jobs").add(job);
  return NextResponse.json({ ok: true, id: ref.id });
}
