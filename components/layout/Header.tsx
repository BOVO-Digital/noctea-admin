"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommandPalette from "@/components/layout/CommandPalette";
import { useState } from "react";

interface HeaderProps {
  breadcrumb?: { label: string; href?: string }[];
  adminEmail?: string;
}

export default function Header({ breadcrumb, adminEmail }: HeaderProps) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0f1621]/90 backdrop-blur-md border-b border-[#3a4757] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumb?.map((item, i) => (
            <span key={item.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#3a4757]">/</span>}
              <span
                className={
                  i === breadcrumb.length - 1
                    ? "text-white font-medium"
                    : "text-[#9ba5b3]"
                }
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#212d40] border border-[#3a4757] text-[#9ba5b3] hover:border-[#D4AF37]/50 transition-all text-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Rechercher</span>
            <kbd className="ml-1 text-xs bg-[#1a2332] border border-[#3a4757] rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-[#9ba5b3] hover:text-white hover:bg-[#212d40]"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 bg-[#1a2332] border-[#3a4757] text-[#e5e7eb]"
            >
              <div className="px-3 py-2 border-b border-[#3a4757]">
                <p className="text-sm font-medium text-white">Notifications</p>
              </div>
              <DropdownMenuItem className="px-3 py-3 focus:bg-[#212d40] cursor-default">
                <div>
                  <p className="text-sm text-white">Nouveau ticket support</p>
                  <p className="text-xs text-[#9ba5b3] mt-0.5">Il y a 5 minutes</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-3 focus:bg-[#212d40] cursor-default">
                <div>
                  <p className="text-sm text-white">12 nouvelles inscriptions</p>
                  <p className="text-xs text-[#9ba5b3] mt-0.5">Aujourd&apos;hui</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Avatar className="w-8 h-8 border border-[#D4AF37]/30">
            <AvatarFallback className="bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-bold">
              {adminEmail?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
