import Header from "@/components/layout/Header";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export const metadata = { title: "Notifications — NOCTEA Admin" };

export default function NotificationsPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Notifications" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications push</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">Composer et envoyer des notifications FCM</p>
        </div>
        <NotificationsClient />
      </div>
    </>
  );
}
