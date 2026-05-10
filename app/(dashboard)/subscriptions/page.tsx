import Header from "@/components/layout/Header";
import SubscriptionsClient from "@/components/subscriptions/SubscriptionsClient";

export const metadata = { title: "Abonnements — NOCTEA Admin" };

export default function SubscriptionsPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Abonnements" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Abonnements</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">MRR, statuts et gestion des abonnements Stripe</p>
        </div>
        <SubscriptionsClient />
      </div>
    </>
  );
}
