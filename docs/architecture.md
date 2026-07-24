# Architecture and migration boundary

- Static UI: root `index.html`, `assets/`, `data/`, `manifest.webmanifest`, `sw.js`.
- API: `worker/src/index.js`, configured by `worker/wrangler.toml`; deploy from `worker/`.
- Public root paths and the Worker name are compatibility contracts.

Keep the root static surface unchanged. Reorganize only internal code, using compatibility scripts and `wrangler deploy --dry-run` before deployment. Agent tools should call validated data read/write operations rather than editing static files directly.
