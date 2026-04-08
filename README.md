# R3viewRadar

**Universal review aggregator** — search once, see reviews from Google, Yelp, Amazon, Reddit, TripAdvisor, and Trustpilot all in one place.

Live at: [r3viewradar.com](https://r3viewradar.com)

---

## Features

- **Dual search modes**: Businesses & Places (with location) or Products
- **6 platform adapters**: Google Places, Yelp Fusion, Reddit, Amazon (via SerpAPI), TripAdvisor (via SerpAPI), Trustpilot (via SerpAPI)
- **Location-based search**: Enter a zip code, city, or use browser geolocation for nearby business results
- **Aggregated dashboard**: Overall score ring, sentiment breakdown, per-platform ratings, and best-rated platform highlight
- **Review filtering**: Filter by star rating, sort by newest / highest / lowest, filter by platform
- **Graceful fallback**: Works with realistic simulated data when API keys aren't configured
- **Dark modern UI**: Space Grotesk font, teal accent, fully responsive
- **API status page**: Live dashboard showing which platforms are connected vs. using simulated data

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express (local dev) / Vercel Serverless Functions (production)
- **Styling**: Custom CSS (no framework)
- **Deployment**: Vercel

---

## Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/r3viewradar.git
cd r3viewradar

# 2. Install dependencies
npm install

# 3. (Optional) Add API keys — copy .env.example to .env and fill in your keys
cp .env.example .env

# 4. Start development servers (frontend + backend)
npm run dev
```

The app runs at `http://localhost:5173` (frontend) with API proxied to `http://localhost:3001` (backend).

Without any API keys, the app uses realistic simulated data so the interface always works.

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/r3viewradar.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your `r3viewradar` repo
3. Vercel auto-detects Vite — no config changes needed
4. Under **Environment Variables**, add your API keys:

| Variable | Service | Required? |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Optional |
| `YELP_API_KEY` | [Yelp Developers](https://www.yelp.com/developers/v3/manage_app) | Optional |
| `REDDIT_CLIENT_ID` | [Reddit Apps](https://www.reddit.com/prefs/apps) | Optional |
| `REDDIT_CLIENT_SECRET` | Reddit Apps | Optional |
| `SERPAPI_KEY` | [SerpAPI](https://serpapi.com/manage-api-key) | Optional |

5. Click **Deploy**

### Step 3: Connect Your Domain

1. In Vercel → Project → **Settings** → **Domains**
2. Add `r3viewradar.com`
3. Vercel shows DNS records to add — go to GoDaddy DNS and add them:
   - **A record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`
4. Wait 10-30 minutes for DNS propagation
5. Vercel auto-provisions HTTPS

---

## Project Structure

```
r3viewradar/
├── api/                          # Backend (Vercel serverless functions)
│   ├── adapters/                 # Platform-specific API adapters
│   │   ├── google.ts             # Google Places API (New)
│   │   ├── yelp.ts               # Yelp Fusion API
│   │   ├── reddit.ts             # Reddit OAuth2 API
│   │   ├── serpapi.ts            # Amazon, TripAdvisor, Trustpilot via SerpAPI
│   │   └── index.ts              # Adapter registry
│   ├── utils/
│   │   ├── mockData.ts           # Deterministic mock review generator
│   │   └── orchestrator.ts       # Parallel fetch + aggregation engine
│   ├── search.ts                 # GET/POST /api/search (Vercel function)
│   ├── status.ts                 # GET /api/status (Vercel function)
│   ├── index.ts                  # Local dev Express server
│   └── types.ts                  # Shared TypeScript types
├── src/                          # Frontend (React + Vite)
│   ├── components/
│   │   ├── Header.tsx            # App header with logo + nav
│   │   ├── Footer.tsx            # App footer
│   │   ├── StarRating.tsx        # SVG star rating component
│   │   ├── ScoreRing.tsx         # Animated SVG score ring
│   │   ├── SentimentBar.tsx      # Animated sentiment breakdown bars
│   │   ├── PlatformCard.tsx      # Platform sidebar card
│   │   ├── ReviewCard.tsx        # Individual review card
│   │   ├── LoadingState.tsx      # Radar sweep loading animation
│   │   └── CategoryPills.tsx     # Category filter pills
│   ├── pages/
│   │   ├── SearchPage.tsx        # Home / search page
│   │   ├── ResultsPage.tsx       # Results dashboard
│   │   └── HowItWorksPage.tsx    # How it works + API status
│   ├── styles/
│   │   └── global.css            # All styles (dark theme, responsive)
│   ├── types.ts                  # Frontend TypeScript types
│   ├── App.tsx                   # Router setup
│   └── main.tsx                  # Entry point
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                   # Vercel deployment config
├── .env.example                  # Environment variable template
├── .gitignore
└── README.md
```

---

## API Endpoints

### `GET /api/search`

Search and aggregate reviews across all platforms.

**Query parameters:**
- `query` (required) — search term
- `type` (required) — `business` or `product`
- `category` — optional category filter
- `location` — zip code or city name (business searches)
- `lat` / `lng` — GPS coordinates (business searches)

**Response:** `SearchResult` object with overall rating, platform summaries, sentiment breakdown, and aggregated reviews.

### `GET /api/status`

Returns the configuration status of each platform adapter (live vs. simulated).

---

## License

MIT
