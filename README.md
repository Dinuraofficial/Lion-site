# Leo Lions Club of Alawwa Nexus

A cinematic, scroll-driven website for the **Leo Lions Club of Alawwa Nexus**, District 306 D11, with a Cloudflare-powered club dashboard.

- **Website:** [lion-site.smartstack-ai-2026.workers.dev](https://lion-site.smartstack-ai-2026.workers.dev/)
- **Repository:** [Dinuraofficial/Lion-site](https://github.com/Dinuraofficial/Lion-site)
- **Restore point before the crawler:** [`restore-before-crawler-20261104`](https://github.com/Dinuraofficial/Lion-site/tree/restore-before-crawler-20261104)

## Website features

- Scroll-driven 3D monument, animated background and mobile-friendly chapter navigation.
- Membership and partnership inquiry forms, plus a showcase for published club leaders, projects and links.
- An optional **crawler** that an authorized officer can enable or disable site-wide. It is off until enabled. When enabled, three smaller spiders hatch automatically at random intervals and grow while remaining smaller than the parent.
- A draggable, fading crawler settings button lets visitors hide or show the crawler and babies, and change color, behavior, size, colorful word highlights, trails, sound and whether the babies follow. The parent’s feet briefly highlight active chapter text when they land on it. Sound is enabled by default but begins only after a user interaction, subject to browser autoplay rules. These preferences are local to the visitor's browser; visitors cannot change the site-wide switch. The crawler defaults to the faster Daddy long-legs preset with Free gait and the geometric reference body; Classic, Tarantula and Jumper presets are also available. The crawler does not run when the browser requests reduced motion.

## Officer dashboard

Use **Officer Login** on the website, or `Ctrl + Shift + P` where supported by the browser. Sign in with the email and password of an authorized Firebase user. Officers can manage inquiries, publish club content and use **Website crawler** to change the site-wide setting. The on/off setting is stored in D1; open pages check periodically (about every 30 seconds) or can be reloaded.

The Worker verifies Firebase ID tokens and an explicit UID allowlist for admin API requests. The shortcut and public login screen are not security controls. Keep officer passwords and service-account credentials private. See [backend/README.md](backend/README.md) for security and setup details.

## Technology and deployment

The Cloudflare deployment uses:

- `index.html` — main site and embedded club imagery.
- `public/crawler-overlay.js` — optional crawler overlay.
- `public/admin/index.html` — officer dashboard.
- `backend/worker.mjs` — Worker API and authorization.
- Cloudflare D1 — inquiries, club content and crawler setting.
- Firebase Authentication — officer sign-in.
- Cloudflare Turnstile — inquiry spam verification.

Cloudflare Workers Builds is connected to the `main` branch. The build command is `node backend/build.mjs`, and the deploy command is `npx wrangler deploy`. The build produces `build/` from the site and public assets; `wrangler.jsonc` defines Worker and D1 bindings. Before changing deployment settings, check the existing Cloudflare configuration and test in staging.

The inquiry form sends to D1 only when Turnstile is configured correctly, including the `TURNSTILE_SECRET_KEY` **runtime secret**. Otherwise it retains the copy-and-share fallback. No email notifications or image uploads are implemented. A plain static deployment such as GitHub Pages does not run the Worker API or officer dashboard.

## Restore

The tag above points to the GitHub version immediately before the crawler update. To undo the crawler commit while preserving later history, an authorized maintainer can revert commit `a24a931` through GitHub or Git. Review later changes and deployment settings before restoring; a Git restore does **not** restore D1 database data. Maintain separate D1 backups.
