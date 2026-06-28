import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { serializeDoc } from "@/lib/firestore-serialize";
import {
  isValidContentPlan,
  isValidContentStatus,
  isValidContentType,
  resolvePublishStatus,
  type ContentStatus,
} from "@/lib/content-types";

function parseScheduledAt(value: unknown): Timestamp | null {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function computeStats(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  const stats = {
    total: docs.length,
    published: 0,
    draft: 0,
    pending_review: 0,
    scheduled: 0,
    archived: 0,
  };
  for (const d of docs) {
    const s = d.data().status as string;
    if (s === "published") stats.published++;
    else if (s === "draft") stats.draft++;
    else if (s === "pending_review") stats.pending_review++;
    else if (s === "scheduled") stats.scheduled++;
    else if (s === "archived") stats.archived++;
  }
  return stats;
}

// ── GET — liste des contenus + stats ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");

  const col = adminDb.collection("contents");

  let query: FirebaseFirestore.Query = col.orderBy("createdAt", "desc").limit(100);
  if (type && type !== "all" && isValidContentType(type)) {
    query = query.where("_type", "==", type);
  }
  if (status && isValidContentStatus(status)) {
    query = query.where("status", "==", status);
  }
  if (plan && isValidContentPlan(plan)) {
    query = query.where("targetPlan", "==", plan);
  }

  const [snap, allSnap] = await Promise.all([query.get(), col.select("status").get()]);

  const content = snap.docs.map((d) => ({
    id: d.id,
    ...serializeDoc(d.data() as Record<string, unknown>),
  }));

  return NextResponse.json({ content, stats: computeStats(allSnap.docs) });
}

// ── POST — créer un contenu ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { _type, title } = body;

  if (!_type || !title) {
    return NextResponse.json({ error: "type et titre requis" }, { status: 400 });
  }
  if (!isValidContentType(_type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const aiGenerated = body.aiGenerated === true;
  let status: ContentStatus = isValidContentStatus(body.status)
    ? body.status
    : "draft";

  const scheduledAt = parseScheduledAt(body.scheduledAt);

  // Contenu IA : pas de publication directe — validation obligatoire
  if (aiGenerated && status === "published") {
    status = "pending_review";
  }

  // Soumission explicite à validation
  if (body.submitForReview === true && status === "draft") {
    status = "pending_review";
  }

  if (status === "published") {
    status = resolvePublishStatus(scheduledAt?.toDate() ?? null);
  }

  const ref = await adminDb.collection("contents").add({
    _type,
    title: String(title),
    body: typeof body.body === "string" ? body.body : "",
    summary: typeof body.summary === "string" ? body.summary : "",
    sources: typeof body.sources === "string" ? body.sources : "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    targetPlan: isValidContentPlan(body.targetPlan) ? body.targetPlan : "free",
    status,
    aiGenerated,
    showAiMention: body.showAiMention === true,
    authorId: session.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    scheduledAt: scheduledAt ?? null,
    publishedAt:
      status === "published" ? FieldValue.serverTimestamp() : null,
    lastReviewedAt: null,
    lastReviewedBy: null,
  });

  return NextResponse.json({ ok: true, id: ref.id, status });
}

// ── PATCH — mettre à jour un contenu ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { id, action, ...updates } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const docRef = adminDb.collection("contents").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) {
    return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 });
  }
  const current = existing.data()!;

  // Actions workflow dédiées
  if (action === "approve") {
    const scheduledAt =
      parseScheduledAt(updates.scheduledAt) ??
      (current.scheduledAt as Timestamp | null | undefined) ??
      null;
    const nextStatus = resolvePublishStatus(scheduledAt?.toDate() ?? null);
    await docRef.update({
      status: nextStatus,
      scheduledAt: scheduledAt ?? null,
      publishedAt: nextStatus === "published" ? FieldValue.serverTimestamp() : null,
      lastReviewedAt: FieldValue.serverTimestamp(),
      lastReviewedBy: session.email,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (action === "reject") {
    await docRef.update({
      status: "archived",
      updatedAt: FieldValue.serverTimestamp(),
      lastReviewedAt: FieldValue.serverTimestamp(),
      lastReviewedBy: session.email,
    });
    return NextResponse.json({ ok: true, status: "archived" });
  }

  if (action === "publish_now" && current.status === "scheduled") {
    await docRef.update({
      status: "published",
      publishedAt: FieldValue.serverTimestamp(),
      scheduledAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, status: "published" });
  }

  const allowed = [
    "title",
    "body",
    "summary",
    "sources",
    "tags",
    "targetPlan",
    "status",
    "_type",
    "aiGenerated",
    "showAiMention",
    "scheduledAt",
  ];
  const safeUpdates: Record<string, unknown> = {};
  const contentFields = ["title", "body", "summary", "sources", "tags", "targetPlan", "_type"];
  let contentChanged = false;

  for (const field of allowed) {
    if (!(field in updates)) continue;
    if (field === "scheduledAt") {
      safeUpdates.scheduledAt = parseScheduledAt(updates.scheduledAt);
      continue;
    }
    if (field === "status" && isValidContentStatus(updates.status)) {
      safeUpdates.status = updates.status;
      continue;
    }
    if (field === "targetPlan" && isValidContentPlan(updates.targetPlan)) {
      safeUpdates.targetPlan = updates.targetPlan;
      contentChanged = true;
      continue;
    }
    if (field === "_type" && isValidContentType(updates._type)) {
      safeUpdates._type = updates._type;
      contentChanged = true;
      continue;
    }
    safeUpdates[field] = updates[field];
    if (contentFields.includes(field)) contentChanged = true;
  }

  // Modification d'un contenu publié → repasse en validation
  if (contentChanged && current.status === "published") {
    safeUpdates.status = "pending_review";
    safeUpdates.publishedAt = null;
  }

  // Bloquer publication directe sans action approve
  if (safeUpdates.status === "published" && current.status !== "scheduled") {
    const scheduledAt =
      (safeUpdates.scheduledAt as Timestamp | null | undefined) ??
      (current.scheduledAt as Timestamp | null | undefined) ??
      null;
    safeUpdates.status = resolvePublishStatus(scheduledAt?.toDate() ?? null);
    if (safeUpdates.status === "published") {
      safeUpdates.publishedAt = FieldValue.serverTimestamp();
    }
  }

  if (safeUpdates.status === "pending_review" && updates.submitForReview === true) {
    safeUpdates.lastReviewedAt = null;
    safeUpdates.lastReviewedBy = null;
  }

  safeUpdates.updatedAt = FieldValue.serverTimestamp();

  await docRef.update(safeUpdates);
  return NextResponse.json({ ok: true, status: safeUpdates.status ?? current.status });
}

// ── DELETE — supprimer un contenu ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json() as { id?: unknown };
  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  await adminDb.collection("contents").doc(id).delete();
  return NextResponse.json({ ok: true });
}
