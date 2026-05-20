/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

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

const SESSIONS_FILE = path.join(process.cwd(), 'db-sessions.json');
const CONFIGS_FILE = path.join(process.cwd(), 'db-configs.json');

let storeConfigs: Record<string, StoreConfig> = {
  default: { ...DEFAULT_CONFIG }
};

let storeSessions: Record<string, any[]> = {
  default: [...DEMO_SESSIONS]
};

function savePersistedSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(storeSessions, null, 2), 'utf-8');
    console.log('[Persistence] db-sessions.json saved');
  } catch (err) {
    console.error('[Persistence] Failed to write sessions:', err);
  }
}

function savePersistedConfigs() {
  try {
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify(storeConfigs, null, 2), 'utf-8');
    console.log('[Persistence] db-configs.json saved');
  } catch (err) {
    console.error('[Persistence] Failed to write configs:', err);
  }
}

function loadPersistedData() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      if (data.trim()) {
        storeSessions = JSON.parse(data);
        console.log('[Persistence] Successfully loaded sessions from db-sessions.json');
      }
    } else {
      savePersistedSessions();
    }
  } catch (err) {
    console.error('[Persistence] Failed to load sessions, defaulting:', err);
  }

  try {
    if (fs.existsSync(CONFIGS_FILE)) {
      const data = fs.readFileSync(CONFIGS_FILE, 'utf-8');
      if (data.trim()) {
        storeConfigs = JSON.parse(data);
        console.log('[Persistence] Successfully loaded configs from db-configs.json');
      }
    } else {
      savePersistedConfigs();
    }
  } catch (err) {
    console.error('[Persistence] Failed to load configs, defaulting:', err);
  }
}

// Call on startup
loadPersistedData();

// GET config
app.get('/api/config', (req, res) => {
  const storeId = (req.query.storeId as string) || 'default';
  if (!storeConfigs[storeId]) {
    storeConfigs[storeId] = { ...DEFAULT_CONFIG, storeId };
    savePersistedConfigs();
  }
  res.json(storeConfigs[storeId]);
});

// POST config
app.post('/api/config', (req, res) => {
  const config = req.body;
  const storeId = config.storeId || 'default';
  storeConfigs[storeId] = config;
  savePersistedConfigs();
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
    savePersistedSessions();
  }
  res.json(storeSessions[storeId]);
});

