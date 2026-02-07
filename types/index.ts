// TypeScript interfaces for LinkRay application

export interface Scan {
  id: string;
  url_hash: string;
  url: string;
  summary: string;
  risk_score: number;
  category: string;
  tags: string[];
  created_at: string;
}

export interface AnalysisRequest {
  url: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: ScanResult;
  error?: string;
}

export interface ScanResult {
  id: string;
  url: string;
  summary: string;
  risk_score: number;
  category: string;
  tags: string[];
  screenshot_url: string;
  created_at: string;
  from_cache: boolean;
}

export interface GeminiAnalysisResult {
  summary: string;
  risk_score: number;
  category: string;
  tags: string[];
}

export interface ScrapedContent {
  text: string;
  title: string;
}
