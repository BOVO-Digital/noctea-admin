"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
} from "lucide-react";

const pages = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Waitlist", href: "/waitlist", icon: ListOrdered },
  { name: "Utilisateurs", href: "/users", icon: Users },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Contenu CMS", href: "/content", icon: FileText },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Abonnements", href: "/subscriptions", icon: CreditCard },
  { name: "Support", href: "/support", icon: HeadphonesIcon },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher une page, un utilisateur..."
        className="text-white placeholder:text-[#9ba5b3]"
      />
      <CommandList className="bg-[#1a2332]">
        <CommandEmpty className="text-[#9ba5b3] text-sm py-4 text-center">
          Aucun résultat trouvé.
        </CommandEmpty>
        <CommandGroup heading="Navigation" className="text-[#9ba5b3]">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              value={page.name}
              onSelect={() => navigate(page.href)}
              className="text-[#e5e7eb] hover:bg-[#212d40] cursor-pointer gap-2"
            >
              <page.icon className="w-4 h-4 text-[#D4AF37]" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
