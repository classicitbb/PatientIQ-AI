/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental configurations
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON payloads
app.use(express.json());

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not configured or holds placeholder. Gemini features will default to high-fidelity rule-based local strategy.');
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err);
    return null;
  }
}

interface PatientStrategyProfile {
  contact?: {
    name?: string;
  };
  isNewPatient?: boolean;
  score: {
    urgency: string;
    budgetTier: string;
    frameStyle: string;
    faceShape: string;
    colorPref: string;
    usageEnv: string;
    lensFlags: string[];
  };
}

interface AiStrategy {
  styleAdvice: string;
  lensUpgradeStrategy: string;
  rapportOpener: string;
  serviceApproach: string;
  objectionHandling: string;
  upSellingTips: string;
  isFallback?: boolean;
}

const STRATEGY_FIELDS: Array<keyof AiStrategy> = [
  'styleAdvice',
  'lensUpgradeStrategy',
  'rapportOpener',
  'serviceApproach',
  'objectionHandling',
  'upSellingTips',
];

function isValidStrategyProfile(value: any): value is PatientStrategyProfile {
  return Boolean(
    value?.score &&
    typeof value.score.frameStyle === 'string' &&
    typeof value.score.faceShape === 'string' &&
    typeof value.score.colorPref === 'string' &&
    typeof value.score.usageEnv === 'string' &&
    typeof value.score.budgetTier === 'string' &&
    typeof value.score.urgency === 'string' &&
    Array.isArray(value.score.lensFlags)
  );
}

function isAiStrategy(value: any): value is AiStrategy {
  return STRATEGY_FIELDS.every((field) => typeof value?.[field] === 'string' && value[field].trim() !== '');
}

function buildStrategyPrompt(profile: PatientStrategyProfile): string {
  const { contact, isNewPatient, score } = profile;
  return `Analyze this patient profile from our retail optical kiosk system and generate a customized high-fidelity consulting strategy for our Customer Service representatives (CSR).
Here is the profile details:
- Name: ${contact?.name || 'Anonymous Guest'}
- Is New Patient: ${isNewPatient ? 'Yes' : 'No'}
- Urgency Level: ${score.urgency}
- Budget Tier: ${score.budgetTier}
- Frame Style Preference: ${score.frameStyle}
- Face Shape: ${score.faceShape}
- Preferred Colors: ${score.colorPref}
- Primary Lifestyle/Environment: ${score.usageEnv}
- Calculated Lens Focus Flags: ${score.lensFlags.join(', ')}

Return only a raw JSON object with exactly these string fields:
styleAdvice, lensUpgradeStrategy, rapportOpener, serviceApproach, objectionHandling, upSellingTips.
Make the advice tailored, practical, conversational, and clear for a retail optical practitioner.`;
}

function buildLocalStrategy(profile: PatientStrategyProfile): AiStrategy {
  const clientName = profile.contact?.name || 'Guest';
  const isNewText = profile.isNewPatient ? 'As a new client to our clinic' : 'As a returning client';
  const { score } = profile;

  return {
    styleAdvice: `Suggest elegant ${score.frameStyle} designs matching their ${score.faceShape} face shape. Emphasize standard colors like ${score.colorPref.toLowerCase()} for daily use.`,
    lensUpgradeStrategy: `Focus heavily on ${score.lensFlags.length > 0 ? score.lensFlags.join(' and ') : 'high-durability coatings'} based on their screen activities.`,
    rapportOpener: `Welcome back, ${clientName}! ${isNewText}, we noticed you spend considerable time engaged in ${score.usageEnv.toLowerCase()}. Let's identify the perfect solution today.`,
    serviceApproach: `Present selections that map directly to their ${score.budgetTier} budget. Highlight frame ergonomics, durability, and customized vision wellness.`,
    objectionHandling: `They are a ${score.budgetTier}-tier client with ${score.urgency} urgency. Address cost by breaking prices down into monthly payments or emphasize durability.`,
    upSellingTips: `Outline why supplementary anti-reflective coatings or a secondary backup pair fits their frequent lifestyle activities.`,
    isFallback: true,
  };
}

