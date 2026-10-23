export interface ImageResult {
  id: number | string;
  img_url: string;
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export function validateImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export async function fetchLatestImage(
  config: SupabaseConfig,
  fetcher: typeof fetch = fetch,
): Promise<ImageResult | null> {
  if (!config.url || !config.key)
    throw new Error("The image connection is not configured yet.");
  const url = new URL("/rest/v1/cheeko-game", config.url);
  url.searchParams.set("select", "id,img_url");
  url.searchParams.set("and", "(img_url.not.is.null,img_url.neq.)");
  url.searchParams.set("order", "created_at.desc,id.desc");
  url.searchParams.set("limit", "1");
  const headers: Record<string, string> = { apikey: config.key };
  if (!config.key.startsWith("sb_publishable_"))
    headers.Authorization = `Bearer ${config.key}`;
  let response: Response;
  try {
    response = await fetcher(url.href, {
      headers,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "The image connection took a little detour. We’re trying again automatically.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Image access is unavailable. Please check the public table permissions.",
      );
    }
    throw new Error(
      "We could not load the image right now. We’re trying again automatically.",
    );
  }
  const payload: unknown = await response.json();
  if (!Array.isArray(payload))
    throw new Error("The image result could not be read.");
  const row = payload[0];
  if (!row) return null;
  const imageUrl = validateImageUrl(row.img_url);
  if (!imageUrl || !/^(0|[1-9]\d*)$/.test(String(row.id))) return null;
  return { id: row.id, img_url: imageUrl };
}
