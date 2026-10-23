import { describe, expect, it, vi } from "vitest";
import { fetchImageDownload } from "../../src/download";

describe("original image download", () => {
  it("returns original image bytes and a MIME-appropriate filename", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response("original-bytes", {
        headers: { "Content-Type": "image/jpeg" },
      }),
    );
    const file = await fetchImageDownload(
      "https://example.com/result.jpg",
      request,
    );
    expect(await file.blob.text()).toBe("original-bytes");
    expect(file.filename).toBe("my-cheeko-moment.jpg");
  });

  it("rejects failed downloads and non-image content", async () => {
    await expect(
      fetchImageDownload(
        "https://example.com/result.jpg",
        vi.fn().mockResolvedValue(new Response("not found", { status: 404 })),
      ),
    ).rejects.toThrow("download");
    await expect(
      fetchImageDownload(
        "https://example.com/result.jpg",
        vi
          .fn()
          .mockResolvedValue(
            new Response("<html>error</html>", {
              headers: { "Content-Type": "text/html" },
            }),
          ),
      ),
    ).rejects.toThrow("image");
  });
});
