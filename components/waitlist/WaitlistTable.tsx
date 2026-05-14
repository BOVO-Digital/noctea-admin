"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MoreHorizontal,
  Download,
  Trash2,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  Filter,
  X,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  email: string;
  prenom?: string;
  nom?: string;
  genre?: string;
  position?: number;
  source?: string;
  createdAt?: string;
}

// ── Colonnes ──────────────────────────────────────────────────────────────────
const columns: ColumnDef<WaitlistEntry>[] = [
  {
    accessorKey: "position",
    header: "#",
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs font-mono">
        #{row.original.position ?? "—"}
      </Badge>
    ),
  },
  {
    id: "name",
    header: "Nom complet",
    accessorFn: (row) => `${row.prenom ?? ""} ${row.nom ?? ""}`.trim(),
    cell: ({ row }) => {
      const full = [row.original.prenom, row.original.nom].filter(Boolean).join(" ");
      return (
        <div>
          <p className="text-white text-sm font-medium">{full || "—"}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-[#9ba5b3] hover:text-white"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-[#9ba5b3] text-sm">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "genre",
    header: "Genre",
    cell: ({ row }) => {
      const g = row.original.genre?.toLowerCase();
      const isFemme = g === "femme" || g === "f";
      return (
        <Badge variant="outline" className={isFemme
          ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
          : "bg-blue-500/10 text-[#7CB9E8] border-blue-500/20"
        }>
          {isFemme ? "Femme" : g ? "Homme" : "—"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 text-[#9ba5b3] hover:text-white"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
    cell: ({ row }) => {
      const raw = row.original.createdAt;
      if (!raw) return <span className="text-[#9ba5b3] text-sm">—</span>;
      const date = new Date(raw);
      return (
        <span className="text-[#9ba5b3] text-sm">
          {isNaN(date.getTime()) ? "—" : format(date, "d MMM yyyy", { locale: fr })}
        </span>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-[#3a4757]/50 text-[#9ba5b3] border-[#3a4757] text-xs">
        {row.original.source ?? "—"}
      </Badge>
    ),
  },
];

// ── Tooltip custom graphique ──────────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl px-3 py-2 text-sm">
      <p className="text-[#9ba5b3] text-xs mb-1">{label}</p>
      <p className="text-[#D4AF37] font-bold">{payload[0].value} inscriptions</p>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function WaitlistTable() {
  const [data, setData] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist?limit=1000");
      const json = await res.json();
      setData(json.entries ?? []);
    } catch {
      toast.error("Erreur lors du chargement de la waitlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Stats calculées ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = data.length;
    const femmes = data.filter((e) => e.genre?.toLowerCase() === "femme" || e.genre?.toLowerCase() === "f").length;
    const hommes = data.filter((e) => e.genre?.toLowerCase() === "homme" || e.genre?.toLowerCase() === "h" || e.genre?.toLowerCase() === "m").length;
    const today = new Date();
    const last7 = data.filter((e) => e.createdAt && isAfter(new Date(e.createdAt), subDays(today, 7))).length;
    const last30 = data.filter((e) => e.createdAt && isAfter(new Date(e.createdAt), subDays(today, 30))).length;

    // Par source
    const sourceCount: Record<string, number> = {};
    data.forEach((e) => {
      const s = e.source ?? "direct";
      sourceCount[s] = (sourceCount[s] ?? 0) + 1;
    });
    const sourceData = Object.entries(sourceCount).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Par jour (14 derniers jours)
    const dailyCount: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(today, i), "dd/MM");
      dailyCount[d] = 0;
    }
    data.forEach((e) => {
      if (!e.createdAt) return;
      const d = new Date(e.createdAt);
      if (isAfter(d, subDays(today, 14))) {
        const key = format(d, "dd/MM");
        if (key in dailyCount) dailyCount[key]++;
      }
    });
    const dailyData = Object.entries(dailyCount).map(([date, count]) => ({ date, count }));

    return { total, femmes, hommes, last7, last30, sourceData, dailyData };
  }, [data]);

  // ── Sources disponibles pour le filtre ────────────────────────────────────
  const sources = useMemo(() => {
    const s = new Set(data.map((e) => e.source ?? "direct"));
    return Array.from(s);
  }, [data]);

  // ── Données filtrées ────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const today = new Date();
    return data.filter((e) => {
      if (filterGenre !== "all") {
        const g = e.genre?.toLowerCase() ?? "";
        if (filterGenre === "femme" && g !== "femme" && g !== "f") return false;
        if (filterGenre === "homme" && g !== "homme" && g !== "h" && g !== "m") return false;
      }
      if (filterSource !== "all" && (e.source ?? "direct") !== filterSource) return false;
      if (filterPeriod !== "all" && e.createdAt) {
        const d = new Date(e.createdAt);
        if (filterPeriod === "7j" && !isAfter(d, subDays(today, 7))) return false;
        if (filterPeriod === "30j" && !isAfter(d, subDays(today, 30))) return false;
      }
      return true;
    });
  }, [data, filterGenre, filterSource, filterPeriod]);

  const hasFilters = filterGenre !== "all" || filterSource !== "all" || filterPeriod !== "all";

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  function exportCSV() {
    const headers = ["Position", "Prénom", "Nom", "Email", "Genre", "Date", "Source"];
    const rows = filteredData.map((e) => {
      const date = e.createdAt ? format(new Date(e.createdAt), "yyyy-MM-dd") : "";
      return [e.position ?? "", e.prenom ?? "", e.nom ?? "", e.email, e.genre ?? "", date, e.source ?? ""].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-noctea-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      toast.success("Entrée supprimée");
      setData((prev) => prev.filter((e) => e.id !== deleteId));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl bg-[#1a2332]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-2xl bg-[#1a2332]" />
          <Skeleton className="h-52 rounded-2xl bg-[#1a2332]" />
        </div>
        <Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />
      </div>
    );
  }

  const PIE_COLORS = ["#7CB9E8", "#f472b6"];

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total inscrits", value: stats.total, color: "text-white", sub: "toutes les inscriptions" },
          { label: "Cette semaine", value: stats.last7, color: "text-[#D4AF37]", sub: "7 derniers jours" },
          { label: "Ce mois", value: stats.last30, color: "text-[#7CB9E8]", sub: "30 derniers jours" },
          { label: "Ratio F/H", value: `${stats.total ? Math.round(stats.femmes / stats.total * 100) : 0}% / ${stats.total ? Math.round(stats.hommes / stats.total * 100) : 0}%`, color: "text-pink-400", sub: "femmes / hommes" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#9ba5b3]" />
              <p className="text-[#9ba5b3] text-xs">{kpi.label}</p>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[#9ba5b3] text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inscriptions 14 derniers jours */}
        <div className="lg:col-span-2 bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-1">Inscriptions — 14 derniers jours</h3>
          <p className="text-[#9ba5b3] text-xs mb-4">Nouveaux inscrits par jour</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a52" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#9ba5b3", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "#9ba5b3", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#2a3a52" }} />
              <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition genre + sources */}
        <div className="space-y-4">
          {/* Donut genre */}
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Répartition par genre</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={[
                    { name: "Hommes", value: stats.hommes || 0 },
                    { name: "Femmes", value: stats.femmes || 0 },
                  ]} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" strokeWidth={0}>
                    <Cell fill="#7CB9E8" />
                    <Cell fill="#f472b6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#7CB9E8]" /><span className="text-[#9ba5b3] text-xs">Hommes</span></div>
                  <span className="text-white text-xs font-semibold">{stats.hommes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-400" /><span className="text-[#9ba5b3] text-xs">Femmes</span></div>
                  <span className="text-white text-xs font-semibold">{stats.femmes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Par source</h3>
            <div className="space-y-2">
              {stats.sourceData.slice(0, 4).map(({ name, value }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#9ba5b3] text-xs capitalize">{name}</span>
                    <span className="text-white text-xs font-semibold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-[#2a3a52] rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] rounded-full transition-all" style={{ width: `${stats.total ? Math.round(value / stats.total * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        {/* Barre de filtres */}
        <div className="p-4 border-b border-[#3a4757] space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ba5b3]" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] h-9"
              />
            </div>

            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-[#e5e7eb] h-9 text-sm">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757] text-[#e5e7eb]">
                <SelectItem value="all">Tous les genres</SelectItem>
                <SelectItem value="femme">Femmes</SelectItem>
                <SelectItem value="homme">Hommes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-[#e5e7eb] h-9 text-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757] text-[#e5e7eb]">
                <SelectItem value="all">Toutes sources</SelectItem>
                {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-[#e5e7eb] h-9 text-sm">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757] text-[#e5e7eb]">
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="7j">7 derniers jours</SelectItem>
                <SelectItem value="30j">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterGenre("all"); setFilterSource("all"); setFilterPeriod("all"); }}
                className="text-[#9ba5b3] hover:text-white gap-1.5 h-9"
              >
                <X className="w-3.5 h-3.5" />
                Réinitialiser
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {hasFilters && (
                <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 gap-1">
                  <Filter className="w-3 h-3" />
                  {table.getFilteredRowModel().rows.length} résultats filtrés
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="border-[#3a4757] bg-[#0f1621] text-[#e5e7eb] hover:bg-[#212d40] hover:text-[#D4AF37] gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[#2a3a52] bg-[#0f1621]/50">
                  {hg.headers.map((header) => (
                    <th key={header.id} className="text-left px-4 py-3 text-xs font-medium text-[#9ba5b3] uppercase tracking-wider whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-10" />
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#2a3a52]">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9ba5b3]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun résultat</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#212d40] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-[#9ba5b3] hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a2332] border-[#3a4757]">
                          <DropdownMenuItem className="text-[#e5e7eb] focus:bg-[#212d40] cursor-pointer gap-2">
                            <Mail className="w-4 h-4 text-[#D4AF37]" />
                            Envoyer un email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(row.original.id)}
                            className="text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#3a4757]">
          <p className="text-xs text-[#9ba5b3]">
            {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
            {" "}· Page <span className="text-white font-medium">{table.getState().pagination.pageIndex + 1}</span> / {table.getPageCount() || 1}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="w-7 h-7 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              «
            </Button>
            <Button variant="ghost" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="w-7 h-7 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="w-7 h-7 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="w-7 h-7 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              »
            </Button>
          </div>
        </div>
      </div>

      {/* ── Dialog suppression ───────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              Cette action est irréversible. L&apos;entrée sera définitivement supprimée de la waitlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