function parseStrategyJson(raw: string): AiStrategy {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const parsed = JSON.parse(cleaned);
  if (!isAiStrategy(parsed)) {
    throw new Error('AI provider returned an incomplete strategy.');
  }
  return parsed;
}

async function generateOpenRouterStrategy(profile: PatientStrategyProfile): Promise<AiStrategy | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.SIMPLE_LLM_API_KEY;
  const apiUrl = process.env.OPENROUTER_API_URL || process.env.SIMPLE_LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const model = process.env.OPENROUTER_MODEL || process.env.SIMPLE_LLM_MODEL || 'openrouter/free';

  if (!apiKey && !process.env.SIMPLE_LLM_API_URL) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(process.env.APP_URL ? { 'HTTP-Referer': process.env.APP_URL } : {}),
        'X-Title': 'PatientIQ AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an elite clinical retail consulting coach. Always return valid JSON with the requested fields.',
          },
          {
            role: 'user',
            content: buildStrategyPrompt(profile),
          },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    const data: any = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error?.message || data?.error || `OpenRouter request failed with ${response.status}`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('OpenRouter returned an empty response.');
    }

    return parseStrategyJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateGeminiStrategy(profile: PatientStrategyProfile): Promise<AiStrategy | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: buildStrategyPrompt(profile),
    config: {
      systemInstruction: 'You are an elite clinical retail consulting coach. You analyze customer questionnaire preferences and write highly precise, helpful, conversational, and direct customer-service tactics for front-line optical practitioners. Always respond in valid JSON matching the exact schema provided.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: STRATEGY_FIELDS,
        properties: {
          styleAdvice: { type: Type.STRING },
          lensUpgradeStrategy: { type: Type.STRING },
          rapportOpener: { type: Type.STRING },
          serviceApproach: { type: Type.STRING },
          objectionHandling: { type: Type.STRING },
          upSellingTips: { type: Type.STRING },
        },
      },
    },
  });

  return parseStrategyJson(response.text || '{}');
}

async function generateAiStrategy(profile: PatientStrategyProfile): Promise<AiStrategy> {
  try {
    const openRouterStrategy = await generateOpenRouterStrategy(profile);
    if (openRouterStrategy) return openRouterStrategy;
  } catch (err) {
    console.error('OpenRouter/free strategy error, trying next provider:', err);
  }

  try {
    const geminiStrategy = await generateGeminiStrategy(profile);
    if (geminiStrategy) return geminiStrategy;
  } catch (err) {
    console.error('Gemini strategy error, fallback initialized:', err);
  }

  return buildLocalStrategy(profile);
}

// REST Api endpoints for patient sessions and configurations
interface StoreConfig {
  storeId: string;
  storeName: string;
  storeAddress: string;
  welcomeMessage: string;
  primaryColor: string;
  accentColor: string;
  csrPin: string;
  adminPin: string;
}

const DEFAULT_CONFIG: StoreConfig = {
  storeId: 'default',
  storeName: 'PriceSmart Optical',
  storeAddress: '100 Meridian Way, Suite 240, Metro City',
  welcomeMessage: 'While you wait, let us get to know your style a little — so we can make the most of your visit today.',
  primaryColor: '#003087',
  accentColor: '#CC0000',
  csrPin: '1234',
  adminPin: '9999',
};

