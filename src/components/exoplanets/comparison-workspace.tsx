import { CircleAlert, Link2, Plus, Trash2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { ComparisonTable } from "@/components/exoplanets/comparison-table";
import { PlanetSearch } from "@/components/exoplanets/planet-search";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReferencePoints, type ScatterKind, type ScatterPoint, type SelectionPoint, toScatterPoint } from "@/domain/charts/scatter";
import { comparisonLimits } from "@/domain/comparison/selection";
import type { Exoplanet, ExoplanetReference } from "@/domain/exoplanets/model";
import { saveComparisonList, useComparisonList } from "@/hooks/use-comparison-list";
import { useHydrated } from "@/hooks/use-hydrated";
import { getComparisonApiUrl, getComparisonUrl } from "@/lib/url";
import { comparisonResponseSchema, fetchValidated } from "@/lib/validation/api";

const PlanetScatter = lazy(() => import("@/components/charts/planet-scatter"));

interface ComparisonWorkspaceProps {
    initialPlanets: Exoplanet[];
    notice: string | null;
    backgrounds: Record<ScatterKind, ScatterPoint[]>;
    suggestions: ExoplanetReference[];
}

const charts = {
    massRadius: {
        tab: "Masse et rayon",
        xAxis: { label: "Masse", unit: "M⊕" },
        yAxis: { label: "Rayon", unit: "R⊕" },
        description: "Nuage de points masse-rayon : planètes comparées, planètes du Système solaire et échantillon de planètes dont la masse et le rayon sont mesurés.",
        missing: "masse ou rayon non renseigné"
    },
    orbit: {
        tab: "Orbites",
        xAxis: { label: "Période orbitale", unit: "jours" },
        yAxis: { label: "Demi-grand axe", unit: "ua" },
        description: "Nuage de points de la période orbitale en fonction du demi-grand axe : planètes comparées, Système solaire et échantillon du catalogue.",
        missing: "période ou demi-grand axe non renseigné"
    }
} as const satisfies Record<ScatterKind, unknown>;

const chartKinds = Object.keys(charts) as ScatterKind[];

function toSelectionPoints(planets: readonly Exoplanet[], kind: ScatterKind): SelectionPoint[] {
    return planets.flatMap((planet, index) => {
        const point = toScatterPoint(planet, kind);
        return point ? [{ name: planet.name, marker: String(index + 1), x: point[0], y: point[1] }] : [];
    });
}

