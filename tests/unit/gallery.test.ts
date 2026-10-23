import { describe, expect, it, vi } from "vitest";
import { fetchLatestImage, validateImageUrl } from "../../src/gallery";

const config = { url: "https://example.supabase.co", key: "public-test-key" };
const row = { id: 5, img_url: "https://example.supabase.co/photo.jpg" };

describe("latest Supabase image", () => {
  it("requests only id and img_url and exactly one latest result", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([row])));
    expect(await fetchLatestImage(config, request)).toEqual(row);
    const url = new URL(request.mock.calls[0][0]);
    expect(url.pathname).toBe("/rest/v1/cheeko-game");
    expect(url.searchParams.get("select")).toBe("id,img_url");
    expect(url.searchParams.get("order")).toBe("created_at.desc,id.desc");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(request.mock.calls[0][1].headers.apikey).toBe(config.key);
    expect(request.mock.calls[0][1].cache).toBe("no-store");
  });

  it("supports publishable keys without treating them as JWTs", async () => {
    const request = vi.fn().mockResolvedValue(new Response("[]"));
    await fetchLatestImage({ ...config, key: "sb_publishable_test" }, request);
    expect(request.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("does not display unsafe or missing image URLs", async () => {
    for (const img_url of [
      null,
      "",
      "javascript:alert(1)",
      "data:image/png;base64,x",
    ]) {
      const request = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify([{ id: 5, img_url }])));
      expect(await fetchLatestImage(config, request)).toBeNull();
    }
    expect(validateImageUrl(" https://example.com/a.jpg ")).toBe(
      "https://example.com/a.jpg",
    );
  });

  it("reports an empty table without inventing a result", async () => {
    expect(
      await fetchLatestImage(
        config,
        vi.fn().mockResolvedValue(new Response("[]")),
      ),
    ).toBeNull();
  });

  it("surfaces an access error when Supabase denies the query", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response('{"message":"permission denied"}', { status: 403 }),
      );
    await expect(fetchLatestImage(config, request)).rejects.toThrow("access");
  });

  it("fails clearly when public configuration is missing", async () => {
    await expect(fetchLatestImage({ url: "", key: "" })).rejects.toThrow(
      "configured",
    );
  });

  it("reports network failures without exposing request credentials", async () => {
    const request = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchLatestImage(config, request)).rejects.toThrow(
      "connection",
    );
  });
});
