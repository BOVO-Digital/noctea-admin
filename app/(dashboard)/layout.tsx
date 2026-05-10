import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0f1621]">
      <Sidebar adminEmail={session.email} />
      <main className="pl-64 min-h-screen">
        {children}
      </main>
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-[#1a2332] border-[#3a4757] text-white",
            title: "text-white",
            description: "text-[#9ba5b3]",
          },
        }}
      />
    </div>
  );
}
