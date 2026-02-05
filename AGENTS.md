# Atlas Automotriz - Agent Guide

Purpose
- Provide build/lint/test commands and code style guidance for agentic tools.

Repository summary
- Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS + shadcn/ui.
- Assets served from Supabase Storage (CDN) or local `public/`.

Rules files
- No `.cursor/rules/*`, `.cursorrules`, or `.github/copilot-instructions.md` found.

Commands

Install
- `npm install`

Dev server
- `npm run dev` (Next.js dev server)

Build
- `npm run build` (production build)

Lint
- `npm run lint` (ESLint, Next core-web-vitals + TypeScript)

Tests
- No test runner configured in `package.json`.
- Single-test command: not available (add a test runner first).

Environment
- CDN mode uses Supabase assets.
  - `NEXT_PUBLIC_ASSET_MODE=cdn`
  - `NEXT_PUBLIC_ASSET_BASE_URL=https://<PROJECT_REF>.supabase.co/storage/v1/object/public/assets`
- Local mode uses assets under `public/`.
  - `NEXT_PUBLIC_ASSET_MODE=local`

App structure
- App Router under `app/`.
- UI components in `components/` and `components/ui/`.
- Data helpers in `lib/`.

TypeScript and build behavior
- TypeScript is `strict: true` in `tsconfig.json`.
- Next config has `typescript.ignoreBuildErrors: true` (builds can succeed with TS errors).
- Keep types correct anyway; do not rely on build ignoring errors.

Coding conventions

Imports
- Use absolute imports via `@/` alias.
- Order: third-party, then app imports, then local relative imports.
- Import types with `import type { ... }` when possible.
- Avoid deep relative paths when a `@/` path exists.

Formatting
- Use existing formatting in files (2 spaces, Prettier-like).
- Keep JSX props on multiple lines when line length grows.
- Prefer trailing commas where already used.

React/Next patterns
- Default to server components in `app/` unless client behavior is needed.
- Add `"use client"` only when hooks or browser APIs are required.
- Use Next `Link` for internal navigation.
- Avoid direct `window` usage in server components.

State and hooks
- Keep hooks at top-level; avoid conditional hooks.
- Use `useMemo` for derived data used in rendering large lists.
- Prefer `useEffect` for browser-only side effects.

Type usage
- Prefer explicit types for public props and exported helpers.
- Use `type` for object shapes; `interface` is acceptable but keep consistent.
- Avoid `any`; if necessary, add a narrow type and a TODO comment.

Naming conventions
- Components: `PascalCase`.
- Props/types: `PascalCase` for types, `camelCase` for values.
- Files: `kebab-case` for routes, `camelCase` for component files.
- Constants: `UPPER_SNAKE_CASE` for true constants.

Error handling
- Handle data fetch errors explicitly in server components where needed.
- Use `try/catch` around external data sources (Supabase/remote assets).
- Log errors with context; avoid swallowing errors silently.

UI and styling
- Use Tailwind CSS utility classes.
- Prefer existing shadcn/ui components from `components/ui/`.
- Keep dark/light styling consistent (`bg-background`, `text-foreground`, etc.).
- Avoid inline styles unless needed for computed values.

Accessibility
- Include `aria-label` on icon-only buttons.
- Provide `alt` text for images (or empty `alt` when purely decorative).

Assets and CDN
- Use `getFlagSrc` and logo helpers for image URLs.
- Do not rename brand/model/logos; those are language-invariant.

Routing
- App Router pages in `app/` with nested routes for brands, tiers, quizzes.
- Use `app/api/*` for route handlers.

Data notes
- Country and brand maps in `lib/` are source of truth for filtering/grouping.
- Avoid embedding large datasets in components; load via helpers.

Linting
- ESLint config is based on `eslint-config-next`.
- Keep code compatible with Next lint rules (e.g., hooks, image usage).

When modifying UI text
- Keep Spanish as the default language unless adding explicit i18n logic.
- Preserve proper nouns (brand names, model names, logos).

Suggested workflow for changes
- Read existing component to match style and structure.
- Update types and props for new behavior.
- Keep UI consistent with existing design tokens.
- Run `npm run lint` if you change TS/JS/TSX.

Notes for agentic tools
- Do not introduce new dependencies without user approval.
- Avoid editing unrelated files.
- Prefer minimal, focused changes.
