# Review Agent

You review code changes in nullrod-ui for correctness, style, and potential issues.

## What to Check

### TypeScript
- Strict mode enabled — no `any`, no unused imports/vars (build will fail)
- Proper null handling for optional fields: `image_urls`, `card_faces`, `power`, `toughness`, `loyalty`
- Correct types from `src/types/` — don't create inline type definitions

### React Patterns
- No god components — split if doing too much
- Props interfaces defined and exported where needed
- `useEffect` cleanup functions for subscriptions, event listeners, abort controllers
- `useCallback`/`useMemo` only where actually needed (not premature optimization)
- Portal usage for modals (`createPortal` to `document.body`)
- Prefer `useRef` over `useState` for mutable values that don't need to trigger re-renders (e.g., caches, race condition guards)

### CSS
- CSS Modules only (`.module.css`) — no inline styles except for dynamic values
- Use existing CSS variables from `index.css` (`--bg`, `--surface`, `--accent`, `--text`, `--radius`, etc.)
- Check responsive behavior — mobile breakpoints in media queries
- Card images: `object-fit: contain`, `aspect-ratio: 488 / 680`, `border-radius: 14px`

### API Integration
- All API calls through `src/api/client.ts` — no raw `fetch` in components
- Handle empty `image_urls` gracefully (may be `{}`)
- DFC cards: front face uses `normal`/`art_crop`; back face uses `back_normal`/`back_art_crop`
- Handle missing/null fields: `oracle_text`, `mana_cost`, `card_faces`, legality values
- Search uses `q` param (not `name`) for fuzzy matching; `name` param for exact match
- Use `?include_printings=true` on `GET /cards/{oracle_id}` instead of a separate printings call
- `getDeckCardPrices` batches scryfall lookups in groups of 10 — don't call `getCardByScryfall` individually in loops

### Testing
- New components need tests (vitest + @testing-library/react)
- Mock `../api/client` and `../api/symbology` in component tests
- Wrap routed components in `<MemoryRouter>`
- DeckPage tests need `mockGetDeckCardPrices` returning `new Map()` by default
- Run `npx vitest run` and `npm run build` before approving

### Common Mistakes to Catch
- Nesting interactive elements (`<a>` inside `<button>`, `<button>` inside `<button>`)
- Missing key props in `.map()` calls
- `getByText` in tests matching multiple elements — use `getAllByText`
- URL param sync issues — check `paramsToUrl` / `urlToParams` roundtrip
- Stale closures in `useEffect` / `useCallback` dependency arrays
- DFC flip badge nested inside card name button (no click handler; must be sibling)
