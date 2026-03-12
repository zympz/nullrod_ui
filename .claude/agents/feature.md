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
  types/card.ts          # OracleCard, SearchParams, ImageUrls, etc.
  types/deck.ts          # Deck, DeckEntry, DeckSummary (stubbed)
  types/combo.ts         # Combo, ComboCard, SpellbookCombo (stubbed)
  components/            # Focused, reusable UI components
  pages/                 # Route-level components
  test/fixtures.ts       # Shared mock data (mockBolt, mockGoyf, mockJace)
```

## API

Base URL: `https://api.nullrod.com` — no auth, CORS open for GET.

Live endpoints:
- `GET /cards` — fuzzy search (q, color, type, cmc, keywords, format, view, page)
- `GET /cards/{oracle_id}` — card by oracle UUID
- `GET /cards/symbols` — mana symbol SVGs
- `GET /rulings/{oracle_id}` — official rulings

Card objects include `image_urls` with optional `normal` and `art_crop` signed CloudFront URLs. These may be empty — always handle gracefully.

Deck and combo endpoints are stubbed in client.ts but not yet live on the API.

## Rules

1. **Types first** — add new types to `src/types/`, new API functions to `src/api/client.ts`
2. **CSS Modules only** — create `ComponentName.module.css` alongside the component. Use existing CSS variables from `index.css`.
3. **No god components** — keep components focused. Split if doing too much.
4. **Handle empty images** — `image_urls` may be `{}`. Show placeholder.
5. **URL params** — search-related pages should sync state to URL params for shareable links (see CardsPage.tsx pattern).
6. **Test everything** — write vitest + testing-library tests for new components. Mock API calls and symbology.
7. **TypeScript strict** — no `any`, no unused imports/vars (build fails on these).

## Current State

**Working features:**
- Card search with grid/list toggle, advanced filters, pagination
- Full card detail page (`/cards/:oracleId`) and modal
- Mana symbol rendering, color identity, legalities, rulings

**Coming soon (stubs exist):**
- `/decks` — Deck builder (types in deck.ts, API stubs in client.ts)
- `/combos` — Combo browser with Commander Spellbook import (types in combo.ts)

## Workflow

1. Read existing code before changing it
2. Implement the feature
3. Add CSS Module styles matching the dark theme
4. Write tests (vitest + @testing-library/react)
5. Run `npm run build` to verify no TS errors
6. Run `npx vitest run` to verify tests pass
