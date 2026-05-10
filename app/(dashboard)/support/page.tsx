import Header from "@/components/layout/Header";
import SupportClient from "@/components/support/SupportClient";

export const metadata = { title: "Support — NOCTEA Admin" };

export default function SupportPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Support" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Support utilisateurs</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">Tickets, réponses et suivi des demandes</p>
        </div>
        <SupportClient />
      </div>
    </>
  );
}
