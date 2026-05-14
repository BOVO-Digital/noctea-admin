import { adminDb } from "@/lib/firebase-admin";
import { Badge } from "@/components/ui/badge";
import { unstable_noStore as noStore } from "next/cache";

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: "Gratuit", className: "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20" },
  lune: { label: "Lune", className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  etoile: { label: "Étoile", className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  soleil: { label: "Soleil", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default async function RecentActivity() {
  noStore();
  
  const [waitlistSnap, usersSnap] = await Promise.all([
    adminDb.collection("waitlist").orderBy("createdAt", "desc").limit(5).get(),
    adminDb.collection("users").orderBy("createdAt", "desc").limit(5).get(),
  ]);

  const waitlistEntries = waitlistSnap.docs.map((d) => ({
    id: d.id,
    type: "waitlist" as const,
    ...d.data(),
  }));

  const userEntries = usersSnap.docs.map((d) => ({
    id: d.id,
    type: "user" as const,
    ...d.data(),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Dernières inscriptions waitlist</h3>
        <div className="space-y-3">
          {waitlistEntries.length === 0 ? (
            <p className="text-[#9ba5b3] text-sm">Aucune entrée</p>
          ) : (
            waitlistEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[#2a3a52] last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">
                    {(entry as Record<string, string>).firstName} {(entry as Record<string, string>).lastName}
                  </p>
                  <p className="text-[#9ba5b3] text-xs">{(entry as Record<string, string>).email}</p>
                </div>
                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">
                  #{String((entry as Record<string, unknown>).position ?? "—")}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Derniers utilisateurs inscrits</h3>
        <div className="space-y-3">
          {userEntries.length === 0 ? (
            <p className="text-[#9ba5b3] text-sm">Aucun utilisateur</p>
          ) : (
            userEntries.map((entry) => {
              const plan = ((entry as Record<string, string>).plan ?? "free") as string;
              const badge = PLAN_BADGES[plan] ?? PLAN_BADGES.free;
              return (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[#2a3a52] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {(entry as Record<string, string>).displayName ?? "—"}
                    </p>
                    <p className="text-[#9ba5b3] text-xs">{(entry as Record<string, string>).email}</p>
                  </div>
                  <Badge variant="outline" className={`${badge.className} text-xs`}>
                    {badge.label}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
