# ⚡ Quick Start Checklist

## Before You Start - Get Your API Keys

### 1️⃣ Supabase Setup (5 minutes)

- [ ] Go to https://supabase.com and create account
- [ ] Create new project (choose a region close to you)
- [ ] Wait for project to initialize (~2 minutes)
- [ ] Go to SQL Editor and run the `supabase-schema.sql` file
- [ ] Go to Settings → API and copy:
  - [ ] Project URL
  - [ ] anon/public key

### 2️⃣ Google Gemini API (2 minutes)

- [ ] Go to https://makersuite.google.com/app/apikey
- [ ] Sign in with Google
- [ ] Click "Create API Key"
- [ ] Copy the generated key

### 3️⃣ Configure Environment (1 minute)

- [ ] Open `.env` file in this project
- [ ] Paste your Supabase URL
- [ ] Paste your Supabase anon key
- [ ] Paste your Gemini API key
- [ ] Save the file

### 4️⃣ Launch (30 seconds)

- [ ] Run `npm run dev` in terminal
- [ ] Open http://localhost:3000
- [ ] Test with a URL like `github.com`

---

## 🎯 Your `.env` Should Look Like This:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc5ODIxMDAsImV4cCI6MjAwMzU1ODEwMH0.VeryLongStringHere
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## ✅ Success Indicators

When everything is working:

- ✅ No errors in terminal
- ✅ Website loads at localhost:3000
- ✅ You can enter a URL
- ✅ Analysis completes in 3-10 seconds
- ✅ You see: risk score, summary, screenshot, tags

---

## 🚨 Common Issues

| Problem                                  | Solution                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| "Missing Supabase environment variables" | Make sure `.env` file exists and has correct variable names  |
| "Failed to fetch website"                | Some sites block bots - try a different URL                  |
| Server won't start                       | Make sure port 3000 is free, or use `npm run dev -- -p 3001` |
| Database errors                          | Run the SQL schema in Supabase SQL Editor                    |

---

## 🧪 Test URLs

Try these to test different scenarios:

✅ **Safe Sites:**

- `github.com`
- `wikipedia.org`
- `stackoverflow.com`

⚠️ **Various Categories:**

- `amazon.com` (E-commerce)
- `bbc.com` (News)
- `medium.com` (Blog)

---

## 📦 What You Just Built

- ✅ Next.js 14 App Router application
- ✅ TypeScript codebase
- ✅ Tailwind CSS styling (dark mode)
- ✅ Supabase PostgreSQL database
- ✅ Google Gemini AI integration
- ✅ Website scraping with Cheerio
- ✅ Screenshot generation (Microlink)
- ✅ Smart 24-hour caching system
- ✅ Error handling & loading states
- ✅ Responsive mobile-first design

**All using 100% free services!** 🎉

---

## 📚 Next Steps

1. Test the app with various URLs
2. Check Supabase dashboard to see cached scans
3. Customize the UI colors in `app/page.tsx`
4. Deploy to Vercel for free hosting
5. Add your own features!

---

**Total setup time: ~10 minutes** ⏱️

Need detailed instructions? Check `SETUP.md`
