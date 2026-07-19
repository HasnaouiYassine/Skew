# News Details Page UI — Implementation Prompt

## Goal

Build the biasly news details page as a **static, display-only UI** matching `UI_NEWS_DETAILS_PAGE_DESIGN.png` pixel-closely. The page renders mock article content defined inline — no Supabase calls yet. It reuses the shared `TopBar`, `Navbar`, and `Footer` components already present in `app/page.tsx`, extracted into a shared location.

---

## Skills Read

- `AGENTS.md` — full read ✅
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — dynamic route segments, `params` as Promise, `generateStaticParams` ✅
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` — Next.js Link ✅
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` — Next.js Image ✅

---

## Existing Code Inspected

| File | Status |
|---|---|
| `app/page.tsx` | Has `TopBar`, `Navbar`, `Footer`, `MOCK_ARTICLES` — all duplicated inline |
| `app/globals.css` | Full design system + homepage styles |
| `app/layout.tsx` | Poppins font, biasly metadata |
| `next.config.ts` | Bare config, no remotePatterns |

---

## Visual Interpretation (from `UI_NEWS_DETAILS_PAGE_DESIGN.png`)

### Overall Layout
- Same TopBar + Navbar at top (identical to homepage)
- **Two-column content layout** (main article left ~65%, sticky sidebar right ~35%) within 1280px container
- Same dark Footer at bottom
- Newsletter signup bar just above footer

### 1. Breadcrumb + Article Header (left column top)
- `Politics · United States` — body-small, `#6B7280`
- **H1** title: `Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report` — bold, 32px
- Byline row: `By David Morgan | May 31, 2026 | 12 min read` — body-small gray, with `|` separators
- Action row: `Save 🔖  Share 📤  ···` — small icon-text buttons, right-aligned, gray

### 2. Hero Image
- Full-width within left column, `border-radius: 8px`, 16:9 aspect ratio
- Image caption below: small italic gray text — `President Donald Trump in the Cabinet Room...`

### 3. Bias Distribution Block (below image)
- Label: `Bias Distribution ⓘ` — body-small semibold
- Full-width segmented bias bar (height 36px): `Left 20%` (red) | `Center 31%` (gray) | `Right 49%` (blue) — same proportional flex layout as homepage cards
- Below bar: `12 sources` — body-small gray

### 4. Article Body
- Multiple paragraphs of body text, 16px, `#0D0D0F`, line-height 1.6
- Paragraph spacing: 16px between paragraphs
- One quoted paragraph (blockquote) styled with left border `4px solid #E5E7EB`, italic, slightly indented

### 5. Related Stories Section (below article body)
- Heading: `Related Stories` — H3, semibold
- **2×3 grid** of compact horizontal cards (6 total)
- Each card: thumbnail image (64×64, rounded 8px, left) + right text: category·region, title (body-medium semibold, 2 lines max), date + read time
- No bias bar on these cards

---

### 6. Right Sidebar — Three Sticky Panels

#### Panel A: Bias Analysis
- Card with `1px solid #E5E7EB` border, `border-radius: 8px`, `padding: 24px`
- Header row: `Bias Analysis` (H4, semibold) + `ⓘ` icon right
- `Overall Bias` label — caption, gray
- Big bias label: `Right 49%` — H2 size, bold, `color: #1D4ED8` (right-bias blue)
- Sub-label: `Based on 12 balanced sources` — body-small, blue
- Three rows with label + percentage + colored progress bar:
  - `Left   20%` — red bar `#B42318`
  - `Center 31%` — gray bar `#E5E7EB`
  - `Right  49%` — blue bar `#1D4ED8`
- Progress bar: `height: 6px`, `border-radius: 9999px`, full-width track gray, colored fill
- Disclaimer paragraph — body-small gray, italic
- CTA button: `How We Analyze Bias` — full-width, `.btn-secondary` outlined

#### Panel B: AI Summary
- Header: `AI Summary` (H4) + `ⓘ` icon + `Generated May 31, 2026 · 3 min read` caption gray
- 5 bullet points of summary text — body-small, `#0D0D0F`, bullet `·` styled
- Disclaimer: `AI summaries can make mistakes.` — caption gray italic
- CTA: `Provide Feedback` — full-width `.btn-secondary` outlined

#### Panel C: Source Breakdown
- Header: `Source Breakdown` (H4) + `ⓘ`
- `12 Total Sources` — body-small gray
- Three rows: `Left 2 (20%)` | `Center 4 (31%)` | `Right 6 (49%)` — with matching colored progress bars
- `Top Sources` / `Bias` — two-column table header, caption gray
- 8 source rows: name left, bias label right — `Right` in blue, `Left` in red, `Center` in gray
- `View All Sources` — full-width `.btn-secondary` outlined

---

### 7. Newsletter Signup Bar
- Full-width dark strip (`#0D0D0F`), padding 40px
- Left: `Stay Informed. Stay Balanced.` — H3 bold white; sub: `Get the top stories and bias analysis delivered to your inbox.` — body-small gray
- Right: email input field + `Subscribe` button (btn-primary)
- Layout: flex row, space-between

### 8. Footer
- Identical to homepage footer

---

## Architecture Decisions

