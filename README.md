# 🔗 LinkRay - AI Link Analyzer

**Know before you visit.**

LinkRay is a modern, full-stack web app that uses AI to analyze, summarize, and score the safety of any website link. It features user authentication, smart caching, beautiful UI, and robust error handling—all built on a 100% free-tier stack.

---

## 🚀 Features

- 🤖 **AI-Powered Analysis**: Google Gemini (multi-model fallback) for content and risk scoring
- 🛡️ **Safety Scoring**: 0-100 risk score with color-coded UI
- 📸 **Screenshots**: Website previews via Microlink API
- ⚡ **Smart Caching**: 24-hour cache per user+URL (Supabase)
- 👤 **User Accounts**: Google OAuth login, per-user scan history
- 🎨 **Modern UI**: Tailwind CSS, dark mode, skeleton loaders for images
- 📝 **Summaries & Tags**: AI-generated summaries, categories, and tags
- 🆓 **100% Free Stack**: No paid services required

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL, RLS, policies)
- **AI**: Google Gemini (Gemma, Flash, fallback logic)
- **Scraping**: Cheerio (static, no headless browser)
- **Screenshots**: Microlink API
- **Language**: TypeScript

---

## 🏗️ Project Structure

```
linkray-app/
├── app/
│   ├── api/
│   │   ├── analyze/       # Main AI analysis API
│   │   │   └── route.ts
│   │   ├── analyze/deep/  # Deep crawl AI analysis
│   │   │   └── route.ts
│   │   └── recent/        # Recent scans API
│   │       └── route.ts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main UI (search, results)
├── lib/
│   ├── supabase.ts        # Supabase client & helpers
│   └── utils.ts           # Utility functions (hash, crawl, etc.)
├── types/
│   └── index.ts           # TypeScript interfaces
├── supabase-schema.sql    # DB schema & RLS policies
├── supabase-migration-*.sql # DB migrations
├── .env.example           # Env vars template
├── package.json           # Dependencies
├── tailwind.config.ts     # Tailwind config
├── next.config.js         # Next.js config
└── README.md              # This file
```

---

## ⚡ Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourname/linkray-app.git
   cd linkray-app
   npm install
   ```
2. **Set Up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase-schema.sql` and all `supabase-migration-*.sql` in SQL Editor
   - Get your Project URL and anon key from Settings > API
3. **Get Google Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create and copy your API key
4. **Configure Environment**
   - Copy `.env.example` to `.env` and fill in your keys
5. **Run the App**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🧠 How It Works

1. **User signs in** (Google OAuth via Supabase)
2. **User enters a URL**
3. **Cache check**: If scan exists for user+URL in last 24h, return cached result
4. **Scraping**: Fetches and cleans HTML with Cheerio
5. **AI Analysis**: Sends content to Gemini (multi-model fallback)
6. **Screenshot**: Gets preview from Microlink
7. **Save**: Upserts scan to DB (user_id, url_hash unique)
8. **Result**: Returns summary, risk score, tags, screenshot, etc.

---

## 🗄️ Database Schema (Supabase)

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  url_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reason TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT scans_user_url_unique UNIQUE (user_id, url_hash)
);
```

**RLS Policies:**

- Users can only read/insert their own scans
- Updates/deletes are blocked (immutable cache)

---

## 📦 API Endpoints

### `POST /api/analyze`

Analyze a URL (quick scan, per-user cache).

**Request:**

```json
{ "url": "https://example.com" }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "url": "https://example.com",
    "summary": "...",
    "risk_score": 85,
    "reason": "...",
    "category": "Blog",
    "tags": ["tech", "tutorial"],
    "screenshot_url": "https://api.microlink.io/...",
    "created_at": "...",
    "from_cache": false
  }
}
```

### `POST /api/analyze/deep`

Deep crawl and analyze a site (multiple pages, more detail).

### `GET /api/recent`

Get recent scans for the signed-in user.

---

## 🎨 UI/UX Highlights

- Responsive dark mode design
- Color-coded safety scores (green/yellow/red)
- Skeleton loader for screenshots
- Error and loading states
- Recent scans list (per user)

---

## 🔒 Security & Safety

- RLS: Users can only access their own scans
- All input validated and sanitized
- Timeout guards on scraping
- No headless browser (static parsing only)
- API keys and secrets in `.env`

---

## 📝 License

MIT License — Free for personal or commercial use.

---

## 🙏 Credits

- Google Gemini AI
- Supabase
- Microlink
- Next.js
- Vercel

---

## 💡 Future Ideas

- [ ] Batch URL analysis
- [ ] Browser extension
- [ ] PDF report export
- [ ] Webhook notifications
- [ ] API rate limiting

---

**Happy scanning!**
