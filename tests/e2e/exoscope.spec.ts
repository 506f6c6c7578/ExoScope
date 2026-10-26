import { expect, type Page, test } from "@playwright/test";

function trackErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    return errors;
}

async function visit(page: Page, path: string) {
    const response = await page.goto(path);
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    return response;
}

async function expectNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
}

async function openFilters(page: Page, isMobile: boolean) {
    if (!isMobile) return page.getByRole("complementary", { name: "Filtres du catalogue" });
    const toggle = page.getByRole("button", { name: /^Filtres/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    return page.getByRole("region", { name: "Filtres" });
}

test.describe("navigation générale", () => {
    for (const path of ["/", "/catalogue", "/comparer?planetes=trappist-1-e,51-peg-b", "/exoplanetes/trappist-1-e", "/methodes", "/a-propos", "/mentions-legales", "/confidentialite"]) {
        test(`${path} s'affiche sans erreur ni débordement`, async ({ page }) => {
            const errors = trackErrors(page);
            const response = await visit(page, path);
            expect(response?.status()).toBe(200);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            await expectNoHorizontalOverflow(page);
            expect(errors).toEqual([]);
        });
    }

    test("présente l'accueil", async ({ page }) => {
        await visit(page, "/");
        await expect(page).toHaveTitle("ExoScope — Explorateur d'exoplanètes");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore les mondes au-delà du Système solaire.");
        await expect(page.getByText("Exoplanètes confirmées")).toBeVisible();
        await expect(page.getByRole("link", { name: "Voir le portfolio" })).toHaveAttribute("href", "https://paulviandier.com");
    });

    test("bascule entre les thèmes clair et sombre", async ({ page }) => {
        await visit(page, "/");
        const switcher = page.getByRole("switch", { name: "Thème sombre" });
        const wasDark = await switcher.getAttribute("aria-checked") === "true";
        await switcher.click();
        await expect(switcher).toHaveAttribute("aria-checked", String(!wasDark));
        await expect(page.locator("html")).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
        await page.reload();
        await expect(page.getByRole("switch", { name: "Thème sombre" })).toHaveAttribute("aria-checked", String(!wasDark));
    });

    test("respecte le thème sombre du système", async ({ page }) => {
        await page.emulateMedia({ colorScheme: "dark" });
        await visit(page, "/methodes");
        await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("se parcourt au clavier depuis le lien d'évitement", async ({ page }) => {
        await visit(page, "/methodes");
        await page.keyboard.press("Tab");
        const skipLink = page.getByRole("link", { name: "Aller au contenu principal" });
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toBeInViewport();
        await page.keyboard.press("Enter");
        await expect(page.locator("main")).toBeFocused();
    });

    test("ouvre le menu de navigation", async ({ page, isMobile }) => {
        await visit(page, "/");
        if (isMobile) {
            await page.getByRole("button", { name: "Menu de navigation" }).click();
            await expect(page.getByRole("button", { name: "Menu de navigation" })).toHaveAttribute("aria-expanded", "true");
        }
        await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Méthodes" }).click();
        await expect(page).toHaveURL(/\/methodes$/);
        await expect(page.locator("#site-nav").getByRole("link", { name: "Méthodes", includeHidden: true })).toHaveAttribute("aria-current", "page");
    });
});

test.describe("recherche et fiche", () => {
    test("recherche une planète au clavier et ouvre sa fiche", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/");
        const search = page.getByRole("combobox", { name: "Rechercher une exoplanète ou une étoile" });
        await search.fill("trappist 1e");
        await expect(page.getByRole("option", { name: /TRAPPIST-1 e/ })).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/exoplanetes\/trappist-1-e$/);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("TRAPPIST-1 e");
        await expect(page).toHaveTitle("TRAPPIST-1 e | ExoScope");
        expect(errors).toEqual([]);
    });

    test("envoie une recherche libre vers le catalogue", async ({ page }) => {
        await visit(page, "/");
        await page.getByRole("combobox", { name: "Rechercher une exoplanète ou une étoile" }).fill("zz");
        await page.getByRole("button", { name: "Rechercher", exact: true }).click();
        await expect(page).toHaveURL(/\/catalogue\?q=zz$/);
    });

    test("affiche des données honnêtes sur une fiche", async ({ page }) => {
        await visit(page, "/exoplanetes/proxima-cen-b");
        const facts = page.getByRole("region", { name: "Planète" });
        await expect(facts.getByText("valeur minimale")).toBeVisible();
        await expect(facts.getByText("estimée")).toBeVisible();
        await expect(facts.getByText("Non calculée")).toBeVisible();
        await expect(page.getByText("Limites des données")).toBeVisible();
        await expect(page.getByRole("link", { name: /sur la NASA Exoplanet Archive/ })).toHaveAttribute("href", /exoplanetarchive\.ipac\.caltech\.edu\/overview\//);
        await expect(page.getByRole("img", { name: /Rayon : Proxima Cen b/ })).toBeVisible();
    });

    test("signale une planète inconnue", async ({ page }) => {
        const response = await page.goto("/exoplanetes/planete-imaginaire-b");
        expect(response?.status()).toBe(404);
        await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    });
});

test.describe("catalogue", () => {
    test("filtre par méthode et reflète les filtres dans l'URL", async ({ page, isMobile }) => {
        const errors = trackErrors(page);
        await visit(page, "/catalogue");
        const filters = await openFilters(page, isMobile);
        await filters.getByRole("checkbox", { name: "Imagerie directe" }).check();
        await expect(page).toHaveURL(/methode=imagerie-directe/);
        await expect(page.getByText(/^\d{2,3}\sexoplanètes · page 1 sur/)).toBeVisible();
        await page.reload();
        await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
        const restored = await openFilters(page, isMobile);
        await expect(restored.getByRole("checkbox", { name: "Imagerie directe" })).toBeChecked();
        expect(errors).toEqual([]);
    });

    test("restreint une plage avec le clavier", async ({ page, isMobile }) => {
        await visit(page, "/catalogue");
        const filters = await openFilters(page, isMobile);
        const thumb = filters.getByRole("slider", { name: "Année de découverte : borne inférieure" });
        await thumb.focus();
        await page.keyboard.press("PageUp");
        await page.keyboard.press("PageUp");
        await expect(page).toHaveURL(/annee-min=\d{4}/);
        await expect(thumb).toHaveAttribute("aria-valuetext", /^\d{4}$/);
    });

    test("trie par masse et pagine", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/catalogue");
        await page.getByRole("button", { name: /^Trier par/ }).click();
        await page.getByRole("menuitemradio", { name: "Masse" }).click();
        await expect(page.getByRole("button", { name: "Trier par : Masse" })).toBeVisible();
        await expect(page).toHaveURL(/tri=masse/);
        await page.getByRole("link", { name: "Page 2", exact: true }).click();
        await expect(page).toHaveURL(/page=2/);
        await expect(page.getByText(/· page 2 sur/)).toBeVisible();
        expect(errors).toEqual([]);
    });

    test("referme le sélecteur de tri quand la page défile", async ({ page }) => {
        await visit(page, "/catalogue");
        await page.getByRole("button", { name: /^Trier par/ }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await page.mouse.wheel(0, 600);
        await expect(page.getByRole("menu")).toHaveCount(0);
    });

    test("affiche un état vide puis réinitialise", async ({ page }) => {
        await visit(page, "/catalogue?q=planete-qui-nexiste-pas");
        await expect(page.getByText("Aucune exoplanète ne correspond à ces critères.")).toBeVisible();
        await page.getByRole("button", { name: "Réinitialiser les filtres" }).last().click();
        await expect(page).toHaveURL(/\/catalogue$/);
        await expect(page.getByText(/^6\s\d{3}\sexoplanètes/)).toBeVisible();
    });

    test("affiche une erreur récupérable si l'API échoue", async ({ page }) => {
        await visit(page, "/catalogue");
        await page.route("**/api/exoplanets?**", (route) => route.fulfill({ status: 500, json: { error: "Erreur" } }));
        await page.getByRole("searchbox", { name: /Rechercher par nom/ }).fill("kepler");
        await expect(page.getByRole("alert")).toContainText("Les résultats n'ont pas pu être chargés.");
        await page.unroute("**/api/exoplanets?**");
        await page.getByRole("button", { name: "Réessayer" }).click();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(page.getByText(/exoplanètes · page 1/)).toBeVisible();
    });

    test("ouvre une fiche depuis les résultats", async ({ page }) => {
        await visit(page, "/catalogue?q=51 peg");
        await page.getByRole("link", { name: "51 Peg b" }).first().click();
        await expect(page).toHaveURL(/\/exoplanetes\/51-peg-b$/);
    });
});

test.describe("comparateur", () => {
    test("ajoute des planètes depuis leur fiche puis les compare", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/exoplanetes/trappist-1-e");
        await page.getByRole("button", { name: "Ajouter à la comparaison" }).click();
        await expect(page.getByRole("status").filter({ hasText: "TRAPPIST-1 e a été ajoutée à la comparaison." })).toBeVisible();
        await visit(page, "/exoplanetes/51-peg-b");
        await page.getByRole("button", { name: "Ajouter à la comparaison" }).click();
        await page.getByRole("link", { name: "Voir la comparaison (2/4)" }).click();
        await expect(page).toHaveURL(/\/comparer\?planetes=trappist-1-e%2C51-peg-b$/);
        await expect(page.getByRole("columnheader", { name: /TRAPPIST-1 e/ })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: /51 Peg b/ })).toBeVisible();
        expect(errors).toEqual([]);
    });

    test("restaure la sélection enregistrée et la partage par l'URL", async ({ page }) => {
        await visit(page, "/comparer?planetes=k2-18-b");
        await page.getByRole("combobox", { name: "Ajouter une planète à la comparaison" }).fill("proxima cen b");
        await page.getByRole("option", { name: /Proxima Cen b/ }).click();
        await expect(page).toHaveURL(/planetes=k2-18-b%2Cproxima-cen-b/);
        await visit(page, "/comparer");
        await expect(page).toHaveURL(/planetes=k2-18-b%2Cproxima-cen-b/);
        await page.getByRole("button", { name: "Retirer K2-18 b de la comparaison" }).click();
        await expect(page).toHaveURL(/planetes=proxima-cen-b$/);
    });

    test("affiche les graphiques à la demande", async ({ page }) => {
        const errors = trackErrors(page);
        await visit(page, "/comparer?planetes=trappist-1-e,51-peg-b");
        await page.getByRole("tab", { name: "Masse et rayon" }).click();
        await expect(page.getByRole("img", { name: /Nuage de points masse-rayon/ })).toBeVisible();
        await expect(page.locator(".recharts-surface").first()).toBeVisible();
        expect(errors).toEqual([]);
    });

    test("limite la comparaison à quatre planètes", async ({ page }) => {
        await visit(page, "/comparer?planetes=trappist-1-e,51-peg-b,k2-18-b,proxima-cen-b,hd-209458-b");
        await expect(page.getByText("Une partie de l'adresse a été ignorée")).toBeVisible();
        await visit(page, "/comparer?planetes=trappist-1-e,51-peg-b,k2-18-b,proxima-cen-b");
        await expect(page.getByRole("combobox", { name: "Ajouter une planète à la comparaison" })).toBeDisabled();
    });
});
