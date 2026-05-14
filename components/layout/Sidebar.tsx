"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ListOrdered,
  Mail,
  FileText,
  Bell,
  CreditCard,
  HeadphonesIcon,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Waitlist", href: "/waitlist", icon: ListOrdered },
  { name: "Utilisateurs", href: "/users", icon: Users },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Contenu", href: "/content", icon: FileText },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Abonnements", href: "/subscriptions", icon: CreditCard },
  { name: "Support", href: "/support", icon: HeadphonesIcon },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

interface SidebarProps {
  adminEmail?: string;
}

export default function Sidebar({ adminEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0f1a] border-r border-[#1e2a3a] flex flex-col z-40">
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1e2a3a] flex-shrink-0">
        <Image
          src="/logo.png"
          alt="NOCTEA"
          width={110}
          height={44}
          className="object-contain"
          priority
        />
        <span className="text-[#9ba5b3] text-[10px] font-medium tracking-widest uppercase bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-md">
          Admin
        </span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37] pl-[10px]"
                      : "text-[#9ba5b3] hover:text-white hover:bg-[#1a2332]"
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-[#1e2a3a]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#D4AF37] text-sm font-bold">
              {adminEmail?.[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {adminEmail ?? "Administrateur"}
            </p>
            <p className="text-[#D4AF37] text-xs">Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[#9ba5b3] hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
