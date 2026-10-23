# Cheeko result page

Build a mobile-first, playful, accessible single page in the supplied empty workspace. Fetch only `id` and `img_url` from `public."cheeko-game"` using the supplied project URL and public anon key. IDs are internal only and never rendered in the interface.

Load exactly one most recent image automatically at entry, ordered by `created_at` with `id` as a tiebreaker. Use Supabase Realtime events and a five-second polling fallback while visible. Show honest loading, empty, failure and reconnection states; recover automatically. Every visitor sees the latest result. Keep the complete portrait image visible without cropping. Use the Cheeko brand palette with Gabarito headings and Hanken Grotesk body text.

Offer original image download through a compact icon, a large animated Instagram action labeled "Share my moment", and a local love reaction with brief celebratory feedback. The interface never requires refresh to obtain an image. Account for image loading failures and unavailable downloads. Instagram opens the configured profile or Instagram home; posting is done by the visitor. There are no gallery, ID, name, copy-link, ribbon or footer controls.

Match the supplied logo and the theme from cheekoai.in: Gabarito display type, Hanken Grotesk body type, warm ink, cream backgrounds, orange and sunflower yellow, rounded buttons, soft shadows and warm hover effects.

Use Vite, TypeScript, native fetch and CSS with a small icon library. Keep data access, downloads and interface separate. Credentials live in ignored local environment configuration. Provide example variables, hosting instructions and optional read-only RLS setup SQL. Do not deploy; the user will host later.

Verify data access and error handling with unit tests, then verify the real connected page and mobile layout with browser checks and a production build.
