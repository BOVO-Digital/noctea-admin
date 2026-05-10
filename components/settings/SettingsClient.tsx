"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface AdminEntry {
  id: string;
  email?: string;
  addedAt?: { toDate?: () => Date } | string;
}

interface SystemLog {
  id: string;
  level?: string;
  message?: string;
  function?: string;
  createdAt?: { toDate?: () => Date } | string;
}

const LOG_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: "text-[#7CB9E8]" },
  warn: { icon: AlertTriangle, className: "text-orange-400" },
  error: { icon: AlertTriangle, className: "text-red-400" },
  success: { icon: CheckCircle, className: "text-emerald-400" },
};

export default function SettingsClient() {
  const [data, setData] = useState<{ admins: AdminEntry[]; logs: SystemLog[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<AdminEntry | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
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

  async function promoteAdmin() {
    if (!newAdminEmail) return;
    setPromoting(true);
    try {
      const res = await fetch("/api/admin/set-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail, action: "promote" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${newAdminEmail} est maintenant admin`);
      setNewAdminEmail("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la promotion");
    } finally {
      setPromoting(false);
    }
  }

  async function revokeAdmin() {
    if (!revokeTarget?.email) return;
    try {
      const res = await fetch("/api/admin/set-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: revokeTarget.email, action: "revoke" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Accès admin révoqué pour ${revokeTarget.email}`);
      setData((prev) => prev ? {
        ...prev,
        admins: prev.admins.filter((a) => a.id !== revokeTarget.id),
      } : prev);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la révocation");
    } finally {
      setRevokeTarget(null);
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-[#1a2332]" />)}
    </div>
  );

  return (
    <>
      <Tabs defaultValue="admins" className="space-y-4">
        <TabsList className="bg-[#1a2332] border border-[#3a4757]">
          <TabsTrigger value="admins" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            <Shield className="w-3.5 h-3.5" />
            Administrateurs
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            Logs système
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <div className="space-y-4">
            <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Ajouter un administrateur</h3>
              <div className="flex items-center gap-3">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] flex-1"
                  onKeyDown={(e) => e.key === "Enter" && promoteAdmin()}
                />
                <Button
                  onClick={promoteAdmin}
                  disabled={promoting || !newAdminEmail}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {promoting ? "Promotion..." : "Promouvoir admin"}
                </Button>
              </div>
              <p className="text-[#9ba5b3] text-xs mt-2">
                L&apos;utilisateur doit déjà avoir un compte NOCTEA. Le rôle sera appliqué immédiatement.
              </p>
            </div>

            <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#3a4757]">
                <h3 className="text-white font-semibold">Admins actuels ({data?.admins?.length ?? 0})</h3>
              </div>
              {!data?.admins?.length ? (
                <div className="text-center py-10 text-[#9ba5b3]">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun admin enregistré en base</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2a3a52]">
                  {data.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                          <span className="text-[#D4AF37] text-sm font-bold">
                            {admin.email?.[0]?.toUpperCase() ?? "A"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{admin.email ?? admin.id}</p>
                          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs border-0 mt-0.5">Admin</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeTarget(admin)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Révoquer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3a4757]">
              <h3 className="text-white font-semibold">Logs système (50 derniers)</h3>
            </div>
            <ScrollArea className="h-[500px]">
              {!data?.logs?.length ? (
                <div className="text-center py-10 text-[#9ba5b3]">
                  <p className="text-sm">Aucun log</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2a3a52]">
                  {data.logs.map((log) => {
                    const cfg = LOG_STYLES[log.level ?? "info"] ?? LOG_STYLES.info;
                    const LogIcon = cfg.icon;
                    const raw = log.createdAt;
                    const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#212d40] transition-colors">
                        <LogIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.className}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{log.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {log.function && <span className="text-[#9ba5b3] text-xs font-mono">{log.function}</span>}
                            {date && <span className="text-[#9ba5b3] text-xs">{format(date, "d MMM HH:mm:ss", { locale: fr })}</span>}
                          </div>
                        </div>
                        <Badge className={`${cfg.className} text-xs border-0 flex-shrink-0 bg-transparent`}>
                          {log.level}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Configuration NOCTEA</h3>
            <div className="space-y-5">
              <div>
                <h4 className="text-[#9ba5b3] text-xs uppercase tracking-wider mb-3">Quotas IA par plan</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { plan: "Lune", default: 5, color: "text-[#7CB9E8]" },
                    { plan: "Étoile", default: -1, color: "text-[#D4AF37]" },
                    { plan: "Soleil", default: -1, color: "text-amber-400" },
                  ].map((item) => (
                    <div key={item.plan} className="bg-[#212d40] rounded-xl p-3">
                      <Label className={`${item.color} text-xs mb-2 block`}>Plan {item.plan}</Label>
                      <Input
                        type="number"
                        defaultValue={item.default === -1 ? "∞" : item.default}
                        className="bg-[#0f1621] border-[#3a4757] text-white h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="bg-[#3a4757]" />
              <div>
                <h4 className="text-[#9ba5b3] text-xs uppercase tracking-wider mb-3">URLs stores</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#9ba5b3] text-xs">App Store</Label>
                    <Input
                      className="bg-[#0f1621] border-[#3a4757] text-white h-9"
                      placeholder="https://apps.apple.com/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#9ba5b3] text-xs">Google Play</Label>
                    <Input
                      className="bg-[#0f1621] border-[#3a4757] text-white h-9"
                      placeholder="https://play.google.com/..."
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-[#3a4757]" />
              <div>
                <h4 className="text-[#9ba5b3] text-xs uppercase tracking-wider mb-3">Email expéditeur</h4>
                <div className="space-y-1.5">
                  <Label className="text-[#9ba5b3] text-xs">Adresse Resend</Label>
                  <Input
                    defaultValue="noreply@noctea.app"
                    className="bg-[#0f1621] border-[#3a4757] text-white h-9"
                  />
                </div>
              </div>
              <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold">
                Sauvegarder la configuration
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer les droits admin ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              <strong className="text-white">{revokeTarget?.email}</strong> n&apos;aura plus accès à l&apos;interface d&apos;administration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={revokeAdmin} className="bg-red-500 hover:bg-red-600 text-white">Révoquer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
