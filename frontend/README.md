This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

`pnpm dev` uses webpack mode by default to reduce Linux file-watcher pressure. If you want Turbopack explicitly, use `pnpm dev:turbo`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend connectivity

The frontend proxies API requests to the backend via `/api/*`. If the proxy cannot reach your backend (common in Docker or multi-host setups), set a reachable base URL:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Save it in `frontend/.env.local` and restart the dev server.

## Troubleshooting

### Linux: `OS file watch limit reached` / `next/dist/compiled/picomatch`

If you see:
- `Module not found: Can't resolve 'next/dist/compiled/picomatch'`
- `Unable to watch ...`
- `OS file watch limit reached`

this is usually an inotify watcher limit issue, not a missing package.

Temporary fix for current session:

```bash
sudo sysctl fs.inotify.max_user_watches=524288 fs.inotify.max_user_instances=1024
```

Persistent fix:

```bash
cat <<'EOF' | sudo tee /etc/sysctl.d/99-sabahub-inotify.conf
fs.inotify.max_user_watches=524288
fs.inotify.max_user_instances=1024
EOF
sudo sysctl --system
```

If a stale Next lock remains after a crash:

```bash
rm -f .next/dev/lock
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
