# Cheeko Page Implementation Plan

> Execute inline in the current authorized workspace. Follow the test-driven-development and verification-before-completion skills for functional work.

**Goal:** A mobile-first game-result page that automatically shows Supabase images, supports saving and sharing, and can be statically hosted.

**Architecture:** Native TypeScript modules separate REST data access and file download from the page. Vite produces a static `dist/` folder. Only the public Supabase key is used, with no database writes.

**Tech stack:** Vite, TypeScript, native CSS, Lucide, Vitest, Playwright.

- [x] Scaffold package scripts, strict type checking, environment examples, fonts and icons.
- [x] Write and run failing tests for the latest-image two-column Supabase query, invalid image URLs, empty data, failures and original-file downloads.
- [x] Implement `src/gallery.ts` and `src/download.ts`; confirm unit tests pass.
- [x] Build `index.html`, `src/main.ts` and `src/styles.css`: mobile-first layout, uncropped image, loading/error/retry states, a compact download icon, a primary animated Instagram action and reactions.
- [x] Subscribe to Supabase Realtime and poll every five seconds while visible. Show only the latest image; recover automatically when a result is not yet available. Preload replacements before switching.
- [x] Write the README and optional read-only Supabase policy setup; document hosting and Instagram configuration.
- [x] Build production output and run unit and browser checks for mobile/desktop, automatic loading, download, navigation and failure states. Inspect screenshots and fix observed problems.

## Verified outcome

Nine unit tests and seven browser tests pass. The live Supabase subscription returned `ok`; the actual latest image and original JPEG download were verified. Screenshots were inspected at 390px and 1440px. Layout checks cover widths from 320px to 1440px; automated WCAG checks pass. The production build succeeds and writes `dist/`. No database rows or schema were changed.
