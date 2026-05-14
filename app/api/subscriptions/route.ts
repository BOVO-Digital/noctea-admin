import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";
import { serializeDoc } from "@/lib/firestore-serialize";

const PLAN_MRR: Record<string, number> = {
  lune: 4.99,
  etoile: 9.99,
  soleil: 14.99,
};

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const snap = await adminDb.collection("subscriptions").orderBy("createdAt", "desc").limit(200).get();
  const subscriptions = snap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }));

  const active = subscriptions.filter((s) => (s as Record<string, string>).status === "active");
  const pastDue = subscriptions.filter((s) => (s as Record<string, string>).status === "past_due");

  const mrr = active.reduce((acc, s) => {
    const plan = (s as Record<string, string>).plan ?? "";
    return acc + (PLAN_MRR[plan] ?? 0);
  }, 0);

  const planBreakdown = { lune: 0, etoile: 0, soleil: 0 };
  active.forEach((s) => {
    const plan = (s as Record<string, string>).plan as keyof typeof planBreakdown;
    if (plan in planBreakdown) planBreakdown[plan]++;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = active.filter((s) => {
    const raw = (s as Record<string, unknown>).createdAt;
    if (!raw) return false;
    const date = new Date(raw as string);
    return !isNaN(date.getTime()) && date >= monthStart;
  }).length;

  return NextResponse.json({
    subscriptions,
    stats: { mrr: Math.round(mrr * 100) / 100, active: active.length, pastDue: pastDue.length, newThisMonth },
    planBreakdown,
  });
}
