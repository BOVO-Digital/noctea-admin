"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserCheck,
  CreditCard,
  ListOrdered,
  Star,
  Headphones,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  UserPlus,
  UserCheck,
  CreditCard,
  ListOrdered,
  Star,
  Headphones,
  TrendingUp,
  AlertTriangle,
};

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  delay?: number;
}

export default function KpiCard({
  title,
  value,
  trend,
  icon,
  iconColor = "text-[#D4AF37]",
  iconBg = "bg-[#D4AF37]/10",
  subtitle,
  delay = 0,
}: KpiCardProps) {
  const Icon = ICON_MAP[icon] ?? Users;
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl bg-[#1a2332] border border-[#3a4757] p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-[#9ba5b3] mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-[#9ba5b3]/60 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
