import { Suspense } from "react";
import Header from "@/components/layout/Header";
import UsersTable from "@/components/users/UsersTable";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Utilisateurs — NOCTEA Admin" };

export default function UsersPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Utilisateurs" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">
            Gérer les comptes, plans et accès des utilisateurs
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl bg-[#1a2332]" />}>
          <UsersTable />
        </Suspense>
      </div>
    </>
  );
}
