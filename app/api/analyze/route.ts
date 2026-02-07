import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { getCachedScan, saveScan, supabase } from '@/lib/supabase';
import { hashUrl, validateUrl } from '@/lib/utils';
import type {
  AnalysisRequest,
  GeminiAnalysisResult,
  ScrapedContent,
} from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Timeout for fetch requests (8 seconds)
const FETCH_TIMEOUT = 8000;

/**
 * Fetch HTML with timeout guard
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Site took too long to respond');
    }
    throw error;
  }
}

/**
 * Scrape and clean website content using cheerio
 */
function scrapeContent(html: string): ScrapedContent {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, iframe, noscript, svg').remove();

  // Try to get the main content
  let text = '';
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '#content',
    '.content',
    'body',
  ];

  for (const selector of mainSelectors) {
    const content = $(selector).text();
    // Keep the largest block of text found
    if (content.length > text.length) {
      text = content;
    }
  }

  // Clean whitespace and limit length to save tokens
  text = text.replace(/\s+/g, ' ').trim().substring(0, 12000);

  const title = $('title').text().trim() || 'Unknown Website';

  return { text, title };
}

/**
 * Analyze content with Gemini AI
 */
async function analyzeWithAI(
  content: ScrapedContent,
): Promise<GeminiAnalysisResult> {
  // ✅ Using 'gemini-flash-latest' which is working for your account
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json' },
  });

  // ✅ UPDATED PROMPT: Requesting a bigger, better summary
  const prompt = `You are a cybersecurity expert. Analyze this website content.
  Title: ${content.title}
  Content: ${content.text}

  Rules for Risk Score (0-100, where 100 is Safe):
  - Phishing, Scams, Malware = 0-20
  - Spammy, Low Quality, Unverified Crypto = 30-50
  - Legitimate Business, Blogs, News = 80-90
  - Verified Tech Platforms (e.g., GitHub, AWS, Google) = 95-100

  Return a JSON object with this EXACT structure:
  {
    "summary": "A detailed 3-4 sentence paragraph summarizing the website's purpose, key features, and target audience.",
    "risk_score": 50,
    "reason": "Explain why you gave this risk_score, referencing specific content. Be consistent with the score.",
    "category": "Category Name",
    "tags": ["tag1", "tag2", "tag3"]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON
    const analysis = JSON.parse(text);

    return {
      summary: analysis.summary || 'Unable to generate summary',
      risk_score:
        typeof analysis.risk_score === 'number' ? analysis.risk_score : 50,
      reason: analysis.reason || 'No explanation provided.',
      category: analysis.category || 'Unknown',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
    };
  } catch (error: any) {
    // Check for Gemini API quota/429 error
    if (error?.response?.status === 429 || error?.status === 429) {
      throw new Error('AI_QUOTA_EXCEEDED');
    }
    console.error('AI Analysis Error:', error);
    // Graceful fallback
    throw new Error('AI_ANALYSIS_FAILED');
  }
}

/**
 * Main POST handler for /api/analyze
 */
export async function POST(request: Request) {
  try {
    // Get user session from Supabase Auth (using cookies)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body: AnalysisRequest = await request.json();
    const { url } = body;

    // 1. Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 },
      );
    }

    const normalizedUrl = validation.normalized!;
    const urlHash = hashUrl(normalizedUrl);

    // 2. If user is signed in, check cache for their scan
    if (user) {
      const cachedScan = await getCachedScan(urlHash);
      if (cachedScan && cachedScan.user_id === user.id) {
        const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
        return NextResponse.json({
          success: true,
          data: {
            ...cachedScan,
            screenshot_url: screenshotUrl,
            from_cache: true,
          },
        });
      }
    }

    // 3. Fetch HTML
    let html = '';
    try {
      html = await fetchWithTimeout(normalizedUrl, FETCH_TIMEOUT);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load website. It might be blocking bots.',
        },
        { status: 500 },
      );
    }

    // 4. Scrape
    const scrapedContent = scrapeContent(html);
    if (!scrapedContent.text || scrapedContent.text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Website has no readable content.' },
        { status: 422 },
      );
    }

    // 5. Analyze
    let analysis;
    try {
      analysis = await analyzeWithAI(scrapedContent);
    } catch (aiError: any) {
      if (aiError.message === 'AI_QUOTA_EXCEEDED') {
        return NextResponse.json(
          {
            success: false,
            error: 'AI quota exceeded. Please try again later.',
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: 'AI analysis failed. Please try again later.',
        },
        { status: 500 },
      );
    }

    // 6. Save & Return (only if analysis is valid and user is signed in)
    if (
      analysis.summary === 'Unable to analyze this website at the moment.' &&
      analysis.reason === 'Analysis failed or not available.' &&
      analysis.category === 'Uncategorized' &&
      analysis.tags.includes('error')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI analysis failed. Please try again later.',
        },
        { status: 500 },
      );
    }

    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

    if (user) {
      // Save scan for signed-in user
      const scanToSave = {
        user_id: user.id,
        url_hash: urlHash,
        url: normalizedUrl,
        summary: analysis.summary,
        risk_score: analysis.risk_score,
        reason: analysis.reason,
        category: analysis.category,
        tags: analysis.tags,
        screenshot_url: screenshotUrl,
        from_cache: false,
      };
      const savedScan = await saveScan(scanToSave);
      if (!savedScan) {
        console.error('Supabase insert failed: scanToSave =', scanToSave);
        return NextResponse.json(
          { success: false, error: 'Failed to save scan to database.' },
          { status: 500 },
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          id: savedScan.id,
          user_id: savedScan.user_id,
          url: savedScan.url,
          summary: savedScan.summary,
          risk_score: savedScan.risk_score,
          reason: savedScan.reason,
          category: savedScan.category,
          tags: savedScan.tags,
          screenshot_url: savedScan.screenshot_url,
          created_at: savedScan.created_at,
          from_cache: false,
        },
      });
    } else {
      // Anonymous: just return the analysis, do not save
      return NextResponse.json({
        success: true,
        data: {
          id: '',
          user_id: '',
          url: normalizedUrl,
          summary: analysis.summary,
          risk_score: analysis.risk_score,
          reason: analysis.reason,
          category: analysis.category,
          tags: analysis.tags,
          screenshot_url: screenshotUrl,
          created_at: '',
          from_cache: false,
        },
      });
    }
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
