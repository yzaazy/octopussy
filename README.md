# Octopussy brick tracker

A single-page website to track which LEGO parts of the Octopussy model you already own. Part lists come from the three BrickLink wanted-list XML files in the repo root; part images are downloaded from BrickLink at build time and served by the site itself. Progress is stored in a shared `progress.json` on the server so it syncs across devices.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321 (progress falls back to localStorage in dev)
npm run build     # outputs static site to dist/
npm run preview   # serve the built site locally
```

`npm run build` first runs `scripts/fetch-images.mjs`, which downloads any missing part images into `public/parts/` (~12 MB, skips ones already downloaded). If a download fails, the page falls back to BrickLink's CDN for that part.

Updated a wanted list on BrickLink? Just overwrite the XML file in the repo root and rebuild.

## Deploy on TrueNAS (Custom App pulling from GHCR)

Every push to `main` triggers GitHub Actions (`.github/workflows/docker.yml`) to build the site and publish it as `ghcr.io/yzaazy/octopussy:latest` — an nginx image with the site baked in.

One-time setup:

1. Make the GHCR package public so the NAS can pull it anonymously: github.com → your profile → **Packages** → `octopussy` → **Package settings** → Change visibility → Public.
2. Create a dataset for the progress file, e.g. `/mnt/<pool>/lego-tracker`, and make it writable by the container's nginx user (uid 101): `chown 101:101 /mnt/<pool>/lego-tracker`.
3. TrueNAS UI → Apps → **Custom App**:
   - Image repository: `ghcr.io/yzaazy/octopussy`, tag `latest`
   - Port: e.g. host `8080` → container `80`
   - Host path mount: `/mnt/<pool>/lego-tracker` → `/data` (this is where `progress.json` lives, so it survives image updates)
4. Expose it through Pangolin — authentication lives there; the app itself has none.

**Updating the site:** push to `main`, wait for the Action to finish, then hit the app's update button in the TrueNAS Apps screen to pull the new image. Your progress is safe in `/data`; back it up anytime with the Export button in the site footer.
