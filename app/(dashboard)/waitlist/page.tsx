import { Suspense } from "react";
import Header from "@/components/layout/Header";
import WaitlistTable from "@/components/waitlist/WaitlistTable";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Waitlist — NOCTEA Admin" };

export default function WaitlistPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Waitlist" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Liste d&apos;attente</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">
            Gérer les inscriptions à la liste d&apos;attente NOCTEA
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />}>
          <WaitlistTable />
        </Suspense>
      </div>
    </>
  );
}
