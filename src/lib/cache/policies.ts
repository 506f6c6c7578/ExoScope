export const cachePolicies = {
    listing: "public, max-age=300, stale-while-revalidate=3600",
    planet: "public, max-age=3600, stale-while-revalidate=86400",
    noStore: "no-store"
} as const;

export type CachePolicy = (typeof cachePolicies)[keyof typeof cachePolicies];
