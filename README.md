# GitHub Real Grass

GitHub Real Grass renders a README-friendly SVG contribution graph for a GitHub user. It fetches the user's public contribution calendar and returns a small soil-and-grass image where busier days have more grass coverage.

The current renderer is the first SVG version. A more realistic PNG renderer may be added later if SVG becomes visually limiting.

Korean documentation: [README.ko.md](README.ko.md)

## README Embed

Deploy the app, then add this Markdown image to a README:

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=USERNAME)
```

Replace `your-app.vercel.app` with your deployment URL and `USERNAME` with a GitHub username.

## API

```txt
GET /api/grass?username=USERNAME
```

Parameters:

| Name | Required | Description |
| --- | --- | --- |
| `username` | Yes | GitHub username to render. Letters, numbers, and hyphens only; must start and end with a letter or number; no consecutive hyphens; maximum 39 characters. |

Responses are always SVG so README image embeds show a visible result or error image:

| Status | Content type | Meaning |
| --- | --- | --- |
| `200` | `image/svg+xml` | Contribution graph rendered. |
| `400` | `image/svg+xml` | Invalid or missing username. |
| `404` | `image/svg+xml` | GitHub user was not found. |
| `500` | `image/svg+xml` | Missing token, GitHub API failure, or server error. |

## Cache Behavior

The endpoint returns CDN-friendly cache headers:

```txt
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Content-Type: image/svg+xml; charset=utf-8
```

Fresh data is cached for one hour, with stale responses allowed while the CDN revalidates.

## Local Setup

Requirements:

- Node.js
- npm
- GitHub token that can call the GitHub GraphQL API for public contribution data

Install dependencies:

```sh
npm install
```

Create `.env.local`:

```env
GITHUB_TOKEN=github_pat_your_token_here
```

Start the development server:

```sh
npm run dev
```

Open:

```txt
http://localhost:3000/api/grass?username=octocat
```

## Vercel Deployment

1. Import this repository into Vercel as a Next.js project.
2. Add `GITHUB_TOKEN` in Vercel project settings under Environment Variables.
3. Deploy.
4. Use your Vercel URL in the README embed:

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=octocat)
```

## GITHUB_TOKEN

`GITHUB_TOKEN` is required because the endpoint reads contribution calendar data through GitHub GraphQL.

For public contribution data, use a token with permission to access the GitHub GraphQL API. Do not expose the token in client-side code or README examples; configure it only as an environment variable.

## Limitations

- SVG only in the first version; PNG may come later.
- No user accounts, database storage, theme editor, GitHub Action generation, or alternate layouts.
- Data freshness is limited by the one-hour cache headers.
- GitHub API rate limits and token permissions can affect availability.
- Private contribution visibility depends on what the token and GitHub API are allowed to see.

## Development Commands

```sh
npm run dev
npm run typecheck
npm test
npm run build
```
