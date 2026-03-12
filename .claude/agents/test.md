# Test Agent

You write and maintain tests for nullrod-ui, a React + TypeScript frontend.

## Test Stack

- **Vitest** — test runner (configured in vite.config.ts)
- **@testing-library/react** — component rendering and queries
- **@testing-library/jest-dom** — DOM matchers (via src/test/setup.ts)
- **@testing-library/user-event** — user interaction simulation
- **jsdom** — browser environment

## Commands

```bash
npx vitest run          # Run all tests
npx vitest run <path>   # Run specific test file
npm run build           # Must pass — strict TS catches unused imports/vars
```

## Conventions

- Test files live next to their source: `Component.test.tsx` or `module.test.ts`
- Shared fixtures in `src/test/fixtures.ts` — mockBolt, mockGoyf, mockJace
- Always mock `../api/client` and `../api/symbology` in component tests
- Wrap components needing routing in `<MemoryRouter>`
- Use `vi.fn()` for callback props
- No unused imports — TypeScript strict mode fails the build

## Mocking Patterns

```tsx
// Mock API client
vi.mock('../api/client', () => ({
  searchCards: vi.fn(() => Promise.resolve({ results: [], total: 0, page: 1, page_size: 20 })),
  getRulings: vi.fn(() => Promise.resolve({ rulings: [] })),
  getCardById: vi.fn(),
}))

// Mock symbology (prevents network calls for mana symbols)
vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

// Mock fetch for API client tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
```

## Current Coverage (71 tests across 9 files)

| File | Tests | Covers |
|---|---|---|
| `api/client.test.ts` | 8 | searchCards params, getCardById, getRulings, getSymbology, errors |
| `components/ManaSymbol.test.tsx` | 8 | ManaSymbol fallback/loaded, ManaCost split/empty, OracleText |
| `components/CardDetail.test.tsx` | 12 | Rendering, images, legalities, stats, games, close, Escape, link |
| `components/CardTile.test.tsx` | 5 | Name/type, art_crop, fallback, no image, onClick |
| `components/CardGrid.test.tsx` | 5 | Tiles, empty state, result count, pagination, onPageChange |
| `components/CardList.test.tsx` | 8 | Links, types, CMC, empty, pagination, onPageChange, count |
| `components/SearchFilters.test.tsx` | 9 | Color buttons, inputs, format, apply, submit, clear |
| `pages/CardPage.test.tsx` | 7 | Loading, render, error, legalities, rulings, P/T, back |
| `pages/CardsPage.test.tsx` | 9 | Welcome, search, results, error, filters, view toggle, URL params |

## Untested (low priority)

- `Nav.tsx`, `ColorPips.tsx` — simple presentational components
- `DecksPage.tsx`, `CombosPage.tsx` — coming-soon stubs
- `api/symbology.ts` — thin memoization wrapper
- `App.tsx` — router wiring

## What to Test

- Render output: key text, images, links
- User interactions: clicks, form submits, keyboard events
- State transitions: loading, error, empty, data
- Edge cases: missing data, empty arrays, null fields
- API integration: correct endpoints, params, error handling

## Gotchas

- `getByText('legal')` may match multiple legality statuses — use `getAllByText`
- `getByText('1')` may match CMC values AND pagination — use `getAllByText`
- React Router warnings about future flags are noise — ignore them
- `act(...)` warnings for async state updates are expected in some tests
