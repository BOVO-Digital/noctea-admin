import { Suspense } from "react";
import Header from "@/components/layout/Header";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Dashboard — NOCTEA Admin" };

export default function DashboardPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">
            Vue d&apos;ensemble de NOCTEA en temps réel
          </p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-[#1a2332]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-2xl bg-[#1a2332] lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl bg-[#1a2332]" />
      </div>
    </div>
  );
}