1. **Route**: `app/news/[id]/page.tsx` — dynamic segment `[id]` matches article ID from `MOCK_ARTICLES`. `params` is a `Promise<{ id: string }>` per Next.js 16 docs — must use `await params`.
2. **`generateStaticParams`** — export this function returning all 12 article IDs so the page is statically prerendered at build time.
3. **Shared components** — Extract `TopBar`, `Navbar`, `Footer` into `app/_components/` shared folder so both `page.tsx` and the details page can import them without duplication.
4. **Shared data** — Extract `MOCK_ARTICLES` array and types into `app/_lib/mock-data.ts` so both pages share the same data source.
5. **`notFound()`** — If `id` param does not match any article, call `notFound()` from `next/navigation`.
6. **No `<Image>`** for external URLs — continue using plain `<img>` to avoid `remotePatterns` config.
7. **Sidebar** — `position: sticky; top: 88px` (below navbar) on desktop; stacks below article on mobile.
8. **Related stories** — 6 hardcoded related articles reusing the existing `MOCK_ARTICLES` slice (exclude current article).
9. **No Clerk / no Supabase** — all auth and data deferred to future steps.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `app/_components/TopBar.tsx` | **NEW** — extracted from `page.tsx` |
| `app/_components/Navbar.tsx` | **NEW** — extracted from `page.tsx` |
| `app/_components/Footer.tsx` | **NEW** — extracted from `page.tsx` |
| `app/_lib/mock-data.ts` | **NEW** — shared `MOCK_ARTICLES`, `CATEGORIES`, `Article` type |
| `app/news/[id]/page.tsx` | **NEW** — news details page |
| `app/page.tsx` | **MODIFY** — update imports to use shared components + data |
| `app/globals.css` | **MODIFY** — add details page styles (article body, sidebar panels, progress bars, newsletter bar) |

---

## Implementation Requirements

### `app/_lib/mock-data.ts`
- Export `Article` interface with all current fields plus new detail fields:
  - `author`, `date`, `readTime`, `imageCaption`
  - `body: string[]` (array of paragraphs)
  - `quote?: string` (optional blockquote)
  - `aiSummary: string[]` (bullet points)
  - `sources: { name: string; bias: 'Left' | 'Center' | 'Right' }[]`
- Export `MOCK_ARTICLES`, `CATEGORIES` arrays

### `app/news/[id]/page.tsx`
- `async` Server Component
- `await params` to get `id` (per Next.js 16 docs — params is Promise)
- `generateStaticParams()` returning `MOCK_ARTICLES.map(a => ({ id: String(a.id) }))`
- `generateMetadata()` returning article title as page title
- Layout: `<TopBar>` + `<Navbar>` + main content area + `<NewsletterBar>` + `<Footer>`
- Main content: two-column CSS grid (`article-detail-grid`) — 65%/35% split
- Left: breadcrumb, H1, byline+actions, hero image, bias block, article paragraphs, related stories
- Right: three sidebar panels (Bias Analysis, AI Summary, Source Breakdown)
- `notFound()` if article not found

### `app/globals.css` additions
Styles needed (appended, no existing styles removed):
- `.article-detail-layout` — two-column grid with gap, max-width container
- `.article-detail-main` — left column
- `.article-detail-sidebar` — sticky right column
- `.article-breadcrumb`, `.article-h1`, `.article-byline`, `.article-actions`
- `.article-hero-img`, `.article-caption`
- `.bias-distribution-block`
- `.article-body p`, `.article-blockquote`
- `.sidebar-panel` — bordered card
- `.bias-progress-track`, `.bias-progress-fill`
- `.source-table`, `.source-row`, `.source-bias-label`
- `.related-stories-grid`, `.related-card`
- `.newsletter-bar`
- Responsive: at ≤1024px, sidebar moves below main content (single column)

---

## Security Requirements
- No server secrets, no API calls from browser
- No Supabase calls (deferred)

---

## Acceptance Criteria

- [ ] Route `/news/1` renders the details page for article ID 1
- [ ] Route `/news/99` returns 404 via `notFound()`
- [ ] `generateStaticParams` causes all 12 articles to prerender at build time
- [ ] TopBar and Navbar match homepage exactly (shared component)
- [ ] Two-column layout: article left, sidebar panels right
- [ ] Sidebar is sticky on desktop; stacks below on mobile (≤1024px)
- [ ] Bias Distribution block shows proportional colored segments
- [ ] Sidebar Bias Analysis panel: overall bias label, three progress bars
- [ ] Sidebar AI Summary panel: bullet list, disclaimer, feedback button
- [ ] Sidebar Source Breakdown: source count rows, top sources table
- [ ] Related Stories: 2×3 grid of compact cards with thumbnails
- [ ] Newsletter bar renders above footer
- [ ] Footer matches homepage exactly (shared component)
- [ ] `npm run typecheck` — no errors
- [ ] `npm run lint` — no errors
- [ ] `npm run build` — compiles, all 12 article routes statically prerendered

---

## Checks to Run
```
npm run typecheck
npm run lint
npm run build
```

---

## Manual Test Steps After Implementation
1. Run `npm run dev`
2. Open `http://localhost:3000` — homepage must still work unchanged
3. Click any article card (or navigate to `http://localhost:3000/news/1`)
4. Verify: TopBar + sticky Navbar match homepage
5. Verify: breadcrumb → H1 title → byline row → hero image → image caption
6. Verify: bias distribution bar (red/gray/blue, proportional widths, source count)
7. Verify: multiple article body paragraphs with one blockquote
8. Verify: right sidebar with 3 panels — Bias Analysis (progress bars), AI Summary (bullets), Source Breakdown (table)
9. Verify: sidebar is sticky — scroll article, sidebar stays in view
10. Verify: Related Stories section shows 6 compact horizontal cards
11. Verify: Newsletter bar above footer (dark bg, email input + button)
12. Verify: dark footer matches homepage
13. Navigate to `http://localhost:3000/news/99` — verify 404 page
14. Resize to ≤1024px — sidebar stacks below article content
