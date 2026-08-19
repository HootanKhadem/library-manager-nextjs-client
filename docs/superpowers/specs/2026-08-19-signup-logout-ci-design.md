# Signup page, logout entry point, and CI pipeline

Date: 2026-08-19
Status: Approved (pending final user sign-off on this written spec)

## Context

The backend added two new endpoints (`library-manager-backend` OpenAPI spec):

- `POST /auth/signup` — creates a `USER`-role account, sets `access_token` /
  `refresh_token` httpOnly cookies exactly like `/auth/login`. Password rule:
  min 8 chars, ≥1 uppercase, ≥1 digit. Returns `400` (weak password / invalid
  preferences) or `409` (email already registered).
- `POST /auth/logout` — public, always succeeds, clears both cookies. Already
  wired up client-side (`src/app/api/auth/logout/route.ts`,
  `AuthContext.logout()`), but there is no UI control that calls it — no
  avatar, no menu, nothing. This spec gives it a home.

The frontend already has a fully-built `/login` page (split-panel layout,
own CSS module, deliberately **not** localized — hardcoded English, unlike
the rest of the app which goes through `useLanguage()`/`t.*`). It has a dead
"Create one" button and a "Continue with Google" button that is a `console.log`
stub. Both patterns are reused/adjusted below.

Also covers: GitHub Actions CI (test gate now, deploy stub for later).

## 1. Signup page

New route `src/app/signup/page.tsx` + `src/app/signup/signup.module.css`.
Visually mirrors `/login`'s split panel (same dark brand aside: logo, tagline,
feature bullets) — copy the CSS module rather than extracting a shared one,
matching the existing per-page convention and avoiding a risky move of the
tested `/login` route. No i18n, consistent with `/login`.

**Removed vs. login:** no "Continue with Google" button/divider (per explicit
request — login's stays untouched, it's covered by an existing test).

**Fields:** Name, Email, Password, Confirm Password.

- Password field shows a live requirements checklist under it (3 lines: 8+
  characters / one uppercase letter / one number), each line switches to a
  checked/green state as the typed value satisfies it. Mirrors the backend
  rule from the OpenAPI spec so the user never hits a surprise 400.
- Confirm Password: client-side only, must equal Password.
- Show/hide toggle on both password fields (same eye-icon pattern as login).

**Submit flow:**

1. Client validation, in order: all fields non-empty → password rule → passwords
   match. First failing rule shown as inline error, mirrors login's error style
   (`role="alert"`, rose text).
2. Calls new `AuthContext.signup(name, email, password)`.
3. `signup()` POSTs `{name, email, password}` to new
   `src/app/api/auth/signup/route.ts`, a proxy route that mirrors
   `login/route.ts`: forwards to `${API_BASE_URL}/auth/signup`, extracts
   `access_token`/`refresh_token` from the backend JSON response, sets them
   as the same two httpOnly cookies `login/route.ts` sets, returns
   `{ok: true}` (400/409 bodies passed through with the backend's `message`).
4. On success: same as login's "remember me" checked — persists the session
   flag to `localStorage` (signup implies "keep me signed in", there's no
   remember-me checkbox on this form) and redirects to `/dashboard`.
5. On 409: inline error "An account with this email already exists.", plus a
   link back to `/login`.
6. On 400 / network / other failure: show the backend message, or a generic
   "Something went wrong. Please try again." on network failure — same
   pattern as login's `catch` block.

**Loading state:** button reads "Creating account…" and is disabled while in
flight, matching login's "Signing in…".

**Redirect guard:** same as `/login` — renders nothing until `hydrated`, and
`router.replace('/dashboard')` if already authenticated.

## 2. Entry points into signup

- **Login page:** the existing "Create one" button (currently a no-op
  `<button type="button">`, kept as a `<button>` — not a `Link` — so the
  existing `getByRole("button", {name: /create one/i})` test keeps passing)
  gets an `onClick` that does `router.push('/signup')`.
- **Signup page footer:** mirrors login's footer — "Already have an account?
  Sign in" → `router.push('/login')`.
- **Marketing site header** (`src/app/(marketing)/_components/MarketingHeader.tsx`):
  currently has one filled rose "Sign in" pill linking to `/login`. Add a
  second, visually secondary "Sign up" link next to it (outline/ghost style,
  not competing with the rose pill) linking to `/signup`. This is the "make
  it available like the sign in button" placement — same header, same
  always-visible position, both breakpoints (the container isn't
  breakpoint-hidden today, so no extra responsive work needed). The two
  hero/closing-CTA "Sign in to your library" buttons on the marketing
  homepage are left as single-CTA sections — not touched.

## 3. AuthContext changes

- New method `signup(name: string, email: string, password: string): Promise<boolean>`,
  structurally parallel to `login()`.
- Both `login()` and `signup()` now also persist the values the user typed
  (`name` when available, `email`) into the same storage tier as the session
  flag (`localStorage` for signup/remember, `sessionStorage` otherwise),
  under new keys (`librax_email`, `librax_name`) — **not** a new field on the
  existing `librax_session` key, so none of the existing `AuthContext.test.tsx`
  assertions (which check only `librax_session`) or the login route's
  `toEqual({ok: true})` body assertion are affected. This is a client-only
  echo of what the user already typed — no new backend calls, no change to
  the login proxy route or its response shape.
- Context value gains `user: {name?: string; email?: string} | null`,
  hydrated from those same storage keys, cleared on `logout()`.

## 4. Logout — Topbar avatar dropdown

`src/components/Topbar.tsx` gains, in `endSlot`, a trailing avatar button
(reuses the existing `Avatar` UI component, keyed off `user.name ?? user.email`):

- Click toggles a small absolutely-positioned dropdown panel: non-interactive
  header row (name + email, falls back to just email if no name), a divider,
  then one menu item "Log out" (lucide `LogOut` icon) that calls
  `useAuth().logout()` then `router.replace('/login')`.
- `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`role="menuitem"`,
  closes on outside click and `Escape`, matching the accessibility patterns
  already used elsewhere in the app (see `BarcodeScanner`/`Modal`).
- New i18n key `t.topbar.logout` in both `en.ts` and `fa.ts` — Topbar is
  localized (unlike the auth pages), so this follows that convention.

## 5. CI pipeline

New `.github/workflows/ci.yml`:

- Triggers: `push` to `master`, `pull_request` targeting `master`.
- Job `test`: `actions/checkout`, `actions/setup-node@v4` pinned to Node 20
  (matches `Dockerfile`'s `node:20-alpine`), `npm ci`, then in order:
  `npm run lint`, `npm run typecheck` (new script, `tsc --noEmit` — the
  project already has `"noEmit": true` in `tsconfig.json` but no script
  wired to it), `npm test -- --ci`, `npm run build` (catches build-only
  failures Jest won't).
- Job `deploy`: `needs: test`, `if: github.event_name == 'push' && github.ref == 'refs/heads/master'`.
  Body is a single placeholder step that echoes a TODO
  (mentions the existing `Dockerfile`/`docker-compose.yml` as the likely
  next step: build & push an image). Not implemented now, per explicit
  instruction — this just gives it a slot in the pipeline so wiring up the
  real deploy later is additive, not a pipeline redesign.

## Out of scope

- `/login` page itself (Google button, layout, copy) — untouched.
- Backend changes — none needed, both endpoints already exist per the
  OpenAPI spec.
- Actual deploy implementation — explicitly deferred by the user.
- Forgot-password flow — the button exists on `/login` already as a stub;
  not part of this spec.
