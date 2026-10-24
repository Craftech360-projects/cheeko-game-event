# Cheeko

A mobile-first, playful page that automatically shows the latest image from `public."cheeko-game"`.

The visual theme follows [cheekoai.in](https://www.cheekoai.in/): Gabarito headings, Hanken Grotesk body type, cream backgrounds, orange `#F0521D`, yellow `#FFC81A`, warm ink `#231A10`, rounded controls and soft shadows. Fonts are served locally. The supplied logo appears in the header, and the animated Instagram action leads the page beside a compact save icon.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

The supplied project URL and public anon key are already configured in the ignored `.env.local` file. To configure a fresh checkout, copy `.env.example` to `.env.local` and supply the public key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Only public publishable or legacy anon keys belong in these variables. Vite embeds `VITE_` values into the browser bundle. The page does not require a service-role key, database password, sign-in, or a server.

## Behavior

- Immediately requests only `id,img_url`, ordered by `created_at DESC, id DESC`, limited to one row with a nonempty image URL.
- Displays the newest available result and uses the ID internally. No IDs, names, timestamps, old results, or gallery controls appear on the page.
- Listens for Supabase Realtime changes and also fetches every **5 seconds** while the tab is visible. Changes appear immediately through Realtime when enabled, or at the next successful five-second check. The page also checks when the visitor returns to the tab or reconnects.
- Preloads a replacement before switching, keeping the previous image usable during downloads and temporary connection failures.
- Handles an empty table, a slow connection, failed image loads and automatic recovery without requiring a browser refresh.
- Downloads the **original image bytes**, retaining the image format. If a third-party image host blocks browser downloads, the full image opens for manual saving.
- The animated **Share my moment** button opens the supplied Cheeko Instagram post. The header Instagram icon opens the Cheeko AI profile and is visible on mobile. These destinations are defined independently in `index.html`. A compact download icon saves the current result image.
- Love reactions are saved only in that browser. No data is written to Supabase.

## Supabase configuration

The supplied table is already readable with the provided anon key. The application never changes your schema, rows, permissions, or Realtime publication.

For instant database events, enable `cheeko-game` in **Database → Publications → supabase_realtime** in your Supabase dashboard. The five-second fallback works without this step. Optional SQL is included in `supabase/setup.sql` for an owner to review and run if needed; it is not applied automatically.

The image URLs must point to publicly readable image files. A public Supabase Storage bucket already works with original image downloads. For other hosts, allow cross-origin image fetching to support direct downloads.

## Host later

```sh
npm run build
npm run preview
```

Upload **the contents of `dist/`** to a static host. There is no backend process to run.

For a Git-connected host such as Netlify, Vercel, or Cloudflare Pages:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20.19+ or 22.12+ |
| Environment variables | The two `VITE_` variables above |

Set environment variables **before building**. A locally built `dist/` already contains the configuration from `.env.local`. Rebuild when changing the project, API key, or Instagram links. For hosting under a subdirectory, run `npm run build -- --base=/your-subdirectory/`.

## Verification

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit tests cover the latest-only query, public-key compatibility, invalid URLs, failures and original image downloads. Browser tests cover the actual Supabase connection, automatic updates without page navigation, empty/error recovery, mobile widths, image actions and automated accessibility checks. Mocked update tests never insert or modify database rows.

## Files

- `index.html`: semantic page structure and dialogs; the supplied `public/logo.png` appears in the header.
- `src/styles.css`: mobile-first layout and motion, with reduced-motion support.
- `src/main.ts`: image display and user interactions.
- `src/gallery.ts`: the read-only, latest-image query.
- `src/live.ts`: Realtime subscription, fallback checks, and lifecycle cleanup.
- `src/download.ts`: original-file downloads.

References: [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes), [public API keys](https://supabase.com/docs/guides/api/api-keys), [Vite environment variables](https://vite.dev/guide/env-and-mode), [static deployment](https://vite.dev/guide/static-deploy.html).
