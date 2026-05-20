/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, OptionKey, AnswerScore } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'How do you typically wear your glasses?',
    subtitle: 'Choose the option that fits best',
    emoji: '👓',
    options: [
      { key: 'a', text: "Every day, all day — they're part of me", emoji: '☀️' },
      { key: 'b', text: 'Mostly for reading or screens', emoji: '💻' },
      { key: 'c', text: 'I switch between glasses and contacts', emoji: '🔄' },
      { key: 'd', text: 'Mainly for driving or specific tasks', emoji: '🚗' },
    ],
  },
  {
    id: 'q2',
    text: 'What word best describes your personal style?',
    subtitle: 'Go with your gut — no wrong answer',
    emoji: '✨',
    options: [
      { key: 'a', text: 'Classic & Polished', emoji: '🎩' },
      { key: 'b', text: 'Modern & Bold', emoji: '🔷' },
      { key: 'c', text: 'Relaxed & Practical', emoji: '🌿' },
      { key: 'd', text: 'Creative & Unique', emoji: '🎨' },
    ],
  },
  {
    id: 'q3',
    text: 'On a typical weekday, how many hours are you on screens?',
    subtitle: 'Phone, computer, TV — all count!',
    emoji: '🖥️',
    options: [
      { key: 'a', text: 'Less than 2 hours', emoji: '😎' },
      { key: 'b', text: 'About 2–4 hours', emoji: '📱' },
      { key: 'c', text: 'About 4–8 hours', emoji: '💻' },
      { key: 'd', text: 'More than 8 hours', emoji: '🔥' },
    ],
  },
  {
    id: 'q4',
    text: 'When buying something you use every day, you tend to:',
    subtitle: 'Think about how you usually decide',
    emoji: '🛍️',
    options: [
      { key: 'a', text: 'Invest in quality — you get what you pay for', emoji: '💎' },
      { key: 'b', text: 'Find the sweet spot between quality and value', emoji: '⚖️' },
      { key: 'c', text: 'Look for the best deal possible', emoji: '🔍' },
      { key: 'd', text: 'Ask someone I trust for a recommendation', emoji: '🤝' },
    ],
  },
  {
    id: 'q5',
    text: 'If your glasses were a vehicle, they’d be:',
    subtitle: 'First instinct is usually the best!',
    emoji: '🚗',
    options: [
      { key: 'a', text: 'A reliable SUV — practical, does it all', emoji: '🚙' },
      { key: 'b', text: 'A sports car — turns heads effortlessly', emoji: '🏎️' },
      { key: 'c', text: 'A classic car — timeless & full of character', emoji: '🚘' },
      { key: 'd', text: 'A rugged 4×4 — built to handle anything', emoji: '🚜' },
    ],
  },
  {
    id: 'q6',
    text: 'How long ago did you get your current glasses?',
    subtitle: 'Be honest — no judgment here!',
    emoji: '⏰',
    options: [
      { key: 'a', text: 'Less than a year ago', emoji: '✨' },
      { key: 'b', text: 'About 1–2 years ago', emoji: '📅' },
      { key: 'c', text: 'About 2–3 years ago', emoji: '⏳' },
      { key: 'd', text: 'More than 3 years ago!', emoji: '😬' },
    ],
  },
  {
    id: 'q7',
    text: 'In your perfect glasses, you’d feel:',
    subtitle: 'What matters most to you',
    emoji: '🌟',
    options: [
      { key: 'a', text: 'Confident and put-together', emoji: '💼' },
      { key: 'b', text: 'Comfortable and at ease', emoji: '😌' },
      { key: 'c', text: 'Active and ready for anything', emoji: '🏃' },
      { key: 'd', text: 'Expressive and noticed', emoji: '🌟' },
    ],
  },
  {
    id: 'q8',
    text: 'If you treated yourself to something today, you’d spend:',
    subtitle: 'For something you’d wear every single day',
    emoji: '💳',
    options: [
      { key: 'a', text: 'Up to $100', emoji: '💚' },
      { key: 'b', text: '$100 – $250', emoji: '💛' },
      { key: 'c', text: '$250 – $500', emoji: '🧡' },
      { key: 'd', text: 'Whatever it takes to get it right', emoji: '❤️' },
    ],
  },
  {
    id: 'q9',
    text: 'Which best describes the shape of your face?',
    subtitle: 'This helps us suggest the most flattering frames',
    emoji: '🔵',
    options: [
      { key: 'a', text: 'Round — soft, full features', emoji: '⭕' },
      { key: 'b', text: 'Oval — balanced & proportional', emoji: '🥚' },
      { key: 'c', text: 'Square — strong, defined jawline', emoji: '◼️' },
      { key: 'd', text: 'Heart / Diamond — wider at top', emoji: '🔺' },
    ],
  },
  {
    id: 'q10',
    text: 'Which colors do you tend to gravitate toward?',
    subtitle: 'Think about your wardrobe & accessories',
    emoji: '🎨',
    options: [
      { key: 'a', text: 'Classic blacks & dark tones', emoji: '🖤' },
      { key: 'b', text: 'Warm browns & tortoiseshell', emoji: '🍂' },
      { key: 'c', text: 'Metallics — silver, gold, rose gold', emoji: '✨' },
      { key: 'd', text: 'Bold & bright — I like to stand out!', emoji: '🌈' },
    ],
  },
  {
    id: 'q11',
    text: 'How do you feel about your current frame style?',
    subtitle: 'Honest answer = better recommendations!',
    emoji: '🪞',
    options: [
      { key: 'a', text: 'Love it — want something very similar', emoji: '💕' },
      { key: 'b', text: 'Ready for something completely different', emoji: '🔄' },
      { key: 'c', text: 'Similar, but with a few upgrades', emoji: '✨' },
      { key: 'd', text: 'Open to whatever looks best on me', emoji: '🤷' },
    ],
  },
  {
    id: 'q12',
    text: 'Where do you wear your glasses most?',
    subtitle: 'Choose your primary environment',
    emoji: '📍',
    options: [
      { key: 'a', text: 'Office / indoors — lots of screen time', emoji: '💼' },
      { key: 'b', text: 'Outdoors & active lifestyle', emoji: '🌿' },
      { key: 'c', text: 'Everywhere — need them for everything', emoji: '🔄' },
      { key: 'd', text: 'Mainly formal / professional settings', emoji: '🎭' },
    ],
  },
];

