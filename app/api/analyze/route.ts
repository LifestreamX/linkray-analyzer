import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { getCachedScan, saveScan } from '@/lib/supabase';
import { hashUrl, validateUrl } from '@/lib/utils';
import type { AnalysisRequest, AnalysisResponse, GeminiAnalysisResult, ScrapedContent } from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Timeout for fetch requests (5 seconds)
const FETCH_TIMEOUT = 5000;

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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
  $('script, style, nav, footer, header, iframe, noscript').remove();

  // Try to get the main content
  let text = '';
  const mainSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
  
  for (const selector of mainSelectors) {
    const content = $(selector).text();
    if (content.length > text.length) {
      text = content;
    }
  }

  // Fallback to body if no main content found
  if (text.length < 100) {
    text = $('body').text();
  }

  // Clean whitespace and limit length
  text = text
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);

  // Get page title
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Unknown';

  return { text, title };
}

/**
 * Analyze content with Gemini AI
 */
async function analyzeWithAI(content: ScrapedContent): Promise<GeminiAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze this website content and respond ONLY with a valid JSON object (no markdown, no code blocks, just raw JSON).

Website Title: ${content.title}
Content: ${content.text}

Return JSON with this exact structure:
{
  "summary": "2-sentence summary of what this website is about",
  "risk_score": <number from 0-100, where 100 is completely safe>,
  "category": "one category like Blog, E-commerce, News, Social Media, Phishing, Scam, Educational, etc.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const analysis: GeminiAnalysisResult = JSON.parse(text);

    // Validate and normalize the response
    return {
      summary: analysis.summary || 'Unable to generate summary',
      risk_score: Math.min(100, Math.max(0, analysis.risk_score || 50)),
      category: analysis.category || 'Unknown',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Return safe defaults on error
    return {
      summary: 'Unable to analyze this website content.',
      risk_score: 50,
      category: 'Unknown',
      tags: ['unanalyzed'],
    };
  }
}

/**
 * Main POST handler for /api/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url } = body;

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid URL' } as AnalysisResponse,
        { status: 400 }
      );
    }

    const normalizedUrl = validation.normalized!;
    const urlHash = hashUrl(normalizedUrl);

    // Check cache first
    const cachedScan = await getCachedScan(urlHash);
    if (cachedScan) {
      const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
      
      return NextResponse.json({
        success: true,
        data: {
          id: cachedScan.id,
          url: cachedScan.url,
          summary: cachedScan.summary,
          risk_score: cachedScan.risk_score,
          category: cachedScan.category,
          tags: cachedScan.tags,
          screenshot_url: screenshotUrl,
          created_at: cachedScan.created_at,
          from_cache: true,
        },
      } as AnalysisResponse);
    }

    // No cache hit - perform fresh analysis
    let html: string;
    try {
      html = await fetchWithTimeout(normalizedUrl, FETCH_TIMEOUT);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch website' } as AnalysisResponse,
        { status: 500 }
      );
    }

    // Scrape content
    const scrapedContent = scrapeContent(html);

    if (!scrapedContent.text || scrapedContent.text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Unable to extract meaningful content from this website' } as AnalysisResponse,
        { status: 422 }
      );
    }

    // Analyze with AI
    const analysis = await analyzeWithAI(scrapedContent);

    // Save to database
    const savedScan = await saveScan({
      url_hash: urlHash,
      url: normalizedUrl,
      summary: analysis.summary,
      risk_score: analysis.risk_score,
      category: analysis.category,
      tags: analysis.tags,
    });

    if (!savedScan) {
      // Still return the analysis even if save failed
      console.error('Failed to save scan to database');
    }

    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

    return NextResponse.json({
      success: true,
      data: {
        id: savedScan?.id || 'temp-id',
        url: normalizedUrl,
        summary: analysis.summary,
        risk_score: analysis.risk_score,
        category: analysis.category,
        tags: analysis.tags,
        screenshot_url: screenshotUrl,
        created_at: savedScan?.created_at || new Date().toISOString(),
        from_cache: false,
      },
    } as AnalysisResponse);

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' } as AnalysisResponse,
      { status: 500 }
    );
  }
}
