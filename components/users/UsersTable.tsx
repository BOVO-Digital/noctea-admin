"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Download, Eye, Shield, Ban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface User {
  id: string;
  email?: string;
  displayName?: string;
  plan?: string;
  status?: string;
  childrenCount?: number;
  createdAt?: { toDate?: () => Date } | string;
}

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: "Gratuit", className: "bg-[#9ba5b3]/10 text-[#9ba5b3] border-[#9ba5b3]/20" },
  lune: { label: "Lune", className: "bg-[#7CB9E8]/10 text-[#7CB9E8] border-[#7CB9E8]/20" },
  etoile: { label: "Étoile", className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" },
  soleil: { label: "Soleil", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  suspended: { label: "Suspendu", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function UsersTable() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (planFilter !== "all") params.set("plan", planFilter);
      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      setData(json.users ?? []);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [planFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleSuspend(user: User) {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.id, updates: { status: newStatus } }),
      });
      toast.success(`Utilisateur ${newStatus === "suspended" ? "suspendu" : "réactivé"}`);
      setData((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: deleteTarget.id }),
      });
      toast.success("Compte supprimé");
      setData((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  }

  function exportCSV() {
    const headers = ["UID", "Nom", "Email", "Plan", "Statut", "Date inscription"];
    const rows = data.map((u) => {
      const raw = u.createdAt;
      const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
      return [u.id, u.displayName ?? "", u.email ?? "", u.plan ?? "free", u.status ?? "active", date ? format(date, "yyyy-MM-dd") : ""].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-noctea-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "Utilisateur",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold">
              {row.original.displayName?.[0]?.toUpperCase() ?? row.original.email?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-medium">{row.original.displayName ?? "Sans nom"}</p>
            <p className="text-[#9ba5b3] text-xs">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.original.plan ?? "free";
        const badge = PLAN_BADGES[plan] ?? PLAN_BADGES.free;
        return <Badge variant="outline" className={`${badge.className} text-xs`}>{badge.label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.status ?? "active";
        const badge = STATUS_BADGES[status] ?? STATUS_BADGES.active;
        return <Badge variant="outline" className={`${badge.className} text-xs`}>{badge.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Inscrit le",
      cell: ({ row }) => {
        const raw = row.original.createdAt;
        const date = raw && typeof raw === "object" && "toDate" in raw ? raw.toDate!() : raw ? new Date(raw as string) : null;
        return <span className="text-[#9ba5b3] text-sm">{date ? format(date, "d MMM yyyy", { locale: fr }) : "—"}</span>;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  if (loading) return <Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />;

  return (
    <div className="space-y-4">
      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#3a4757]">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ba5b3]" />
              <Input
                placeholder="Rechercher..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] h-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-36 bg-[#0f1621] border-[#3a4757] text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#3a4757]">
                <SelectItem value="all" className="text-[#e5e7eb] focus:bg-[#212d40]">Tous les plans</SelectItem>
                <SelectItem value="free" className="text-[#e5e7eb] focus:bg-[#212d40]">Gratuit</SelectItem>
                <SelectItem value="lune" className="text-[#e5e7eb] focus:bg-[#212d40]">Lune</SelectItem>
                <SelectItem value="etoile" className="text-[#e5e7eb] focus:bg-[#212d40]">Étoile</SelectItem>
                <SelectItem value="soleil" className="text-[#e5e7eb] focus:bg-[#212d40]">Soleil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}
            className="border-[#3a4757] bg-[#0f1621] text-[#e5e7eb] hover:bg-[#212d40] hover:text-[#D4AF37] gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[#2a3a52]">
                  {hg.headers.map((header) => (
                    <th key={header.id} className="text-left px-4 py-3 text-xs font-medium text-[#9ba5b3] uppercase tracking-wider">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#2a3a52]">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#212d40] transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
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
                        <DropdownMenuItem asChild className="text-[#e5e7eb] focus:bg-[#212d40] cursor-pointer gap-2">
                          <Link href={`/users/${row.original.id}`}>
                            <Eye className="w-4 h-4 text-[#7CB9E8]" />
                            Voir la fiche
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleSuspend(row.original)}
                          className={`focus:bg-[#212d40] cursor-pointer gap-2 ${row.original.status === "suspended" ? "text-emerald-400" : "text-orange-400"}`}
                        >
                          <Ban className="w-4 h-4" />
                          {row.original.status === "suspended" ? "Réactiver" : "Suspendre"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(row.original)}
                          className="text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Supprimer le compte
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#3a4757]">
          <p className="text-xs text-[#9ba5b3]">
            {table.getFilteredRowModel().rows.length} utilisateurs · Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()} className="w-8 h-8 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()} className="w-8 h-8 text-[#9ba5b3] hover:text-white disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              Le compte de <strong className="text-white">{deleteTarget?.email}</strong> sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb] hover:bg-[#2a3a52]">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