export function scoreAnswers(answers: Record<string, OptionKey>): AnswerScore {
  // Score mapping based on the instructions
  const q4Map: Record<OptionKey, number> = { a: 25, b: 18, c: 8, d: 15 };
  const q6Map: Record<OptionKey, number> = { a: 5, b: 15, c: 25, d: 35 };
  const q8Map: Record<OptionKey, number> = { a: 8, b: 18, c: 28, d: 40 };

  const pr = (q4Map[answers.q4] || 0) + (q6Map[answers.q6] || 0) + (q8Map[answers.q8] || 0);

  const urgency = ({ a: 'low', b: 'low', c: 'medium', d: 'high' }[answers.q6] || 'low') as 'low' | 'medium' | 'high';
  const budgetTier = ({ a: 'value', b: 'mid', c: 'premium', d: 'luxury' }[answers.q8] || 'mid') as 'value' | 'mid' | 'premium' | 'luxury';

  const frameStyle = ({
    a: 'Classic & Polished',
    b: 'Modern & Bold',
    c: 'Relaxed & Practical',
    d: 'Creative & Unique',
  }[answers.q2] || 'Classic & Polished') as 'Classic & Polished' | 'Modern & Bold' | 'Relaxed & Practical' | 'Creative & Unique';

  const faceShape = ({
    a: 'Round',
    b: 'Oval',
    c: 'Square',
    d: 'Heart/Diamond',
  }[answers.q9] || 'Oval') as 'Round' | 'Oval' | 'Square' | 'Heart/Diamond';

  const colorPref = {
    a: 'Classic blacks & dark tones',
    b: 'Warm browns & tortoiseshell',
    c: 'Metallics — silver, gold, rose gold',
    d: 'Bold & bright — I like to stand out!',
  }[answers.q10] || 'Classic blacks & dark tones';

  const usageEnv = {
    a: 'Office / indoors — lots of screen time',
    b: 'Outdoors & active lifestyle',
    c: 'Everywhere — need them for everything',
    d: 'Mainly formal / professional settings',
  }[answers.q12] || 'Everywhere — need them for everything';

  const lensFlags: string[] = [];
  if (['c', 'd'].includes(answers.q3)) {
    lensFlags.push('blue-light');
  }
  if (answers.q1 === 'c') {
    lensFlags.push('backup pair opp.');
  }
  if (['c', 'd'].includes(answers.q6)) {
    lensFlags.push('progressive check');
  }
  if (answers.q1 === 'a') {
    lensFlags.push('premium coatings');
  }
  if (answers.q3 === 'd') {
    lensFlags.push('transitions');
  }

  return {
    purchaseReadiness: Math.min(100, Math.round(pr)),
    urgency,
    budgetTier,
    frameStyle,
    faceShape,
    colorPref,
    usageEnv,
    lensFlags,
  };
}

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `ps-${timestamp}-${randomPart}`;
}

export function getFrameAdvice(style: string, shape: string, color: string): string {
  let shapeAdvice = '';
  if (shape === 'Round') {
    shapeAdvice = 'angular frames with clean lines like rectangles or geometric squares to add visual structure';
  } else if (shape === 'Square') {
    shapeAdvice = 'soft round, oval, or cat-eye frames to balance the defined, strong jawline and structure';
  } else if (shape === 'Heart/Diamond') {
    shapeAdvice = 'subtle rimless, oval, or light butterfly designs that are slightly wider at the bottom';
  } else {
    shapeAdvice = 'almost any geometric silhouette including aviators, rectangles, or bold oversized structures';
  }

  return `Recommend ${shapeAdvice} in beautiful ${color.toLowerCase()} to accentuate their ${style.toLowerCase()} personality.`;
}

export function getLensAdvice(flags: string[], budget: string): string[] {
  const suggestions: string[] = [];

  if (flags.includes('blue-light')) {
    suggestions.push('Premium blue-light filter to prevent screen-related visual fatigue.');
  }
  if (flags.includes('progressive check')) {
    suggestions.push('Dual-focus digital progressives or advanced fatigue-relieving daily office lenses.');
  }
  if (flags.includes('transitions')) {
    suggestions.push('Smart Transitions® optical-to-sun light adjustment tints.');
  }
  if (flags.includes('premium coatings')) {
    suggestions.push('Anti-static, hydrophobic anti-reflective (AR) scratch-resistant durability coatings.');
  }
  if (flags.includes('backup pair opp.')) {
    suggestions.push('A secondary dedicated outdoor/driving sunglass or prescription backup frame.');
  }

  if (budget === 'luxury' || budget === 'premium') {
    suggestions.push('Signature thin high-index featherweight lenses with personalized custom engraving.');
  } else if (budget === 'mid') {
    suggestions.push('Comprehensive value-plus impact-resistant polycarbonate index upgrade package.');
  }

  return suggestions;
}
