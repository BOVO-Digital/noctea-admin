import KpiCard from "@/components/dashboard/KpiCard";
import SignupChart from "@/components/dashboard/SignupChart";
import PlanChart from "@/components/dashboard/PlanChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  Users,
  ListOrdered,
  UserCheck,
  CreditCard,
  HeadphonesIcon,
  UserPlus,
  Star,
} from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { unstable_noStore as noStore } from "next/cache";

async function getDashboardData() {
  noStore();

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
    try {
      const created = u.createdAt?.toDate?.() ?? new Date(u.createdAt);
      return created >= weekAgo;
    } catch { return false; }
  }).length;

  const activeUsers30d = users.filter((u) => {
    try {
      const last = u.lastActiveAt?.toDate?.() ?? new Date(u.lastActiveAt ?? 0);
      return last >= thirtyDaysAgo;
    } catch { return false; }
  }).length;

  const waitlistThisWeek = waitlist.filter((w) => {
    try {
      const created = w.createdAt?.toDate?.() ?? new Date(w.createdAt);
      return created >= weekAgo;
    } catch { return false; }
  }).length;

  const dailySignups: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailySignups[key] = 0;
  }
  [...users, ...waitlist].forEach((entry) => {
    try {
      const created = entry.createdAt?.toDate?.() ?? new Date(entry.createdAt ?? 0);
      const key = created.toISOString().split("T")[0];
      if (key in dailySignups) dailySignups[key]++;
    } catch {}
  });

  const signupChart = Object.entries(dailySignups).map(([date, count]) => ({ date, count }));

  const recentUsers = usersSnap.docs
    .slice(0, 10)
    .map((d) => ({ id: d.id, ...d.data() }));

  return {
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
    recentUsers,
  };
}

export default async function DashboardContent() {
  const data = await getDashboardData();
  const { kpis, planCounts, signupChart } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Utilisateurs totaux"
          value={kpis.totalUsers.toLocaleString("fr-FR")}
          icon={Users}
          delay={0}
        />
        <KpiCard
          title="Nouveaux cette semaine"
          value={kpis.newUsersThisWeek}
          icon={UserPlus}
          iconColor="text-[#7CB9E8]"
          iconBg="bg-[#7CB9E8]/10"
          delay={0.05}
        />
        <KpiCard
          title="Actifs (30 jours)"
          value={kpis.activeUsers30d}
          icon={UserCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <KpiCard
          title="Abonnements actifs"
          value={kpis.activeSubscriptions}
          icon={CreditCard}
          iconColor="text-[#D4AF37]"
          iconBg="bg-[#D4AF37]/10"
          delay={0.15}
        />
        <KpiCard
          title="Waitlist total"
          value={kpis.totalWaitlist.toLocaleString("fr-FR")}
          icon={ListOrdered}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          delay={0.2}
        />
        <KpiCard
          title="Waitlist cette semaine"
          value={kpis.waitlistThisWeek}
          icon={Star}
          iconColor="text-[#D4AF37]"
          iconBg="bg-[#D4AF37]/10"
          delay={0.25}
        />
        <KpiCard
          title="Tickets ouverts"
          value={kpis.openTickets}
          icon={HeadphonesIcon}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SignupChart data={signupChart} />
        </div>
        <PlanChart data={planCounts} />
      </div>

      <RecentActivity />
    </div>
  );
}
