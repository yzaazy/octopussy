# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static Astro site that tracks which LEGO parts of the "Octopussy" model the user owns. The three BrickLink wanted-list XML files in the repo root (`Octopussy.xml`, `backwall octopussy.xml`, `Octopussy power.xml`) are the source of truth — they are parsed at build time, never modified by the app, and can be replaced with fresh BrickLink exports at any time.

## Commands

```sh
npm run dev           # dev server at http://localhost:4321
npm run build         # static build to dist/ (prebuild downloads missing part images)
npm run preview       # serve the built site
npm run fetch-images  # download part images to public/parts/ (idempotent, skips existing)
```

There are no tests or linters configured.

## Architecture

- `src/lib/parseWantedList.ts` — parses a BrickLink wanted-list XML at build time into `{ key, partId, colorId, qtyNeeded }`, merging duplicate part+color entries. Item key format: `${partId}-${colorId}`; the client prefixes it with the section slug (`octopussy:3003-3`) because the same part can be needed by more than one list.
- `src/lib/colors.ts` — static BrickLink color ID → name/hex map covering only the colors used in the XMLs. If a new XML introduces an unknown color ID, add it here (values from bricklink.com/catalogColors.asp).
- `src/pages/index.astro` — the entire UI: build-time rendered part cards plus one vanilla-TS client script for steppers, progress bars, search/filter, and persistence. No UI framework.
- `scripts/fetch-images.mjs` (run by `prebuild`) downloads part images from BrickLink's CDN (`https://img.bricklink.com/ItemImage/PN/{colorId}/{partId}.png`) into `public/parts/{colorId}-{partId}.png`, which is gitignored. Cards use the local image with a two-step `onerror` fallback: CDN color image, then colorless `PL/{partId}.png`. Node 24+ is assumed (the script imports the `.ts` parser directly via type stripping).

### Persistence model

Owned quantities live in a single flat object `{ [sectionKey]: ownedQty }`:
- Loaded from `GET progress.json` (same origin); falls back to `localStorage` if that fails (which is the normal case in `npm run dev`).
- Saved via debounced `PUT progress.json` — in production nginx's dav module writes the file (see `deploy/nginx.conf`); `localStorage` is always mirrored as backup. The sync indicator in the header reflects which mode is active.
- `progress.json` is intentionally NOT part of the build output: it is created on the server by the first PUT, so re-deploying `dist/` never clobbers progress.

## Deployment

TrueNAS Custom App running stock `nginx:alpine`: the `dist/` output and `deploy/nginx.conf` are copied to a dataset and mounted into the container (site → `/usr/share/nginx/html`, conf → `/etc/nginx/conf.d/default.conf`). The site dir must be writable by uid 101 so nginx can PUT `progress.json`. Auth is handled by Pangolin in front — nothing in this app. Full steps in README.md.
