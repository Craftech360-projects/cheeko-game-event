export async function fetchImageDownload(
  url: string,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok)
    throw new Error("Your image could not download. Please try again.");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size === 0) {
    throw new Error("The download did not contain an image.");
  }
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
  };
  const extension = extensions[blob.type.split(";")[0]] ?? "img";
  return { blob, filename: `my-cheeko-moment.${extension}` };
}
