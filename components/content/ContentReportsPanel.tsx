"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ContentReport {
  id: string;
  contentId?: string;
  contentTitle?: string;
  reason?: string;
  details?: string;
  userId?: string;
  status?: string;
  adminNote?: string;
  createdAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  reviewing: "En cours",
  resolved: "Résolu",
  dismissed: "Ignoré",
};

export default function ContentReportsPanel() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content-reports?status=${filter}`);
      const json = (await res.json()) as { reports?: ContentReport[] };
      setReports(json.reports ?? []);
    } catch {
      toast.error("Erreur chargement signalements");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleReport(
    id: string,
    status: string,
    contentAction?: "none" | "archive" | "pending_review"
  ) {
    try {
      const res = await fetch("/api/content-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, contentAction }),
      });
      if (!res.ok) throw new Error();
      toast.success("Signalement mis à jour");
      fetchReports();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[#9ba5b3] text-sm">
          Signalements utilisateurs sur les contenus publiés — corrigez puis marquez comme résolu.
        </p>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-[#1a2332] border-[#3a4757] text-white h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2332] border-[#3a4757]">
            <SelectItem value="open" className="text-[#e5e7eb]">Ouverts</SelectItem>
            <SelectItem value="reviewing" className="text-[#e5e7eb]">En cours</SelectItem>
            <SelectItem value="resolved" className="text-[#e5e7eb]">Résolus</SelectItem>
            <SelectItem value="all" className="text-[#e5e7eb]">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-[#212d40]" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-[#9ba5b3] border border-[#3a4757] rounded-2xl bg-[#1a2332]">
          <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun signalement pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">
                    {report.contentTitle || report.contentId || "Contenu"}
                  </p>
                  <p className="text-[#D4AF37] text-xs mt-1">{report.reason}</p>
                  {report.details && (
                    <p className="text-[#9ba5b3] text-sm mt-2">{report.details}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#9ba5b3]">
                    <Badge className="bg-[#212d40] text-[#9ba5b3] border-0">
                      {STATUS_LABELS[report.status ?? "open"] ?? report.status}
                    </Badge>
                    {report.createdAt && (
                      <span>{new Date(report.createdAt).toLocaleString("fr-FR")}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {report.contentId && (
                    <Link href="/content">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#3a4757] text-[#7CB9E8] h-8 text-xs gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Contenu
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {report.status === "open" || report.status === "reviewing" ? (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#2a3a52]">
                  <Button
                    size="sm"
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#0f1621] h-8 text-xs"
                    onClick={() => handleReport(report.id, "reviewing")}
                  >
                    Prendre en charge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#3a4757] text-[#e5e7eb] h-8 text-xs"
                    onClick={() =>
                      handleReport(report.id, "resolved", "pending_review")
                    }
                  >
                    Repasser en validation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#3a4757] text-orange-400 h-8 text-xs"
                    onClick={() => handleReport(report.id, "resolved", "archive")}
                  >
                    Archiver le contenu
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#9ba5b3] h-8 text-xs"
                    onClick={() => handleReport(report.id, "dismissed")}
                  >
                    Ignorer
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