// POST analyze (retained for backward compatibility if any)
app.post('/api/analyze', async (req, res) => {
  const { contact, isNewPatient, score, answers } = req.body;

  if (!answers || !score) {
    return res.status(400).json({ error: 'Missing session answers or scored results.' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant high-fidelity rule-based fallback strategy
    const clientName = contact?.name || 'Guest';
    const isNewText = isNewPatient ? 'As a new client to our clinic' : 'As a returning client';

    const localStrategy = {
      styleAdvice: `Suggest elegant ${score.frameStyle} designs matching their ${score.faceShape} face shape. Emphasize standard colors like ${score.colorPref.toLowerCase()} for daily use.`,
      lensUpgradeStrategy: `Focus heavily on ${score.lensFlags.length > 0 ? score.lensFlags.join(' and ') : 'high-durability coatings'} based on their screen activities.`,
      rapportOpener: `Welcome back, ${clientName}! ${isNewText}, we noticed you spend considerable time engaged in ${score.usageEnv.toLowerCase()}. Let's identify the perfect solution today.`,
      serviceApproach: `Present selections that map directly to their ${score.budgetTier} budget. Highlight frame ergonomics, durability, and customized vision wellness.`,
      objectionHandling: `They are a ${score.budgetTier}-tier client with ${score.urgency} urgency. Address cost by breaking prices down into monthly payments or emphasize durability.`,
      upSellingTips: `Outline why supplementary anti-reflective coatings or a secondary backup pair fits their frequent lifestyle activities.`,
      isFallback: true
    };
    return res.json({ strategy: localStrategy });
  }

  try {
    const prompt = `Analyze this patient profile from our retail optical kiosk system and generate a customized high-fidelity consulting strategy for our Customer Service representatives (CSR).
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

    You must return a raw JSON object strictly adhering to the schema specified, mapping professional, highly specific, and actionable dialogue options that the practitioner can use. Make the advice highly tailored and practical, written in clear, professional English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite clinical retail consulting coach. You analyze customer questionnaire preferences and write highly precise, helpful, conversational, and direct customer-service tactics for front-line optical practitioners. Always respond in valid JSON matching the exact schema provided.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'styleAdvice',
            'lensUpgradeStrategy',
            'rapportOpener',
            'serviceApproach',
            'objectionHandling',
            'upSellingTips'
          ],
          properties: {
            styleAdvice: {
              type: Type.STRING,
              description: 'Clear, specific, aesthetic advice recommending shapes, sizes, or weights of frames that balance their face shape and style direction.',
            },
            lensUpgradeStrategy: {
              type: Type.STRING,
              description: 'Which high-value specialty lenses or add-on technologies (e.g. customized progressives, blue-cut, active polarized) are most aligned with their user habits and screen fatigue.',
            },
            rapportOpener: {
              type: Type.STRING,
              description: 'A friendly, high impact direct opening greeting or conversation starter the salesperson can speak to start the meeting in a personalized way.',
            },
            serviceApproach: {
              type: Type.STRING,
              description: 'Stylistic and communicative guide for the representative: should they be fast and concise, story-led, tech-oriented, or value-driven?',
            },
            objectionHandling: {
              type: Type.STRING,
              description: 'An instruction on how to elegantly bypass pricing or time delay complaints depending on their budget tier and urgency flag.',
            },
            upSellingTips: {
              type: Type.STRING,
              description: 'Actionable upselling points for premium materials, special collections, or secondary backup lenses tailored to their habits.',
            },
          },
        },
      },
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    return res.json({ strategy: parsed });
  } catch (error: any) {
    console.error('Gemini Analysis API Error:', error);
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

  if (!storeSessions[activeStoreId]) {
    if (activeStoreId === 'default') {
      storeSessions[activeStoreId] = [...DEMO_SESSIONS];
    } else {
      storeSessions[activeStoreId] = [];
    }
  }

  const sessionToSave = { ...session };

  const ai = getGeminiClient();
  if (!ai) {
    const clientName = sessionToSave.contact?.name || 'Guest';
    const isNewText = sessionToSave.isNewPatient ? 'As a new client to our clinic' : 'As a returning client';
    sessionToSave.aiStrategy = {
      styleAdvice: `Suggest elegant ${sessionToSave.score.frameStyle} designs matching their ${sessionToSave.score.faceShape} face shape. Emphasize standard colors like ${sessionToSave.score.colorPref.toLowerCase()} for daily use.`,
      lensUpgradeStrategy: `Focus heavily on ${sessionToSave.score.lensFlags.length > 0 ? sessionToSave.score.lensFlags.join(' and ') : 'high-durability coatings'} based on their screen activities.`,
      rapportOpener: `Welcome back, ${clientName}! ${isNewText}, we noticed you spend considerable time engaged in ${sessionToSave.score.usageEnv.toLowerCase()}. Let's identify the perfect solution today.`,
      serviceApproach: `Present selections that map directly to their ${sessionToSave.score.budgetTier} budget. Highlight frame ergonomics, durability, and customized vision wellness.`,
      objectionHandling: `They are a ${sessionToSave.score.budgetTier}-tier client with ${sessionToSave.score.urgency} urgency. Address cost by breaking prices down into monthly payments or emphasize durability.`,
      upSellingTips: `Outline why supplementary anti-reflective coatings or a secondary backup pair fits their frequent lifestyle activities.`,
      isFallback: true
    };
  } else {
    try {
      const { contact, isNewPatient, score } = sessionToSave;
      const prompt = `Analyze this patient profile from our retail optical kiosk system and generate a customized high-fidelity consulting strategy for our Customer Service representatives (CSR).
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

      You must return a raw JSON object strictly adhering to the schema specified, mapping professional, highly specific, and actionable dialogue options that the practitioner can use. Make the advice highly tailored and practical, written in clear, professional English.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite clinical retail consulting coach. You analyze customer questionnaire preferences and write highly precise, helpful, conversational, and direct customer-service tactics for front-line optical practitioners. Always respond in valid JSON matching the exact schema provided.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'styleAdvice',
              'lensUpgradeStrategy',
              'rapportOpener',
              'serviceApproach',
              'objectionHandling',
              'upSellingTips'
            ],
            properties: {
              styleAdvice: { type: Type.STRING },
              lensUpgradeStrategy: { type: Type.STRING },
              rapportOpener: { type: Type.STRING },
              serviceApproach: { type: Type.STRING },
              objectionHandling: { type: Type.STRING },
              upSellingTips: { type: Type.STRING },
            }
          }
        }
      });
      const resultText = response.text || '{}';
      sessionToSave.aiStrategy = JSON.parse(resultText);
    } catch (err) {
      console.error('Gemini direct session analysis error, fallback initialized:', err);
      sessionToSave.aiStrategy = {
        styleAdvice: `Suggest elegant ${sessionToSave.score.frameStyle} designs matching their ${sessionToSave.score.faceShape} face shape.`,
        lensUpgradeStrategy: `Focus heavily on ${sessionToSave.score.lensFlags.join(' or ') || 'durability coatings'}.`,
        rapportOpener: `Hello ${sessionToSave.contact?.name || 'there'}! Let's find your perfect style match today.`,
        serviceApproach: `Present matching styles highlighting personalized aesthetics and comfort.`,
        objectionHandling: 'Offer installments or discuss long-term durability rewards.',
        upSellingTips: 'Outline custom lens add-ons for screen work.',
        isFallback: true
      };
    }
  }

  // Prepend to our memory store
  storeSessions[activeStoreId] = [sessionToSave, ...storeSessions[activeStoreId]];
  savePersistedSessions();
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

  savePersistedSessions();
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
