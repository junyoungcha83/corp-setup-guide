# Architecture and migration boundary

- Static UI: root `index.html`, `assets/`, `data/`, `manifest.webmanifest`, `sw.js`.
- API: `api/src/index.js`, configured by `api/wrangler.toml`; deploy from `api/` (`cd api && npm run deploy`). The Worker `name` (`corp-guide-api`) and KV binding (`CORP_GUIDE`) are unchanged by the directory rename.
- Public root paths and the Worker name are compatibility contracts.

Keep the root static surface unchanged. Reorganize only internal code, using compatibility scripts and `wrangler deploy --dry-run` before deployment. Agent tools should call validated data read/write operations rather than editing static files directly.
