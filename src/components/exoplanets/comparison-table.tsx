import { cn } from "cn";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Measurement, provenanceLegend } from "@/components/exoplanets/measurement";
import { MethodBadge } from "@/components/exoplanets/method-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlanetPath } from "@/data/site";
import { buildComparisonRows, type Extreme } from "@/domain/comparison/compare";
import type { Exoplanet } from "@/domain/exoplanets/model";
import { formatMeasurement } from "@/lib/formatting/measurement";

interface ComparisonTableProps {
    planets: readonly Exoplanet[];
    onRemove: (slug: string) => void;
}

const extremeLabels: Record<Extreme, string> = {
    highest: "valeur la plus élevée",
    lowest: "valeur la plus faible"
};

function ExtremeMarker({ extreme }: { extreme: Extreme }) {
    const Icon = extreme === "highest" ? ArrowUp : ArrowDown;
    return (
        <>
            <Icon className="ml-1 inline size-3.5 text-brand" aria-hidden="true"/>
            <span className="sr-only">, {extremeLabels[extreme]}</span>
        </>
    );
}

export function ComparisonTable({ planets, onRemove }: ComparisonTableProps) {
    const rows = buildComparisonRows(planets);

    return (
        <div className="grid gap-3">
            <div className="overflow-hidden rounded-xl border bg-card">
                <Table className="min-w-xl tabular-nums">
                    <TableHeader className="bg-surface">
                        <TableRow>
                            <TableHead scope="col" className="sticky left-0 z-10 w-44 bg-surface pl-4">Caractéristique</TableHead>
                            {planets.map((planet) => (
                                <TableHead key={planet.slug} scope="col" className="h-auto min-w-40 py-3 align-top whitespace-normal">
                                    <div className="grid justify-items-start gap-1.5">
                                        <div className="flex w-full items-start justify-between gap-2">
                                            <a href={getPlanetPath(planet.slug)} className="font-heading text-base font-bold underline-offset-4 hover:underline">
                                                {planet.name}
                                            </a>
                                            <Button variant="ghost" size="icon-sm" onClick={() => onRemove(planet.slug)}
                                                    aria-label={`Retirer ${planet.name} de la comparaison`}>
                                                <X aria-hidden="true"/>
                                            </Button>
                                        </div>
                                        <span className="text-xs font-normal text-muted-foreground">{planet.hostStarName ?? "Étoile non renseignée"}</span>
                                        <MethodBadge method={planet.discoveryMethod}/>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.key}>
                                <TableHead scope="row" className="sticky left-0 z-10 bg-card pl-4 font-normal whitespace-normal">
                                    {row.label}
                                    {row.unitName && <span className="block text-xs text-muted-foreground">en {row.unitName}</span>}
                                </TableHead>
                                {row.cells.map((cell) => (
                                    <TableCell key={cell.slug} className={cn(cell.extreme && "font-semibold text-foreground")}>
                                        <Measurement compact measurement={formatMeasurement(cell.value, cell.origin, row)}/>
                                        {cell.extreme && <ExtremeMarker extreme={cell.extreme}/>}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ArrowUp className="size-3.5 text-brand" aria-hidden="true"/>valeur la plus élevée</span>
                <span className="inline-flex items-center gap-1"><ArrowDown className="size-3.5 text-brand" aria-hidden="true"/>valeur la plus faible</span>
                <span>{provenanceLegend}</span>
            </p>
        </div>
    );
}
