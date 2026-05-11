# sprocket-fiber-map

Sprocket Networks internal fiber map viewer, hosted at **https://sprocket-fiber-map.vercel.app**.

Leaflet-based HTML maps built by Sam (GIS) and gated behind Google sign-in. Anyone with a `@sprocketnetworks.com` or `@lasso.net` Google account can access; tokens are validated against the DB01 API.

---

## How auth works

Every page loads `auth.js`, which runs before the map renders:

1. **Token passthrough from willgibson.com** — the portal at willgibson.com links to maps with a URL hash: `#token=<google_id_token>&ref=willgibson`. `auth.js` reads the hash, stores the token in `localStorage` as `google_auth_token` (and the referrer as `sprocket_map_referrer`), then strips the hash from the URL.

2. **Returning visit** — if a token is already in `localStorage`, it is validated against `https://db01.tailfca0e2.ts.net/api/me`. A valid response shows the map immediately (page was hidden while this resolves to prevent a flash).

3. **No token / expired token** — a Google Sign-In button is injected via the GSI library (`https://accounts.google.com/gsi/client`). After sign-in, the new credential is stored and validated the same way.

4. **Home bar** — a persistent bar is injected at the top of every page showing the user's name and a link back to the referrer (willgibson.com) if one was stored.

---

## File structure

```
sprocket-fiber-map/
├── auth.js                          # Auth gate — injected into every map page
├── index.html                       # Top-level FWF phase overview / nav
├── FWF-Phase-Overview.html          # Phase overview map
├── FWF-P01-Overview.html            # Phase 1 overview
├── FWF-P01-BB-Backbone_Phase1_Redlines.html
├── FWF-P02-Overview.html
├── FWF-P04-Overview.html
├── FWF-P04-BB-Backbone_Phase4_Redlines.html
├── FWF-P05-C03-L1-PARD_Nature_Center_Hardwick_Redlines.html
├── FWF-P09-C01-Backbone_Silver_Creek_Redlines.html
├── FWF-P09-C02-Backbone_Silver_Creek-Confederate_Redlines.html
├── FWF-P09-C02-L1-Marshal_Lake_Patrol_Redlines.html
├── FWF-P09-C03-Backbone_8901_Jacksboro_Hwy_Redlines.html
├── FWF-P09-C03-L2-Nature_Center_Refuge_Redlines.html
├── FWF-P09-C04-Backbone_Hanger_Cutoff_Redlines.html
├── FWF-P09-C04-L2-TRWD_Eagle_Mtn_Dam_Redlines.html
├── Phase9_CP02_Map.html
├── Phase9_Fiber_Map.html
└── willgibson-landing.html          # Redirect/landing helper for portal
```

Naming convention: `FWF-P<phase>-<segment>-<description>.html`

---

## How to add a new map

1. Get the source HTML from Sam. Source files live at:
   ```
   /Volumes/MacMini-Data/Sprocket Networks Dropbox/Sprocket Networks Team Folder/
   Sprocket Networks LLC/SprocketGIS/projects/Claude_GIS_Project/Fiber Mapping Projects/
   ```

2. Copy the HTML file into the repo root (`~/Projects/sprocket-fiber-map/`).

3. Add these two lines immediately after the opening `<head>` tag:
   ```html
   <script src="/auth.js"></script>
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```

4. Add a link to the new map from `index.html` (or the relevant phase overview page).

5. Commit and deploy:
   ```bash
   cd ~/Projects/sprocket-fiber-map
   git add <new-file>.html index.html   # or whatever you changed
   git commit -m "Add <description> map"
   git push
   vercel --prod --yes
   ```

That's it — Vercel serves all HTML files at their filename path with no build step.

---

## Repo & infrastructure

| Thing | Value |
|---|---|
| Repo | https://github.com/Sprocket-Networks/sprocket-fiber-map |
| Live URL | https://sprocket-fiber-map.vercel.app |
| API backend | https://db01.tailfca0e2.ts.net (token validation at `/api/me`) |
| Vercel team | Sprocket-Networks |
| Auth library | Google GSI (`accounts.google.com/gsi/client`) |
| Map library | Leaflet 1.9.4 (CDN, loaded inside each map file) |

DB01 is on the SprocketNetworks Tailnet (`100.99.28.206`). Token validation only works from machines on the tailnet or from Vercel edge functions with tailnet access — it is not public.

---

## Pending work

- **Territory overview map** — a top-level map covering all Sprocket/Lasso territory, not just Fort Worth Water (FWF). This will become the new `index.html` entry point.
- **Element8 / AtLink integration** — Sam built Leaflet maps for Element8's FTTH plans in Crowley (`E8_Crowley_FTTH_Plan.html`, 468 homes, ROW+MST draft) and Lakeside (`E8_Lakeside_FTTH_Plan.html`). These need auth injected and a home in the nav structure.
- **Drill-down navigation** — a coherent hierarchy: territory overview → carrier/project → phase → route/segment. The current nav in `index.html` is FWF-only and flat.

---

## Local development

No build step — open any HTML file directly in a browser, or run a local server:

```bash
cd ~/Projects/sprocket-fiber-map
python3 -m http.server 8080
```

Auth will redirect to sign-in locally (no valid token). To test with a real token, log in on the live site, copy `google_auth_token` from `localStorage`, and set it in your local browser's `localStorage` for `localhost`.
