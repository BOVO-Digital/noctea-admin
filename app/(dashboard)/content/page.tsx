import Header from "@/components/layout/Header";
import ContentClient from "@/components/content/ContentClient";

export const metadata = { title: "Contenu — NOCTEA Admin" };

export default function ContentPage() {
  return (
    <>
      <Header breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Contenu" }]} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Gestion du contenu</h1>
          <p className="text-[#9ba5b3] text-sm mt-1">
            Articles, stories, conseils et wellbeing
          </p>
        </div>
        <ContentClient />
      </div>
    </>
  );
}
