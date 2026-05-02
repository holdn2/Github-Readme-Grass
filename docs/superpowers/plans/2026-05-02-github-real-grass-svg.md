# GitHub Real Grass SVG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-deployable Next.js endpoint that returns a README-friendly SVG GitHub contribution graph styled as soil and grass.

**Architecture:** The API route validates the username, fetches GitHub contribution calendar data through GraphQL, normalizes levels, and returns SVG. Rendering stays pure and isolated from HTTP and network code so it can be tested without GitHub access.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, GitHub GraphQL API, Vercel serverless deployment.

---

## File Structure

- Create `package.json`: project scripts and dependencies.
- Create `tsconfig.json`: TypeScript settings.
- Create `next.config.mjs`: minimal Next.js config.
- Create `vitest.config.ts`: unit test config.
- Create `app/api/grass/route.ts`: public SVG image endpoint.
- Create `src/github/contributions.ts`: GitHub GraphQL client and data types.
- Create `src/render/escape.ts`: SVG text escaping.
- Create `src/render/levels.ts`: contribution count to grass density mapping.
- Create `src/render/svg.ts`: pure SVG renderer.
- Create `src/validation/username.ts`: GitHub username validation.
- Create `src/api/error-svg.ts`: compact SVG error response rendering.
- Create `src/test/*.test.ts`: focused unit tests.
- Create `README.md`: usage, Vercel deployment, environment variable setup.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Create package and config files**

Add a minimal Next.js TypeScript project with scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add a tiny homepage**

Create a plain page that explains the README image URL format and links to `/api/grass?username=octocat`.

- [ ] **Step 3: Run installation**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

## Task 2: Core Pure Utilities

**Files:**
- Create: `src/validation/username.ts`
- Create: `src/render/escape.ts`
- Create: `src/render/levels.ts`
- Create: `src/test/username.test.ts`
- Create: `src/test/escape.test.ts`
- Create: `src/test/levels.test.ts`

- [ ] **Step 1: Write validation tests**

Tests should accept `octocat`, `real-grass`, and `u39chars` style names, and reject empty values, underscores, leading hyphens, trailing hyphens, consecutive hyphens, and names longer than 39 characters.

- [ ] **Step 2: Implement username validation**

Expose `validateGithubUsername(value: string | null): { ok: true; username: string } | { ok: false; message: string }`.

- [ ] **Step 3: Write escaping tests**

Tests should verify `<`, `>`, `&`, `"`, and `'` are escaped for SVG text/attributes.

- [ ] **Step 4: Implement SVG escaping**

Expose `escapeSvgText(value: string): string`.

- [ ] **Step 5: Write level mapping tests**

Tests should cover zero counts, percentile-based mapping, and fallback thresholds for fewer than four non-zero days.

- [ ] **Step 6: Implement level mapping**

Expose `countToLevels(counts: number[]): number[]` returning levels `0` through `4`.

- [ ] **Step 7: Run tests**

Run: `npm test`

Expected: all utility tests pass.

## Task 3: SVG Renderer

**Files:**
- Create: `src/render/svg.ts`
- Create: `src/test/svg.test.ts`

- [ ] **Step 1: Write renderer tests**

Tests should verify the output starts with `<svg`, includes title, month labels, legend, and does not contain an unescaped dangerous username.

- [ ] **Step 2: Implement renderer**

Expose `renderGrassSvg(input: GrassSvgInput): string`, where input includes `username`, `weeks`, and optional `generatedAt`.

The renderer should draw:

- Soil base tile for every returned day.
- Darker lower edge for subtle depth.
- Grass overlays that increase by level.
- Month labels based on the first day in each month.
- A compact legend.

- [ ] **Step 3: Run renderer tests**

Run: `npm test -- src/test/svg.test.ts`

Expected: renderer tests pass.

## Task 4: GitHub GraphQL Client

**Files:**
- Create: `src/github/contributions.ts`
- Create: `src/test/contributions.test.ts`

- [ ] **Step 1: Write client tests with mocked fetch**

Tests should verify request body, token header, successful normalization, user-not-found error, and GraphQL error handling.

- [ ] **Step 2: Implement client**

Expose `fetchContributionCalendar(username: string, token: string, fetchImpl = fetch): Promise<ContributionCalendar>`.

- [ ] **Step 3: Run client tests**

Run: `npm test -- src/test/contributions.test.ts`

Expected: client tests pass.

## Task 5: API Route and Error SVG

**Files:**
- Create: `src/api/error-svg.ts`
- Create: `app/api/grass/route.ts`
- Create: `src/test/error-svg.test.ts`

- [ ] **Step 1: Write error SVG tests**

Tests should verify error output is valid SVG and escapes messages.

- [ ] **Step 2: Implement error SVG helper**

Expose `renderErrorSvg(title: string, message: string): string`.

- [ ] **Step 3: Implement API route**

The route should:

- Validate `username`.
- Return `400 image/svg+xml` for invalid username.
- Return `500 image/svg+xml` when `GITHUB_TOKEN` is missing.
- Fetch contribution data and render SVG.
- Return `404 image/svg+xml` when GitHub user is not found.
- Return `500 image/svg+xml` for other failures.
- Set `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`.

- [ ] **Step 4: Run typecheck and tests**

Run: `npm run typecheck`

Run: `npm test`

Expected: both pass.

## Task 6: README Documentation

**Files:**
- Create: `README.md`
- Create: `README.ko.md`

- [ ] **Step 1: Write English README**

Include README embed example, local setup, Vercel deployment, `GITHUB_TOKEN` setup, API parameters, and limitations.

- [ ] **Step 2: Write Korean README**

Translate the same content for readability.

- [ ] **Step 3: Run final verification**

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Expected: typecheck, tests, and build pass.
