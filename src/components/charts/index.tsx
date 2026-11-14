import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { usePalette, type Palette } from "@/lib/theme";

const seriesOf = (c: Palette) => [c.forest, c.purple, c.mint, c.lilac, c.warn, c.forestDeep, c.purpleDeep, c.line];

function useChartTheme() {
  const c = usePalette();
  return {
    c, series: seriesOf(c),
    axis: { fontSize: 11, fill: c.muted },
    tip: { contentStyle: { background: c.card, border: "none", borderRadius: 12, boxShadow: `4px 4px 10px ${c.shadow}`, fontSize: 12, color: c.ink },
      itemStyle: { color: c.ink }, labelStyle: { color: c.ink }, cursor: { fill: c.hover } },
    legend: { fontSize: 11, color: c.muted },
  };
}

export function NoData({ text = "No data yet" }: { text?: string }) {
  return <div className="grid h-full min-h-32 place-items-center text-sm text-ink-muted">{text}</div>;
}

export function Bars({ data, x = "name", y = "papers", horizontal = false, height = 220, color, onClick, label = "Chart" }:
  { data: Record<string, any>[]; x?: string; y?: string; horizontal?: boolean; height?: number; color?: string; onClick?(d: any): void; label?: string }) {
  const { c, series, axis, tip } = useChartTheme();
  if (!data.length) return <NoData />;
  const fill = color ?? series[0];
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 8 : -18, right: 12, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={!horizontal} horizontal={horizontal ? false : true} />
          {horizontal ? <><XAxis type="number" tick={axis} allowDecimals={false} /><YAxis type="category" dataKey={x} tick={axis} width={110} /></>
            : <><XAxis dataKey={x} tick={axis} /><YAxis tick={axis} allowDecimals={false} /></>}
          <Tooltip {...tip} />
          <Bar dataKey={y} radius={6} fill={fill} onClick={onClick} cursor={onClick ? "pointer" : undefined}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? series[1] : fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, height = 220, label = "Distribution" }: { data: { name: string; papers: number }[]; height?: number; label?: string }) {
  const { c, series: PALETTE, tip, legend } = useChartTheme();
  if (!data.length) return <NoData />;
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="papers" nameKey="name" innerRadius="52%" outerRadius="82%" paddingAngle={3} stroke={c.card} strokeWidth={3}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip {...tip} />
          <Legend iconType="circle" wrapperStyle={legend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Evolution({ data, keys, height = 260 }: { data: Record<string, any>[]; keys: string[]; height?: number }) {
  const { c, series: PALETTE, axis, tip, legend } = useChartTheme();
  if (!data.length || !keys.length) return <NoData text="Select at least one topic with dated papers" />;
  return (
    <div style={{ height }} role="img" aria-label="Topic evolution over time">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -18, right: 12, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.line} />
          <XAxis dataKey="year" tick={axis} /><YAxis tick={axis} allowDecimals={false} />
          <Tooltip {...tip} /><Legend iconType="circle" wrapperStyle={legend} />
          {keys.map((k, i) => <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.55} />)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
