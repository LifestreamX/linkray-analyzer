# 🔍 LinkRay - AI Link Pre-screener

**Know before you click.** A modern, AI-powered link analysis tool that provides safety scores, summaries, and screenshots for any URL.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Uses Google Gemini 1.5 Flash for intelligent content analysis
- 🛡️ **Safety Scoring** - Get a 0-100 safety rating for any website
- 📸 **Screenshots** - Automatic website preview using Microlink API
- ⚡ **Smart Caching** - Returns cached results within 24 hours to save API costs
- 🎨 **Modern UI** - Beautiful dark mode interface with Tailwind CSS
- 🆓 **100% Free Stack** - Built entirely with free-tier services

## 🛠️ Tech Stack (Free Tier)

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 1.5 Flash
- **Scraping**: Cheerio (lightweight, no headless browser)
- **Screenshots**: Microlink API (free tier)
- **Language**: TypeScript

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier)
- A Google Gemini API key (free tier)

### 2. Clone & Install

```bash
cd website-summary
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to the SQL Editor
3. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
4. Go to Settings > API to get your project URL and anon key

### 4. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

## 📦 Project Structure

```
linkray/
├── app/
│   ├── api/
│   │   ├── analyze/       # Main analysis API endpoint
│   │   │   └── route.ts
│   │   └── recent/        # Recent scans endpoint
│   │       └── route.ts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main landing page
├── lib/
│   ├── supabase.ts        # Supabase client & helpers
│   └── utils.ts           # Utility functions
├── types/
│   └── index.ts           # TypeScript interfaces
├── supabase-schema.sql    # Database schema
├── .env.example           # Environment variables template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── package.json           # Dependencies
```

## 🔧 How It Works

1. **User Input**: User enters a URL
2. **Cache Check**: System checks Supabase for existing scan (within 24 hours)
3. **Scraping**: If no cache, fetches HTML using `fetch` with timeout guard
4. **Content Extraction**: Uses Cheerio to extract and clean main content
5. **AI Analysis**: Sends content to Gemini AI for analysis
6. **Data Storage**: Saves result to Supabase with MD5 hash for caching
7. **Response**: Returns safety score, summary, category, tags, and screenshot

## 🎯 API Endpoints

### POST `/api/analyze`

Analyzes a URL and returns safety information.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://example.com",
    "summary": "Two-sentence summary",
    "risk_score": 85,
    "category": "Blog",
    "tags": ["technology", "programming", "tutorial"],
    "screenshot_url": "https://api.microlink.io/...",
    "created_at": "2026-02-07T...",
    "from_cache": false
  }
}
```

### GET `/api/recent`

Fetches the most recent scans.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

## 🔒 Safety Features

- **Timeout Protection**: 5-second timeout for website fetches
- **Content Validation**: Ensures meaningful content before analysis
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Built-in caching reduces API calls
- **No Execution**: Uses Cheerio (static parsing) instead of headless browsers

## 🎨 UI Features

- Modern dark mode design
- Color-coded safety scores (Green: Safe, Yellow: Caution, Red: Risky)
- Loading states with skeleton loaders
- Error handling with clear messages
- Recent scans section for quick analysis
- Responsive design for mobile/desktop

## 📊 Database Schema

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  url_hash TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP
);
```

## 🚀 Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy! 🎉

**Important**: Vercel's free tier has a 10-second timeout limit, which is handled in the code.

## 🔄 Caching Strategy

LinkRay implements smart caching to minimize API costs:

- URLs are hashed using MD5
- Cache is valid for 24 hours
- Cached results are returned instantly
- Fresh analysis only when cache expires

## 🤝 Contributing

This is a learning project demonstrating modern full-stack development. Feel free to fork and customize!

## 📝 License

MIT License - Use freely for personal or commercial projects.

## 🙏 Credits

- **Google Gemini AI** - For free, fast AI analysis
- **Supabase** - For PostgreSQL database hosting
- **Microlink** - For screenshot generation
- **Next.js** - For the amazing React framework
- **Vercel** - For free hosting

## 💡 Future Enhancements

- [ ] User accounts for scan history
- [ ] Batch URL analysis
- [ ] Browser extension
- [ ] API rate limiting per IP
- [ ] PDF report generation
- [ ] Webhook notifications

---

Built with ❤️ using 100% free-tier services. No credit card required! 🚀
