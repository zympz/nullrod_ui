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
/         → /decks (redirect)
/decks    — Deck list and builder (coming soon)
/combos   — Combo browser and creator (coming soon, Commander Spellbook import planned)
/cards    — Card search and browser (live)
```

## Project Structure

```
src/
  api/client.ts               # Typed fetch wrapper for api.nullrod.com
  types/
    card.ts                   # OracleCard, SearchParams, ArtworkResponse, etc.
    deck.ts                   # Deck, DeckEntry, DeckSummary, DeckFormat (stubbed)
    combo.ts                  # Combo, ComboCard, SpellbookCombo (stubbed)
  pages/
    CardsPage.tsx             # Card search (live)
    DecksPage.tsx             # Deck builder stub (coming soon)
    CombosPage.tsx            # Combo browser stub (coming soon)
  components/
    Nav.tsx                   # Top navigation
    ManaSymbol.tsx            # ManaCost, OracleText inline symbol renderers
    ColorPips.tsx             # Color identity dots
    SearchFilters.tsx         # Filter panel (color, type, CMC, keywords, legality)
    CardGrid.tsx              # Responsive grid + pagination
    CardTile.tsx              # Card tile with lazy artwork
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
| `GET /artwork/{scryfall_id}` | Signed CloudFront URLs for a printing (small/normal/large/png/art_crop/border_crop) |
| `GET /artwork/{scryfall_id}/printings` | All printings for the oracle card |
| `GET /rulings/{oracle_id}` | Official rulings for a card |

`canonical_scryfall_id` on `OracleCard` is the key for artwork lookups.
More endpoints coming — update `src/api/client.ts` and `src/types/` as they're added.

## Conventions

- Add new API functions to `src/api/client.ts`
- Add new types to the appropriate file under `src/types/`
- Use CSS Modules (`.module.css`) for all component styles
- Keep components focused — no god components
- Artwork may be empty (`urls: {}`) while backfill runs — handle gracefully
