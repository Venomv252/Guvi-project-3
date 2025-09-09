# Netflix Clone

A full‑stack Netflix‑style streaming app with authentication, subscriptions, payments, and video playback.

## Tech Stack

- Frontend: React 18, React Router, Axios
- Backend: Node.js, Express, Helmet, CORS, express‑validator
- Auth: JWT (access/refresh), interceptors and refresh logic on the client
- Database: MySQL (mysql2/promise)
- Payments: Stripe Checkout (subscription mode)
- Storage/Streaming: Amazon AWS S3 (videos hosted and streamed from S3)

## Core Features

- Secure auth: register, login, refresh tokens, logout, route guards
- Video browsing: categories, genres, search suggestions, pagination
- Video playback: protected content requires active subscription
- Subscriptions: plans, status, history, cancel/reactivate
- Payments: Stripe Checkout, webhook handlers (dev helpers included)

## Project Structure

```
netflix-clone/
  backend/        # Express API (auth, videos, subscriptions, payments)
  frontend/       # React app (UI, contexts, services)
  database/       # Schema/migrations and setup script
```

## Getting Started (Dev)

1) Backend

```
cd backend
npm install
```

Create `backend/.env` with at least:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=netflix_streaming
# Optional for real Stripe flows
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Initialize/upgrade DB:

```
cd ../database
npm install   # first time only
node setup-database.js
```

Run API:

```
cd ../backend
npm run dev
```

2) Frontend

```
cd ../frontend
npm install
npm start
```

The frontend auto‑targets `/api` with a dev proxy to `http://localhost:5000`. Auth headers are attached automatically once you log in.

## Video Storage and Playback (AWS S3)

- Videos are hosted in Amazon AWS S3. The app loads/streams video files directly from S3 URLs (or via your CDN if configured).
- Thumbnails and media metadata can also be stored/retrieved from S3.
- Ensure your S3 objects are accessible via signed URLs or public as needed.

## Subscriptions in Development

- Production: Stripe webhooks update subscription status automatically.
- Development: a helper endpoint is available to activate a plan without Stripe:

```
POST /api/subscriptions/dev/activate { plan: "basic" | "premium" | "family" }
```

This sets `users.subscription_status = 'active'`, stores the plan, and marks the start date, so protected videos play locally.

## Testing the Flow

1. Register and log in
2. Choose a plan (dev: use the “Dev: Activate Plan” box on the Subscription page)
3. Browse and play a video

## Notes

- If you host videos in S3, configure proper CORS on the bucket and use signed URLs when needed.
- The API includes rate limiting and security headers. Adjust CORS origins to your domain in production.

## License

MIT