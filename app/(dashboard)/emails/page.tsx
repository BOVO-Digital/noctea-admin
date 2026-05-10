import Header from "@/components/layout/Header";
import EmailsClient from "@/components/emails/EmailsClient";

export const metadata = { title: "Emails — NOCTEA Admin" };

export default function EmailsPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Emails" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Gestion des emails</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">
            Templates, séquences et envoi manuel
          </p>
        </div>
        <EmailsClient />
      </div>
    </>
  );
}
