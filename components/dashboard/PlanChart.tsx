"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PLAN_COLORS = {
  free: "#9ba5b3",
  lune: "#7CB9E8",
  etoile: "#D4AF37",
  soleil: "#f59e0b",
};

const PLAN_LABELS = {
  free: "Gratuit",
  lune: "Lune",
  etoile: "Étoile",
  soleil: "Soleil",
};

interface PlanChartProps {
  data: Record<string, number>;
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-xl shadow-xl px-4 py-3">
      <p className="text-[#9ba5b3] text-xs mb-1">{item.name}</p>
      <p className="text-white text-base font-bold">{item.value} utilisateurs</p>
    </div>
  );
}

export default function PlanChart({ data }: PlanChartProps) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({
      name: PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan,
      value: count,
      color: PLAN_COLORS[plan as keyof typeof PLAN_COLORS] ?? "#9ba5b3",
    }));

  return (
    <div className="bg-[#1a2332] border border-[#3a4757] rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-1">Répartition des plans</h3>
      <p className="text-[#9ba5b3] text-sm mb-5">Distribution des utilisateurs</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-[#9ba5b3] text-xs">{value}</span>
            )}
            wrapperStyle={{ paddingTop: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
