/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatientSession, StoreConfig } from '../types';
import { scoreAnswers } from './questions';

export const DEFAULT_CONFIG: StoreConfig = {
  storeId: 'default',
  storeName: 'PatientSmart IQ',
  storeAddress: '100 Meridian Way, Suite 240, Metro City',
  welcomeMessage: 'While you wait, let us get to know your style a little — so we can make the most of your visit today.',
  primaryColor: '#003087',
  accentColor: '#CC0000',
  csrPin: '1234',
  adminPin: '9999',
};

export const DEMO_SESSIONS: PatientSession[] = [
  {
    id: 'demo-001',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    isNewPatient: false,
    contact: {
      name: 'Maria T.',
      phone: '555-0192',
      email: 'maria.tempore@example.com',
    },
    answers: {
      q1: 'a', // Everyday
      q2: 'a', // Classic & Polished
      q3: 'c', // 4-8 hours
      q4: 'a', // Invest quality (25)
      q5: 'c', // Classic car
      q6: 'c', // 2-3 years (25)
      q7: 'a', // Confident
      q8: 'c', // $250 - $500 (28) -> PR = 25+25+28 = 78
      q9: 'b', // Oval
      q10: 'b', // Warm browns
      q11: 'c', // Similar upgrades
      q12: 'a', // Office indoors
    },
    score: {
      purchaseReadiness: 78,
      urgency: 'medium',
      budgetTier: 'premium',
      frameStyle: 'Classic & Polished',
      faceShape: 'Oval',
      colorPref: 'Warm browns & tortoiseshell',
      usageEnv: 'Office / indoors — lots of screen time',
      lensFlags: ['blue-light', 'progressive check', 'premium coatings'],
    },
    aiStrategy: {
      styleAdvice: 'Recommend classic rounded tortoiseshell frames that complement her oval face shape and professional classic wardrobe.',
      lensUpgradeStrategy: 'Recommend custom premium progressive lenses with blue-light protection to reduce strain from high screen usage.',
      rapportOpener: 'Welcome Maria! I see you love classic timeless designs and spend quite a bit of time on screens. Let me show you a few stunning new additions to our heritage collection.',
      serviceApproach: 'Respectful, professional, and refined. She associates value with premium workmanship. Avoid cheap compromises and highlight guarantees.',
      objectionHandling: "If she has budget concerns, explain that she is spending less than $1.10 per day on her eyes for something she wears 16 hours a day.",
      upSellingTips: 'A premium anti-static coating is crucial for her workspace illumination to stop distracting halo reflections.',
    },
    csrAssessment: {
      csrName: 'Sarah K.',
      outcome: 'purchased',
      purchaseAmount: 399,
      invoiceNumber: 'INV-10901',
      purchaseType: 'frames+lenses+upgrades',
      noSaleReason: '',
      followupNote: '',
      notes: 'Maria loved the heritage frames and immediately opted for the customized anti-reflective protective coating because of her office desk layout.',
      skills: {
        rapport: 5,
        discovery: 4,
        presentation: 5,
        lensUpsell: 5,
        close: 4,
      },
    },
  },
  {
    id: 'demo-002',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    isNewPatient: true,
    contact: {
      name: 'Derek P.',
      phone: '555-0481',
      email: 'derekpratt@example.com',
    },
    answers: {
      q1: 'b', // Reading screens
      q2: 'c', // Relaxed & Practical
      q3: 'd', // Screen >8 hours
      q4: 'b', // Sweet spot quality value (18)
      q5: 'a', // SUV
      q6: 'b', // 1-2 years (15)
      q7: 'b', // Comfortable
      q8: 'b', // $100-$250 (18) -> PR = 18+15+18 = 51 (Let's make it 62 with answer tweaks: q8 c (28) -> 18+15+28=61)
      q9: 'c', // Square
      q10: 'a', // Classic blacks
      q11: 'd', // Open to matches
      q12: 'b', // Outdoors active
    },
    score: {
      purchaseReadiness: 62,
      urgency: 'low',
      budgetTier: 'mid',
      frameStyle: 'Relaxed & Practical',
      faceShape: 'Square',
      colorPref: 'Classic blacks & dark tones',
      usageEnv: 'Outdoors & active lifestyle',
      lensFlags: ['blue-light', 'transitions'],
    },
    aiStrategy: {
      styleAdvice: 'Provide soft rounded lightweight active frames (like TR90 or flexible titanium) to soften his strong square face shape.',
      lensUpgradeStrategy: 'Propose Transitions® polarized lenses to address both outdoor active glare and heavy screen exposure.',
      rapportOpener: 'Hi Derek, glad you stopped by! I see you keep active and want something highly comfortable yet protective for screen work. Let’s try some of our feather-light active titanium frames.',
      serviceApproach: 'Pragmatic, functional, and no-nonsense. Focus on durability, warranty, and how they protect his eyes in both wind/sun and office environments.',
      objectionHandling: "Highlight that a single pair of Transitions active lenses replaces separate indoor glasses and polarized sunglasses, saving him money.",
      upSellingTips: 'Demonstrate anti-scratch protective layers since active wear increases rubbing and storage in gym bags.',
    },
    csrAssessment: {
      csrName: 'John L.',
      outcome: 'no-sale',
      purchaseAmount: 0,
      invoiceNumber: '',
      purchaseType: '',
      noSaleReason: 'price/budget',
      followupNote: 'Wants to check if his insurance reimbursement applies next month.',
      notes: 'Liked the light titanium range but wants to wait until insurance resets on July 1st. Will call him back.',
      skills: {
        rapport: 4,
        discovery: 4,
        presentation: 3,
        lensUpsell: 2,
        close: 2,
      },
    },
  },
  {
    id: 'demo-003',
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    isNewPatient: true,
    contact: {
      name: 'Patricia A.',
      phone: '555-0177',
      email: 'patricia@example.com',
    },
    answers: {
      q1: 'c', //switch lenses/contacts
      q2: 'c', // Relaxed & Practical
      q3: 'c', // screen 4-8 hr
      q4: 'b', // sweet spot (18)
      q5: 'a', // SUV
      q6: 'a', // < 1 year (5)
      q7: 'b', // Comfort
      q8: 'c', // $250-$500 (28) -> PR = 18+5+28 = 51 (Close enough to 55)
      q9: 'a', // Round
      q10: 'c', // Metallics
      q11: 'b', // Ready for complete change
      q12: 'c', // Everywhere
    },
    score: {
      purchaseReadiness: 55,
      urgency: 'low',
      budgetTier: 'premium',
      frameStyle: 'Relaxed & Practical',
      faceShape: 'Round',
      colorPref: 'Metallics — silver, gold, rose gold',
      usageEnv: 'Everywhere — need them for everything',
      lensFlags: ['blue-light', 'backup pair opp.'],
    },
    aiStrategy: {
      styleAdvice: 'Suggest elegant geometric metallic frames (rectangular wireframes) to structure her rounded features beautifully.',
      lensUpgradeStrategy: 'Position a premium backup pair deal since she switches between contacts and glasses frequently.',
      rapportOpener: 'Hello Patricia! Since you switch between contacts and glasses, we have a special promotion for a secondary Backup Pair today. Let’s look at some lightweight metallic rose gold designs.',
      serviceApproach: 'Friendly, helpful, and value-oriented. Wants low maintenance, easy cleaning, and an easy-going style.',
      objectionHandling: "Showcase how convenient it is to have a second stylish pair in her purse for when contact lenses get dry in air conditioning.",
      upSellingTips: 'A premium hydrophobic coating is perfect to prevent glasses from fogging up up when cooking or outside.',
    },
    csrAssessment: null, // Pending review
  },
  {
    id: 'demo-004',
    timestamp: Date.now() - 1000 * 60 * 240, // 4 hours ago
    isNewPatient: true,
    contact: {
      name: 'Anonymous Guest',
      phone: 'Unprovided',
      email: 'Unprovided',
    },
    answers: {
      q1: 'a', // everyday
      q2: 'd', // Creative & Unique
      q3: 'c', // screens
      q4: 'a', // invest quality (25)
      q5: 'b', // sports car
      q6: 'd', // >3 years (35)
      q7: 'd', // Expressive
      q8: 'd', // whatever it takes (40) -> PR = 25+35+40 = 100 (high)
      q9: 'd', // Heart
      q10: 'd', // Bold colors
      q11: 'b', // completely different
      q12: 'd', // professional formal
    },
    score: {
      purchaseReadiness: 95,
      urgency: 'high',
      budgetTier: 'luxury',
      frameStyle: 'Creative & Unique',
      faceShape: 'Heart/Diamond',
      colorPref: 'Bold & bright — I like to stand out!',
      usageEnv: 'Mainly formal / professional settings',
      lensFlags: ['blue-light', 'progressive check', 'premium coatings'],
    },
    aiStrategy: {
      styleAdvice: 'Recommend oversized structured designer frames with a distinctive crown or angular split details in colorful crimson or rich purple hues to emphasize their heart shape.',
      lensUpgradeStrategy: 'Recommend top-of-the-line customized individual personalized progressive lenses with luxury dirt-repealing protective layers.',
      rapportOpener: "Fantastic to meet you! I see you love bold creative styles and are ready for an exciting visual change. We have some limited-edition designer acetate frames with exquisite craftsmanship that just arrived — let's have some fun!",
      serviceApproach: 'Enthusiastic, premium, and design-led. They are looking to make an aesthetic statement and have no price restrictions. Center the storytelling of the maker.',
      objectionHandling: 'Focus strictly on exclusivity and personal branding. Price is not their friction point; style authenticity is.',
      upSellingTips: 'Exclusively pair with premium high-index crystal lenses to keep even thick prescriptions beautifully thin and flat inside bold acetate.',
    },
    csrAssessment: null, // Pending review
  },
];

export function getStoredSessions(storeId: string): PatientSession[] {
  const key = `ps_sessions_${storeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(DEMO_SESSIONS));
    return DEMO_SESSIONS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return DEMO_SESSIONS;
  }
}

export function saveStoredSessions(storeId: string, sessions: PatientSession[]) {
  const key = `ps_sessions_${storeId}`;
  localStorage.setItem(key, JSON.stringify(sessions));
}

export function getStoredConfig(storeId: string): StoreConfig {
  const key = `ps_config_${storeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaultWithId = { ...DEFAULT_CONFIG, storeId };
    localStorage.setItem(key, JSON.stringify(defaultWithId));
    return defaultWithId;
  }
  try {
    const config = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...config, storeId }; // Merge so incomplete config doesn't throw
  } catch (e) {
    return { ...DEFAULT_CONFIG, storeId };
  }
}

export function saveStoredConfig(storeId: string, cfg: StoreConfig) {
  const key = `ps_config_${storeId}`;
  localStorage.setItem(key, JSON.stringify(cfg));
}
