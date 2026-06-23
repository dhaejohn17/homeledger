"use client";

import {
  Area,
  Line,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPeso } from "@/lib/format";
import { CHART_PALETTE as PALETTE } from "@/lib/constants";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
  boxShadow: "var(--shadow-pop)",
  fontSize: 13,
};

const peso0 = (v: number) =>
  formatPeso(v, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function TrendChart({
  data,
}: {
  data: { name: string; income: number; expense: number; net: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-faint)", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-faint)", fontSize: 12 }}
            tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--ink) 6%, transparent)" }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--ink-muted)", fontWeight: 600 }}
            formatter={(value: number, name) => [
              peso0(value),
              name === "income" ? "Income" : name === "expense" ? "Expense" : "Net",
            ]}
          />
          <Bar dataKey="income" fill="var(--positive)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" fill="var(--negative)" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Area
            type="monotone"
            dataKey="net"
            stroke="none"
            fill="url(#netFill)"
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "var(--primary)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({
  data,
}: {
  data: { name: string; value: number; color: string | null }[];
}) {
  const top = data.slice(0, 8);
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={top}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
          >
            {top.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name) => [peso0(value), name as string]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

