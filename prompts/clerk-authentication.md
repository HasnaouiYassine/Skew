# Clerk Authentication — Implementation Prompt

## Goal

Add Clerk authentication to the biasly news website. The home page remains public, but **news detail pages** (`/news/[id]`) require authentication. Unauthenticated users are redirected to `/sign-in`. The navbar shows Sign In / User button based on auth state.

---

## Skills Read

- `AGENTS.md` — full read ✅
- `.agents/skills/clerk/SKILL.md` — router, routed to `clerk-setup` and `clerk-nextjs-patterns` ✅
- `.agents/skills/clerk-setup/SKILL.md` — Clerk setup for Next.js, `proxy.ts` (not `middleware.ts`), `ClerkProvider` inside `<body>`, Keyless or manual keys ✅
- `.agents/skills/clerk-nextjs-patterns/SKILL.md` — Next.js patterns (server vs client, middleware strategies) ✅
- `.agents/skills/clerk-nextjs-patterns/references/middleware-strategies.md` — Public-first middleware strategy for news site ✅
- `.agents/skills/clerk-nextjs-patterns/references/server-vs-client.md` — `await auth()`, import rules, `<Show>` component ✅

---

## Existing Code Inspected

| File | Status |
|---|---|
| `package.json` | Next.js 16.2.10, React 19.2.4 — Clerk not yet installed |
| `.env.local` | Has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` already set |
| `app/layout.tsx` | Root layout with Poppins font, `<body>` wraps children directly |
| `app/page.tsx` | Home page with `TopBar`, `Navbar`, `Footer` |
| `app/news/[id]/page.tsx` | News details page with `TopBar`, `Navbar`, `Footer` |
| `app/_components/Navbar.tsx` | Sticky navbar with Login/Subscribe buttons (static) |
| `next.config.ts` | Bare config, no changes needed |

---

## Decisions & Assumptions

1. **Protected-first middleware** — News detail pages (`/news/(.*)`) require authentication. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`. All other routes are protected.
2. **`proxy.ts` not `middleware.ts`** — Next.js 16 uses `proxy.ts`. The code is identical; only the filename differs.
3. **Current SDK (Core 3)** — `@clerk/nextjs` v7+ (since Next.js 16 uses the current SDK). No Core 2 workarounds needed.
4. **No shadcn theme** — No `components.json` found, so skip the shadcn theme.
5. **ClerkProvider inside `<body>`** — Per clerk-setup skill, Core 3 requires `ClerkProvider` inside `<body>`.
6. **Sign-in / Sign-up pages** — Use Clerk's prebuilt `<SignIn />` and `<SignUp />` components at the standard catch-all routes.
7. **Navbar auth UI** — Replace static Login button with Clerk's `SignInButton` and `UserButton`. Subscribe button stays static.
8. **`SignInButton` redirect** — After sign-in, user is redirected back to the news detail page they originally tried to access (Clerk handles this automatically via the `redirect_url` param).
9. **No `currentUser()` on pages** — Auth check is handled by middleware (request-level). Navbar auth UI is client-side via `@clerk/nextjs` hooks.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `app/proxy.ts` | **NEW** — Clerk middleware (public-first) |
| `app/layout.tsx` | **MODIFY** — Wrap with `ClerkProvider` |
| `app/sign-in/[[...sign-in]]/page.tsx` | **NEW** — Clerk sign-in page |
| `app/sign-up/[[...sign-up]]/page.tsx` | **NEW** — Clerk sign-up page |
| `app/_components/Navbar.tsx` | **MODIFY** — Add Clerk auth UI (SignInButton, UserButton) |

---

## Implementation Requirements

### 1. Install `@clerk/nextjs`

```bash
npm install @clerk/nextjs
```

### 2. `app/proxy.ts` — Clerk Middleware

Protected-first strategy — only public routes (home page, sign-in, sign-up) are excluded from protection. All other routes, including `/news/(.*)`, require authentication.

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 3. `app/layout.tsx` — ClerkProvider

Add `ClerkProvider` wrapping children **inside `<body>`** per Core 3 requirements. No `dynamic` prop needed since auth state is only used client-side in Navbar.

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
```

### 4. `app/sign-in/[[...sign-in]]/page.tsx`

Catch-all sign-in route using Clerk's prebuilt `<SignIn />` component.

- Simple centered layout with the Clerk sign-in form
- Import `SignIn` from `@clerk/nextjs`
- The component handles all auth methods (email, Google, etc.) automatically

### 5. `app/sign-up/[[...sign-up]]/page.tsx`

Catch-all sign-up route using Clerk's prebuilt `<SignUp />` component.

- Same centered layout pattern as sign-in
- Import `SignUp` from `@clerk/nextjs`

### 6. `app/_components/Navbar.tsx` — Auth UI

Convert Navbar to a **Client Component** (`"use client"`) to use Clerk hooks:

- Import `useUser`, `SignInButton`, `UserButton` from `@clerk/nextjs` (client import)
- Import `SignedIn`, `SignedOut` components from `@clerk/nextjs`
- **Replace Login button:** Wrap in `<SignedOut>` → render `<SignInButton>`. Wrap in `<SignedIn>` → render `<UserButton>`
- Subscribe button remains static
- Handle loading state with `isLoaded` from `useUser()`

---

## Security Requirements

- `ClerkProvider` inside `<body>` (Core 3 rule)
- No `CLERK_SECRET_KEY` in client code — only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` reaches the browser
- `proxy.ts` matcher excludes static files from middleware processing

---

## Acceptance Criteria

- [ ] `npm install @clerk/nextjs` succeeds
- [ ] `app/proxy.ts` exists with Clerk middleware and proper matcher
- [ ] `app/layout.tsx` wraps children in `<ClerkProvider>` inside `<body>`
- [ ] `/sign-in` renders Clerk's sign-in form
- [ ] `/sign-up` renders Clerk's sign-up form
- [ ] Navbar shows "Sign In" button when signed out (instead of static "Login")
- [ ] Navbar shows `UserButton` when signed in (with user avatar, manage account dropdown)
- [ ] Home page (`/`) loads without errors for signed-in and signed-out users
- [ ] News details page (`/news/1`) redirects unauthenticated users to `/sign-in`
- [ ] News details page (`/news/1`) loads successfully after signing in
- [ ] `npm run lint` — no errors
- [ ] `npm run build` — succeeds

---

## Checks to Run

```
npm run lint
npm run build
```

---

## Manual Test Steps After Implementation

1. Run `npm run dev`
2. Open `http://localhost:3000` — homepage loads, Navbar shows "Sign In" button
3. Click "Sign In" — navigates to `/sign-in`, Clerk sign-in form renders
4. Create an account or sign in with Google OAuth
5. After sign-in, redirect back to homepage — Navbar now shows UserButton with avatar
6. Click UserButton — dropdown shows "Manage account" and "Sign out"
7. **Without signing in**, open a new private/incognito window and navigate directly to `http://localhost:3000/news/1`
8. ✅ Verify: redirected to `/sign-in` (detail page is protected)
9. Sign in on that window — ✅ Verify: redirected back to `/news/1` after sign-in
10. Navigate to homepage — loads fine
11. Sign out — Navbar returns to "Sign In" button
12. Navigate directly to `/sign-up` — sign-up form renders
13. Build succeeds with `npm run build`
