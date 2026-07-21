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

## Deploy on TrueNAS (Custom App, stock nginx)

1. `npm run build`
2. Copy the contents of `dist/` and `deploy/nginx.conf` to a dataset, e.g. `/mnt/<pool>/apps/lego-tracker/site` and `/mnt/<pool>/apps/lego-tracker/nginx.conf`.
3. Make the site directory writable by the container's nginx user (uid 101), so it can write `progress.json`:
   `chown -R 101:101 /mnt/<pool>/apps/lego-tracker/site` (or grant via ACL).
4. TrueNAS UI → Apps → **Custom App**:
   - Image: `nginx`, tag `alpine`
   - Port: e.g. host `8080` → container `80`
   - Host path mounts:
     - `/mnt/<pool>/apps/lego-tracker/site` → `/usr/share/nginx/html`
     - `/mnt/<pool>/apps/lego-tracker/nginx.conf` → `/etc/nginx/conf.d/default.conf` (read-only)
5. Expose it through Pangolin — authentication lives there; the app itself has none.

**Updating the site:** rebuild and re-copy `dist/` — but never delete `progress.json`, it holds your tracked progress. Back it up with the Export button in the site footer.
