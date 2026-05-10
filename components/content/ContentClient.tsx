"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, MoreHorizontal, Search, Globe, FileText } from "lucide-react";
import { toast } from "sonner";

const TipTapEditor = dynamic(() => import("@/components/content/TipTapEditor"), { ssr: false });

interface ContentItem {
  id: string;
  _type: string;
  title: string;
  plan?: string;
  status?: string;
  tags?: string[];
  body?: string;
  coverImage?: string;
  createdAt?: { toDate?: () => Date } | string;
}

const TYPE_LABELS: Record<string, string> = {
  articles: "Article",
  stories: "Story",
  conseils: "Conseil",
  wellbeing: "Bien-être",
};

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: "Gratuit", className: "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20" },
  lune: { label: "Lune", className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  etoile: { label: "Étoile", className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  soleil: { label: "Soleil", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-[#9ba5b3]/10 text-[#9ba5b3]" },
  published: { label: "Publié", className: "bg-emerald-500/10 text-emerald-400" },
  archived: { label: "Archivé", className: "bg-orange-500/10 text-orange-400" },
};

export default function ContentClient() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [editing, setEditing] = useState<Partial<ContentItem> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: typeFilter });
      const res = await fetch(`/api/content?${params}`);
      const json = await res.json();
      setContent(json.content ?? []);
    } catch {
      toast.error("Erreur lors du chargement du contenu");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing({ _type: "articles", title: "", plan: "free", status: "draft", body: "" });
    setEditOpen(true);
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    setEditOpen(true);
  }

  async function saveContent() {
    if (!editing || !editing.title || !editing._type) {
      toast.error("Titre et type requis");
      return;
    }
    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          collection: editing._type,
          data: {
            title: editing.title,
            plan: editing.plan ?? "free",
            status: editing.status ?? "draft",
            body: editing.body ?? "",
            tags: editing.tags ?? [],
          },
        }),
      });
      toast.success("Contenu sauvegardé");
      setEditOpen(false);
      fetchData();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, collection: deleteTarget._type }),
      });
      toast.success("Contenu supprimé");
      setContent((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function togglePublish(item: ContentItem) {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          collection: item._type,
          data: { status: newStatus },
        }),
      });
      toast.success(newStatus === "published" ? "Contenu publié" : "Dépublié");
      setContent((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: newStatus } : c))
      );
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  const filtered = content.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c._type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-[#1a2332]" />)}
    </div>
  );

  return (
    <>
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#3a4757]">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ba5b3]" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                <SelectItem value="all" className="text-[#e5e7eb] focus:bg-[#212d40]">Tous types</SelectItem>
                <SelectItem value="articles" className="text-[#e5e7eb] focus:bg-[#212d40]">Articles</SelectItem>
                <SelectItem value="stories" className="text-[#e5e7eb] focus:bg-[#212d40]">Stories</SelectItem>
                <SelectItem value="conseils" className="text-[#e5e7eb] focus:bg-[#212d40]">Conseils</SelectItem>
                <SelectItem value="wellbeing" className="text-[#e5e7eb] focus:bg-[#212d40]">Bien-être</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau contenu
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9ba5b3]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucun contenu trouvé.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a3a52]">
            {filtered.map((item) => {
              const plan = PLAN_BADGES[item.plan ?? "free"] ?? PLAN_BADGES.free;
              const status = STATUS_BADGES[item.status ?? "draft"] ?? STATUS_BADGES.draft;
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#212d40] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#212d40] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[#9ba5b3] text-xs">{TYPE_LABELS[item._type] ?? item._type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`${plan.className} text-xs`}>{plan.label}</Badge>
                    <Badge className={`${status.className} text-xs border-0`}>{status.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-[#9ba5b3] hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a2332] border-[#3a4757]">
                        <DropdownMenuItem onClick={() => openEdit(item)}
                          className="text-[#e5e7eb] focus:bg-[#212d40] cursor-pointer gap-2">
                          <Edit className="w-4 h-4 text-[#7CB9E8]" /> Éditer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(item)}
                          className="text-emerald-400 focus:bg-[#212d40] cursor-pointer gap-2">
                          <Globe className="w-4 h-4" />
                          {item.status === "published" ? "Dépublier" : "Publier"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(item)}
                          className="text-red-400 focus:bg-red-500/10 cursor-pointer gap-2">
                          <Trash2 className="w-4 h-4" /> Supprimer
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#1a2332] border-[#3a4757] text-white max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier le contenu" : "Nouveau contenu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Type</Label>
                <Select
                  value={editing?._type ?? "articles"}
                  onValueChange={(v) => setEditing((prev) => ({ ...prev, _type: v }))}
                >
                  <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-[#e5e7eb] focus:bg-[#212d40]">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#9ba5b3]">Plan requis</Label>
                <Select
                  value={editing?.plan ?? "free"}
                  onValueChange={(v) => setEditing((prev) => ({ ...prev, plan: v }))}
                >
                  <SelectTrigger className="bg-[#0f1621] border-[#3a4757] text-white">
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#9ba5b3]">Titre</Label>
              <Input
                value={editing?.title ?? ""}
                onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-[#0f1621] border-[#3a4757] text-white"
                placeholder="Titre de l'article..."
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}
              className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</Button>
            <Button onClick={saveContent} className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] font-semibold">
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              &quot;{deleteTarget?.title}&quot; sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
