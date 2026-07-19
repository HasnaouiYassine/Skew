# Homepage UI Implementation Prompt

## Goal

Build the biasly homepage (`app/page.tsx`) as a **static, display-only UI** that matches the attached `UI_HOMEPAGE_DESIGN.png` pixel-closely, using the design system already established in `globals.css`. The page renders mock article data inline — no Supabase calls yet. Supabase integration is a future step.

---

## Skills Read

- `AGENTS.md` — full read ✅
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` — Next.js `<Image>` component ✅
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` — Next.js `<Link>` component ✅

---

## Existing Code Inspected

| File | Status |
|---|---|
| `app/page.tsx` | Stub — only `<div>Home</div>` |
| `app/layout.tsx` | Has Poppins font, correct metadata |
| `app/globals.css` | Full design system: tokens, typography, `.card`, `.bias-meter`, `.chip`, `.btn`, grid |
| `public/` | Only SVGs and PNG design references — no article images |
| `next.config.ts` | Bare config, no `remotePatterns` |

---

## Visual Interpretation (from UI_HOMEPAGE_DESIGN.png)

### Overall layout
- White background (`#FFFFFF`), 1280px max-width container, 24px side margin
- Three distinct horizontal bands: **top bar → nav → category strip → main content → footer**

### 1. Top Bar (dark, full-width)
- Background: `#0D0D0F` (text-primary / near-black)
- Left: `Browser Extension` link, `Theme: Light | Dark | Auto` toggle labels (text only, no function)
- Right: Date (`Monday, June 1, 2026`), `Set Location`, 🌐 `International Edition ▾`
- Font: body-small, color: `#9CA3AF` (muted white-gray)

### 2. Navigation Bar
- White background, bottom border `1px solid #E5E7EB`
- Left: hamburger icon + **biasly News** logotype (bold Poppins, "News" smaller below)
- Center nav links: `Home` (with active underline in black), `For You` (with red dot badge), `Local`, `Blindspot`
- Right: `Subscribe` button (btn-primary, black fill) + `Login` button (btn-secondary, outlined)
- Height: ~64px, sticky top

### 3. Category Chip Strip
- Single horizontal scrollable row of chips
- Background: white, bottom border `1px solid #E5E7EB`, padding: 8px 0
- Chips: `+ World Cup`, `+ IPL`, `+ Social Media`, `+ Business & Markets`, `+ Health & Medicine`, `+ Soccer`, `+ Artificial Intelligence`, `+ Arsenal FC`, `+ Extreme Weather and Disasters` (and more cut off)
- Each chip has a `+` icon prefix, pill shape, border `1px solid #E5E7EB`, hover state

### 4. Main Content — "Top News" Section
- Section heading: `Top News` — H1, bold, 32px, `#0D0D0F`, margin: 24px 0 16px
- **4 rows × 3 columns** = 12 article cards in a CSS grid
- Grid: `grid-template-columns: repeat(3, 1fr)`, gap: 24px
- Each card is a vertical card (image top, content below), no external border — image bleeds to card top

### Card anatomy (top to bottom):
1. **Image** — 16:9 aspect ratio, `border-radius: 8px 8px 0 0`, object-fit cover. A small `ⓘ` info circle icon overlaid bottom-right of image (gray, 24px).
2. **Meta line** — `Category · Region` in body-small, `#6B7280`, e.g. `Politics · United States`
3. **Title** — H3 (20px, semibold), `#0D0D0F`, 2–3 lines, line-height 1.3
4. **Bias Meter row** — segmented bar: Left badge (red, e.g. `L 20%`) + Center segment (gray, e.g. `Center 31%`) + Right badge (blue, e.g. `Right 49%`) — full-width, height 24px
5. **Source count** — `N sources` in body-small, `#6B7280`, margin-top 8px

### Bias meter details
- Left segment: `background #B42318`, white text, e.g. `L 20%`
- Center segment: `background #E5E7EB`, dark text, e.g. `Center 31%`
- Right segment: `background #1D4ED8`, white text, e.g. `Right 49%`
- Each segment width is proportional to its percentage (flex with dynamic width)
- Text inside each segment is the label + percentage, semibold 13px

### Card hover
- `box-shadow: 0px 4px 12px rgba(0,0,0,0.08)` (shadow-md from design system)
- `transform: translateY(-2px)`
- Smooth transition 250ms

### 5. Footer
- Background: `#0D0D0F` (dark)
- Four columns:
  - Col 1: biasly News logo (white), tagline "Balanced news coverage, powered by AI." (gray, body-small)
  - Col 2: **Company** — About, Careers, Press, Contact
  - Col 3: **Help** — Help Center, Guides, Privacy Policy, Terms of Service
  - Col 4: **Connect** — X (Twitter), LinkedIn, Instagram, YouTube icons (SVG, gray, 20px)
- Bottom strip: `© 2026 Biasly News. All rights reserved.` — caption, gray
- Padding: 48px top, 24px bottom

---

## Decisions & Assumptions

