"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  MoreHorizontal,
  Download,
  Trash2,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  position?: number;
  source?: string;
  createdAt?: { toDate?: () => Date } | string;
}

const columns: ColumnDef<WaitlistEntry>[] = [
  {
    accessorKey: "position",
    header: "#",
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">
        #{row.original.position ?? "—"}
      </Badge>
    ),
  },
  {
    id: "name",
    header: "Nom",
    cell: ({ row }) => (
      <div>
        <p className="text-white text-sm font-medium">
          {row.original.firstName} {row.original.lastName}
        </p>
      </div>
    ),
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
    accessorKey: "gender",
    header: "Genre",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.gender === "F"
            ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
            : "bg-blue-500/10 text-[#7CB9E8] border-blue-500/20"
        }
      >
        {row.original.gender ?? "—"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const raw = row.original.createdAt;
      const date =
        raw && typeof raw === "object" && "toDate" in raw
          ? raw.toDate!()
          : raw
          ? new Date(raw as string)
          : null;
      return (
        <span className="text-[#9ba5b3] text-sm">
          {date ? format(date, "d MMM yyyy", { locale: fr }) : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="text-[#9ba5b3] text-xs">{row.original.source ?? "—"}</span>
    ),
  },
];

export default function WaitlistTable() {
  const [data, setData] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist?limit=500");
      const json = await res.json();
      setData(json.entries ?? []);
    } catch {
      toast.error("Erreur lors du chargement de la waitlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  function exportCSV() {
    const headers = ["Position", "Prénom", "Nom", "Email", "Genre", "Date"];
    const rows = data.map((e) => {
      const raw = e.createdAt;
      const date =
        raw && typeof raw === "object" && "toDate" in raw
          ? raw.toDate!()
          : raw ? new Date(raw as string) : null;
      return [
        e.position ?? "",
        e.firstName ?? "",
        e.lastName ?? "",
        e.email,
        e.gender ?? "",
        date ? format(date, "yyyy-MM-dd") : "",
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
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

  const total = data.length;
  const female = data.filter((e) => e.gender === "F").length;
  const male = data.filter((e) => e.gender === "M" || e.gender === "H").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-[#1a2332]" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4">
          <p className="text-[#9ba5b3] text-xs mb-1">Total inscrits</p>
          <p className="text-2xl font-bold text-white">{total.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4">
          <p className="text-[#9ba5b3] text-xs mb-1">Femmes</p>
          <p className="text-2xl font-bold text-pink-400">{female} <span className="text-sm font-normal text-[#9ba5b3]">({total ? Math.round(female / total * 100) : 0}%)</span></p>
        </div>
        <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl p-4">
          <p className="text-[#9ba5b3] text-xs mb-1">Hommes</p>
          <p className="text-2xl font-bold text-[#7CB9E8]">{male} <span className="text-sm font-normal text-[#9ba5b3]">({total ? Math.round(male / total * 100) : 0}%)</span></p>
        </div>
      </div>

      <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#3a4757]">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ba5b3]" />
            <Input
              placeholder="Rechercher..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-[#0f1621] border-[#3a4757] text-white placeholder:text-[#9ba5b3] h-9"
            />
          </div>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-[#2a3a52]">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-3 text-xs font-medium text-[#9ba5b3] uppercase tracking-wider"
                    >
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#3a4757]">
          <p className="text-xs text-[#9ba5b3]">
            {table.getFilteredRowModel().rows.length} résultats · Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 text-[#9ba5b3] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 text-[#9ba5b3] hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#1a2332] border-[#3a4757] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9ba5b3]">
              Cette action est irréversible. L&apos;entrée sera définitivement supprimée de la waitlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3a4757] bg-[#212d40] text-[#e5e7eb] hover:bg-[#2a3a52]">
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
    </div>
  );
}
