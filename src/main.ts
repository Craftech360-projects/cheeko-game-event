import "./styles.css";
import {
  createIcons,
  ArrowUpRight,
  MoveUpRight,
  Camera,
  Heart,
  Sparkles,
  RotateCw,
  Expand,
  Download,
  ArrowRight,
  Check,
  X,
} from "lucide";
import { fetchLatestImage, type ImageResult } from "./gallery";
import { fetchImageDownload } from "./download";
import { startLiveUpdates } from "./live";

// Lucide does not include brand marks; use the Instagram camera mark separately.
document.querySelectorAll<HTMLElement>("[data-icon]").forEach((node) => {
  if (node.dataset.icon === "Instagram") {
    node.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  } else {
    node.setAttribute("data-lucide", node.dataset.icon!);
  }
});
createIcons({
  icons: {
    ArrowUpRight,
    MoveUpRight,
    Camera,
    Heart,
    Sparkles,
    RotateCw,
    Expand,
    Download,
    ArrowRight,
    Check,
    X,
  },
  attrs: { "aria-hidden": "true" },
});

const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const image = element<HTMLImageElement>("result-image");
const stage = element<HTMLDivElement>("image-stage");
const imageState = element<HTMLDivElement>("image-state");
const stateTitle = element<HTMLHeadingElement>("state-title");
const stateDescription = element<HTMLParagraphElement>("state-description");
const retryButton = element<HTMLButtonElement>("retry-button");
const downloadButton = element<HTMLButtonElement>("download-button");
const downloadLabel = element<HTMLSpanElement>("download-label");
const loveButton = element<HTMLButtonElement>("love-button");
const shareButton = element<HTMLAnchorElement>("share-button");
const expandButton = element<HTMLButtonElement>("expand-button");
const connectionLabel = element<HTMLSpanElement>("connection-label");
const toast = element<HTMLDivElement>("toast");
const helpDialog = element<HTMLDialogElement>("help-dialog");
const lightbox = element<HTMLDialogElement>("lightbox");
const lightboxImage = element<HTMLImageElement>("lightbox-image");
const config = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
  key: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
};
let current: ImageResult | null = null;
let fetching = false;
let queued = false;
let downloading = false;
let pendingImageKey: string | null = null;
let loadVersion = 0;
let toastTimer: ReturnType<typeof setTimeout>;

function notify(message: string) {
  clearTimeout(toastTimer);
  element<HTMLSpanElement>("toast-message").textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}

function setConnection(connected: boolean) {
  connectionLabel.textContent = connected
    ? "LIVE FROM THE GAME"
    : "RECONNECTING AUTOMATICALLY";
  connectionLabel.parentElement!.dataset.connection = connected
    ? "live"
    : "retrying";
}

function setActionsEnabled(enabled: boolean) {
  downloadButton.disabled = !enabled || downloading;
  loveButton.disabled = !enabled;
  shareButton.setAttribute("aria-disabled", String(!enabled));
  shareButton.tabIndex = enabled ? 0 : -1;
  expandButton.hidden = !enabled;
}

function showState(
  kind: "loading" | "empty" | "error",
  title: string,
  description: string,
) {
  image.hidden = true;
  imageState.hidden = false;
  imageState.className = `image-state is-${kind}`;
  stage.setAttribute("aria-busy", String(kind === "loading"));
  stateTitle.textContent = title;
  stateDescription.textContent = description;
  retryButton.hidden = kind !== "error";
  setActionsEnabled(false);
}

function updateLove() {
  let loved = false;
  try {
    loved =
      current !== null &&
      localStorage.getItem(`cheeko-loved-${current.id}`) === "yes";
  } catch {
    /* Optional local reaction. */
  }
  loveButton.setAttribute("aria-pressed", String(loved));
  loveButton.setAttribute(
    "aria-label",
    loved ? "Remove love from this image" : "Love this image",
  );
}

function showImage(result: ImageResult) {
  const key = `${result.id}:${result.img_url}`;
  if (pendingImageKey === key) return;
  if (
    String(current?.id) === String(result.id) &&
    current?.img_url === result.img_url &&
    !image.hidden
  )
    return;
  const version = ++loadVersion;
  pendingImageKey = key;
  // Keep the previous image usable until its replacement has fully downloaded.
  if (!current || image.hidden)
    showState(
      "loading",
      "Getting your moment ready…",
      "A little patience. A lot of personality.",
    );
  const preview = new Image();
  preview.onload = () => {
    if (version !== loadVersion) return;
    const isNew = current !== null;
    current = result;
    pendingImageKey = null;
    image.src = result.img_url;
    image.hidden = false;
    imageState.hidden = true;
    stage.setAttribute("aria-busy", "false");
    setActionsEnabled(true);
    updateLove();
    if (isNew) notify("A fresh Cheeko moment just dropped!");
  };
  preview.onerror = () => {
    if (version !== loadVersion) return;
    pendingImageKey = null;
    if (!current)
      showState(
        "error",
        "This moment is feeling shy.",
        "The image could not load. We’ll keep trying automatically.",
      );
    setConnection(false);
  };
  preview.src = result.img_url;
}

