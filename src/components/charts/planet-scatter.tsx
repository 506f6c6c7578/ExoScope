import { CartesianGrid, LabelList, type LabelProps, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { decadeTicks } from "@/domain/charts/scale";
import type { LabelledPoint, ScatterPoint } from "@/domain/charts/scatter";
import { formatSignificant } from "@/lib/formatting/number";

interface Axis {
    label: string;
    unit: string;
}

export interface PlanetScatterProps {
    description: string;
    xAxis: Axis;
    yAxis: Axis;
    background: readonly ScatterPoint[];
    selection: readonly LabelledPoint[];
    references: readonly LabelledPoint[];
}

interface TooltipEntry {
    payload?: Partial<LabelledPoint>;
}

const legend = [
    { key: "selection", label: "Planètes comparées", shape: "star" },
    { key: "reference", label: "Système solaire", shape: "diamond" },
    { key: "background", label: "Échantillon du catalogue", shape: "circle" }
] as const;

const legendIcons = {
    star: <path d="M6 0.8 7.5 4.2 11.2 4.5 8.4 7 9.3 10.6 6 8.7 2.7 10.6 3.6 7 0.8 4.5 4.5 4.2Z" className="fill-chart-brand"/>,
    diamond: <path d="M6 1 11 6 6 11 1 6Z" className="fill-chart-reference"/>,
    circle: <circle cx="6" cy="6" r="4" className="fill-chart-muted"/>
};

function renderPointLabel(position: "top" | "right", className: string) {
    return ({ viewBox, value }: LabelProps) => {
        if (!viewBox || !("x" in viewBox) || value === undefined) return null;
        const { x = 0, y = 0, width = 0, height = 0 } = viewBox;
        return position === "top"
            ? <text x={x + width / 2} y={y - 8} textAnchor="middle" className={className}>{value}</text>
            : <text x={x + width + 6} y={y + height / 2} dominantBaseline="middle" className={className}>{value}</text>;
    };
}

const referenceLabel = renderPointLabel("right", "fill-muted-foreground text-[11px]");
const selectionLabel = renderPointLabel("top", "fill-foreground text-xs font-semibold");

function getDomain(values: readonly number[]): [number, number] {
    const positive = values.filter((value) => value > 0);
    return [10 ** Math.floor(Math.log10(Math.min(...positive))), 10 ** Math.ceil(Math.log10(Math.max(...positive)))];
}

function PointTooltip({ active, payload, xAxis, yAxis }: { active?: boolean; payload?: readonly TooltipEntry[]; xAxis: Axis; yAxis: Axis }) {
    const point = payload?.[0]?.payload;
    if (!active || point?.x === undefined || point.y === undefined) return null;
    return (
        <div className="grid gap-1 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
            {point.name && <span className="font-semibold text-foreground">{point.name}</span>}
            <span>{xAxis.label} : {formatSignificant(point.x)} {xAxis.unit}</span>
            <span>{yAxis.label} : {formatSignificant(point.y)} {yAxis.unit}</span>
        </div>
    );
}

export default function PlanetScatter({ description, xAxis, yAxis, background, selection, references }: PlanetScatterProps) {
    const backgroundPoints = background.map(([x, y]) => ({ x, y }));
    const all = [...backgroundPoints, ...selection, ...references];
    const xDomain = getDomain(all.map(({ x }) => x));
    const yDomain = getDomain(all.map(({ y }) => y));

    return (
        <figure className="grid gap-4">
            <ChartContainer config={{}} className="aspect-[4/3] w-full sm:aspect-[16/10]" role="img" aria-label={description}>
                <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 12 }}>
                    <CartesianGrid className="[&_line]:stroke-chart-grid"/>
                    <XAxis type="number" dataKey="x" scale="log" domain={xDomain} ticks={decadeTicks(...xDomain)} allowDataOverflow
                           tickFormatter={formatSignificant}
                           label={{ value: `${xAxis.label} (${xAxis.unit})`, position: "insideBottom", offset: -18, className: "fill-muted-foreground" }}/>
                    <YAxis type="number" dataKey="y" scale="log" domain={yDomain} ticks={decadeTicks(...yDomain)} allowDataOverflow
                           tickFormatter={formatSignificant} width={56}
                           label={{ value: `${yAxis.label} (${yAxis.unit})`, angle: -90, position: "insideLeft", offset: 4, className: "fill-muted-foreground" }}/>
                    <ZAxis range={[28, 28]}/>
                    <Tooltip cursor={false} content={({ active, payload }) => (
                        <PointTooltip active={active} payload={payload} xAxis={xAxis} yAxis={yAxis}/>
                    )}/>
                    <Scatter data={backgroundPoints} shape="circle" fill="var(--chart-muted)" fillOpacity={0.45} isAnimationActive={false}/>
                    <Scatter data={references} shape="diamond" fill="var(--chart-reference)" isAnimationActive={false}>
                        <LabelList dataKey="name" content={referenceLabel}/>
                    </Scatter>
                    <Scatter data={selection} shape="star" fill="var(--chart-brand)" isAnimationActive={false}>
                        <LabelList dataKey="name" content={selectionLabel}/>
                    </Scatter>
                </ScatterChart>
            </ChartContainer>
            <figcaption>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Légende">
                    {legend.map(({ key, label, shape }) => (
                        <li key={key} className="inline-flex items-center gap-2">
                            <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden="true">{legendIcons[shape]}</svg>
                            {label}
                        </li>
                    ))}
                </ul>
            </figcaption>
        </figure>
    );
}
