import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { site } from "./src/data/site";

const requestBodySizeLimit = 1024;

export default defineConfig({
    site: site.url,
    adapter: node({ mode: "standalone", bodySizeLimit: requestBodySizeLimit }),
    trailingSlash: "never",
    compressHTML: true,
    build: {
        format: "file"
    },
    vite: {
        plugins: [
            tailwindcss(),
            {
                name: "bundle-server-dependencies",
                apply: "build",
                config: () => ({ ssr: { noExternal: true } })
            }
        ]
    },
    markdown: {
        syntaxHighlight: false
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover"
    },
    integrations: [react()],
    security: {
        allowedDomains: [{ hostname: new URL(site.url).hostname, protocol: "https" }],
        csp: {
            directives: [
                "default-src 'self'",
                "img-src 'self' data:",
                "connect-src 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests"
            ]
        }
    },
    fonts: [
        {
            provider: fontProviders.fontsource(),
            name: "Signika",
            cssVariable: "--font-signika",
            weights: ["500 700"],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["sans-serif"]
        },
        {
            provider: fontProviders.fontsource(),
            name: "Heebo",
            cssVariable: "--font-heebo",
            weights: ["400 600"],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["sans-serif"]
        }
    ]
});
