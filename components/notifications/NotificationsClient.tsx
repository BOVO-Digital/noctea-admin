"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Send, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface NotifJob {
  id: string;
  title: string;
  body: string;
  target: string;
  status: string;
  createdAt?: { toDate?: () => Date } | string;
  scheduledAt?: { toDate?: () => Date } | string | null;
}

const TARGET_LABELS: Record<string, string> = {
  all: "Tous les utilisateurs",
  free: "Plan Gratuit",
  lune: "Plan Lune",
  etoile: "Plan Étoile",
  soleil: "Plan Soleil",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-400",
  scheduled: "bg-[#7CB9E8]/10 text-[#7CB9E8]",
  sent: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function NotificationsClient() {
  const [jobs, setJobs] = useState<NotifJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [deepLink, setDeepLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      setJobs(json.jobs ?? []);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function sendNotification() {
    if (!title || !body) {
      toast.error("Titre et message requis");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, target, deepLink: deepLink || null, scheduledAt: scheduledAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(scheduledAt ? "Notification planifiée" : "Notification envoyée");
      setTitle("");
      setBody("");
      setDeepLink("");
      setScheduledAt("");
      fetchJobs();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-[#D4AF37]" />
          </div>
          <h2 className="text-white font-semibold">Composer une notification</h2>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#9ba5b3]">Titre</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#0f1621] border-[#3a4757] text-white"
            placeholder="Ex : Bonne nuit avec NOCTEA 🌙"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#9ba5b3]">Message</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="bg-[#0f1621] border-[#3a4757] text-white min-h-[80px] resize-none"
            placeholder="Le message de la notification..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#9ba5b3]">Ciblage</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2332] border-[#3a4757]">
              {Object.entries(TARGET_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-[#e5e7eb] focus:bg-[#212d40]">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#9ba5b3]">Deep link (optionnel)</Label>
          <Input
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            className="bg-[#0f1621] border-[#3a4757] text-white"
            placeholder="noctea://dashboard"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[#9ba5b3]">Planification (optionnel)</Label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="bg-[#0f1621] border-[#3a4757] text-white"
          />
        </div>

        <Button
          onClick={sendNotification}
          disabled={sending}
          className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2 h-11"
        >
          {scheduledAt ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {sending ? "Envoi..." : scheduledAt ? "Planifier" : "Envoyer maintenant"}
        </Button>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-white font-semibold">Historique</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-[#1a2332]" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-8 text-center">
            <Bell className="w-8 h-8 text-[#9ba5b3] mx-auto mb-2 opacity-50" />
            <p className="text-[#9ba5b3] text-sm">Aucune notification envoyée</p>
          </div>
        ) : (
          jobs.map((job) => {
            const raw = job.createdAt;
            const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
            return (
              <div key={job.id} className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4 hover:bg-[#212d40] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{job.title}</p>
                    <p className="text-[#9ba5b3] text-xs mt-0.5 line-clamp-2">{job.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-[#9ba5b3] text-xs">
                        <Users className="w-3 h-3" />
                        {TARGET_LABELS[job.target] ?? job.target}
                      </div>
                      {date && (
                        <span className="text-[#9ba5b3] text-xs">
                          · {format(date, "d MMM HH:mm", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={`${STATUS_STYLES[job.status] ?? STATUS_STYLES.pending} text-xs border-0 flex-shrink-0`}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
