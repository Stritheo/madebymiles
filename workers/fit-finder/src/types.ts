export interface MatchResult {
  rank: number;
  category: 'skillset' | 'mindset';
  aicdDomain: string;
  skillArea: string;
  matchReason: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FitResponse {
  matches: MatchResult[];
  roleTitle: string | null;
  summary: string;
  token: string;
  analysedAt: string;
}

export interface Env {
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  DISCORD_WEBHOOK_REPORTS: string;
  DISCORD_WEBHOOK_ALERTS: string;
  RATE_LIMIT_KV: KVNamespace;
}

export interface ProfileDomain {
  domain: string;
  skills: {
    skillArea: string;
    category: string;
    rating: string;
    evidence: string;
  }[];
}

export interface ProfileCaseStudy {
  title: string;
  company: string;
  role: string;
  order: number;
  summary: string;
  outcomes: string[];
}

export interface Profile {
  name: string;
  title: string;
  credentials: string[];
  contact: { website: string; linkedin: string; whatsapp: string };
  domains: ProfileDomain[];
  caseStudies: ProfileCaseStudy[];
  philosophy: string;
}
