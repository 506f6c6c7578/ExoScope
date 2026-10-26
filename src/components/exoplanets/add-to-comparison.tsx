import { ArrowRight, Check, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { comparisonLimits, toggleSelection } from "@/domain/comparison/selection";
import { saveComparisonList, useComparisonList } from "@/hooks/use-comparison-list";
import { useHydrated } from "@/hooks/use-hydrated";
import { getComparisonUrl } from "@/lib/url";

interface AddToComparisonProps {
    slug: string;
    name: string;
}

export function AddToComparison({ slug, name }: AddToComparisonProps) {
    const hydrated = useHydrated();
    const slugs = useComparisonList();
    const [message, setMessage] = useState("");
    const selected = slugs.includes(slug);
    const full = !selected && slugs.length >= comparisonLimits.max;

    const toggle = () => {
        saveComparisonList(toggleSelection(slugs, slug));
        setMessage(selected ? `${name} a été retirée de la comparaison.` : `${name} a été ajoutée à la comparaison.`);
    };

    return (
        <div className="grid justify-items-start gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button size="lg" variant={selected ? "outline" : "default"} onClick={toggle} disabled={!hydrated || full}
                        aria-pressed={selected}>
                    {selected ? <Check aria-hidden="true"/> : <Plus aria-hidden="true"/>}
                    {selected ? "Dans la comparaison" : "Ajouter à la comparaison"}
                </Button>
                {slugs.length > 0 && (
                    <a href={getComparisonUrl(slugs)}
                       className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:underline">
                        Voir la comparaison ({slugs.length}/{comparisonLimits.max})
                        <ArrowRight className="size-4" aria-hidden="true"/>
                    </a>
                )}
            </div>
            <p className="min-h-5 text-sm text-muted-foreground" role="status">
                {full ? `La comparaison contient déjà ${comparisonLimits.max} planètes.` : message}
            </p>
        </div>
    );
}
