"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Message {
  from: string;
  message: string;
  createdAt: string;
  adminEmail?: string;
}

interface Ticket {
  id: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  messages: Message[];
  labels?: string[];
  createdAt?: { toDate?: () => Date } | string;
  updatedAt?: { toDate?: () => Date } | string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  open: { label: "Ouvert", icon: AlertCircle, className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  "in_progress": { label: "En cours", icon: Clock, className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  resolved: { label: "Résolu", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Faible", className: "bg-[#9ba5b3]/10 text-[#9ba5b3]" },
  normal: { label: "Normal", className: "bg-[#7CB9E8]/10 text-[#7CB9E8]" },
  high: { label: "Haute", className: "bg-red-500/10 text-red-400" },
};

export default function SupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sending, setSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/support?${params}`);
      const json = await res.json();
      setTickets(json.tickets ?? []);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setReply("");
    setSheetOpen(true);
  }

  async function sendReply() {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: reply,
          updateStatus: "in_progress",
        }),
      });
      toast.success("Réponse envoyée");
      setReply("");
      setSelectedTicket((prev) => prev ? {
        ...prev,
        status: "in_progress",
        messages: [...(prev.messages ?? []), { from: "admin", message: reply, createdAt: new Date().toISOString() }],
      } : prev);
      fetchTickets();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(ticketId: string, status: string) {
    try {
      await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      toast.success("Statut mis à jour");
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, status } : prev);
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  const openCount = tickets.filter((t) => t.status === "open").length;

  if (loading) return <Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />;

  return (
    <>
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#3a4757]">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-medium">Tous les tickets</h3>
            {openCount > 0 && (
              <Badge className="bg-orange-500/10 text-orange-400 border-0">{openCount} ouvert(s)</Badge>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2332] border-[#3a4757]">
              <SelectItem value="all" className="text-[#e5e7eb] focus:bg-[#212d40]">Tous</SelectItem>
              <SelectItem value="open" className="text-[#e5e7eb] focus:bg-[#212d40]">Ouverts</SelectItem>
              <SelectItem value="in_progress" className="text-[#e5e7eb] focus:bg-[#212d40]">En cours</SelectItem>
              <SelectItem value="resolved" className="text-[#e5e7eb] focus:bg-[#212d40]">Résolus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-[#9ba5b3]">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun ticket trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a3a52]">
            {tickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
              const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.normal;
              const raw = ticket.createdAt;
              const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
              return (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                      {ticket.messages?.length > 1 && (
                        <span className="text-[#9ba5b3] text-xs">{ticket.messages.length} msgs</span>
                      )}
                    </div>
                    <p className="text-[#9ba5b3] text-xs">
                      {ticket.email} · {date ? format(date, "d MMM yyyy", { locale: fr }) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${priorityCfg.className} text-xs border-0`}>{priorityCfg.label}</Badge>
                    <Badge variant="outline" className={`${statusCfg.className} text-xs`}>{statusCfg.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[540px] bg-[#1a2332] border-l border-[#3a4757] text-white p-0"
        >
          {selectedTicket && (
            <>
              <SheetHeader className="p-5 border-b border-[#3a4757]">
                <SheetTitle className="text-white text-lg">{selectedTicket.subject}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#9ba5b3] text-sm">{selectedTicket.email}</span>
                  <Badge
                    variant="outline"
                    className={`${STATUS_CONFIG[selectedTicket.status]?.className ?? ""} text-xs`}
                  >
                    {STATUS_CONFIG[selectedTicket.status]?.label ?? selectedTicket.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-[#9ba5b3] text-xs">Statut :</Label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => updateStatus(selectedTicket.id, v)}
                  >
                    <SelectTrigger className="h-7 w-32 bg-[#0f1621] border-[#3a4757] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                      <SelectItem value="open" className="text-[#e5e7eb] focus:bg-[#212d40] text-xs">Ouvert</SelectItem>
                      <SelectItem value="in_progress" className="text-[#e5e7eb] focus:bg-[#212d40] text-xs">En cours</SelectItem>
                      <SelectItem value="resolved" className="text-[#e5e7eb] focus:bg-[#212d40] text-xs">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 h-[calc(100vh-280px)] p-5">
                <div className="space-y-4">
                  {(selectedTicket.messages ?? []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                          msg.from === "admin"
                            ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-white"
                            : "bg-[#212d40] border border-[#3a4757] text-[#e5e7eb]"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs text-[#9ba5b3] mt-1">
                          {msg.from === "admin" ? "Admin" : selectedTicket.email}
                          {msg.createdAt && ` · ${format(new Date(msg.createdAt), "d MMM HH:mm", { locale: fr })}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-[#3a4757] space-y-3">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Écrire une réponse..."
                  className="bg-[#0f1621] border-[#3a4757] text-white resize-none min-h-[80px]"
                />
                <Button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Envoi..." : "Répondre par email"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
