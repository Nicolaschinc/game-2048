---
name: "vercel-web"
description: "Deploy frontend to Vercel and guide setup. Invoke when user asks to deploy web app to Vercel or configure Vercel for current project."
---

# Vercel Web

This skill helps deploy web frontends (Vite/React, Vue, Angular, static SPA) to Vercel with correct build settings, SPA routing fallback, and environment configuration.

## When to Invoke
- User asks to deploy a web app to Vercel
- Need to set up Vercel config or CLI for the current project
- Need SPA fallback or environment variable configuration for Vercel

## Capabilities
- Analyze project to determine build command and output directory
- Recommend/prepare `vercel.json` for SPA routing fallback
- Provide CLI steps: link project, add env, deploy preview/production
- Troubleshoot common issues (404 routing, wrong output folder, missing build)

## Quick Start (Vite + React)
1. Ensure scripts:
   - build: `npm run build` produces `dist`
2. Install CLI:
   - `npm i -g vercel`
3. Link & login:
   - `vercel login`
   - `vercel link` (select or create project)
4. Deploy:
   - Preview: `vercel deploy`
   - Production: `vercel --prod`

## Optional: SPA Fallback
Create `vercel.json` at project root to ensure client-side routing works:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## Environment Variables
- Add: `vercel env add <NAME> <development|preview|production>`
- Pull to local: `vercel env pull .env`

## Troubleshooting
- 404 on client routes: add `rewrites` in `vercel.json`
- Empty deploy: set `build` script and ensure output is `dist`
- Build fails: run `npm run build` locally to reproduce and fix

## Notes
- Vercel auto-detects frameworks; this skill ensures consistent configuration and commands.
