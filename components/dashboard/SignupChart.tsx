"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface SignupChartProps {
  data: { date: string; count: number }[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  let displayDate = label;
  try { displayDate = format(parseISO(label), "d MMM yyyy", { locale: fr }); } catch { /* label déjà lisible */ }
  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl shadow-xl px-4 py-3">
      <p className="text-[#9ba5b3] text-xs mb-1">
        {displayDate}
      </p>
      <p className="text-[#D4AF37] text-base font-bold">
        {payload[0].value} inscriptions
      </p>
    </div>
  );
}

export default function SignupChart({ data }: SignupChartProps) {
  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-1">Inscriptions (30 derniers jours)</h3>
      <p className="text-[#9ba5b3] text-sm mb-5">Waitlist + utilisateurs combinés</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3a52" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ba5b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={4}
            tickFormatter={(val: string) => {
              try { return format(parseISO(val), "dd/MM"); } catch { return val; }
            }}
          />
          <YAxis
            tick={{ fill: "#9ba5b3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3a4757" }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#D4AF37"
            strokeWidth={2}
            fill="url(#goldGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#D4AF37", stroke: "#1a2332", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
