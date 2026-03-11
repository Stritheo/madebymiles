export type Relevance = 'primary' | 'supporting' | 'noted';

export interface SkillMatrixEntry {
  aicdDomain: string;
  skillArea: string;
  relevance: Relevance;
  matchReason: string;
  evidence: string;
  evidenceQualitative: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CaseStudyMatch {
  company: string;
  role: string;
  descriptor: string;
  relevanceReason: string;
  fullContent: string;
}

export interface FitResponse {
  skillMatrix: SkillMatrixEntry[];
  topMatches: {
    skillset: string;
    mindset: string;
  };
  roleTitle: string | null;
  summary: string;
  relevantCaseStudies: CaseStudyMatch[];
  token: string;
  analysedAt: string;
}

// Deprecated: kept for backwards compatibility with shared URL tokens
// containing the old format. Remove after old tokens expire (30 days).
export interface MatchResult {
  rank: number;
  category: 'skillset' | 'mindset';
  aicdDomain: string;
  skillArea: string;
  matchReason: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
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
