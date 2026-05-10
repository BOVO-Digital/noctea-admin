"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Shield, Ban, Trash2, User, CreditCard, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

interface UserData {
  id: string;
  email?: string;
  displayName?: string;
  plan?: string;
  status?: string;
  role?: string;
  createdAt?: { toDate?: () => Date } | string;
  lastActiveAt?: { toDate?: () => Date } | string;
  childrenCount?: number;
  aiQuestionsThisMonth?: number;
  aiQuestionsTotal?: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: "text-[#9ba5b3]",
  lune: "text-[#7CB9E8]",
  etoile: "text-[#D4AF37]",
  soleil: "text-amber-400",
};

export default function UserDetailClient({ uid }: { uid: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmAdmin, setConfirmAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${uid}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setUser(json.user);
      } catch {
        toast.error("Utilisateur introuvable");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  async function updatePlan(plan: string) {
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, updates: { plan } }),
      });
      setUser((prev) => prev ? { ...prev, plan } : prev);
      toast.success(`Plan mis à jour : ${plan}`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function toggleSuspend() {
    if (!user) return;
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, updates: { status: newStatus } }),
      });
      setUser((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Compte ${newStatus === "suspended" ? "suspendu" : "réactivé"}`);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      toast.success("Compte supprimé");
      router.push("/users");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setConfirmDelete(false);
    }
  }

  async function promoteAdmin() {
    if (!user?.email) return;
    try {
      await fetch("/api/admin/set-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, action: "promote" }),
      });
      setUser((prev) => prev ? { ...prev, role: "admin" } : prev);
      toast.success(`${user.email} est maintenant admin`);
    } catch {
      toast.error("Erreur lors de la promotion");
    } finally {
      setConfirmAdmin(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl bg-[#1a2332]" />
        <Skeleton className="h-64 rounded-2xl bg-[#1a2332]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-[#9ba5b3]">Utilisateur introuvable</p>
        <Link href="/users">
          <Button variant="outline" className="mt-4 border-[#3a4757] text-[#e5e7eb]">
            Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  const createdDate = user.createdAt && typeof user.createdAt === "object" && "toDate" in user.createdAt
    ? user.createdAt.toDate!()
    : user.createdAt ? new Date(user.createdAt as string) : null;

  const planColor = PLAN_COLORS[user.plan ?? "free"] ?? PLAN_COLORS.free;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="icon" className="text-[#9ba5b3] hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Fiche utilisateur</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-6"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-[#D4AF37]/30">
              <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] text-xl font-bold">
                {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-white">{user.displayName ?? "Sans nom"}</h2>
              <p className="text-[#9ba5b3]">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-semibold ${planColor}`}>Plan {user.plan ?? "free"}</span>
                {user.role === "admin" && (
                  <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 text-xs">Admin</Badge>
                )}
                <Badge
                  variant="outline"
                  className={user.status === "suspended"
                    ? "bg-red-500/10 text-red-400 border-red-500/20 text-xs"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"}
                >
                  {user.status === "suspended" ? "Suspendu" : "Actif"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={user.plan ?? "free"} onValueChange={updatePlan}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                {["free", "lune", "etoile", "soleil"].map((p) => (
                  <SelectItem key={p} value={p} className="text-[#e5e7eb] focus:bg-[#212d40]">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSuspend}
              className={`border-[#3a4757] gap-1 h-9 ${user.status === "suspended" ? "text-emerald-400 hover:text-emerald-300" : "text-orange-400 hover:text-orange-300"}`}
            >
              <Ban className="w-3.5 h-3.5" />
              {user.status === "suspended" ? "Réactiver" : "Suspendre"}
            </Button>
            {user.role !== "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAdmin(true)}
                className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 gap-1 h-9"
              >
                <Shield className="w-3.5 h-3.5" />
                Promouvoir admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1 h-9"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </Button>
          </div>
        </div>

        <Separator className="bg-[#3a4757] my-5" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[#9ba5b3] text-xs mb-1">Inscrit le</p>
            <p className="text-white text-sm font-medium">
              {createdDate ? format(createdDate, "d MMM yyyy", { locale: fr }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[#9ba5b3] text-xs mb-1">ID</p>
            <p className="text-white text-xs font-mono truncate">{user.id}</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-[#1a2332] border border-[#3a4757]">
          <TabsTrigger value="info" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            <User className="w-3.5 h-3.5" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Abonnement
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Logs IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-semibold">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#9ba5b3] text-xs mb-1">Nom d&apos;affichage</p>
                <p className="text-white">{user.displayName ?? "—"}</p>
              </div>
              <div>
                <p className="text-[#9ba5b3] text-xs mb-1">Email</p>
                <p className="text-white">{user.email ?? "—"}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Abonnement actuel</h3>
            <div className="text-center py-8 text-[#9ba5b3]">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Plan actuel : <span className={planColor}>{user.plan ?? "free"}</span></p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Utilisation IA</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#212d40] rounded-xl p-4">
                <p className="text-[#9ba5b3] text-xs mb-1">Ce mois</p>
                <p className="text-2xl font-bold text-white">{user.aiQuestionsThisMonth ?? 0}</p>
              </div>
              <div className="bg-[#212d40] rounded-xl p-4">
                <p className="text-[#9ba5b3] text-xs mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{user.aiQuestionsTotal ?? 0}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              Le compte de <strong className="text-white">{user.email}</strong> sera définitivement supprimé. Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAdmin} onOpenChange={setConfirmAdmin}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Promouvoir en administrateur ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              <strong className="text-white">{user.email}</strong> aura accès à l&apos;interface d&apos;administration complète.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={promoteAdmin} className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold">Promouvoir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
