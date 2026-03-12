# nullrod-ui

React + Vite + TypeScript frontend for [api.nullrod.com](https://api.nullrod.com) — a Magic: The Gathering tool.

Primary use cases: combo building and deck building. Card search is a secondary browsing feature.

## Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** for dev/build
- **React Router v6** for client-side routing
- **CSS Modules** for component styles (no external UI framework)
- **Vitest** + **Testing Library** for unit tests (71 tests)

## Dev

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build (strict — fails on unused imports)
npx vitest run     # run all tests
```

## Routes

```
/              → /cards (redirect)
/decks         — Deck list and builder (coming soon)
/combos        — Combo browser and creator (coming soon)
/cards         — Card search and browser (live, URL params synced)
/cards/:id     — Full card detail page by oracle UUID (live)
```

## Project Structure

```
src/
  api/
    client.ts                 # Typed fetch wrapper for api.nullrod.com
    client.test.ts            # API client tests
    symbology.ts              # Mana symbol SVG map (memoized)
  types/
    card.ts                   # OracleCard, ImageUrls, SearchParams, CardFace, etc.
    deck.ts                   # Deck, DeckEntry, DeckSummary, DeckFormat (stubbed)
    combo.ts                  # Combo, ComboCard, SpellbookCombo (stubbed)
  pages/
    CardsPage.tsx             # Card search with URL-synced params, grid/list toggle (live)
    CardPage.tsx              # Full card detail page (live)
    DecksPage.tsx             # Deck builder stub (coming soon)
    CombosPage.tsx            # Combo browser stub (coming soon)
  components/
    Nav.tsx                   # Top navigation
    ManaSymbol.tsx            # ManaCost, OracleText inline symbol renderers
    ColorPips.tsx             # Color identity dots
    SearchFilters.tsx         # Filter panel (color, type, CMC, oracle text, keywords, legality)
    CardGrid.tsx              # Responsive grid + pagination
    CardList.tsx              # Table/list view + pagination
    CardTile.tsx              # Card tile with art from image_urls
    CardDetail.tsx            # Modal: art, oracle text, stats, legalities, rulings
  test/
    setup.ts                  # Vitest setup (jest-dom matchers)
    fixtures.ts               # Mock cards: mockBolt, mockGoyf, mockJace
  App.tsx                     # Router + layout shell
  index.css                   # Global dark theme CSS variables
```

## API — api.nullrod.com

Base URL: `https://api.nullrod.com`
Auth: None. CORS: GET from any origin.
Rate limits: 60 req/min (search), 300 req/min (all others).

### Live endpoints

| Endpoint | Description |
|---|---|
| `GET /cards` | Fuzzy search with filters (q, oracle_text, color, type, cmc_min, cmc_max, keywords, format, view, page) |
| `GET /cards/{oracle_id}` | Get card by oracle UUID |
| `GET /cards/symbols` | Mana symbol SVG URIs |
| `GET /rulings/{oracle_id}` | Official rulings for a card |

Card objects include `image_urls` with optional `normal` and `art_crop` signed CloudFront URLs.
The `?view=list` param returns lightweight card data (no image_urls, power, toughness).

Deck and combo endpoints are stubbed in client.ts — update as they go live.

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

## Rules

- When the user says "commit and deploy from local", do all of the following in sequence:
  1. Stage and commit the changed files with a descriptive message
  2. Run `npm run build` — fix any TS errors before continuing
  3. `git push origin main`
  4. Sync to S3 (assets with immutable cache, index.html with no-cache, everything else with 1hr cache)
  5. Invalidate CloudFront cache

## Agents

Custom agents are defined in `.claude/agents/` for specialized tasks:

| Agent | File | Purpose |
|---|---|---|
| **feature** | `.claude/agents/feature.md` | Build new features — knows the architecture, API, types, styling patterns, and testing requirements |
| **test** | `.claude/agents/test.md` | Write and maintain tests — knows vitest config, mocking patterns, current coverage, and common gotchas |
| **fix** | `.claude/agents/fix.md` | Fix bugs and UI issues — knows past bug patterns, image handling, modal quirks, and CSS gotchas |
| **deploy** | `.claude/agents/deploy.md` | Build and deploy to production — knows the exact S3/CloudFront deploy sequence and cache strategies |
| **review** | `.claude/agents/review.md` | Review code changes — checks TypeScript, React patterns, CSS, API integration, and test coverage |

### Usage

Invoke agents with `/agent <name>`:

```
/agent feature    — "Build the deck list page"
/agent test       — "Add tests for the new DeckList component"
/agent fix        — "Card images show white corners on mobile"
/agent deploy     — "Deploy current build to production"
/agent review     — "Review my changes before merging"
```

Agents have full context about the project's architecture, conventions, and known issues so they can work autonomously.

## Conventions

- Add new API functions to `src/api/client.ts`
- Add new types to the appropriate file under `src/types/`
- Use CSS Modules (`.module.css`) for all component styles
- Use CSS variables from `index.css` for theming
- Keep components focused — no god components
- Image URLs may be empty (`{}`) while backfill runs — handle gracefully
- Write tests for new components (vitest + @testing-library/react)
- Search params sync to URL for shareable links