export function ComparisonWorkspace({ initialPlanets, notice, backgrounds, suggestions }: ComparisonWorkspaceProps) {
    const hydrated = useHydrated();
    const stored = useComparisonList();
    const [planets, setPlanets] = useState(initialPlanets);
    const [synced, setSynced] = useState(initialPlanets.length > 0);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");
    const slugs = planets.map(({ slug }) => slug);
    const full = planets.length >= comparisonLimits.max;

    useEffect(() => {
        if (!hydrated || synced) return;
        if (stored.length === 0) {
            setSynced(true);
            return;
        }
        const controller = new AbortController();
        fetchValidated(getComparisonApiUrl(stored), comparisonResponseSchema, controller.signal).then(
            (response) => {
                setPlanets(response.planets);
                setSynced(true);
            },
            () => {
                if (controller.signal.aborted) return;
                setMessage("La comparaison enregistrée n'a pas pu être restaurée.");
                setSynced(true);
            }
        );
        return () => controller.abort();
    }, [hydrated, synced, stored]);

    useEffect(() => {
        if (!synced) return;
        const current = planets.map(({ slug }) => slug);
        window.history.replaceState(window.history.state, "", getComparisonUrl(current));
        saveComparisonList(current);
    }, [synced, planets]);

    const add = async ({ slug, name }: ExoplanetReference) => {
        if (full || slugs.includes(slug)) return;
        setPending(true);
        try {
            const response = await fetchValidated(getComparisonApiUrl([slug]), comparisonResponseSchema, AbortSignal.timeout(10_000));
            setPlanets((current) => [...current, ...response.planets].slice(0, comparisonLimits.max));
            setMessage(`${name} a été ajoutée à la comparaison.`);
        } catch {
            setMessage(`${name} n'a pas pu être ajoutée. Réessaie dans un instant.`);
        } finally {
            setPending(false);
        }
    };

    const remove = (slug: string) => {
        const removed = planets.find((planet) => planet.slug === slug);
        setPlanets((current) => current.filter((planet) => planet.slug !== slug));
        if (removed) setMessage(`${removed.name} a été retirée de la comparaison.`);
    };

    const share = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(
            () => setMessage("Lien de la comparaison copié dans le presse-papiers."),
            () => setMessage(`Copie impossible, voici le lien : ${url}`)
        );
    };

    return (
        <div className="grid gap-6">
            {notice && (
                <Alert>
                    <CircleAlert aria-hidden="true"/>
                    <AlertTitle>Une partie de l'adresse a été ignorée</AlertTitle>
                    <AlertDescription>{notice}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5">
                <div className="grid gap-2">
                    <label htmlFor="ajout-comparaison" className="text-sm font-semibold text-foreground">
                        Ajouter une planète ({planets.length}/{comparisonLimits.max})
                    </label>
                    <PlanetSearch id="ajout-comparaison" label="Ajouter une planète à la comparaison"
                                  placeholder={full ? "Comparaison complète" : "Nom de la planète ou de l'étoile..."}
                                  disabled={full || pending} excluded={slugs} onSelect={add}/>
                </div>
                <div className="flex flex-wrap gap-2 md:self-end">
                    <Button variant="outline" size="lg" onClick={share} disabled={!hydrated || planets.length === 0}>
                        <Link2 aria-hidden="true"/>
                        Copier le lien
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => setPlanets([])} disabled={!hydrated || planets.length === 0}>
                        <Trash2 aria-hidden="true"/>
                        Vider
                    </Button>
                </div>
            </div>

            <p className="min-h-5 text-sm text-muted-foreground" role="status">{message}</p>

            {planets.length === 0 ? (
                <div className="grid justify-items-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center">
                    <p className="font-heading text-lg font-bold text-foreground">Aucune planète à comparer pour l'instant.</p>
                    <p className="max-w-lg text-sm">
                        Recherche une planète ci-dessus, ajoute-la depuis sa fiche, ou commence par l'une de ces suggestions.
                    </p>
                    <ul className="flex flex-wrap justify-center gap-2">
                        {suggestions.map((suggestion) => (
                            <li key={suggestion.slug}>
                                <Button variant="outline" onClick={() => add(suggestion)} disabled={!hydrated || pending}>
                                    <Plus aria-hidden="true"/>
                                    {suggestion.name}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <>
                    {planets.length < comparisonLimits.min && (
                        <p className="text-sm">Ajoute au moins une autre planète pour faire ressortir les différences.</p>
                    )}
                    {hydrated ? <Tabs defaultValue="tableau" className="gap-4">
                        <TabsList aria-label="Vues de la comparaison">
                            <TabsTrigger value="tableau">Tableau</TabsTrigger>
                            {chartKinds.map((kind) => <TabsTrigger key={kind} value={kind}>{charts[kind].tab}</TabsTrigger>)}
                        </TabsList>
                        <TabsContent value="tableau">
                            <ComparisonTable planets={planets} onRemove={remove}/>
                        </TabsContent>
                        {chartKinds.map((kind) => {
                            const selection = toSelectionPoints(planets, kind);
                            const absent = planets.filter((planet) => !selection.some(({ name }) => name === planet.name));
                            return (
                                <TabsContent key={kind} value={kind} className="grid gap-3">
                                    <Suspense fallback={<Skeleton className="aspect-[4/3] w-full sm:aspect-[16/10]"/>}>
                                        <PlanetScatter description={charts[kind].description} xAxis={charts[kind].xAxis} yAxis={charts[kind].yAxis}
                                                       background={backgrounds[kind]} selection={selection} references={getReferencePoints(kind)}/>
                                    </Suspense>
                                    {absent.length > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Absentes du graphique ({charts[kind].missing}) : {absent.map(({ name }) => name).join(", ")}.
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Les valeurs exactes des planètes comparées figurent dans l'onglet Tableau. Échelles logarithmiques.
                                    </p>
                                </TabsContent>
                            );
                        })}
                    </Tabs> : <ComparisonTable planets={planets} onRemove={remove}/>}
                </>
            )}
        </div>
    );
}
