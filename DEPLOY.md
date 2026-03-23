# Deploying to Vercel

## Prerequisites
- A [Vercel account](https://vercel.com) (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini
- (Optional) A Shopify store with Admin API access

---

## 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create shopify-ai-assistant --public --push
# or use: git remote add origin https://github.com/YOUR_USERNAME/REPO.git && git push -u origin main
```

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select your repo
3. Framework preset: **Other** (Vite is auto-detected)
4. Build command: `vite build`
5. Output directory: `dist`
6. Click **Deploy** (it will fail on first deploy — that's expected before setting env vars)

## 3. Set Environment Variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value | Required |
|------|-------|----------|
| `GEMINI_API_KEY` | Your Gemini API key | ✅ Yes |
| `ADMIN_PASSWORD` | A strong password | ✅ Yes |
| `SHOPIFY_SHOP_NAME` | e.g. `my-store` | Optional |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin token | Optional |

## 4. Redeploy

After setting env vars, go to **Deployments** → click the three dots on the latest → **Redeploy**.

## 5. Accessing the app

- **Storefront chat**: `https://your-app.vercel.app`
- **Admin dashboard**: `https://your-app.vercel.app?admin=1`

---

## Notes

### Socket.IO on Vercel
Vercel uses serverless functions which don't support persistent WebSocket connections.
This app is configured to use **long-polling** as the Socket.IO transport, which works
correctly on Vercel. The real-time live chat feature will work, but with slightly higher
latency than a dedicated server.

For production-grade WebSockets, consider upgrading to [Vercel's Pro plan](https://vercel.com/pricing)
or using a separate WebSocket service like [Ably](https://ably.com) or [Pusher](https://pusher.com).

### In-Memory Storage
All data (FAQs, leads, analytics, chat logs) is stored **in-memory**. This means data
resets on every deployment or when the serverless function cold-starts. For persistent
storage, add a database like [Vercel Postgres](https://vercel.com/storage/postgres) or
[PlanetScale](https://planetscale.com).

### Shopify-less Demo Mode
Without `SHOPIFY_SHOP_NAME` and `SHOPIFY_ACCESS_TOKEN`, the app runs in demo mode
with sample products. All other features (AI chat, admin dashboard, analytics) work fully.
