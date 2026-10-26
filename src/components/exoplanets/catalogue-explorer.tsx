import { cn } from "cn";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, CircleAlert, Info, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CatalogueFilters, textInputDelay } from "@/components/exoplanets/catalogue-filters";
import { CataloguePagination } from "@/components/exoplanets/catalogue-pagination";
import { CatalogueResults } from "@/components/exoplanets/catalogue-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectMenu, type SelectMenuOption } from "@/components/ui/select-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExoplanetSummary } from "@/domain/exoplanets/model";
import { getRangeProperty, type SortKey, sortKeys } from "@/domain/filters/fields";
import type { Page } from "@/domain/filters/pagination";
import { type CatalogQuery, clearFilters, countActiveFilters } from "@/domain/filters/query";
import type { RangeBoundsByFilter } from "@/domain/filters/scale";
import { useCatalogueResults } from "@/hooks/use-catalogue-results";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatCount, formatInteger } from "@/lib/formatting/number";
import { getCatalogueUrl } from "@/lib/url";
import { searchTextLimits } from "@/lib/validation/text";

interface CatalogueExplorerProps {
    initialQuery: CatalogQuery;
    initialPage: Page<ExoplanetSummary>;
    bounds: RangeBoundsByFilter;
    invalidParameters: string | null;
}

const sortOptions: readonly SelectMenuOption<SortKey>[] = sortKeys.map((key) => ({
    value: key,
    label: key === "nom" ? "Nom" : getRangeProperty(key).label
}));

function getDefaultOrder(sort: SortKey): CatalogQuery["order"] {
    return sort === "nom" ? "asc" : "desc";
}

function FiltersSkeleton() {
    return (
        <div className="grid gap-5" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-10"/>)}
        </div>
    );
}

export function CatalogueExplorer({ initialQuery, initialPage, bounds, invalidParameters }: CatalogueExplorerProps) {
    const hydrated = useHydrated();
    const resultsRef = useRef<HTMLElement>(null);
    const [query, setQuery] = useState(initialQuery);
    const [text, setText] = useState(initialQuery.text);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { page, status, retry } = useCatalogueResults(query, initialPage);
    const activeFilters = countActiveFilters(query);

    useEffect(() => {
        if (hydrated) window.history.replaceState(window.history.state, "", getCatalogueUrl(query));
    }, [hydrated, query]);

    const update = (changes: Partial<CatalogQuery>) => setQuery((current) => ({ ...current, ...changes, page: 1 }));
    const commitText = useDebouncedCallback((value: string) => update({ text: value.trim() }), textInputDelay);

    const reset = () => {
        setText("");
        setQuery(clearFilters);
    };

    const sortBy = (sort: SortKey) => setQuery((current) => ({
        ...current,
        sort,
        order: current.sort === sort ? (current.order === "asc" ? "desc" : "asc") : getDefaultOrder(sort),
        page: 1
    }));

    const goToPage = (target: number) => {
        setQuery((current) => ({ ...current, page: target }));
        resultsRef.current?.scrollIntoView({ block: "start" });
    };

    const filters = (idPrefix: string) => hydrated
        ? <CatalogueFilters idPrefix={idPrefix} query={query} bounds={bounds} onChange={update} onReset={reset}/>
        : <FiltersSkeleton/>;

    return (
        <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
            <aside className="hidden lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block" aria-label="Filtres du catalogue">
                <h2 className="mb-5 font-heading text-lg font-bold">Filtres</h2>
                {filters("filtre")}
            </aside>

            <section ref={resultsRef} aria-labelledby="resultats-titre" className="grid min-w-0 scroll-mt-28 gap-5">
                <h2 id="resultats-titre" className="sr-only">Résultats</h2>
                {invalidParameters && (
                    <Alert>
                        <Info aria-hidden="true"/>
                        <AlertTitle>Certains paramètres de l'adresse ont été ignorés</AlertTitle>
                        <AlertDescription>{invalidParameters} Le catalogue complet est affiché.</AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-56 flex-1">
                        <label htmlFor="recherche-catalogue" className="sr-only">Rechercher par nom de planète ou d'étoile</label>
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>
                        <Input
                            id="recherche-catalogue"
                            type="search"
                            value={text}
                            maxLength={searchTextLimits.max}
                            placeholder="Rechercher par nom..."
                            className="h-10 pl-9"
                            onChange={(event) => {
                                setText(event.target.value);
                                commitText(event.target.value);
                            }}
                        />
                    </div>
                    <Button variant="outline" size="lg" className="h-10 lg:hidden" aria-expanded={filtersOpen}
                            aria-controls="filtres-mobile" onClick={() => setFiltersOpen((open) => !open)} disabled={!hydrated}>
                        <SlidersHorizontal aria-hidden="true"/>
                        Filtres
                        {activeFilters > 0 && <Badge variant="brand">{activeFilters}</Badge>}
                        <ChevronDown className={cn("transition-transform", filtersOpen && "rotate-180")} aria-hidden="true"/>
                    </Button>
                    <SelectMenu value={query.sort} options={sortOptions} onValueChange={sortBy} size="lg" className="h-10 min-w-52"
                                aria-label={`Trier par : ${sortOptions.find(({ value }) => value === query.sort)?.label ?? ""}`}/>
                    <Button variant="outline" size="icon-lg" className="size-10"
                            aria-label={query.order === "asc" ? "Ordre croissant, passer en décroissant" : "Ordre décroissant, passer en croissant"}
                            onClick={() => setQuery((current) => ({ ...current, order: current.order === "asc" ? "desc" : "asc", page: 1 }))}>
                        {query.order === "asc" ? <ArrowUpNarrowWide aria-hidden="true"/> : <ArrowDownWideNarrow aria-hidden="true"/>}
                    </Button>
                </div>

                {filtersOpen && (
                    <div id="filtres-mobile" role="region" aria-label="Filtres" className="rounded-xl border bg-card p-4 lg:hidden">
                        <p className="mb-4 text-sm text-muted-foreground">
                            {formatCount(page.total, "exoplanète correspondante", "exoplanètes correspondantes")}
                        </p>
                        {filters("filtre-mobile")}
                    </div>
                )}

                <p className="text-sm text-muted-foreground" aria-live="polite">
                    {status === "loading"
                        ? "Mise à jour des résultats..."
                        : `${formatCount(page.total, "exoplanète")} · page ${formatInteger(page.page)} sur ${formatInteger(page.totalPages)}`}
                </p>

                {status === "error" ? (
                    <Alert variant="destructive" role="alert">
                        <CircleAlert aria-hidden="true"/>
                        <AlertTitle>Les résultats n'ont pas pu être chargés.</AlertTitle>
                        <AlertDescription className="grid justify-items-start gap-3">
                            Vérifie ta connexion puis réessaie. Les filtres sélectionnés sont conservés.
                            <Button variant="outline" onClick={retry}>Réessayer</Button>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div aria-busy={status === "loading"} className={cn("grid gap-5 transition-opacity", status === "loading" && "opacity-60")}>
                        <CatalogueResults planets={page.items} sort={query.sort} order={query.order} onSort={hydrated ? sortBy : undefined}
                                          onReset={reset}/>
                        <CataloguePagination page={page.page} totalPages={page.totalPages}
                                             getHref={(target) => getCatalogueUrl({ ...query, page: target })}
                                             onNavigate={hydrated ? goToPage : undefined}/>
                    </div>
                )}
            </section>
        </div>
    );
}
