# GitHub Real Grass SVG Design

## Goal

Build a README-friendly GitHub contribution graph renderer. A user should be able to insert one Markdown image URL with their GitHub username and get a custom SVG contribution graph:

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=USERNAME)
```

The first version prioritizes a lightweight dynamic SVG that works well in GitHub README files. More realistic PNG rendering can be added later if SVG becomes visually limiting.

## Product Scope

The app exposes one public image endpoint:

```txt
GET /api/grass?username=USERNAME
```

The endpoint fetches the target user's contribution calendar from GitHub and returns an `image/svg+xml` response. Days with no contributions are rendered as brown dirt. Days with more contributions show denser green grass coverage. The visual style should feel like a connected Minecraft-inspired pixel field: more natural and playful than a flat GitHub heatmap, but still readable at README size.

Out of scope for the first version:

- PNG rendering.
- User accounts.
- Persistent database storage.
- Theme editor UI.
- Multiple graph layouts.
- GitHub Action generation.

## Architecture

Use a minimal Next.js project deployable to Vercel.

Main units:

- `app/api/grass/route.ts`: HTTP endpoint. Validates query params, fetches GitHub data, renders SVG, and returns image response headers.
- `src/github/contributions.ts`: GitHub GraphQL client for contribution calendar data.
- `src/render/svg.ts`: Pure SVG renderer. Accepts normalized contribution weeks and rendering options, returns an SVG string.
- `src/render/levels.ts`: Converts raw contribution counts into visual density levels.
- `src/render/escape.ts`: Escapes text values used in SVG.

The renderer should be pure and testable without network access. GitHub fetching and HTTP response handling should stay outside rendering code.

## Data Flow

1. Request arrives at `/api/grass?username=USERNAME`.
2. API validates `username`.
3. API reads `GITHUB_TOKEN` from environment.
4. API calls GitHub GraphQL `user(login:) { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount weekday }}}}}`.
5. Raw days are normalized into a stable list of weeks and days.
6. Each contribution count is mapped to a density level:
   - `0`: bare soil.
   - `1`: sparse grass.
   - `2`: light grass.
   - `3`: medium grass.
   - `4`: full grass.
7. SVG renderer creates a fixed-size README image.
8. API returns SVG with cache headers.

## Visual Design

Each day is a small top-down pixel tile. The whole grid should read as one connected Minecraft-inspired field rather than many separated cubes.

- Tile gaps should be minimal so adjacent days feel visually connected while still remaining individually countable.
- `0` contribution days are brown dirt tiles with subtle pixel variation.
- `1-4` contribution days are green grass tiles with deterministic pixel patches.
- Higher contribution levels increase green coverage, contrast, and patch density.
- Level `3` should feel as dense as the previous full-grass level.
- Level `3` and level `4` should use the same deep full-grass color palette.
- Level `4` should build on level `3` by adding one tiny pixel flower plus one smaller one-pixel flower accent that match the cute Minecraft-inspired mood without making the tile feel busy.
- Levels `1`, `2`, and `3` should have visibly distinct grass coverage and contrast, with level `3` clearly darker and denser than level `2`.
- Level `2` should be slightly darker than the light-grass feel while still staying clearly lighter than level `3`.
- Do not use tall grass blades or separate isometric cube faces in the README graph; those details become visually noisy at 365-day scale.
- Use simple SVG rectangles only for the field texture; no external images.

The visual should stay restrained:

- No large decorative background.
- Use a slightly darker, warm field background than near-white so the grass does not feel washed out, while keeping enough contrast for README readability.
- The overall SVG background panel should have a subtle border radius so the README image feels softer, without rounding individual contribution tiles.
- Background texture is optional; if used, it must be extremely subtle and not compete with the contribution tiles.
- No animated elements.
- No heavy gradients.
- No hidden dependency on custom fonts.
- No text that becomes unreadable in README embeds.

The first version should include a compact title such as `USERNAME's GitHub grass`, month labels, and a small legend from dirt to flowered full grass.
The title/header area should keep generous vertical breathing room so the title clearly separates from month labels and the first tile row.
The month labels should sit closer to the first tile row than the title, so the labels feel attached to the graph rather than floating midway in the header.

## Contribution Level Mapping

Use GitHub's returned calendar data but compute local levels so the graph reflects the selected user's range.

Mapping:

- `0`: count is exactly zero.
- `1`: count is greater than zero and at or below the 25th percentile of non-zero counts.
- `2`: above 25th and at or below 50th percentile.
- `3`: above 50th and at or below 75th percentile.
- `4`: above 75th percentile.

If the user has very few contribution days, fall back to simple thresholds:

- `1`: 1 contribution.
- `2`: 2-3 contributions.
- `3`: 4-6 contributions.
- `4`: 7 or more contributions.

"Very few contribution days" means fewer than four non-zero contribution days in the returned calendar.

## API Behavior

Required query params:

- `username`: GitHub username.

Validation:

- Allow only GitHub-compatible username characters: letters, numbers, and hyphens.
- Require the username to start and end with a letter or number.
- Reject consecutive hyphens.
- Limit length to 39 characters.
- Reject empty values.

Responses:

- `200 image/svg+xml`: successful rendered graph.
- `200 image/svg+xml`: invalid username rendered as a small error SVG with `X-GitHub-Real-Grass-Status: 400`.
- `200 image/svg+xml`: GitHub user not found rendered as a small error SVG with `X-GitHub-Real-Grass-Status: 404`.
- `200 image/svg+xml`: token/config/network failure rendered as a small error SVG with `X-GitHub-Real-Grass-Status: 500`.

Do not return JSON for image requests, because README embeds should still show a visible failure image.
Error SVG responses use HTTP `200` so README image proxies render the diagnostic image instead of showing a broken image.

## Caching

Use CDN-friendly headers:

```txt
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Content-Type: image/svg+xml; charset=utf-8
```

One-hour freshness is enough for README use and keeps GitHub API usage modest.
Error SVG responses should use `Cache-Control: no-store` so temporary failures are not cached.

## Configuration

Environment variable:

- `GITHUB_TOKEN`: GitHub token with permission to call the GraphQL API for public contribution data.

The README should explain that deployers need to add this token in Vercel project settings.

## Testing

Unit tests:

- Username validation.
- Contribution count to density level mapping.
- SVG escaping.
- Renderer output contains expected SVG structure and no raw unescaped username.

Integration-style tests:

- API returns SVG content type.
- Missing username returns an SVG error response.
- Mocked GitHub not-found response returns an SVG error response.

Manual verification:

- Start Next.js locally.
- Open `/api/grass?username=octocat`.
- Confirm the SVG renders in browser.
- Confirm Markdown embed format works in the generated README instructions.

## First Implementation Plan Boundary

The first implementation should create the Next.js project, add the SVG endpoint, add focused tests, and write README usage/deployment instructions. It should not implement PNG export or a visual editor.
