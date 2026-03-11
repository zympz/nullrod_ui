# nullrod-ui

React + Vite + TypeScript frontend for [api.nullrod.com](https://api.nullrod.com) — a Magic: The Gathering tool.

Primary use cases: combo building and deck building. Card search is a secondary browsing feature.

## Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** for dev/build
- **React Router v6** for client-side routing
- **CSS Modules** for component styles (no external UI framework)

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Routes

```
/              → /cards (redirect)
/decks         — Deck list and builder (coming soon)
/combos        — Combo browser and creator (coming soon, Commander Spellbook import planned)
/cards         — Card search and browser (live, URL params synced for shareable searches)
/cards/:id     — Full card detail page by oracle UUID (live)
```

## Project Structure

```
src/
  api/client.ts               # Typed fetch wrapper for api.nullrod.com
  types/
    card.ts                   # OracleCard, ImageUrls, SearchParams, etc.
    deck.ts                   # Deck, DeckEntry, DeckSummary, DeckFormat (stubbed)
    combo.ts                  # Combo, ComboCard, SpellbookCombo (stubbed)
  pages/
    CardsPage.tsx             # Card search with URL-synced params (live)
    CardPage.tsx              # Full card detail page (live)
    DecksPage.tsx             # Deck builder stub (coming soon)
    CombosPage.tsx            # Combo browser stub (coming soon)
  components/
    Nav.tsx                   # Top navigation
    ManaSymbol.tsx            # ManaCost, OracleText inline symbol renderers
    ColorPips.tsx             # Color identity dots
    SearchFilters.tsx         # Filter panel (color, type, CMC, keywords, legality)
    CardGrid.tsx              # Responsive grid + pagination
    CardTile.tsx              # Card tile with art from image_urls
    CardDetail.tsx            # Modal: art, oracle text, legalities, rulings
  App.tsx                     # Router + layout shell
  index.css                   # Global dark theme CSS variables
```

## API — api.nullrod.com

Base URL: `https://api.nullrod.com`
Auth: None. CORS: GET from any origin.
Rate limits: 60 req/min (search), 300 req/min (all others).

### Available endpoints

| Endpoint | Description |
|---|---|
| `GET /cards/search` | Fuzzy search with filters (q, color, type, cmc, keywords, legality, page) |
| `GET /cards?name=` | Exact name lookup (case-insensitive), returns array |
| `GET /cards/{oracle_id}` | Get card by oracle UUID |
| `GET /rulings/{oracle_id}` | Official rulings for a card |

Card objects include `image_urls` with `normal` and `art_crop` signed CloudFront URLs.
More endpoints coming — update `src/api/client.ts` and `src/types/` as they're added.

## Deploy

Production is served from CloudFront at `nullrod.com` and `www.nullrod.com`, backed by S3 bucket `nullrod-ui-920888352055`. Infrastructure is managed by the `NullrodUI` CDK stack in `~/Documents/nullrod_infra`.

**Automated (preferred):** push to `main` — GitHub Actions builds and deploys via OIDC.

**Manual from local machine:**

```bash
# 1. Build
npm run build

# 2. Sync assets (long-lived cache — filenames are content-hashed by Vite)
aws s3 sync dist/assets/ s3://nullrod-ui-920888352055/assets/ \
  --cache-control "public,max-age=31536000,immutable"

# 3. Upload index.html (no-cache — always fetch fresh)
aws s3 cp dist/index.html s3://nullrod-ui-920888352055/index.html \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# 4. Sync everything else (favicon, manifest, etc.)
aws s3 sync dist/ s3://nullrod-ui-920888352055/ \
  --delete \
  --exclude "assets/*" \
  --exclude "index.html" \
  --cache-control "public,max-age=3600"

# 5. Invalidate CloudFront cache
DIST_ID=$(aws ssm get-parameter --name /nullrod/ui/distribution-id \
  --query Parameter.Value --output text)
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
```

AWS credentials must have access to S3 and CloudFront. The deploy IAM role is `nullrod-ui-deploy` but requires GitHub OIDC — use your personal CLI credentials for local deploys.

## Conventions

- Add new API functions to `src/api/client.ts`
- Add new types to the appropriate file under `src/types/`
- Use CSS Modules (`.module.css`) for all component styles
- Keep components focused — no god components
- Image URLs may be empty while backfill runs — handle gracefully
