import { Badge } from "@/components/ui/badge";
import { getDiscoveryMethodLabel } from "@/domain/exoplanets/discovery-methods";
import type { DiscoveryMethod } from "@/domain/exoplanets/model";

export function MethodBadge({ method }: { method: DiscoveryMethod | null }) {
    return <Badge variant={method ? "brand" : "outline"}>{method ? getDiscoveryMethodLabel(method) : "Méthode non renseignée"}</Badge>;
}
