import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import { Measurement, provenanceLegend } from "@/components/exoplanets/measurement";
import { MethodBadge } from "@/components/exoplanets/method-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlanetPath } from "@/data/site";
import type { ExoplanetSummary } from "@/domain/exoplanets/model";
import { getRangeProperty, type RangeFilterKey, type SortKey, type SortOrder } from "@/domain/filters/fields";
import { formatPlanetProperty } from "@/lib/formatting/measurement";

interface CatalogueResultsProps {
    planets: readonly ExoplanetSummary[];
    sort: SortKey;
    order: SortOrder;
    onSort?: (sort: SortKey) => void;
    onReset: () => void;
}

const valueColumns = ["annee", "periode", "masse", "rayon", "distance", "temperature"] as const satisfies readonly RangeFilterKey[];
const columnLabels: Record<(typeof valueColumns)[number], string> = {
    annee: "Année",
    periode: "Période",
    masse: "Masse",
    rayon: "Rayon",
    distance: "Distance",
    temperature: "T. d'équilibre"
};

const cardColumns = ["periode", "masse", "rayon", "distance", "temperature"] as const satisfies readonly RangeFilterKey[];

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
    if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true"/>;
    const Icon = order === "asc" ? ArrowUp : ArrowDown;
    return <Icon className="size-3.5 text-brand" aria-hidden="true"/>;
}

function SortableHead({ column, label, sort, order, onSort, className }: {
    column: SortKey;
    label: string;
    sort: SortKey;
    order: SortOrder;
    onSort?: (sort: SortKey) => void;
    className?: string;
}) {
    const active = column === sort;
    return (
        <TableHead scope="col" className={className} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : undefined}>
            {onSort ? (
                <button type="button" onClick={() => onSort(column)}
                        className="-mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold hover:bg-muted">
                    {label}
                    <SortIcon active={active} order={order}/>
                </button>
            ) : label}
        </TableHead>
    );
}

function columnLabel(column: (typeof valueColumns)[number]): string {
    const { unit } = getRangeProperty(column);
    return unit ? `${columnLabels[column]} (${unit})` : columnLabels[column];
}

function PlanetLink({ planet }: { planet: ExoplanetSummary }) {
    return (
        <a href={getPlanetPath(planet.slug)} className="font-semibold text-foreground underline-offset-4 hover:underline">
            {planet.name}
        </a>
    );
}

function CatalogueEmpty({ onReset }: { onReset: () => void }) {
    return (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true"/>
            <p className="font-heading text-lg font-bold text-foreground">Aucune exoplanète ne correspond à ces critères.</p>
            <p className="max-w-md text-sm">Élargis les plages de valeurs ou retire un filtre : beaucoup de planètes n'ont pas toutes leurs caractéristiques renseignées.</p>
            <Button variant="outline" size="lg" onClick={onReset} className="mt-2">Réinitialiser les filtres</Button>
        </div>
    );
}

export function CatalogueResults({ planets, sort, order, onSort, onReset }: CatalogueResultsProps) {
    if (planets.length === 0) return <CatalogueEmpty onReset={onReset}/>;

    return (
        <>
            <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
                <Table className="tabular-nums">
                    <TableHeader className="bg-surface">
                        <TableRow>
                            <SortableHead column="nom" label="Planète et étoile" sort={sort} order={order} onSort={onSort} className="pl-4"/>
                            <TableHead scope="col">Méthode</TableHead>
                            {valueColumns.map((column) => (
                                <SortableHead key={column} column={column} label={columnLabel(column)} sort={sort} order={order}
                                              onSort={onSort} className="text-right"/>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {planets.map((planet) => (
                            <TableRow key={planet.slug}>
                                <TableHead scope="row" className="pl-4 font-normal">
                                    <span className="grid">
                                        <PlanetLink planet={planet}/>
                                        <span className="text-xs text-muted-foreground">{planet.hostStarName ?? "Étoile non renseignée"}</span>
                                    </span>
                                </TableHead>
                                <TableCell><MethodBadge method={planet.discoveryMethod}/></TableCell>
                                {valueColumns.map((column) => (
                                    <TableCell key={column} className="text-right">
                                        <Measurement compact measurement={formatPlanetProperty(planet, getRangeProperty(column))}/>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-muted-foreground">{provenanceLegend}</p>

            <ul className="grid gap-3 md:hidden">
                {planets.map((planet) => (
                    <li key={planet.slug} className="grid gap-3 rounded-xl border bg-card p-4">
                        <div className="grid gap-1">
                            <PlanetLink planet={planet}/>
                            <p className="text-sm text-muted-foreground">
                                {[planet.hostStarName, planet.discoveryYear].filter(Boolean).join(" · ")}
                            </p>
                            <MethodBadge method={planet.discoveryMethod}/>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {cardColumns.map((column) => (
                                <div key={column} className="grid">
                                    <dt className="text-xs text-muted-foreground">{getRangeProperty(column).label}</dt>
                                    <dd className="font-semibold text-foreground">
                                        <Measurement compact measurement={formatPlanetProperty(planet, getRangeProperty(column))}/>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </li>
                ))}
            </ul>
        </>
    );
}
