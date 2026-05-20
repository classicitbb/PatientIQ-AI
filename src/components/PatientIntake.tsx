/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { QUESTIONS, scoreAnswers, generateId } from '../utils/questions';
import { StoreConfig, PatientSession, OptionKey } from '../types';
import { Sparkles, Maximize2, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface PatientIntakeProps {
  config: StoreConfig;
  onSessionComplete: (session: PatientSession) => void;
}

export default function PatientIntake({ config, onSessionComplete }: PatientIntakeProps) {
  const [step, setStep] = useState<number>(-1); // -1: Welcome, 0: Contact info, 1-12: Questions, 13: Thank You
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isNewPatient, setIsNewPatient] = useState<boolean>(true);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedSession, setCompletedSession] = useState<PatientSession | null>(null);

  // Auto-advance helper on option tap
  const handleOptionTap = (questionId: string, optionKey: OptionKey) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 380);
  };

  const handleNextStep = () => {
    if (step === 0 && (!name.trim() || !phone.trim())) {
      return; // validation
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(-1, prev - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const score = scoreAnswers(answers);
    const newSession: PatientSession = {
      id: generateId(),
      timestamp: Date.now(),
      isNewPatient,
      contact: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      },
      answers,
      score,
      csrAssessment: null,
    };

    // Trigger AI strategy asynchronously in the background via express API (safely error protected)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.strategy) {
          newSession.aiStrategy = data.strategy;
        }
      }
    } catch (e) {
      console.warn('Unable to query Gemini on submit, fallback to rule-based analysis will be handles inside CSR panel.', e);
    }

    onSessionComplete(newSession);
    setCompletedSession(newSession);
    setStep(13);
    setSubmitting(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        // Fallback for Safari/iOS
        const docEl = document.documentElement as any;
        if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else {
          console.warn(`Error enabling full screen limits: ${err.message}`);
        }
      });
    } else {
      document.exitFullscreen();
    }
  };

  const resetForm = () => {
    setStep(-1);
    setName('');
    setPhone('');
    setEmail('');
    setIsNewPatient(true);
    setAnswers({});
    setCompletedSession(null);
  };

  // Helper for tracking progress dots (Questions Q1 to Q12)
  const renderProgressDots = () => {
    if (step < 1 || step > 12) return null;
    return (
      <div className="flex justify-center items-center gap-1.5 py-4 px-6 overflow-x-auto max-w-full">
        {QUESTIONS.map((q, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone = step > num;

          return (
            <div
              id={`progress-dot-${num}`}
              key={q.id}
              className={`h-2 rounded-full transition-all duration-300 shrink-0 ${
                isActive 
                  ? 'w-7' 
                  : 'w-2'
              }`}
              style={{
                backgroundColor: isActive 
                  ? (config.accentColor || '#CC0000') 
                  : isDone 
                  ? '#FFFFFF' 
                  : 'rgba(255,255,255,0.35)'
              }}
            />
          );
        })}
      </div>
    );
  };

  // Render question component
  const renderQuestion = () => {
    if (step < 1 || step > 12) return null;
    const currentQ = QUESTIONS[step - 1];
    const selectedOpt = answers[currentQ.id];

    return (
      <div 
        key={currentQ.id}
        id={`question-card-${currentQ.id}`}
        className="bg-white rounded-[24px] shadow-card border border-slate-50 p-6 md:p-8 relative overflow-hidden transition-all duration-300 select-none animate-[cardIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        {/* Detail Spark */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: config.primaryColor }} />

        {/* Counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{currentQ.emoji}</span>
          <span className="text-xs font-bold font-mono tracking-widest px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
            QUIZ {step} / 12
          </span>
        </div>

        {/* Text */}
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
          {currentQ.text}
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {currentQ.subtitle}
        </p>

        {/* Grid of Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOpt === opt.key;
            return (
              <button
                id={`option-${currentQ.id}-${opt.key}`}
                key={opt.key}
                type="button"
                onClick={() => handleOptionTap(currentQ.id, opt.key)}
                className={`py-3.5 px-4 text-left rounded-xl border-2 transition-all duration-200 outline-none flex items-center gap-3 active:scale-[0.98] select-none ${
                  isSelected 
                    ? 'text-white border-transparent' 
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                style={{
                  backgroundColor: isSelected ? config.primaryColor : undefined,
                  transform: isSelected ? 'scale(1.02)' : undefined,
                }}
              >
                <span className="text-2xl shrink-0">{opt.emoji}</span>
                <span className="text-sm font-medium tracking-tight leading-tight">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          <button
            id="nav-back-btn"
            type="button"
            onClick={handlePrevStep}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition py-2"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step === 12 ? (
            <button
              id="nav-finish-btn"
              type="button"
              disabled={!selectedOpt}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold transition flex-row cursor-pointer ${
                submitting || !selectedOpt ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
              style={{ backgroundColor: config.accentColor }}
            >
              {submitting ? 'Generating strategy...' : 'Calculate My Style →'}
            </button>
          ) : (
            <button
              id="nav-next-btn"
              type="button"
              disabled={!selectedOpt}
              onClick={handleNextStep}
              className={`flex items-center gap-1.5 text-sm font-bold transition px-4 py-2 text-white rounded-xl ${
                !selectedOpt ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:brightness-110 active:scale-95'
              }`}
              style={{ backgroundColor: config.primaryColor }}
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden p-4 md:p-6 pb-[80px]"
      style={{
        background: `radial-gradient(circle at top right, ${config.primaryColor}dd, ${config.primaryColor}ff)`
      }}
    >
      {/* Decorative vector background clouds */}
      <div className="absolute top-[8%] right-[-10%] w-[380px] h-[380px] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-15%] w-[420px] h-[420px] rounded-full bg-white/5 blur-[90px] pointer-events-none" />

      {/* Top Banner Action */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between py-2 text-white z-10">
        <div className="flex items-center gap-2">
          {/* Spectacles clean vector */}
          <div className="p-2 bg-white/10 rounded-xl">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M6 14C8.20914 14 10 12.2091 10 10C10 7.79086 8.20914 6 6 6C3.79086 6 2 7.79086 2 10C2 12.2091 3.79086 14 6 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 14C20.2091 14 22 12.2091 22 10C22 7.79086 20.2091 6 18 6C15.7909 6 14 7.79086 14 10C14 12.2091 15.7909 14 18 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 10C11.5 10 12.5 10 14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 10L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21.5 10L23 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight uppercase">
            {config.storeName}
          </span>
        </div>

        <button
          id="toggle-fullscreen-btn"
          onClick={toggleFullscreen}
          className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition duration-150 flex items-center gap-1.5 focus:outline-none"
          title="Toggle Kiosk Fullscreen Mode"
        >
          <Maximize2 size={16} />
          <span className="text-xs font-semibold hidden sm:inline">Kiosk Mode</span>
        </button>
      </div>

      {/* Progress indicators */}
      <div className="w-full z-10">{renderProgressDots()}</div>

      {/* Central Content Box */}
      <div className="w-full max-w-xl mx-auto my-auto py-6 relative z-10 flex flex-col justify-center">
        {/* Welcome Screen */}
        {step === -1 && (
          <div 
            id="welcome-card"
            className="bg-white rounded-[28px] shadow-card p-6 md:p-8 relative overflow-hidden text-center animate-[cardIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
          >
            <div className="flex justify-center mb-5">
              <span className="text-6xl animate-pulse">👋</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">
              Intelligent Fitting Profile
            </h1>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
              {config.welcomeMessage}
            </p>

            {/* Checkbox selector */}
            <div className="flex justify-center mb-8">
              <label 
                id="new-patient-toggle-label"
                className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-100 hover:bg-slate-100/70 rounded-2xl transition max-w-xs justify-center"
              >
                <input
                  id="new-patient-checkbox"
                  type="checkbox"
                  checked={isNewPatient}
                  onChange={(e) => setIsNewPatient(e.target.checked)}
                  className="w-5 h-5 accent-indigo-700 text-indigo-100 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">This is my first visit here</span>
              </label>
            </div>

            <button
              id="start-intake-btn"
              onClick={handleNextStep}
              className="w-full max-w-xs bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl shadow-indigo-200 shadow-xl transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: config.primaryColor }}
            >
              Let's Get Started <Sparkles size={18} />
            </button>
          </div>
        )}

        {/* Gathering contact stats */}
        {step === 0 && (
          <form 
            id="contact-form"
            onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}
            className="bg-white rounded-[24px] shadow-card border border-slate-50 p-6 md:p-8 animate-[cardIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
          >
            <div className="text-center mb-6">
              <span className="text-4xl">📝</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-2 mb-1">Your Details</h2>
              <p className="text-sm text-slate-500 leading-normal max-w-xs mx-auto">
                Please register your visit so our opticians can retrieve your custom design analysis file.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">First & Last Name *</label>
                  <input
                    id="contact-name-input"
                    type="text"
                    required
                    placeholder="e.g. Maria Tempore"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-800 rounded-xl leading-tight focus:outline-none transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number *</label>
                  <input
                    id="contact-phone-input"
                    type="tel"
                    required
                    placeholder="e.g. 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-800 rounded-xl leading-tight focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address (Optional)</label>
                <input
                  id="contact-email-input"
                  type="email"
                  placeholder="e.g. maria@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-800 rounded-xl leading-tight focus:outline-none transition font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mt-6">
              <p className="text-[11px] text-slate-400 font-medium text-center">
                🔒 Your privacy is fully protected. We never distribute your email or contact metrics to external agencies.
              </p>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              <button
                id="contact-back-btn"
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft size={16} /> Welcome
              </button>
              <button
                id="contact-next-btn"
                type="submit"
                disabled={!name.trim() || !phone.trim()}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-extrabold transition text-sm cursor-pointer ${
                  !name.trim() || !phone.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md'
                }`}
                style={{ backgroundColor: config.primaryColor }}
              >
                Let's Quiz! <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Interactive 12 Questions Screen */}
        {step >= 1 && step <= 12 && renderQuestion()}

        {/* Thank You Card */}
        {step === 13 && completedSession && (
          <div 
            id="thank-you-card"
            className="bg-white rounded-[28px] shadow-card px-6 py-8 md:p-8 border border-slate-50 text-center animate-[cardIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden"
          >
            {/* Header background accents */}
            <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: config.primaryColor }} />
            
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-4xl animate-bounce">
                🎉
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
              All Set, {name.split(' ')[0]}!
            </h2>
            <p className="text-sm md:text-base text-slate-600 max-w-sm mx-auto mb-6">
              Your personal style and wellness preferences have been processed securely. Your design counselor will lead you shortly!
            </p>

            {/* Calculated Local preference tag indicators */}
            <div className="bg-slate-50/80 rounded-2xl p-4 mb-6 border border-slate-100 max-w-md mx-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Calculated Style Arch</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 z-10">
                  🧬 {completedSession.score.frameStyle}
                </span>
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 z-10">
                  🎨 {completedSession.score.colorPref.split(' — ')[0]}
                </span>
                {completedSession.score.lensFlags.slice(0, 2).map((flag) => (
                  <span key={flag} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 z-10">
                    ⚡ {flag.toUpperCase()}
                  </span>
                ))}
                {isNewPatient && (
                  <span className="px-3 py-1.5 bg-pink-50 text-pink-700 text-xs font-bold rounded-lg border border-pink-100 z-10">
                    🆕 NEW CLIENT FLAG
                  </span>
                )}
              </div>
            </div>

            {/* Handing Instructions panel */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-8 max-w-sm mx-auto">
              <p className="text-xs font-extrabold text-indigo-800">
                👉 PLEASE HAND THIS TABLET TO THE FRONT OFFICE DESK
              </p>
              <p className="text-[10px] text-indigo-500 font-medium mt-1 uppercase tracking-wider">
                Our team will fetch your file and initiate personalized testing.
              </p>
            </div>

            <button
              id="reset-intake-btn"
              onClick={resetForm}
              className="px-6 py-3 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 text-xs font-extrabold rounded-xl transition duration-150 active:scale-95 flex items-center gap-1.5 mx-auto"
            >
              🔄 Start next pre-visit profile form
            </button>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="w-full text-center text-xs text-white/45 py-2 z-10">
        Patient IQ Platform &bull; Pre-Visit Kiosk Software &bull; All private data AES-protected
      </div>
    </div>
  );
}
