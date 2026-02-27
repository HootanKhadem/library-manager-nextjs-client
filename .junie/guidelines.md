# Project Guidelines: library-manager-nextjs-client

## Stack

- **Next.js 16** (App Router) with **React 19**, **TypeScript 5**, **Tailwind CSS v4**
- No backend — this is a pure client-side Next.js app
- Node.js package manager: `npm`

---

## Build & Configuration

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # run ESLint (eslint-config-next)
```

### Key config files

| File                 | Purpose                                                                              |
|----------------------|--------------------------------------------------------------------------------------|
| `next.config.ts`     | Next.js configuration                                                                |
| `tsconfig.json`      | TypeScript — uses `moduleResolution: bundler`, path alias `@/*` maps to project root |
| `postcss.config.mjs` | Tailwind CSS v4 via `@tailwindcss/postcss`                                           |
| `eslint.config.mjs`  | ESLint flat config with `eslint-config-next`                                         |

### Path alias

Use `@/` to import from the project root:

```ts
import Home from "@/app/page";
```

---

## Testing

### Setup

Testing uses **Jest** + **React Testing Library** + **ts-jest**:

```bash
npm test              # run all tests once
npm run test:watch    # run in watch mode
```

Config files:

- `jest.config.ts` — Jest config (jsdom environment, ts-jest transform, `@/` alias, CSS mocking via
  `identity-obj-proxy`)
- `jest.setup.ts` — imports `@testing-library/jest-dom` matchers

### Writing tests

- Place test files in `__tests__/` (root level) or co-locate as `*.test.tsx` next to components.
- Always mock `next/image` and `next/link` in unit tests — they are not compatible with jsdom:

```ts
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props}
        />;
    },
}));

jest.mock("next/link", () => ({
    __esModule: true,
    default: ({children, href}: { children: React.ReactNode; href: string }) => (
        <a href = {href} > {children} < /a>
    ),
}));
```

- Use `@testing-library/react` `render` + `screen` queries; prefer accessible queries (`getByRole`, `getByText`,
  `getByAltText`).
- Avoid snapshot tests for layout-heavy components; prefer behavioral assertions.

### Example test (`__tests__/page.test.tsx`)

```tsx
import {render, screen} from "@testing-library/react";
import Home from "@/app/page";

jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

describe("Home page", () => {
    it("renders the getting started heading", () => {
        render(<Home/>);
        expect(
            screen.getByText("To get started, edit the page.tsx file.")
        ).toBeInTheDocument();
    });
});
```

---

## Code Style & Best Practices

### App Router conventions

- All pages/layouts live under `app/`. Use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` conventions.
- Prefer **React Server Components** (RSC) by default. Add `"use client"` only when needed (event handlers, hooks,
  browser APIs).
- Fetch data directly in Server Components; avoid prop-drilling data from client to server.

### TypeScript

- Strict mode is enabled (`"strict": true`). Do not disable it.
- Avoid `any`; use proper types or `unknown` with narrowing.
- Use `React.FC` sparingly — prefer plain function declarations with explicit return types when needed.

### Tailwind CSS v4

- Tailwind v4 uses `@tailwindcss/postcss` — no `tailwind.config.js` needed by default.
- Use utility classes directly in JSX; avoid inline `style` props unless dynamic values require it.
- Dark mode classes (`dark:`) are used in the existing codebase — maintain this pattern.

### Imports

- Use the `@/` alias for all non-relative imports within the project.
- Group imports: external libraries → internal modules → styles.

### Next.js best practices

- Use `next/image` for all images (optimized loading, LCP improvement).
- Use `next/link` for all internal navigation (prefetching).
- Use `next/font` for fonts (already configured with Geist).
- Metadata: export a `metadata` object from `layout.tsx` or `page.tsx` for SEO.
- Environment variables: prefix with `NEXT_PUBLIC_` for client-side exposure; never expose secrets to the client.
