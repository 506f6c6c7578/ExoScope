import { type APIResponse, expect, test } from "@playwright/test";

const robots = "noindex, nofollow, noarchive, nosnippet";

async function expectJsonError(response: APIResponse, status: number) {
    expect(response.status()).toBe(status);
    expect(response.headers()["cache-control"]).toBe("no-store");
    const body: unknown = await response.json();
    expect(body).toEqual({ error: expect.any(String) });
    expect(JSON.stringify(body)).not.toMatch(/at |\.mjs|stack/i);
}

test.describe("GET /api/exoplanets", () => {
    test("renvoie une page bornée, typée et mise en cache", async ({ request }) => {
        const response = await request.get("/api/exoplanets");
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("application/json");
        expect(response.headers()["cache-control"]).toContain("max-age=300");
        expect(response.headers()["x-content-type-options"]).toBe("nosniff");
        expect(response.headers()["x-robots-tag"]).toBe(robots);
        const body = await response.json();
        expect(body.items).toHaveLength(25);
        expect(body).toMatchObject({ page: 1, pageSize: 25 });
        expect(body.total).toBeGreaterThan(4000);
        expect(Object.keys(body.items[0])).not.toContain("discoveryFacility");
    });

    test("pagine et ramène une page trop lointaine dans les bornes", async ({ request }) => {
        const second = await (await request.get("/api/exoplanets?page=2&taille=10")).json();
        expect(second).toMatchObject({ page: 2, pageSize: 10 });
        expect(second.items).toHaveLength(10);
        const last = await (await request.get("/api/exoplanets?page=1000&taille=50&methode=astrometrie")).json();
        expect(last.page).toBe(last.totalPages);
    });

    test("applique filtres et tri", async ({ request }) => {
        const body = await (await request.get("/api/exoplanets?methode=imagerie-directe&tri=masse&ordre=desc&taille=50")).json();
        const methods = new Set(body.items.map((item: { discoveryMethod: string }) => item.discoveryMethod));
        expect([...methods]).toEqual(["imagerie-directe"]);
        const masses = body.items.map((item: { massJupiter: number | null }) => item.massJupiter).filter((mass: number | null) => mass !== null);
        expect(masses).toEqual([...masses].sort((first, second) => second - first));
    });

    for (const search of ["taille=51", "page=1001", "tri=__proto__", "masse-min=abc", "annee-min=2020&annee-max=2000", `q=${"a".repeat(101)}`, "q=%00"]) {
        test(`refuse ${search.slice(0, 30)}`, async ({ request }) => {
            await expectJsonError(await request.get(`/api/exoplanets?${search}`), 400);
        });
    }
});

test.describe("GET /api/exoplanets/search", () => {
    test("trouve une planète par nom approché", async ({ request }) => {
        const body = await (await request.get("/api/exoplanets/search?q=trappist 1e")).json();
        expect(body.results[0]).toMatchObject({ slug: "trappist-1-e", name: "TRAPPIST-1 e" });
        expect(Object.keys(body.results[0])).toEqual(["slug", "name", "hostStarName", "discoveryYear", "discoveryMethod"]);
    });

    test("borne le nombre de résultats", async ({ request }) => {
        const body = await (await request.get("/api/exoplanets/search?q=kepler&limite=20")).json();
        expect(body.results).toHaveLength(20);
    });

    for (const search of ["", "q=a", `q=${"a".repeat(101)}`, "q=kepler&limite=21", "q=kepler&limite=0"]) {
        test(`refuse la recherche ${search.slice(0, 30) || "vide"}`, async ({ request }) => {
            await expectJsonError(await request.get(`/api/exoplanets/search?${search}`), 400);
        });
    }
});

test.describe("GET /api/exoplanets/[slug] et /compare", () => {
    test("renvoie la fiche complète d'une planète", async ({ request }) => {
        const response = await request.get("/api/exoplanets/51-peg-b");
        expect(response.status()).toBe(200);
        expect(response.headers()["cache-control"]).toContain("max-age=3600");
        const { planet } = await response.json();
        expect(planet).toMatchObject({ name: "51 Peg b", discoveryYear: 1995, discoveryMethod: "vitesse-radiale" });
    });

    test("distingue identifiant invalide et planète inexistante", async ({ request }) => {
        await expectJsonError(await request.get("/api/exoplanets/planete-inexistante-b"), 404);
        await expectJsonError(await request.get("/api/exoplanets/Bad_Slug"), 400);
    });

    test("compare au plus quatre planètes et signale les inconnues", async ({ request }) => {
        const body = await (await request.get("/api/exoplanets/compare?planetes=trappist-1-e,51-peg-b,inconnue-b")).json();
        expect(body.planets.map((planet: { slug: string }) => planet.slug)).toEqual(["trappist-1-e", "51-peg-b"]);
        expect(body.missing).toEqual(["inconnue-b"]);
        await expectJsonError(await request.get("/api/exoplanets/compare?planetes=a,b,c,d,e"), 400);
        await expectJsonError(await request.get("/api/exoplanets/compare"), 400);
        await expectJsonError(await request.get("/api/exoplanets/compare?planetes=../etc"), 400);
    });
});

test.describe("méthodes HTTP", () => {
    for (const method of ["POST", "PUT", "DELETE", "PATCH"] as const) {
        test(`refuse ${method}`, async ({ request }) => {
            const response = await request.fetch("/api/exoplanets", { method });
            expect([403, 405]).toContain(response.status());
            if (response.status() === 405) expect(response.headers()["allow"]).toBe("GET, HEAD");
        });
    }

    test("accepte HEAD", async ({ request }) => {
        expect((await request.head("/api/exoplanets/search?q=kepler")).status()).toBe(200);
    });
});

test.describe("pages HTML", () => {
    for (const path of ["/", "/catalogue", "/comparer?planetes=trappist-1-e", "/exoplanetes/trappist-1-e", "/methodes", "/a-propos", "/mentions-legales", "/confidentialite"]) {
        test(`${path} n'est pas indexable et porte une CSP`, async ({ request }) => {
            const response = await request.get(path);
            expect(response.status()).toBe(200);
            const html = await response.text();
            expect(html).toContain(`<meta name="robots" content="${robots}">`);
            const policy = response.headers()["content-security-policy"]
                ?? html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1];
            expect(policy).toContain("default-src 'self'");
            expect(policy).toMatch(/script-src 'self'/);
            expect(policy).not.toContain("unsafe-inline");
            expect(html).not.toContain('rel="canonical"');
            expect(html).not.toContain("sitemap");
            expect(html).not.toMatch(/style="/);
        });
    }

    test("les pages dynamiques envoient X-Robots-Tag et un cache adapté", async ({ request }) => {
        const response = await request.get("/catalogue?methode=transit");
        expect(response.headers()["x-robots-tag"]).toBe(robots);
        expect(response.headers()["cache-control"]).toContain("max-age=300");
    });

    test("une planète inexistante renvoie la page 404", async ({ request }) => {
        const response = await request.get("/exoplanetes/planete-inexistante-b");
        expect(response.status()).toBe(404);
        expect(await response.text()).toContain("Page introuvable");
    });

    test("des paramètres invalides n'empêchent pas d'afficher le catalogue", async ({ request }) => {
        const response = await request.get("/catalogue?taille=999");
        expect(response.status()).toBe(200);
        expect(await response.text()).toMatch(/Certains paramètres de l(?:'|&#x27;)adresse ont été ignorés/);
    });

    test("aucun sitemap n'est publié", async ({ request }) => {
        expect((await request.get("/sitemap-index.xml")).status()).toBe(404);
    });
});
