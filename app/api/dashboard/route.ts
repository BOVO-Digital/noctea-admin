import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth/session";

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [usersSnap, waitlistSnap, subsSnap, supportSnap] = await Promise.all([
    adminDb.collection("users").get(),
    adminDb.collection("waitlist").get(),
    adminDb.collection("subscriptions").where("status", "==", "active").get(),
    adminDb.collection("support_tickets").where("status", "==", "open").get(),
  ]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const users = usersSnap.docs.map((d) => d.data());
  const waitlist = waitlistSnap.docs.map((d) => d.data());

  const planCounts = { free: 0, lune: 0, etoile: 0, soleil: 0 };
  users.forEach((u) => {
    const plan = (u.plan as string) ?? "free";
    if (plan in planCounts) planCounts[plan as keyof typeof planCounts]++;
  });

  const newUsersThisWeek = users.filter((u) => {
    const created = u.createdAt?.toDate?.() ?? new Date(u.createdAt);
    return created >= weekAgo;
  }).length;

  const activeUsers30d = users.filter((u) => {
    const last = u.lastActiveAt?.toDate?.() ?? new Date(u.lastActiveAt ?? 0);
    return last >= thirtyDaysAgo;
  }).length;

  const waitlistThisWeek = waitlist.filter((w) => {
    const created = w.createdAt?.toDate?.() ?? new Date(w.createdAt);
    return created >= weekAgo;
  }).length;

  const dailySignups: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailySignups[key] = 0;
  }
  users.forEach((u) => {
    const created = u.createdAt?.toDate?.() ?? new Date(u.createdAt ?? 0);
    const key = created.toISOString().split("T")[0];
    if (key in dailySignups) dailySignups[key]++;
  });
  waitlist.forEach((w) => {
    const created = w.createdAt?.toDate?.() ?? new Date(w.createdAt ?? 0);
    const key = created.toISOString().split("T")[0];
    if (key in dailySignups) dailySignups[key]++;
  });

  const signupChart = Object.entries(dailySignups).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({
    kpis: {
      totalUsers: users.length,
      newUsersThisWeek,
      activeUsers30d,
      totalWaitlist: waitlist.length,
      waitlistThisWeek,
      activeSubscriptions: subsSnap.size,
      openTickets: supportSnap.size,
    },
    planCounts,
    signupChart,
  });
}