const DEMO_SESSIONS = [
  {
    id: 'demo-001',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    isNewPatient: false,
    contact: {
      name: 'Maria T.',
      phone: '555-0192',
      email: 'maria.tempore@example.com',
    },
    answers: { q1: 'a', q2: 'a', q3: 'c', q4: 'a', q5: 'c', q6: 'c', q7: 'a', q8: 'c', q9: 'b', q10: 'b', q11: 'c', q12: 'a' },
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
      skills: { rapport: 5, discovery: 4, presentation: 5, lensUpsell: 5, close: 4 },
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
    answers: { q1: 'b', q2: 'c', q3: 'd', q4: 'b', q5: 'a', q6: 'b', q7: 'b', q8: 'b', q9: 'c', q10: 'a', q11: 'd', q12: 'b' },
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
      skills: { rapport: 4, discovery: 4, presentation: 3, lensUpsell: 2, close: 2 },
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
    answers: { q1: 'c', q2: 'c', q3: 'c', q4: 'b', q5: 'a', q6: 'a', q7: 'b', q8: 'c', q9: 'a', q10: 'c', q11: 'b', q12: 'c' },
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
    csrAssessment: null,
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
    answers: { q1: 'a', q2: 'd', q3: 'c', q4: 'a', q5: 'b', q6: 'd', q7: 'd', q8: 'd', q9: 'd', q10: 'd', q11: 'b', q12: 'd' },
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
    csrAssessment: null,
  },
];

const storeConfigs: Record<string, StoreConfig> = {
  default: { ...DEFAULT_CONFIG }
};

const storeSessions: Record<string, any[]> = {
  default: [...DEMO_SESSIONS]
};

// GET config
app.get('/api/config', (req, res) => {
  const storeId = (req.query.storeId as string) || 'default';
  if (!storeConfigs[storeId]) {
    storeConfigs[storeId] = { ...DEFAULT_CONFIG, storeId };
  }
  res.json(storeConfigs[storeId]);
});

// POST config
app.post('/api/config', (req, res) => {
  const config = req.body;
  const storeId = config.storeId || 'default';
  storeConfigs[storeId] = config;
  res.json({ success: true, config });
});

// GET sessions
app.get('/api/sessions', (req, res) => {
  const storeId = (req.query.storeId as string) || 'default';
  if (!storeSessions[storeId]) {
    if (storeId === 'default') {
      storeSessions[storeId] = [...DEMO_SESSIONS];
    } else {
      storeSessions[storeId] = [];
    }
  }
  res.json(storeSessions[storeId]);
});

// POST analyze (retained for backward compatibility if any)
app.post('/api/analyze', async (req, res) => {
  const { answers } = req.body;

  if (!answers || !isValidStrategyProfile(req.body)) {
    return res.status(400).json({ error: 'Missing session answers or scored results.' });
  }

  try {
    return res.json({ strategy: await generateAiStrategy(req.body) });
  } catch (error: any) {
    console.error('AI Analysis API Error:', error);
    return res.status(500).json({ error: 'AI interpretation failed.', details: error.message });
  }
});

// POST create/save session (with in-place Gemini analyzer scoring support!)
app.post('/api/sessions', async (req, res) => {
  const { storeId, session } = req.body;
  const activeStoreId = storeId || 'default';

  if (!session) {
    return res.status(400).json({ error: 'Missing session body.' });
  }

  if (!isValidStrategyProfile(session)) {
    return res.status(400).json({ error: 'Missing or invalid session score data.' });
  }

  if (!storeSessions[activeStoreId]) {
    if (activeStoreId === 'default') {
      storeSessions[activeStoreId] = [...DEMO_SESSIONS];
    } else {
      storeSessions[activeStoreId] = [];
    }
  }

  const sessionToSave: PatientStrategyProfile & Record<string, any> = { ...session };
  sessionToSave.aiStrategy = await generateAiStrategy(sessionToSave);

  // Prepend to our memory store
  storeSessions[activeStoreId] = [sessionToSave, ...storeSessions[activeStoreId]];
  res.json({ success: true, session: sessionToSave });
});

// PUT update session assessment
app.put('/api/sessions/:id', (req, res) => {
  const { storeId, session } = req.body;
  const activeStoreId = storeId || 'default';
  const sessionId = req.params.id;

  if (!storeSessions[activeStoreId]) {
    storeSessions[activeStoreId] = [];
  }

  storeSessions[activeStoreId] = storeSessions[activeStoreId].map(s => 
    s.id === sessionId ? { ...s, ...session } : s
  );

  const updatedSession = storeSessions[activeStoreId].find(s => s.id === sessionId);
  res.json({ success: true, session: updatedSession });
});

// Setup Vite Development Middleware or Serve Static Files
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Patient IQ Client/Server] Online and listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
