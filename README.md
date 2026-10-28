# Leo Lions Club of Alawwa Nexus — Official Website

Cinematic, scroll-driven 3D WebGL website for the **Leo Lions Club of Alawwa Nexus** (*Lions International District 306 D11 · Multiple District 306 Sri Lanka*).

## Features
- **Single Self-Contained `index.html`**: Zero build step, no bundler required, all club emblems and editorial visuals embedded directly as optimized WebP data URIs.
- **3D WebGL "Sovereign Nexus" Monument (`Three.js r0.160`)**: Parametric 3-lobed champagne-bronze Triquetra interwoven in 3D space with a Royal Amethyst circle, floating faceted crystals, celestial astrolabe rings, and a double-sided relief-mapped Alawwa Nexus emblem seal.
- **Scroll-Driven 360° Camera Orbit & GLSL Liquid Silk Shader**: Morphs smoothly from Royal Amethyst & Sovereign Gold to Imperial Violet and Lions International Sapphire Blue across `650vh`.
- **Inquiry builder and club showcase**: Explore the club’s service themes and prepare a membership or partnership message. The site does not send inquiries; add a verified contact channel or backend before accepting submissions. The showcase intentionally omits unverified leadership names, project results and social links.
- **Responsive navigation**: Dedicated mobile framing and chapter controls, shortened scroll distance, reduced-motion styling, and a brief crest arrival.

## Live Deployment (GitHub Pages)
1. Push this repository to GitHub (`main` branch).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** → `main` / `/ (root)` and click **Save**.

## Cloudflare backend (prepared, not deployed)
A Worker + D1 backend and officer dashboard are included in `backend/` and `public/admin/`. See [backend/README.md](backend/README.md) for prerequisites, security configuration, deployment and limitations. The current GitHub Pages site continues to use the copy-and-share inquiry form until the backend is configured on Cloudflare.
