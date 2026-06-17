'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatTL } from '@/lib/format'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from 'recharts'

export function WeeklySalesChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ChartContainer
      config={{ total: { label: 'Ciro', color: 'var(--chart-1)' } }}
      className="h-[240px] w-full"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <Tooltip
          content={<ChartTooltipContent formatter={(v) => formatTL(Number(v))} />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
