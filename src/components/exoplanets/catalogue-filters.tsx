import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { RangeFilter } from "@/components/exoplanets/range-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { discoveryMethodDefinitions } from "@/domain/exoplanets/discovery-methods";
import { type DiscoveryMethod, discoveryMethods } from "@/domain/exoplanets/model";
import { rangeFilterKeys } from "@/domain/filters/fields";
import { type CatalogQuery, countActiveFilters, withRange } from "@/domain/filters/query";
import type { RangeBoundsByFilter } from "@/domain/filters/scale";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { searchTextLimits } from "@/lib/validation/text";

export const textInputDelay = 300;

interface CatalogueFiltersProps {
    idPrefix: string;
    query: CatalogQuery;
    bounds: RangeBoundsByFilter;
    onChange: (changes: Partial<CatalogQuery>) => void;
    onReset: () => void;
}

export function CatalogueFilters({ idPrefix, query, bounds, onChange, onReset }: CatalogueFiltersProps) {
    const [host, setHost] = useState(query.host);
    const commitHost = useDebouncedCallback((value: string) => onChange({ host: value.trim() }), textInputDelay);

    useEffect(() => setHost(query.host), [query.host]);

    const toggleMethod = (method: DiscoveryMethod, checked: boolean) => {
        const selected = new Set(query.methods);
        if (checked) selected.add(method);
        else selected.delete(method);
        onChange({ methods: discoveryMethods.filter((candidate) => selected.has(candidate)) });
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-etoile`} className="font-semibold text-foreground">Étoile hôte</Label>
                <Input
                    id={`${idPrefix}-etoile`}
                    type="search"
                    value={host}
                    maxLength={searchTextLimits.max}
                    placeholder="TRAPPIST-1, Kepler-90..."
                    className="h-10"
                    onChange={(event) => {
                        setHost(event.target.value);
                        commitHost(event.target.value);
                    }}
                />
            </div>

            <fieldset className="grid gap-3">
                <legend className="mb-3 text-sm font-semibold text-foreground">Méthode de découverte</legend>
                {discoveryMethods.map((method) => {
                    const id = `${idPrefix}-methode-${method}`;
                    return (
                        <div key={method} className="flex items-center gap-2.5">
                            <Checkbox id={id} checked={query.methods.includes(method)}
                                      onCheckedChange={(checked) => toggleMethod(method, checked === true)}/>
                            <Label htmlFor={id} className="font-normal">{discoveryMethodDefinitions[method].label}</Label>
                        </div>
                    );
                })}
            </fieldset>

            <Separator/>

            {rangeFilterKeys.map((key) => (
                <RangeFilter key={key} filter={key} bounds={bounds[key]} range={query.ranges[key]}
                             onChange={(range) => onChange({ ranges: withRange(query.ranges, key, range) })}/>
            ))}
            <p className="text-xs text-muted-foreground">
                Les planètes dont la valeur n'est pas renseignée sont exclues dès qu'une plage est restreinte.
            </p>

            <Separator/>

            <div className="flex items-start justify-between gap-4">
                <Label htmlFor={`${idPrefix}-mesurees`} className="grid gap-1 font-normal">
                    <span className="font-semibold text-foreground">Masse et rayon mesurés</span>
                    <span className="text-xs text-muted-foreground">Exclut les valeurs estimées, calculées, minimales ou limites.</span>
                </Label>
                <Switch id={`${idPrefix}-mesurees`} checked={query.measuredOnly}
                        onCheckedChange={(checked) => onChange({ measuredOnly: checked })}/>
            </div>

            <Button variant="outline" size="lg" onClick={onReset} disabled={countActiveFilters(query) === 0}>
                <RotateCcw aria-hidden="true"/>
                Réinitialiser les filtres
            </Button>
        </div>
    );
}
