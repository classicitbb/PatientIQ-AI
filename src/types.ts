/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Store Setup Configuration
export interface StoreConfig {
  storeId: string;
  storeName: string;
  storeAddress: string;
  welcomeMessage: string;
  primaryColor: string;
  accentColor: string;
  csrPin: string;
  adminPin: string;
}

// Answer options standard keys (a | b | c | d)
export type OptionKey = 'a' | 'b' | 'c' | 'd';

export interface QuestionOption {
  key: OptionKey;
  text: string;
  emoji: string;
}

export interface Question {
  id: string; // q1 - q12
  text: string;
  subtitle: string;
  emoji: string;
  options: QuestionOption[];
}

// Scored output traits
export interface AnswerScore {
  purchaseReadiness: number; // 0 - 100
  urgency: 'low' | 'medium' | 'high';
  budgetTier: 'value' | 'mid' | 'premium' | 'luxury';
  frameStyle: 'Classic & Polished' | 'Modern & Bold' | 'Relaxed & Practical' | 'Creative & Unique';
  faceShape: 'Round' | 'Oval' | 'Square' | 'Heart/Diamond';
  colorPref: string;
  usageEnv: string;
  lensFlags: string[]; // e.g., 'blue-light', 'progressive check', 'transitions', etc.
}

// AI Personalized Strategy generated on the backend via Gemini
export interface AiStrategy {
  styleAdvice: string;
  lensUpgradeStrategy: string;
  rapportOpener: string; // Dynamic greeting phrase based on their profile
  serviceApproach: string; // How to talk to this patient (stylistic advice)
  objectionHandling: string; // Specific advice if they raise a budget/time objection
  upSellingTips: string; // Additional value props to present
}

// CSR (Customer Service Representative) Assessment
export interface CsrAssessment {
  csrName: string;
  outcome: 'purchased' | 'no-sale' | 'followup';
  purchaseAmount: number;
  invoiceNumber: string;
  purchaseType: string;
  noSaleReason: string;
  followupNote: string;
  notes: string;
  skills: {
    rapport: number;     // 1 to 5
    discovery: number;   // 1 to 5
    presentation: number;// 1 to 5
    lensUpsell: number;  // 1 to 5
    close: number;       // 1 to 5
  };
}

// Pre-visit and Customer Session instance
export interface PatientSession {
  id: string;
  timestamp: number;
  isNewPatient: boolean;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  answers: Record<string, OptionKey>; // q1 - q12 values
  score: AnswerScore;
  csrAssessment: CsrAssessment | null;
  aiStrategy?: AiStrategy; // Injected by Gemini endpoint
  aiStrategyLoading?: boolean;
  aiStrategyError?: string;
}
