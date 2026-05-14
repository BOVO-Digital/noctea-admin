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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  UserPlus,
  ArrowUpCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface AdminEntry {
  id: string;
  email?: string;
  displayName?: string;
  promotedAt?: string;
  invitedAt?: string;
  invitedBy?: string;
  promotedBy?: string;
  status?: string;
}

interface SystemLog {
  id: string;
  level?: string;
  message?: string;
  function?: string;
  createdAt?: string;
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

  // Promouvoir existant
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  // Inviter nouveau
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  // Révoquer
  const [revokeTarget, setRevokeTarget] = useState<AdminEntry | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Promouvoir un utilisateur existant ──────────────────────────────────────
  async function handlePromote() {
    if (!promoteEmail) return;
    setPromoting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote-admin", email: promoteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${promoteEmail} est maintenant administrateur`);
      setPromoteEmail("");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la promotion");
    } finally {
      setPromoting(false);
    }
  }

  // ── Inviter un nouvel admin ─────────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite-admin", email: inviteEmail, displayName: inviteName || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.message);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'invitation");
    } finally {
      setInviting(false);
    }
  }

  // ── Révoquer un admin ───────────────────────────────────────────────────────
  async function handleRevoke() {
    if (!revokeTarget?.email) return;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-admin", email: revokeTarget.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Accès admin révoqué pour ${revokeTarget.email}`);
      setData((prev) => prev ? { ...prev, admins: prev.admins.filter((a) => a.id !== revokeTarget.id) } : prev);
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

        {/* ── Onglet Admins ────────────────────────────────────────────────── */}
        <TabsContent value="admins">
          <div className="space-y-4">
            {/* Deux cartes d'action */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Promouvoir un utilisateur existant */}
              <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpCircle className="w-4 h-4 text-[#7CB9E8]" />
                  <h3 className="text-white font-semibold text-sm">Promouvoir un utilisateur</h3>
                </div>
                <p className="text-[#9ba5b3] text-xs mb-4">
                  L&apos;utilisateur doit déjà avoir un compte NOCTEA (connexion via app ou admin).
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={promoteEmail}
                    onChange={(e) => setPromoteEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] flex-1 h-9 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handlePromote()}
                  />
                  <Button
                    onClick={handlePromote}
                    disabled={promoting || !promoteEmail}
                    size="sm"
                    className="bg-[#7CB9E8]/10 hover:bg-[#7CB9E8]/20 text-[#7CB9E8] border border-[#7CB9E8]/30 gap-1.5 shrink-0"
                  >
                    {promoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                    Promouvoir
                  </Button>
                </div>
              </div>

              {/* Inviter un nouvel admin */}
              <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-white font-semibold text-sm">Inviter un nouvel admin</h3>
                </div>
                <p className="text-[#9ba5b3] text-xs mb-4">
                  Crée un compte et envoie un email d&apos;invitation avec un lien de connexion. Compatible Google SSO.
                </p>
                <Button
                  onClick={() => setInviteOpen(true)}
                  className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 gap-2 w-full"
                  size="sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Envoyer une invitation
                </Button>
              </div>
            </div>

            {/* Liste des admins */}
            <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#3a4757] flex items-center justify-between">
                <h3 className="text-white font-semibold">Admins actuels ({data?.admins?.length ?? 0})</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  className="text-[#9ba5b3] hover:text-white h-7 text-xs"
                >
                  Actualiser
                </Button>
              </div>
              {!data?.admins?.length ? (
                <div className="text-center py-10 text-[#9ba5b3]">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun admin enregistré en base</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2a3a52]">
                  {data.admins.map((admin) => {
                    const dateRaw = admin.invitedAt ?? admin.promotedAt;
                    const date = dateRaw ? new Date(dateRaw) : null;
                    return (
                      <div key={admin.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#D4AF37] text-sm font-bold">
                              {(admin.displayName ?? admin.email)?.[0]?.toUpperCase() ?? "A"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{admin.displayName ?? admin.email}</p>
                            {admin.displayName && (
                              <p className="text-[#9ba5b3] text-xs">{admin.email}</p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs border-0 px-1.5 py-0">Admin</Badge>
                              {admin.status === "invited" && (
                                <Badge className="bg-orange-500/10 text-orange-400 text-xs border-0 px-1.5 py-0">Invité</Badge>
                              )}
                              {date && !isNaN(date.getTime()) && (
                                <span className="text-[#9ba5b3] text-xs">
                                  {format(date, "d MMM yyyy", { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(admin)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Révoquer
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Onglet Logs ──────────────────────────────────────────────────── */}
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
                    const date = log.createdAt ? new Date(log.createdAt) : null;
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#212d40] transition-colors">
                        <LogIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.className}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{log.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {log.function && <span className="text-[#9ba5b3] text-xs font-mono">{log.function}</span>}
                            {date && !isNaN(date.getTime()) && (
                              <span className="text-[#9ba5b3] text-xs">
                                {format(date, "d MMM HH:mm:ss", { locale: fr })}
                              </span>
                            )}
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

        {/* ── Onglet Config ────────────────────────────────────────────────── */}
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
                        defaultValue={item.default === -1 ? "" : item.default}
                        placeholder={item.default === -1 ? "∞ illimité" : ""}
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
                    <Input className="bg-[#0f1621] border-[#3a4757] text-white h-9" placeholder="https://apps.apple.com/..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#9ba5b3] text-xs">Google Play</Label>
                    <Input className="bg-[#0f1621] border-[#3a4757] text-white h-9" placeholder="https://play.google.com/..." />
                  </div>
                </div>
              </div>
              <Separator className="bg-[#3a4757]" />
              <div>
                <h4 className="text-[#9ba5b3] text-xs uppercase tracking-wider mb-3">Email expéditeur</h4>
                <div className="space-y-1.5">
                  <Label className="text-[#9ba5b3] text-xs">Adresse Resend</Label>
                  <Input defaultValue="noreply@noctea.app" className="bg-[#0f1621] border-[#3a4757] text-white h-9" />
                </div>
              </div>
              <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold">
                Sauvegarder la configuration
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog invitation ──────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!inviting) setInviteOpen(o); }}>
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              Inviter un administrateur
            </DialogTitle>
            <DialogDescription className="text-[#9ba5b3]">
              Un compte sera créé s&apos;il n&apos;existe pas, et un email d&apos;invitation sera envoyé.
              Le nouvel admin pourra se connecter via <strong className="text-white">Google</strong> ou définir un mot de passe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3] text-sm">Adresse email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nouvel.admin@exemple.com"
                className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] focus:border-[#D4AF37]"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3] text-sm">Prénom / Nom <span className="text-[#9ba5b3] font-normal">(optionnel)</span></Label>
              <Input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Marie Dupont"
                className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] focus:border-[#D4AF37]"
              />
            </div>

            <div className="bg-[#212d40] border border-[#3a4757] rounded-xl p-4 space-y-2.5">
              <p className="text-[#e5e7eb] text-xs font-semibold uppercase tracking-wider">Ce qui va se passer</p>
              {[
                { icon: UserPlus,     text: "Le compte est créé si inexistant" },
                { icon: Shield,       text: <>Le rôle <code className="bg-[#1a2332] px-1.5 py-0.5 rounded text-[#D4AF37] font-mono">admin</code> est attribué immédiatement</> },
                { icon: Mail,         text: "Un email d'invitation avec lien de connexion est envoyé" },
                { icon: ArrowUpCircle,text: "Connexion possible via Google ou mot de passe" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#D4AF37]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <p className="text-[#9ba5b3] text-xs leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              disabled={inviting}
              className="border border-[#3a4757] text-[#9ba5b3] hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
            >
              {inviting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
              ) : (
                <><Mail className="w-4 h-4" /> Envoyer l&apos;invitation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog révocation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer les droits admin ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              <strong className="text-white">{revokeTarget?.email}</strong> n&apos;aura plus accès
              à l&apos;interface d&apos;administration. Son compte Firebase reste intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-red-500 hover:bg-red-600 text-white">
              Révoquer l&apos;accès
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
