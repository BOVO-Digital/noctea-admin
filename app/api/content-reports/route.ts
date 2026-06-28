import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import { serializeDoc } from "@/lib/firestore-serialize";

const VALID_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status") ?? "open";
  let query: FirebaseFirestore.Query = adminDb
    .collection("content_reports")
    .orderBy("createdAt", "desc")
    .limit(100);

  if (status !== "all" && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    query = query.where("status", "==", status);
  }

  const snap = await query.get();
  const reports = snap.docs.map((d) => ({
    id: d.id,
    ...serializeDoc(d.data() as Record<string, unknown>),
  }));

  return NextResponse.json({ reports });
}

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as {
    id?: string;
    status?: string;
    adminNote?: string;
    contentAction?: "none" | "archive" | "pending_review";
  };

  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (body.status && !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const ref = adminDb.collection("content_reports").doc(body.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Signalement introuvable" }, { status: 404 });

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    handledBy: session.email,
  };
  if (body.status) updates.status = body.status;
  if (typeof body.adminNote === "string") updates.adminNote = body.adminNote;

  await ref.update(updates);

  const report = snap.data();
  if (body.contentAction && body.contentAction !== "none" && report?.contentId) {
    const contentRef = adminDb.collection("contents").doc(String(report.contentId));
    if (body.contentAction === "archive") {
      await contentRef.update({
        status: "archived",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (body.contentAction === "pending_review") {
      await contentRef.update({
        status: "pending_review",
        publishedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// Endpoint mobile (sans session admin) — à sécuriser via Cloud Function en prod
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    contentId?: string;
    contentTitle?: string;
    reason?: string;
    details?: string;
    userId?: string;
  };

  if (!body.contentId || !body.reason?.trim()) {
    return NextResponse.json({ error: "contentId et reason requis" }, { status: 400 });
  }

  const ref = await adminDb.collection("content_reports").add({
    contentId: body.contentId,
    contentTitle: body.contentTitle ?? "",
    reason: body.reason.trim(),
    details: typeof body.details === "string" ? body.details.trim() : "",
    userId: body.userId ?? "anonymous",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
