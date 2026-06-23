"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatPeso } from "@/lib/format";

type Datum = { name: string; income: number; expense: number };

export function CashFlowChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: -12, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-faint)", fontSize: 12 }} dy={8} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-faint)", fontSize: 12 }}
            tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--ink) 6%, transparent)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--ink)",
              boxShadow: "var(--shadow-pop)",
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--ink-muted)", fontWeight: 600 }}
            formatter={(value: number, name) => [
              formatPeso(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
              name === "income" ? "Income" : "Expense",
            ]}
          />
          <Bar dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense" fill="var(--negative)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
