import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { LoaderCircle, Search } from "lucide-react";
import { useRef, useState } from "react";
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { getDiscoveryMethodLabel } from "@/domain/exoplanets/discovery-methods";
import type { ExoplanetReference } from "@/domain/exoplanets/model";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePlanetSearch } from "@/hooks/use-planet-search";
import { searchTextLimits } from "@/lib/validation/text";

interface PlanetSearchProps {
    id: string;
    label: string;
    placeholder: string;
    onSelect: (planet: ExoplanetReference) => void;
    excluded?: readonly string[];
    disabled?: boolean;
    name?: string;
    size?: "default" | "lg";
}

const inputClassName = "w-full min-w-0 rounded-lg border border-input bg-card pr-10 pl-10 text-base text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";
const inputSizes = { default: "h-10 text-sm", lg: "h-12" } as const;
const searchIcon = <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>;

function describe({ hostStarName, discoveryYear, discoveryMethod }: ExoplanetReference): string {
    return [hostStarName, discoveryYear, discoveryMethod && getDiscoveryMethodLabel(discoveryMethod)].filter(Boolean).join(" · ");
}

export function PlanetSearch({ id, label, placeholder, onSelect, excluded = [], disabled, name, size = "default" }: PlanetSearchProps) {
    const hydrated = useHydrated();
    const anchorRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const { results, status } = usePlanetSearch(query);
    const visibleResults = results.filter(({ slug }) => !excluded.includes(slug));
    const expanded = open && query.trim().length >= searchTextLimits.min;

    const select = (planet: ExoplanetReference) => {
        onSelect(planet);
        setQuery("");
        setOpen(false);
    };

    const inputProps = {
        id,
        name,
        disabled,
        maxLength: searchTextLimits.max,
        placeholder,
        autoComplete: "off",
        spellCheck: false,
        className: cn(inputClassName, inputSizes[size])
    };

    if (!hydrated) {
        return (
            <div className="relative">
                {searchIcon}
                <input type="search" {...inputProps}/>
            </div>
        );
    }

    return (
        <Command shouldFilter={false} loop label={label} className="overflow-visible rounded-none! bg-transparent p-0">
            <Popover open={expanded} onOpenChange={setOpen}>
                <PopoverAnchor asChild>
                    <div ref={anchorRef} className="relative">
                        {searchIcon}
                        <CommandPrimitive.Input
                            {...inputProps}
                            value={query}
                            onValueChange={(value) => {
                                setQuery(value);
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                        />
                        {status === "loading" && (
                            <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true"/>
                        )}
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) min-w-64 p-1"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    onInteractOutside={(event) => {
                        if (event.target instanceof Node && anchorRef.current?.contains(event.target)) event.preventDefault();
                    }}
                >
                    <CommandList aria-label={`Résultats : ${label}`}>
                        {status === "loading" && visibleResults.length === 0 && (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">Recherche en cours...</p>
                        )}
                        {status === "error" && (
                            <p className="px-3 py-6 text-center text-sm text-destructive" role="alert">
                                La recherche est momentanément indisponible.
                            </p>
                        )}
                        {status === "success" && <CommandEmpty>Aucune exoplanète ne correspond à cette recherche.</CommandEmpty>}
                        {visibleResults.map((planet) => (
                            <CommandItem key={planet.slug} value={planet.slug} onSelect={() => select(planet)} className="grid justify-items-start gap-0.5 px-3 py-2">
                                <span className="font-semibold text-foreground">{planet.name}</span>
                                <span className="text-xs text-muted-foreground">{describe(planet)}</span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </PopoverContent>
            </Popover>
        </Command>
    );
}