async function refreshLatest() {
  if (fetching) {
    queued = true;
    return;
  }
  fetching = true;
  try {
    const result = await fetchLatestImage(config);
    setConnection(true);
    if (result) {
      showImage(result);
    } else {
      ++loadVersion;
      pendingImageKey = null;
      current = null;
      image.removeAttribute("src");
      showState(
        "empty",
        "The good stuff is coming.",
        "Your latest image will appear here automatically. No refresh needed.",
      );
    }
  } catch (error) {
    setConnection(false);
    if (!current)
      showState(
        "error",
        "A tiny plot twist.",
        error instanceof Error
          ? error.message
          : "We’re trying again automatically.",
      );
  } finally {
    fetching = false;
    if (queued) {
      queued = false;
      void refreshLatest();
    }
  }
}

retryButton.addEventListener("click", () => {
  void refreshLatest();
});

downloadButton.addEventListener("click", async () => {
  if (!current || downloading) return;
  const selected = current;
  downloading = true;
  downloadButton.disabled = true;
  downloadLabel.textContent = "Saving the good stuff…";
  try {
    const file = await fetchImageDownload(selected.img_url);
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    notify("Download started. Your camera roll says thanks.");
  } catch {
    lightboxImage.src = selected.img_url;
    lightbox.showModal();
    notify("Download unavailable. Press and hold the full image to save it.");
  } finally {
    downloading = false;
    downloadLabel.textContent = "Save image";
    downloadButton.disabled = Boolean(image.hidden);
  }
});

shareButton.addEventListener("click", (event) => {
  if (shareButton.getAttribute("aria-disabled") === "true")
    event.preventDefault();
});

loveButton.addEventListener("click", () => {
  if (!current) return;
  const loved = loveButton.getAttribute("aria-pressed") !== "true";
  try {
    localStorage.setItem(`cheeko-loved-${current.id}`, loved ? "yes" : "no");
  } catch {
    /* Reactions still work in memory. */
  }
  loveButton.setAttribute("aria-pressed", String(loved));
  loveButton.setAttribute(
    "aria-label",
    loved ? "Remove love from this image" : "Love this image",
  );
  if (!loved) return;
  notify("Excellent taste. Cheeko approves.");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = element<HTMLDivElement>("image-confetti");
  confetti.replaceChildren();
  for (let i = 0; i < 20; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-bit";
    const angle = (i / 20) * Math.PI * 2;
    piece.style.setProperty(
      "--x",
      `${Math.cos(angle) * (70 + Math.random() * 90)}px`,
    );
    piece.style.setProperty(
      "--y",
      `${Math.sin(angle) * (70 + Math.random() * 140)}px`,
    );
    piece.style.setProperty("--rotation", `${Math.random() * 600}deg`);
    piece.style.background = ["#f0521d", "#ffc81a", "#e5312b", "#fff4e3"][
      i % 4
    ];
    confetti.append(piece);
  }
  setTimeout(() => confetti.replaceChildren(), 1100);
});

document
  .querySelectorAll<HTMLButtonElement>("[data-open-help]")
  .forEach((button) => {
    button.addEventListener("click", () => helpDialog.showModal());
  });
document
  .querySelectorAll<HTMLButtonElement>("[data-close-help]")
  .forEach((button) => {
    button.addEventListener("click", () => helpDialog.close());
  });
expandButton.addEventListener("click", () => {
  if (!current) return;
  lightboxImage.src = current.img_url;
  lightbox.showModal();
});
element<HTMLButtonElement>("close-lightbox").addEventListener("click", () =>
  lightbox.close(),
);
[helpDialog, lightbox].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
});

void refreshLatest();
let stopLive = startLiveUpdates(config, () => {
  void refreshLatest();
});
window.addEventListener("pagehide", () => stopLive());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    stopLive = startLiveUpdates(config, () => {
      void refreshLatest();
    });
    void refreshLatest();
  }
});
