import { PlanetSearch } from "@/components/exoplanets/planet-search";
import { Button } from "@/components/ui/button";
import { getPlanetPath, pages } from "@/data/site";
import { queryParameters } from "@/domain/filters/query";

const inputId = "recherche-accueil";

export function HeroSearch() {
    return (
        <form action={pages.catalogue} method="get" role="search" className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label htmlFor={inputId} className="sr-only">Rechercher une exoplanète ou une étoile</label>
            <PlanetSearch
                id={inputId}
                name={queryParameters.text}
                size="lg"
                label="Rechercher une exoplanète ou une étoile"
                placeholder="TRAPPIST-1 e, Kepler-186, 51 Peg..."
                onSelect={({ slug }) => window.location.assign(getPlanetPath(slug))}
            />
            <Button type="submit" size="lg" className="h-12 px-6">Rechercher</Button>
        </form>
    );
}
