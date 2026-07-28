export type CvdValue = 'none' | 'rg_d' | 'rg_p' | 'by' | 'total' | 'unsure';
export type ThemeMode = 'light' | 'dark' | 'contrast';
export type TextScale = 'normal' | 'large' | 'xlarge';
export type AppView = 'home' | 'prepare' | 'screening' | 'results' | 'tools' | 'learn' | 'privacy';

export type Answers = {
  cvd: CvdValue | null;
  friction: Record<string, number>;
  worst: string | null;
  worstOther: string;
  pair: string | null;
  tools: string[];
  wishlist: string;
  researchConsent: boolean;
};

export type ResultSummary = {
  reportedPattern: string;
  observedPatterns: string[];
  responseConsistency: 'Limited' | 'Moderate' | 'Mixed';
  limitations: string[];
  topArea: string | null;
};
