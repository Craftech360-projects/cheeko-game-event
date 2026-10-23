import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const first = { id: 1001, img_url: "https://images.example/first.svg" };
const second = { id: 1002, img_url: "https://images.example/second.svg" };
const portrait =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#f1ad73"/><circle cx="540" cy="700" r="300" fill="#e95c34"/><text x="540" y="1200" text-anchor="middle" font-size="90" fill="white">WELL PLAYED!</text></svg>';

async function mockImages(page: Page) {
  await page.route("https://images.example/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: portrait }),
  );
  await page.routeWebSocket("**/realtime/**", (socket) => socket.close());
}

test("loads the actual latest database image immediately and renders mobile and desktop", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = page.waitForResponse((response) =>
    response.url().includes("/rest/v1/cheeko-game"),
  );
  await page.goto("/");
  const rows = await (await response).json();
  await expect(page.locator("#result-image")).toBeVisible();
  await expect(page.locator("#result-image")).toHaveAttribute(
    "src",
    rows[0].img_url,
  );
  await expect(page.locator("#download-button")).toBeEnabled();
  expect(
    await page
      .locator(".result-actions")
      .evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight),
  ).toBe(true);
  await expect(page.locator("body")).not.toContainText("ksa");
  expect(
    await page
      .locator("#result-image")
      .evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: "test-results/cheeko-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/cheeko-desktop.png",
    fullPage: true,
  });
  const realDownload = page.waitForEvent("download");
  await page.locator("#download-button").click();
  const downloaded = await realDownload;
  expect(downloaded.suggestedFilename()).toBe("my-cheeko-moment.jpg");
  expect(await downloaded.failure()).toBeNull();
  expect(errors).toEqual([]);
});

test("polls for only the latest image and replaces it without reloading the page", async ({
  page,
}) => {
  await mockImages(page);
  await page.clock.install();
  let latest = first;
  let documentLoads = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentLoads++;
  });
  await page.route("**/rest/v1/cheeko-game?**", (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("select")).toBe("id,img_url");
    expect(url.searchParams.get("limit")).toBe("1");
    return route.fulfill({ json: [latest] });
  });
  await page.goto("/");
  await expect(page.locator("#result-image")).toHaveAttribute(
    "src",
    first.img_url,
  );
  latest = second;
  await page.clock.runFor(5100);
  await expect(page.locator("#result-image")).toHaveAttribute(
    "src",
    second.img_url,
  );
  expect(documentLoads).toBe(1);
  await expect(page.locator("body")).not.toContainText("1001");
  await expect(page.locator("body")).not.toContainText("1002");
  await expect(page.getByRole("button", { name: "Next image" })).toHaveCount(0);
});

test("fills an initially empty page automatically when an image becomes available", async ({
  page,
}) => {
  await mockImages(page);
  await page.clock.install();
  let ready = false;
  await page.route("**/rest/v1/cheeko-game?**", (route) =>
    route.fulfill({ json: ready ? [first] : [] }),
  );
  await page.goto("/");
  await expect(page.locator("#state-title")).toHaveText(
    "The good stuff is coming.",
  );
  ready = true;
  await page.clock.runFor(5100);
  await expect(page.locator("#result-image")).toBeVisible();
  await expect(page.locator("#download-button")).toBeEnabled();
});

test("recovers from a failed connection automatically", async ({ page }) => {
  await mockImages(page);
  await page.clock.install();
  let available = false;
  await page.route("**/rest/v1/cheeko-game?**", (route) =>
    available
      ? route.fulfill({ json: [first] })
      : route.fulfill({ status: 503, json: { message: "unavailable" } }),
  );
  await page.goto("/");
  await expect(page.locator("#retry-button")).toBeVisible();
  available = true;
  await page.clock.runFor(5100);
  await expect(page.locator("#result-image")).toBeVisible();
  await expect(page.locator("#connection-label")).toHaveText(
    "LIVE FROM THE GAME",
  );
});

test("keeps a loaded image usable during a temporary connection failure", async ({
  page,
}) => {
  await mockImages(page);
  await page.clock.install();
  let available = true;
  await page.route("**/rest/v1/cheeko-game?**", (route) =>
    available
      ? route.fulfill({ json: [first] })
      : route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/");
  await expect(page.locator("#result-image")).toBeVisible();
  available = false;
  await page.clock.runFor(5100);
  await expect(page.locator("#connection-label")).toHaveText(
    "RECONNECTING AUTOMATICALLY",
  );
  await expect(page.locator("#result-image")).toBeVisible();
  await expect(page.locator("#download-button")).toBeEnabled();
});

test("downloads the original, reacts, opens the image and shows instructions", async ({
  page,
}) => {
  await mockImages(page);
  await page.route("**/rest/v1/cheeko-game?**", (route) =>
    route.fulfill({ json: [first] }),
  );
  await page.goto("/");
  await expect(page.locator("#result-image")).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#download-button").click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("my-cheeko-moment.svg");
  expect(await download.failure()).toBeNull();
  await page.locator("#love-button").click();
  await expect(page.locator("#love-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#expand-button").click();
  await expect(page.locator("#lightbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#lightbox")).not.toBeVisible();
  await page.getByRole("button", { name: "What's this?" }).click();
  await expect(page.locator("#help-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Got it. Let's flex." }).click();
  await expect(page.locator("#help-dialog")).not.toBeVisible();
  await expect(page.locator(".instagram-button")).toHaveAttribute(
    "href",
    "https://www.instagram.com/",
  );
});

test("fits narrow mobile screens and passes automated accessibility checks", async ({
  page,
}) => {
  await mockImages(page);
  await page.route("**/rest/v1/cheeko-game?**", (route) =>
    route.fulfill({ json: [first] }),
  );
  await page.goto("/");
  await expect(page.locator("#result-image")).toBeVisible();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
