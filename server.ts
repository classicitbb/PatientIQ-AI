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

// REST Api endpoint for patient profile interpretation and engagement strategies
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
    const pronoun = 'they';

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
