import Header from "@/components/layout/Header";
import UserDetailClient from "@/components/users/UserDetailClient";

interface Props {
  params: Promise<{ uid: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { uid } = await params;
  return (
    <>
      <Header breadcrumb={[
        { label: "Dashboard", href: "/" },
        { label: "Utilisateurs", href: "/users" },
        { label: "Fiche utilisateur" },
      ]} />
      <div className="p-6">
        <UserDetailClient uid={uid} />
      </div>
    </>
  );
}
