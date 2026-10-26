import { defineMiddleware } from "astro:middleware";
import { site } from "@/data/site";

export const onRequest = defineMiddleware(async (_, next) => {
    const response = await next();
    response.headers.set("X-Robots-Tag", site.robots);
    return response;
});
