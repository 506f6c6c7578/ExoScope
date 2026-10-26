export interface FeaturedPlanet {
    slug: string;
    note: string;
}

export const featuredPlanets: readonly FeaturedPlanet[] = [
    { slug: "51-peg-b", note: "Première exoplanète découverte autour d'une étoile semblable au Soleil, en 1995." },
    { slug: "hd-209458-b", note: "Première exoplanète observée en transit devant son étoile, en 1999." },
    { slug: "trappist-1-e", note: "L'une des sept planètes de taille terrestre du système TRAPPIST-1." },
    { slug: "proxima-cen-b", note: "En orbite autour de Proxima du Centaure, l'étoile la plus proche du Soleil." },
    { slug: "hr-8799-e", note: "L'une des quatre planètes géantes de HR 8799 photographiées directement." },
    { slug: "k2-18-b", note: "Planète tempérée dont l'atmosphère a été étudiée par le télescope spatial James-Webb." }
];

export const earthLikeCriteria = {
    radius: { min: 0.5, max: 1.6 },
    temperature: { min: 180, max: 310 }
} as const;