1. **Static mock data** — The page uses hardcoded article data (12 cards matching the design) defined as a TypeScript array inside the page. No Supabase calls. This follows the architecture rule: *UI displays stored data only* — the mock data stands in for what Supabase will later provide.
2. **No external image URLs** — Because `next.config.ts` has no `remotePatterns`, I will use `unoptimized` images via a public placeholder service (`https://picsum.photos`) OR use plain `<img>` tags styled with CSS for the cards, avoiding the need to configure `remotePatterns`. Decision: use `<img>` tags (not `next/image`) for external URLs in mock data to keep the config untouched for now.
3. **No Clerk auth** — Subscribe/Login buttons are present as visual elements only. Clerk is not installed yet.
4. **`"use client"` directive** — The category chip strip needs horizontal scroll (overflow-x auto). Since no server data is needed yet, the page can be a Server Component — all interactivity is CSS-only. No `"use client"` needed.
5. **Responsive** — The design shows a desktop layout (1280px). At ≤768px, the 3-column grid collapses to 1 column. At ≤1024px, 2 columns. This is added via CSS media queries.
6. **`ⓘ` icon** — Rendered as a simple Unicode/SVG overlay on each card image, absolutely positioned bottom-right.
7. **Top bar** — Static text only, no theme-switch functionality.
8. **Active nav underline** — `Home` gets a 2px black underline via CSS, matching the design.
9. **Sticky navbar** — `position: sticky; top: 0; z-index: 50` so it stays visible on scroll.

---

## Files Likely to Change

| File | Change |
|---|---|
| `app/page.tsx` | **Replace** — full homepage implementation |
| `app/globals.css` | **Minor additions** — top bar styles, sticky nav, category strip scroll, footer dark theme |
| `next.config.ts` | No change needed (using `<img>` for external URLs) |
| `app/layout.tsx` | No change needed |

---

## Implementation Requirements

### `app/page.tsx`

- Export a default Server Component (no `"use client"`)
- Import `Link` from `next/link`
- Define a `MOCK_ARTICLES` array (12 items) with these fields:
  - `id`, `category`, `region`, `title`, `imageUrl`, `left`, `center`, `right`, `sources`
- Render sections in order: `<TopBar>`, `<Navbar>`, `<CategoryStrip>`, `<main>` (Top News grid), `<Footer>`
- Each section is a local sub-component or inline JSX within the page file — keep it in one file for simplicity
- Use design system class names from `globals.css` where available (`.card`, `.chip`, `.btn-primary`, `.btn-secondary`, `.bias-meter-segment--left` etc.)

### `app/globals.css` additions

Add these CSS blocks (do not remove existing tokens):

```css
/* Top Bar */
.top-bar { background: var(--color-text-primary); color: #9CA3AF; font-size: var(--text-body-small); }
.top-bar a { color: #9CA3AF; text-decoration: none; }
.top-bar a:hover { color: #fff; }

/* Sticky Navbar */
.navbar { position: sticky; top: 0; z-index: 50; background: var(--color-bg-primary); border-bottom: 1px solid var(--color-border); }

/* Category Strip */
.category-strip { border-bottom: 1px solid var(--color-border); overflow-x: auto; scrollbar-width: none; }
.category-strip::-webkit-scrollbar { display: none; }

/* Card image overlay (info icon) */
.card-image-wrap { position: relative; }
.card-info-icon { position: absolute; bottom: 8px; right: 8px; width: 24px; height: 24px; background: rgba(0,0,0,0.45); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; cursor: pointer; }

/* Footer dark */
.footer-dark { background: var(--color-text-primary); color: #9CA3AF; }
.footer-dark a { color: #9CA3AF; text-decoration: none; }
.footer-dark a:hover { color: #fff; }
.footer-heading { color: #fff; font-weight: var(--weight-semibold); font-size: var(--text-body); margin-bottom: var(--space-4); }

/* Active nav link */
.nav-link-active { border-bottom: 2px solid var(--color-text-primary); padding-bottom: 2px; font-weight: var(--weight-semibold); }

/* Responsive grid */
@media (max-width: 1024px) { .news-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .news-grid { grid-template-columns: 1fr; } }
```

### Mock article data (12 articles matching the design)
```
Row 1: Trump Iran peace, Grapes superfood, CERN physics
Row 2: Brooklyn Rivera Nicaragua, UN Security Council Lebanon, Oil Prices OPEC
Row 3: SpaceX Starship Mars, Apple AI features, 2025 hottest year
Row 4: Fed rates steady, Real Madrid Champions League, Wildfires Western Canada
```

---

## Security Requirements

- No server secrets or credentials in the page
- No API calls from browser code
- No Supabase calls (deferred to integration step)

---

## Acceptance Criteria

- [ ] Top bar renders dark with correct text layout
- [ ] Navbar is sticky, shows logo + nav links + Subscribe/Login buttons
- [ ] Category strip scrolls horizontally, chips show `+` prefix, all match the design
- [ ] "Top News" heading renders at H1 size
- [ ] 12 cards render in a 3-column grid with 24px gap
- [ ] Each card has: image (16:9), meta line, title, bias meter, source count
- [ ] Bias meter segments are proportionally sized by percentage values
- [ ] Card hover lifts with shadow-md
- [ ] Footer renders dark with 4-column layout and copyright strip
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] `npm run build` succeeds

---

## Checks to Run

```
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # Next.js production build
```

---

## Manual Test Steps After Implementation

1. Run `npm run dev`
2. Open `http://localhost:3000` in browser
3. Verify: dark top bar visible at very top with theme/location text
4. Verify: sticky white navbar with biasly logo, nav links, Subscribe and Login buttons
5. Scroll down — navbar stays fixed at top
6. Verify: category chip strip scrollable horizontally
7. Verify: "Top News" heading then 3-column grid of 12 article cards
8. Hover a card — verify lift + shadow animation
9. Verify each card has category·region meta, bold title, proportional bias meter bar, source count
10. Scroll to bottom — verify dark footer with 4 columns and copyright line
11. Resize to ≤768px — verify cards collapse to 1 column
12. Resize to ≤1024px — verify cards show 2 columns
