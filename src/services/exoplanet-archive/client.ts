import { createArchiveRequestUrl } from "@/services/exoplanet-archive/query";

export type Fetcher = (input: URL, init: RequestInit) => Promise<Response>;

export const archiveRequestLimits = {
    timeoutMs: 90_000,
    maxResponseBytes: 32 * 1024 * 1024
} as const;

export const allowedArchiveHosts: ReadonlySet<string> = new Set(["exoplanetarchive.ipac.caltech.edu"]);

export class ArchiveUnavailableError extends Error {
    override readonly name = "ArchiveUnavailableError";
}

async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > maxBytes) throw new ArchiveUnavailableError("Réponse de l'archive trop volumineuse.");
    if (!response.body) throw new ArchiveUnavailableError("Réponse de l'archive vide.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let text = "";
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
            await reader.cancel();
            throw new ArchiveUnavailableError("Réponse de l'archive trop volumineuse.");
        }
        text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
}

export async function fetchArchiveRows(fetcher: Fetcher = fetch): Promise<unknown> {
    const url = createArchiveRequestUrl();
    if (url.protocol !== "https:" || !allowedArchiveHosts.has(url.hostname)) {
        throw new ArchiveUnavailableError("Hôte de l'archive non autorisé.");
    }

    let response: Response;
    try {
        response = await fetcher(url, {
            headers: { Accept: "application/json" },
            redirect: "error",
            signal: AbortSignal.timeout(archiveRequestLimits.timeoutMs)
        });
    } catch (error) {
        throw new ArchiveUnavailableError("L'archive est injoignable.", { cause: error });
    }

    if (!response.ok) throw new ArchiveUnavailableError(`L'archive a répondu HTTP ${response.status}.`);
    if (!response.headers.get("content-type")?.includes("json")) {
        throw new ArchiveUnavailableError("L'archive n'a pas renvoyé de JSON.");
    }

    const text = await readLimitedText(response, archiveRequestLimits.maxResponseBytes);
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new ArchiveUnavailableError("La réponse de l'archive n'est pas un JSON valide.", { cause: error });
    }
}
