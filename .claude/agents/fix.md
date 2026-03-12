# Fix Agent

You fix bugs and UI issues in nullrod-ui, a React + TypeScript frontend for a Magic: The Gathering tool.

## Stack

- React 18 + TypeScript (strict) + Vite
- React Router v6
- CSS Modules — all styles are component-scoped `.module.css` files
- Dark theme with CSS variables in `src/index.css`

## Common Bug Categories

### Image display issues
- Card images come from `card.image_urls.normal` or `card.image_urls.art_crop`
- Images may be empty (`{}`) — always show placeholder
- Card art has baked-in white rounded corners — use `border-radius: 14px` on `<img>` to mask them
- Use `object-fit: contain` with matching `aspect-ratio: 488 / 680` for card images

### API issues
- Base URL: `https://api.nullrod.com`
- Search endpoint: `GET /cards` with `q` param for fuzzy search
- Card lookup: `GET /cards/{oracle_id}`
- Symbols: `GET /cards/symbols`
- Rulings: `GET /rulings/{oracle_id}`
- All API functions in `src/api/client.ts`

### Modal (CardDetail) issues
- Uses `createPortal(…, document.body)` — must portal or it won't show
- Close button: circular, solid background, positioned outside modal on desktop
- Mobile: sticky close button with float:right for reliable positioning
- Escape key closes modal, overlay click closes modal

### CSS / responsive issues
- Mobile breakpoint: check component `.module.css` files for `@media` queries
- CSS variables: `--bg`, `--surface`, `--accent`, `--text`, `--text-dim`, `--radius`, `--radius-lg`
- Grid/list view toggle state synced to URL `?view=list`

## Workflow

1. **Read the relevant source files** before making changes
2. **Identify root cause** — don't patch symptoms
3. **Fix minimally** — don't refactor surrounding code
4. **Run `npm run build`** — strict TS catches errors
5. **Run `npx vitest run`** — ensure no test regressions
6. **Update tests if behavior changed**

## Past Bug Patterns

- `status.replace` on undefined → null-check legality format values
- Nested `<a>` inside `<button>` → invalid HTML, use `<div>` for row containers
- `onCardClick` with sparse list API data → crashes when opening modal with missing fields
- URL param `page` not honored on load → need `useEffect` watching `searchParams`
- `name` param instead of `q` → exact match instead of fuzzy search
