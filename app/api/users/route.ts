import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const VALID_PLANS = new Set(["free", "lune", "etoile", "soleil"]);

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

  const body = await req.json();
  const { uid, updates, action } = body as {
    uid?: string;
    updates?: Record<string, unknown>;
    action?: string;
    plan?: string;
    days?: number;
  };

  if (!uid) return NextResponse.json({ error: "UID manquant" }, { status: 400 });

  // ── Grant plan temporaire (ex. 1 mois gratuit testeurs) ───────────────────
  if (action === "grant") {
    const plan = typeof body.plan === "string" ? body.plan : "etoile";
    const days = typeof body.days === "number" && body.days > 0 ? body.days : 30;

    if (!VALID_PLANS.has(plan) || plan === "free") {
      return NextResponse.json({ error: "Plan invalide pour un grant" }, { status: 400 });
    }

    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    );
    const now = FieldValue.serverTimestamp();

    await Promise.all([
      adminDb.collection("users").doc(uid).set(
        {
          plan,
          planExpiresAt: expiresAt,
          planGrantedBy: session.email ?? session.uid,
          planGrantedAt: now,
          updatedAt: now,
        },
        { merge: true }
      ),
      adminDb.collection("subscriptions").doc(uid).set(
        {
          plan,
          status: "active",
          source: "admin_grant",
          currentPeriodEnd: expiresAt,
          grantedBy: session.email ?? session.uid,
          grantedAt: now,
          updatedAt: now,
        },
        { merge: true }
      ),
    ]);

    return NextResponse.json({
      ok: true,
      plan,
      days,
      expiresAt: expiresAt.toDate().toISOString(),
    });
  }

  // ── Update générique ──────────────────────────────────────────────────────
  if (!updates) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const safeUpdates: Record<string, unknown> = { ...updates, updatedAt: FieldValue.serverTimestamp() };

  if (typeof updates.plan === "string") {
    if (!VALID_PLANS.has(updates.plan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }
    // Alignement users + subscriptions (requis pour askAI / règles)
    if (updates.plan === "free") {
      safeUpdates.planExpiresAt = FieldValue.delete();
      await adminDb.collection("subscriptions").doc(uid).set(
        {
          plan: "free",
          status: "canceled",
          source: "admin",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await adminDb.collection("subscriptions").doc(uid).set(
        {
          plan: updates.plan,
          status: "active",
          source: "admin",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  await adminDb.collection("users").doc(uid).update(safeUpdates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { uid } = await req.json();
  if (!uid) return NextResponse.json({ error: "UID manquant" }, { status: 400 });

  await adminAuth.deleteUser(uid);
  await Promise.all([
    adminDb.collection("users").doc(uid).delete(),
    adminDb.collection("subscriptions").doc(uid).delete().catch(() => undefined),
  ]);
  return NextResponse.json({ ok: true });
}
