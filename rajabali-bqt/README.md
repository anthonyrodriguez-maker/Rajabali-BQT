# Rajabali BQ Tracker

Q2 Bottom Quartile performance tracking app for The Rajabali Group.

## Setup

1. Push this repo to GitHub
2. Import into Vercel
3. Add environment variable in Vercel: `DATABASE_URL` = your Neon connection string
4. Deploy

## Initialize the database

After first deploy, visit:
`https://your-app.vercel.app/api/init` (POST request — use a tool like Postman or run once from the browser console)

Or add this to your browser console on the live site:
```js
fetch('/api/init', { method: 'POST' }).then(r => r.json()).then(console.log)
```

## Roles

- **VP** — Anthony Rodriguez — sees all networks, can edit status/checkboxes
- **Network Leaders** — see their network only, read-only status
- **ARLs** — see their stores only, can log visits

## Stack

- Next.js 14
- Neon (Postgres)
- Vercel
