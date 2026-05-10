import Header from "@/components/layout/Header";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata = { title: "Paramètres — NOCTEA Admin" };

export default function SettingsPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Paramètres" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">Admins, Remote Config et logs système</p>
        </div>
        <SettingsClient />
      </div>
    </>
  );
}
