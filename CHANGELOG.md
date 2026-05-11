# Sprocket Fiber Map — Changelog

## 2026-05-11

### Auth / Access Control

- **Auth endpoint moved to willgibson.com** — `API_BASE` in `auth.js` changed from `https://db01.tailfca0e2.ts.net` to `https://willgibson.com`. Token validation (`/api/me`) now goes through the willgibson.com access control system, which is backed by Vercel Edge Config. Approving or revoking access at willgibson.com now applies to this app as well.

- **Seamless portal sign-in** — When users arrive from the willgibson.com portal, their Google credential is passed via URL hash (`#token=...&ref=willgibson`) and automatically stored. No second Google prompt is required.

- No changes to map data, KMZ loading, or the HTML file contents.
