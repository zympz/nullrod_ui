# Feature Agent

You build new features for nullrod-ui, a React + TypeScript frontend for a Magic: The Gathering tool at nullrod.com.

## Stack

- React 18 + TypeScript (strict mode) + Vite
- React Router v6 (BrowserRouter)
- CSS Modules for all component styles — no external UI framework
- Dark theme with CSS variables defined in `src/index.css`

## Architecture

```
src/
  api/client.ts          # Typed fetch wrapper — all API calls go here
  api/symbology.ts       # Mana symbol SVG map (memoized)
  types/card.ts          # OracleCard, SearchParams, ImageUrls, CardFace, PrintingResponse, etc.
  types/deck.ts          # Deck, DeckCard, DeckSummary, ImportDeckInput
  types/combo.ts         # Combo, ComboSummary, ComboListResponse
  constants.ts           # BRACKET_LABELS, identityColors() helper
  components/            # Focused, reusable UI components
  pages/                 # Route-level components
  test/fixtures.ts       # Shared mock data (mockBolt, mockGoyf, mockJace)
```

## API

Base URL: `https://api.nullrod.com` — no auth, CORS open for GET.

Live endpoints:
- `GET /cards/search` — fuzzy search (q, oracle_text, color, type, cmc_min, cmc_max, keywords, format, view, page)
- `GET /cards/{oracle_id}` — card by oracle UUID; `?include_printings=true` embeds printings array
- `GET /cards/{oracle_id}/printings` — all printings (paginated)
- `GET /cards/scryfall/{scryfall_id}` — printing by Scryfall ID, includes prices
- `GET /cards/symbols` — mana symbol SVGs
- `GET /decks` — list decks (page, page_size, format)
- `GET /decks/{id}` — full deck detail
- `POST /decks/import` — import from Moxfield URL or public ID
- `GET /combos` — list combos (identity, page, page_size)
- `GET /combos/{id}` — full combo detail

Card objects include `image_urls` with optional `normal`, `art_crop` signed CloudFront URLs. DFC cards also have `back_normal` and `back_art_crop`. These may be empty — always handle gracefully.

## Rules

1. **Types first** — add new types to `src/types/`, new API functions to `src/api/client.ts`
2. **CSS Modules only** — create `ComponentName.module.css` alongside the component. Use existing CSS variables from `index.css`.
3. **No god components** — keep components focused. Split if doing too much.
4. **Handle empty images** — `image_urls` may be `{}`. Show placeholder.
5. **URL params** — search-related pages should sync state to URL params for shareable links (see CardsPage.tsx pattern).
6. **Test everything** — write vitest + testing-library tests for new components. Mock API calls and symbology.
7. **TypeScript strict** — no `any`, no unused imports/vars (build fails on these).

## Current State

All major features are live:
- Card search with grid/list toggle, advanced filters, pagination (`/cards`)
- Full card detail page with printings list (`/cards/:oracleId`)
- Deck list with Moxfield import (`/decks`)
- Deck detail with banner art, type-grouped mainboard, card preview panel, price totals (`/decks/:id`)
- Combo browser with color identity filter (`/combos`)
- Combo detail with cards, steps, prerequisites, produces (`/combos/:id`)

## DFC Cards

Double-faced cards have `card_faces` array and names like `"Front // Back"`. Use helpers from `src/types/card.ts`:
- `frontFace(name)` — strips back face from name
- `backFace(name)` — extracts back face name
- `isDFC(card)` — checks if card has faces

Images: front face uses `image_urls.normal`/`art_crop`; back face uses `image_urls.back_normal`/`back_art_crop`.

## Workflow

1. Read existing code before changing it
2. Implement the feature
3. Add CSS Module styles matching the dark theme
4. Write tests (vitest + @testing-library/react)
5. Run `npm run build` to verify no TS errors
6. Run `npx vitest run` to verify tests pass
