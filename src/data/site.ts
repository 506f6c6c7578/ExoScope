export interface NavigationLink {
    label: string;
    href: string;
}

export const site = {
    url: "https://exo.paulviandier.com",
    lang: "fr",
    locale: "fr_FR",
    name: "ExoScope",
    tagline: "Explorer les mondes au-delà du Système solaire.",
    title: "ExoScope — Explorateur d'exoplanètes",
    description:
        "ExoScope est un explorateur pédagogique d'exoplanètes : recherche, filtres astronomiques, fiches détaillées, comparaisons et méthodes de détection, à partir du catalogue de la NASA Exoplanet Archive.",
    robots: "noindex, nofollow, noarchive, nosnippet",
    author: {
        name: "Paul Viandier",
        url: "https://paulviandier.com",
        contactUrl: "https://paulviandier.com/contact"
    },
    repository: "https://github.com/506f6c6c7578/ExoScope"
} as const;

export const pages = {
    home: "/",
    catalogue: "/catalogue",
    compare: "/comparer",
    methods: "/methodes",
    about: "/a-propos",
    legalNotice: "/mentions-legales",
    privacy: "/confidentialite"
} as const;

export function getPlanetPath(slug: string): string {
    return `/exoplanetes/${slug}`;
}

export const endpoints = {
    exoplanets: "/api/exoplanets",
    search: "/api/exoplanets/search",
    compare: "/api/exoplanets/compare"
} as const;

export const navigation: readonly NavigationLink[] = [
    { label: "Catalogue", href: pages.catalogue },
    { label: "Comparer", href: pages.compare },
    { label: "Méthodes", href: pages.methods },
    { label: "À propos", href: pages.about }
];

export const legalLinks = {
    notice: { label: "Mentions légales", href: pages.legalNotice },
    privacy: { label: "Politique de confidentialité", href: pages.privacy }
} as const satisfies Record<string, NavigationLink>;

export const credits: readonly NavigationLink[] = [
    { label: "Données : NASA Exoplanet Archive", href: "https://exoplanetarchive.ipac.caltech.edu" },
    { label: "Code source sur GitHub", href: site.repository }
];
