"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import KpiCard from "@/components/dashboard/KpiCard";
import { CreditCard, TrendingUp, AlertTriangle, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Subscription {
  id: string;
  userId?: string;
  userEmail?: string;
  plan?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | string;
}

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  lune: { label: "Lune 🌙", className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  etoile: { label: "Étoile ⭐", className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  soleil: { label: "Soleil ☀️", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  past_due: { label: "Impayé", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  canceled: { label: "Annulé", className: "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20" },
};

export default function SubscriptionsClient() {
  const [data, setData] = useState<{
    subscriptions: Subscription[];
    stats: { mrr: number; active: number; pastDue: number; newThisMonth: number };
    planBreakdown: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscriptions");
        const json = await res.json();
        setData(json);
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl bg-[#1a2332]" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />
      </div>
    );
  }

  if (!data) return null;

  const { subscriptions, stats, planBreakdown } = data;
  const pastDue = subscriptions.filter((s) => s.status === "past_due");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="MRR estimé"
          value={`${stats.mrr.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`}
          icon={TrendingUp}
          delay={0}
        />
        <KpiCard
          title="Abonnements actifs"
          value={stats.active}
          icon={CreditCard}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.05}
        />
        <KpiCard
          title="Nouveaux ce mois"
          value={stats.newThisMonth}
          icon={UserPlus}
          iconColor="text-[#7CB9E8]"
          iconBg="bg-[#7CB9E8]/10"
          delay={0.1}
        />
        <KpiCard
          title="Impayés"
          value={stats.pastDue}
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(planBreakdown).map(([plan, count]) => {
          const badge = PLAN_BADGES[plan];
          if (!badge) return null;
          return (
            <motion.div
              key={plan}
              whileHover={{ y: -2 }}
              className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4 text-center"
            >
              <Badge variant="outline" className={`${badge.className} text-sm mb-2`}>{badge.label}</Badge>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-[#9ba5b3] text-xs mt-0.5">
                {plan === "lune" ? "4,99 €" : plan === "etoile" ? "9,99 €" : "14,99 €"}/mois
              </p>
            </motion.div>
          );
        })}
      </div>

      {pastDue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-red-400 font-semibold text-sm">{pastDue.length} abonnement(s) en impayé</p>
          </div>
          <div className="space-y-2">
            {pastDue.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-[#1a2332] rounded-lg px-3 py-2">
                <span className="text-white text-sm">{s.userEmail ?? s.userId ?? s.id}</span>
                <Badge variant="outline" className={PLAN_BADGES[s.plan ?? ""]?.className ?? ""}>
                  {PLAN_BADGES[s.plan ?? ""]?.label ?? s.plan}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3a4757]">
          <h3 className="text-white font-semibold">Tous les abonnements</h3>
        </div>
        <div className="divide-y divide-[#2a3a52]">
          {subscriptions.slice(0, 50).map((s) => {
            const raw = s.createdAt;
            const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
            const plan = PLAN_BADGES[s.plan ?? ""] ?? { label: s.plan ?? "—", className: "" };
            const status = STATUS_BADGES[s.status ?? "active"] ?? STATUS_BADGES.active;
            return (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#212d40] transition-colors">
                <div>
                  <p className="text-white text-sm">{s.userEmail ?? s.userId ?? "—"}</p>
                  {date && <p className="text-[#9ba5b3] text-xs">{format(date, "d MMM yyyy", { locale: fr })}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${plan.className} text-xs`}>{plan.label}</Badge>
                  <Badge variant="outline" className={`${status.className} text-xs`}>{status.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
