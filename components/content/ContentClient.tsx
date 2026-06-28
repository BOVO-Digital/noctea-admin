"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Globe,
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Archive,
  Loader2,
  Bot,
  PenLine,
  Flag,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentReportsPanel from "@/components/content/ContentReportsPanel";

const TipTapEditor = dynamic(() => import("@/components/content/TipTapEditor"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType = "articles" | "stories" | "conseils" | "wellbeing";
type ContentStatus = "draft" | "pending_review" | "scheduled" | "published" | "archived";
type ContentPlan = "free" | "lune" | "etoile" | "soleil";

interface ContentItem {
  id: string;
  _type: ContentType;
  title: string;
  body?: string;
  summary?: string;
  sources?: string;
  tags?: string[];
  targetPlan?: ContentPlan;
  status?: ContentStatus;
  aiGenerated?: boolean;
  showAiMention?: boolean;
  scheduledAt?: string;
  createdAt?: string;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  pending_review: number;
  scheduled: number;
  archived: number;
}

interface AIResult {
  title: string;
  body: string;
  tags: string[];
  summary: string;
  sources?: string;
  targetPlan: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContentType, string> = {
  articles: "Article",
  stories: "Story",
  conseils: "Conseil",
  wellbeing: "Bien-être",
};

const PLAN_BADGES: Record<ContentPlan, { label: string; className: string }> = {
  free: { label: "Gratuit", className: "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20" },
  lune: { label: "Lune", className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  etoile: { label: "Étoile", className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  soleil: { label: "Soleil", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const STATUS_BADGES: Record<ContentStatus, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-[#9ba5b3]/10 text-[#9ba5b3]" },
  pending_review: { label: "En attente", className: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  scheduled: { label: "Planifié", className: "bg-[#7CB9E8]/10 text-[#7CB9E8]" },
  published: { label: "Publié", className: "bg-emerald-500/10 text-emerald-400" },
  archived: { label: "Archivé", className: "bg-[#3a4757]/50 text-[#9ba5b3]" },
};

const STATUS_TABS = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publiés" },
  { value: "pending_review", label: "En attente" },
  { value: "scheduled", label: "Planifiés" },
  { value: "draft", label: "Brouillons" },
  { value: "archived", label: "Archivés" },
] as const;

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "articles", label: "Article" },
  { value: "stories", label: "Story" },
  { value: "conseils", label: "Conseil" },
  { value: "wellbeing", label: "Bien-être" },
];

const PLAN_OPTIONS: { value: ContentPlan; label: string }[] = [
  { value: "free", label: "Gratuit" },
  { value: "lune", label: "Lune" },
  { value: "etoile", label: "Étoile" },
  { value: "soleil", label: "Soleil" },
];

const STYLE_OPTIONS = [
  { value: "bienveillant", label: "Bienveillant" },
  { value: "éducatif", label: "Éducatif" },
  { value: "pratique", label: "Pratique" },
  { value: "inspirant", label: "Inspirant" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4 flex flex-col gap-1">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-[#9ba5b3]">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContentClient() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    draft: 0,
    pending_review: 0,
    scheduled: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // AI dialog
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiStep, setAiStep] = useState<1 | 2>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<{
    topic: string;
    contentType: ContentType;
    targetPlan: ContentPlan;
    style: string;
    includeSources: boolean;
    showAiMention: boolean;
    scheduledAt: string;
  }>({
    topic: "",
    contentType: "articles",
    targetPlan: "free",
    style: "bienveillant",
    includeSources: false,
    showAiMention: false,
    scheduledAt: "",
  });
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiEditorKey, setAiEditorKey] = useState(0);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"content" | "reports">("content");

  // Manual dialog
  const [manualOpen, setManualOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ContentItem> | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (activeTab !== "all") params.set("status", activeTab);
      const res = await fetch(`/api/content?${params.toString()}`);
      const json = (await res.json()) as { content?: ContentItem[]; stats?: ContentStats };
      setContent(json.content ?? []);
      if (json.stats) setStats(json.stats);
    } catch {
      toast.error("Erreur lors du chargement du contenu");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── AI flow ────────────────────────────────────────────────────────────────

  async function generateWithAI() {
    if (!aiBrief.topic.trim()) {
      toast.error("Veuillez décrire le sujet du contenu");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/content/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiBrief,
          language: "fr",
          includeSources: aiBrief.includeSources,
        }),
      });
      const json = (await res.json()) as AIResult & { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur lors de la génération IA");
        return;
      }
      setAiResult(json);
      setAiEditorKey((k) => k + 1);
      setAiStep(2);
    } catch {
      toast.error("Erreur réseau lors de la génération IA");
    } finally {
      setAiLoading(false);
    }
  }

  async function saveAIContent(status: "draft" | "pending_review") {
    if (!aiResult) return;
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: aiBrief.contentType,
          title: aiResult.title,
          body: aiResult.body,
          summary: aiResult.summary,
          sources: aiResult.sources ?? "",
          tags: aiResult.tags,
          targetPlan: aiResult.targetPlan,
          status,
          aiGenerated: true,
          showAiMention: aiBrief.showAiMention,
          scheduledAt: aiBrief.scheduledAt || null,
          submitForReview: status === "pending_review",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        status === "pending_review"
          ? "Contenu soumis à validation"
          : "Brouillon sauvegardé"
      );
      closeAIDialog();
      fetchData();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  async function regenerateSection(section: "title" | "summary" | "body" | "sources" | "tags") {
    if (!aiResult) return;
    setRegeneratingSection(section);
    try {
      const res = await fetch("/api/content/ai-regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          topic: aiBrief.topic,
          contentType: aiBrief.contentType,
          targetPlan: aiBrief.targetPlan,
          style: aiBrief.style,
          includeSources: aiBrief.includeSources,
          currentTitle: aiResult.title,
          currentSummary: aiResult.summary,
          currentBody: aiResult.body,
          currentSources: aiResult.sources,
        }),
      });
      const json = (await res.json()) as { value?: unknown; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur régénération");
        return;
      }
      setAiResult((prev) => {
        if (!prev) return prev;
        if (section === "tags" && Array.isArray(json.value)) {
          return { ...prev, tags: json.value as string[] };
        }
        return { ...prev, [section]: String(json.value ?? "") };
      });
      if (section === "body") setAiEditorKey((k) => k + 1);
      toast.success("Section régénérée");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setRegeneratingSection(null);
    }
  }

  function closeAIDialog() {
    setAiDialogOpen(false);
    setAiStep(1);
    setAiResult(null);
    setAiBrief({
      topic: "",
      contentType: "articles",
      targetPlan: "free",
      style: "bienveillant",
      includeSources: false,
      showAiMention: false,
      scheduledAt: "",
    });
  }

  // ── Manual CRUD ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing({
      _type: "articles",
      title: "",
      targetPlan: "free",
      status: "draft",
      body: "",
      tags: [],
    });
    setManualOpen(true);
  }

  function openEdit(item: ContentItem) {
    setEditing({ ...item });
    setManualOpen(true);
  }

  async function saveManual() {
    if (!editing?.title?.trim() || !editing._type) {
      toast.error("Titre et type requis");
      return;
    }
    setManualSaving(true);
    try {
      if (editing.id) {
        const res = await fetch("/api/content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            title: editing.title,
            body: editing.body ?? "",
            summary: editing.summary ?? "",
            sources: editing.sources ?? "",
            tags: editing.tags ?? [],
            targetPlan: editing.targetPlan ?? "free",
            status: editing.status ?? "draft",
            showAiMention: editing.showAiMention ?? false,
            scheduledAt: editing.scheduledAt ?? null,
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _type: editing._type,
            title: editing.title,
            body: editing.body ?? "",
            summary: editing.summary ?? "",
            sources: editing.sources ?? "",
            tags: editing.tags ?? [],
            targetPlan: editing.targetPlan ?? "free",
            status: editing.status ?? "draft",
            aiGenerated: false,
            showAiMention: editing.showAiMention ?? false,
            scheduledAt: editing.scheduledAt ?? null,
          }),
        });
        if (!res.ok) throw new Error();
      }
      toast.success("Contenu sauvegardé");
      setManualOpen(false);
      fetchData();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setManualSaving(false);
    }
  }

  async function handleApprove(item: ContentItem) {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          action: "approve",
          scheduledAt: item.scheduledAt ?? null,
        }),
      });
      const json = (await res.json()) as { status?: string };
      if (!res.ok) throw new Error();
      toast.success(
        json.status === "scheduled" ? "Contenu planifié" : "Contenu publié"
      );
      fetchData();
    } catch {
      toast.error("Erreur lors de la validation");
    }
  }

  async function handleReject(item: ContentItem) {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "reject" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contenu archivé");
      fetchData();
    } catch {
      toast.error("Erreur lors du refus");
    }
  }

  async function handlePublishNow(item: ContentItem) {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "publish_now" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contenu publié");
      fetchData();
    } catch {
      toast.error("Erreur publication");
    }
  }

  async function handleStatusChange(item: ContentItem, newStatus: ContentStatus) {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<ContentStatus, string> = {
        published: "Contenu publié",
        draft: "Repassé en brouillon",
        archived: "Contenu archivé",
        pending_review: "En attente de validation",
        scheduled: "Contenu planifié",
      };
      toast.success(labels[newStatus]);
      fetchData();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contenu supprimé");
      fetchData();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = content.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      TYPE_LABELS[c._type]?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "content" | "reports")} className="mb-6">
        <TabsList className="bg-[#1a2332] border border-[#3a4757]">
          <TabsTrigger value="content" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3]">
            Bibliothèque
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] text-[#9ba5b3] gap-2">
            <Flag className="w-3.5 h-3.5" />
            Signalements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4">
          <ContentReportsPanel />
        </TabsContent>
        <TabsContent value="content" className="mt-0">
      {/* ── Section 1 — Statistiques ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total contenus" value={stats.total} colorClass="text-[#e5e7eb]" />
        <StatCard label="Publiés" value={stats.published} colorClass="text-emerald-400" />
        <StatCard label="En attente" value={stats.pending_review} colorClass="text-[#D4AF37]" />
        <StatCard label="Planifiés" value={stats.scheduled} colorClass="text-[#7CB9E8]" />
        <StatCard label="Brouillons" value={stats.draft} colorClass="text-[#9ba5b3]" />
      </div>

      {/* ── Section 2 & 3 — Boutons de création ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={() => setAiDialogOpen(true)}
          className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2 shadow-lg shadow-[#D4AF37]/10"
        >
          <Sparkles className="w-4 h-4" />
          Créer avec l&apos;IA
        </Button>
        <Button
          onClick={openCreate}
          variant="outline"
          className="border-[#3a4757] bg-[#1a2332] text-[#e5e7eb] hover:bg-[#212d40] gap-2"
        >
          <PenLine className="w-4 h-4" />
          Créer manuellement
        </Button>
      </div>

      {/* ── Section 4 — Filtres ── */}
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#3a4757]">
          {/* Tabs statuts */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                    : "text-[#9ba5b3] hover:text-[#e5e7eb] hover:bg-[#212d40]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ba5b3]" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] h-9 w-48"
              />
            </div>
            {/* Filtre type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                <SelectItem value="all" className="text-[#e5e7eb] focus:bg-[#212d40]">
                  Tous types
                </SelectItem>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    className="text-[#e5e7eb] focus:bg-[#212d40]"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Section 5 — Liste des contenus ── */}
        {loading ? (
          <div className="space-y-1 p-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl bg-[#212d40]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9ba5b3]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun contenu trouvé.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a3a52]">
            {filtered.map((item) => {
              const plan = PLAN_BADGES[item.targetPlan ?? "free"] ?? PLAN_BADGES.free;
              const status = STATUS_BADGES[item.status ?? "draft"] ?? STATUS_BADGES.draft;
              const isPending = item.status === "pending_review";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors ${
                    isPending ? "border-l-2 border-l-[#D4AF37]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#212d40] flex items-center justify-center flex-shrink-0">
                      {item.aiGenerated ? (
                        <Bot className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#7CB9E8]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[#9ba5b3] text-xs">
                          {TYPE_LABELS[item._type] ?? item._type}
                        </span>
                        {item.aiGenerated && (
                          <span className="text-[10px] text-[#D4AF37]/70 bg-[#D4AF37]/5 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                            IA
                          </span>
                        )}
                        {item.createdAt && (
                          <span className="text-[#9ba5b3] text-xs">
                            · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`${plan.className} text-xs hidden sm:flex`}>
                      {plan.label}
                    </Badge>
                    <Badge className={`${status.className} text-xs border-0`}>{status.label}</Badge>

                    {/* CTA proéminent pour pending_review */}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item)}
                          className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-bold text-xs h-7 px-3 gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          VALIDER
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item)}
                          className="border-[#3a4757] text-orange-400 h-7 px-2 text-xs gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {item.status === "scheduled" && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishNow(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Publier
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-[#9ba5b3] hover:text-white"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a2332] border-[#3a4757]">
                        <DropdownMenuItem
                          onClick={() => openEdit(item)}
                          className="text-[#e5e7eb] focus:bg-[#212d40] cursor-pointer gap-2"
                        >
                          <Edit className="w-4 h-4 text-[#7CB9E8]" />
                          Éditer
                        </DropdownMenuItem>
                        {item.status !== "published" && item.status !== "scheduled" && (
                          <DropdownMenuItem
                            onClick={() => handleApprove(item)}
                            className="text-emerald-400 focus:bg-[#212d40] cursor-pointer gap-2"
                          >
                            <Globe className="w-4 h-4" />
                            Valider / publier
                          </DropdownMenuItem>
                        )}
                        {item.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => openEdit(item)}
                            className="text-[#9ba5b3] focus:bg-[#212d40] cursor-pointer gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Modifier (→ validation)
                          </DropdownMenuItem>
                        )}
                        {item.status !== "archived" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "archived")}
                            className="text-orange-400 focus:bg-[#212d40] cursor-pointer gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog IA ── */}
      <Dialog
        open={aiDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAIDialog();
        }}
      >
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
              {aiStep === 1 ? "Générer un contenu avec l'IA" : "Résultat IA — À valider"}
            </DialogTitle>
          </DialogHeader>

          {aiStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Idée / sujet du contenu</Label>
                <Textarea
                  value={aiBrief.topic}
                  onChange={(e) => setAiBrief((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="Ex : Les bienfaits de la lecture à voix haute pour les tout-petits de 0 à 3 ans..."
                  className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] resize-none min-h-[90px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#9ba5b3]">Type</Label>
                  <Select
                    value={aiBrief.contentType}
                    onValueChange={(v) =>
                      setAiBrief((p) => ({ ...p, contentType: v as ContentType }))
                    }
                  >
                    <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-[#e5e7eb] focus:bg-[#212d40]"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#9ba5b3]">Plan cible</Label>
                  <Select
                    value={aiBrief.targetPlan}
                    onValueChange={(v) =>
                      setAiBrief((p) => ({ ...p, targetPlan: v as ContentPlan }))
                    }
                  >
                    <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem
                          key={p.value}
                          value={p.value}
                          className="text-[#e5e7eb] focus:bg-[#212d40]"
                        >
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#9ba5b3]">Style</Label>
                  <Select
                    value={aiBrief.style}
                    onValueChange={(v) => setAiBrief((p) => ({ ...p, style: v }))}
                  >
                    <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                      {STYLE_OPTIONS.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-[#e5e7eb] focus:bg-[#212d40]"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#3a4757]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-[#e5e7eb] text-sm">Inclure des sources</Label>
                    <p className="text-[#9ba5b3] text-xs">Références optionnelles en bas d&apos;article</p>
                  </div>
                  <Switch
                    checked={aiBrief.includeSources}
                    onCheckedChange={(v) => setAiBrief((p) => ({ ...p, includeSources: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-[#e5e7eb] text-sm">Mention « généré par IA »</Label>
                    <p className="text-[#9ba5b3] text-xs">Visible dans l&apos;app si coché</p>
                  </div>
                  <Switch
                    checked={aiBrief.showAiMention}
                    onCheckedChange={(v) => setAiBrief((p) => ({ ...p, showAiMention: v }))}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[#9ba5b3] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Publication planifiée (optionnel)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={aiBrief.scheduledAt}
                    onChange={(e) => setAiBrief((p) => ({ ...p, scheduledAt: e.target.value }))}
                    className="bg-[#0f1621] border-[#3a4757] text-white"
                  />
                </div>
              </div>

              <p className="text-xs text-[#9ba5b3] bg-[#212d40] border border-[#3a4757] rounded-xl px-3 py-2">
                Le disclaimer médical s&apos;affiche toujours dans l&apos;app. La mention IA n&apos;apparaît que si vous la cochez ici.
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeAIDialog}
                  className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]"
                >
                  Annuler
                </Button>
                <Button
                  onClick={generateWithAI}
                  disabled={aiLoading || !aiBrief.topic.trim()}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2 min-w-[180px]"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      L&apos;agent génère...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer avec l&apos;IA ✨
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {aiStep === 2 && aiResult && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Badge IA */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-1 rounded-full">
                  <Bot className="w-3 h-3" />
                  Généré par IA — à valider avant publication
                </span>
              </div>

              {/* Titre éditable */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[#9ba5b3]">Titre proposé</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={regeneratingSection === "title"}
                    onClick={() => regenerateSection("title")}
                    className="text-[#7CB9E8] h-7 text-xs gap-1"
                  >
                    {regeneratingSection === "title" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Régénérer
                  </Button>
                </div>
                <Input
                  value={aiResult.title}
                  onChange={(e) =>
                    setAiResult((prev) => prev ? { ...prev, title: e.target.value } : prev)
                  }
                  className="bg-[#0f1621] border-[#3a4757] text-white font-medium"
                />
              </div>

              {/* Résumé */}
              {aiResult.summary && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[#9ba5b3]">Résumé</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={regeneratingSection === "summary"}
                      onClick={() => regenerateSection("summary")}
                      className="text-[#7CB9E8] h-7 text-xs gap-1"
                    >
                      {regeneratingSection === "summary" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Régénérer
                    </Button>
                  </div>
                  <Textarea
                    value={aiResult.summary}
                    onChange={(e) =>
                      setAiResult((prev) => prev ? { ...prev, summary: e.target.value } : prev)
                    }
                    className="bg-[#0f1621] border-[#3a4757] text-white text-sm resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Contenu TipTap */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[#9ba5b3]">Contenu (éditable)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={regeneratingSection === "body"}
                    onClick={() => regenerateSection("body")}
                    className="text-[#7CB9E8] h-7 text-xs gap-1"
                  >
                    {regeneratingSection === "body" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Régénérer le corps
                  </Button>
                </div>
                <div className="border border-[#3a4757] rounded-xl overflow-hidden">
                  <TipTapEditor
                    key={aiEditorKey}
                    content={aiResult.body}
                    onChange={(html) =>
                      setAiResult((prev) => prev ? { ...prev, body: html } : prev)
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[#9ba5b3]">Sources / références (optionnel)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={regeneratingSection === "sources"}
                    onClick={() => regenerateSection("sources")}
                    className="text-[#7CB9E8] h-7 text-xs gap-1"
                  >
                    {regeneratingSection === "sources" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Régénérer
                  </Button>
                </div>
                <Textarea
                  value={aiResult.sources ?? ""}
                  onChange={(e) =>
                    setAiResult((prev) => prev ? { ...prev, sources: e.target.value } : prev)
                  }
                  className="bg-[#0f1621] border-[#3a4757] text-white text-sm resize-none"
                  rows={3}
                  placeholder="OMS, PMI, ouvrages de référence..."
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Tags (séparés par des virgules)</Label>
                <Input
                  value={aiResult.tags.join(", ")}
                  onChange={(e) =>
                    setAiResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          }
                        : prev
                    )
                  }
                  className="bg-[#0f1621] border-[#3a4757] text-white"
                  placeholder="parentalité, bébé, sommeil..."
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {aiResult.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#212d40] text-[#9ba5b3] border border-[#3a4757] px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiStep(1);
                    setAiResult(null);
                  }}
                  className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb] gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nouvelle idée
                </Button>
                <div className="flex gap-2 sm:ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => saveAIContent("draft")}
                    className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb] gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Brouillon
                  </Button>
                  <Button
                    onClick={() => saveAIContent("pending_review")}
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Soumettre à validation
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog Manuel ── */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Modifier le contenu" : "Nouveau contenu"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Type</Label>
                <Select
                  value={editing?._type ?? "articles"}
                  onValueChange={(v) =>
                    setEditing((prev) => ({ ...prev, _type: v as ContentType }))
                  }
                >
                  <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-[#e5e7eb] focus:bg-[#212d40]"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Plan requis</Label>
                <Select
                  value={editing?.targetPlan ?? "free"}
                  onValueChange={(v) =>
                    setEditing((prev) => ({ ...prev, targetPlan: v as ContentPlan }))
                  }
                >
                  <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                    {PLAN_OPTIONS.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className="text-[#e5e7eb] focus:bg-[#212d40]"
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Titre</Label>
              <Input
                value={editing?.title ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-[#0f1621] border-[#3a4757] text-white"
                placeholder="Titre du contenu..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Résumé (optionnel)</Label>
              <Textarea
                value={editing?.summary ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, summary: e.target.value }))}
                className="bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] resize-none"
                placeholder="1-2 phrases de résumé..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Contenu</Label>
              <div className="border border-[#3a4757] rounded-xl overflow-hidden">
                <TipTapEditor
                  content={editing?.body ?? ""}
                  onChange={(html) => setEditing((prev) => ({ ...prev, body: html }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Tags (séparés par des virgules)</Label>
              <Input
                value={(editing?.tags ?? []).join(", ")}
                onChange={(e) =>
                  setEditing((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
                className="bg-[#0f1621] border-[#3a4757] text-white"
                placeholder="parentalité, sommeil, alimentation..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Sources / références (optionnel)</Label>
              <Textarea
                value={editing?.sources ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, sources: e.target.value }))}
                className="bg-[#0f1621] border-[#3a4757] text-white resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              <div>
                <Label className="text-[#e5e7eb] text-sm">Mention « généré par IA »</Label>
                <p className="text-[#9ba5b3] text-xs">Uniquement pour contenus issus du générateur</p>
              </div>
              <Switch
                checked={editing?.showAiMention ?? false}
                onCheckedChange={(v) => setEditing((prev) => ({ ...prev, showAiMention: v }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Publication planifiée
              </Label>
              <Input
                type="datetime-local"
                value={editing?.scheduledAt ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="bg-[#0f1621] border-[#3a4757] text-white"
              />
            </div>

            {editing?.status === "published" && (
              <p className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl px-3 py-2">
                Toute modification d&apos;un contenu publié le repasse en validation avant retour dans l&apos;app.
              </p>
            )}

            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Statut</Label>
              <Select
                value={editing?.status ?? "draft"}
                onValueChange={(v) =>
                  setEditing((prev) => ({ ...prev, status: v as ContentStatus }))
                }
              >
                <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                  <SelectItem value="draft" className="text-[#e5e7eb] focus:bg-[#212d40]">
                    Brouillon
                  </SelectItem>
                  <SelectItem value="pending_review" className="text-[#e5e7eb] focus:bg-[#212d40]">
                    En attente de validation
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-[#e5e7eb] focus:bg-[#212d40]">
                    Planifié
                  </SelectItem>
                  <SelectItem value="published" className="text-[#e5e7eb] focus:bg-[#212d40]">
                    Publié
                  </SelectItem>
                  <SelectItem value="archived" className="text-[#e5e7eb] focus:bg-[#212d40]">
                    Archivé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManualOpen(false)}
              className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]"
            >
              Annuler
            </Button>
            <Button
              onClick={saveManual}
              disabled={manualSaving}
              className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
            >
              {manualSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog de suppression ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              &quot;{deleteTarget?.title}&quot; sera définitivement supprimé. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
