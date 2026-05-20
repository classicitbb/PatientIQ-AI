/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { PatientSession, StoreConfig, CsrAssessment, OptionKey, AiStrategy } from '../types';
import { scoreAnswers, getFrameAdvice, getLensAdvice, QUESTIONS } from '../utils/questions';
import { 
  User, CheckCircle2, AlertCircle, Phone, Mail, Award, ArrowUpRight, 
  HelpCircle, Sparkles, MessageSquare, Star, DollarSign, Bookmark, RefreshCw, FileText
} from 'lucide-react';

interface CsrDashboardProps {
  config: StoreConfig;
  sessions: PatientSession[];
  onUpdateSession: (updated: PatientSession) => void;
}

export default function CsrDashboard({ config, sessions, onUpdateSession }: CsrDashboardProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );

  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');

  // Assessment Fields
  const [outcome, setOutcome] = useState<'purchased' | 'no-sale' | 'followup'>('purchased');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<string>('frames+lenses+upgrades');
  const [noSaleReason, setNoSaleReason] = useState<string>('price/budget');
  const [followupNote, setFollowupNote] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [skills, setSkills] = useState({
    rapport: 5,
    discovery: 5,
    presentation: 5,
    lensUpsell: 5,
    close: 5,
  });
  const [csrName, setCsrName] = useState<string>('');

  // UI state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeSessionId = sessions.some(s => s.id === selectedSessionId)
    ? selectedSessionId
    : sessions[0]?.id ?? null;
  const selectedSession = sessions.find(s => s.id === activeSessionId) || null;

  // Sync edits on change of selected patient
  const syncPatientFields = (session: PatientSession) => {
    setEditName(session.contact.name);
    setEditPhone(session.contact.phone);
    setEditEmail(session.contact.email);

    if (session.csrAssessment) {
      setOutcome(session.csrAssessment.outcome);
      setPurchaseAmount(session.csrAssessment.purchaseAmount.toString());
      setInvoiceNumber(session.csrAssessment.invoiceNumber);
      setPurchaseType(session.csrAssessment.purchaseType || 'frames+lenses+upgrades');
      setNoSaleReason(session.csrAssessment.noSaleReason || 'price/budget');
      setFollowupNote(session.csrAssessment.followupNote || '');
      setNotes(session.csrAssessment.notes);
      setSkills(session.csrAssessment.skills);
      setCsrName(session.csrAssessment.csrName);
    } else {
      // Defaults
      setOutcome('purchased');
      setPurchaseAmount('');
      setInvoiceNumber('');
      setPurchaseType('frames+lenses+upgrades');
      setNoSaleReason('price/budget');
      setFollowupNote('');
      setNotes('');
      setSkills({ rapport: 5, discovery: 5, presentation: 5, lensUpsell: 5, close: 5 });
      setCsrName('');
    }
  };

  useEffect(() => {
    if (!activeSessionId) return;

    const session = sessions.find(item => item.id === activeSessionId);
    if (session) {
      syncPatientFields(session);
    }
  }, [activeSessionId]);

  const selectPatient = (session: PatientSession) => {
    setSelectedSessionId(session.id);
    syncPatientFields(session);
  };

  const fireToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleUpdateContact = () => {
    if (!selectedSession) return;
    const updated: PatientSession = {
      ...selectedSession,
      contact: {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      }
    };
    onUpdateSession(updated);
    fireToast('Customer contact record updated successfully!');
  };

  // Connects directly to the express API to trigger Gemini analysis
  const handleRegenerateAi = async () => {
    if (!selectedSession) return;
    setAiLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSession),
      });

      if (!res.ok) throw new Error('Analytical servers experienced failure.');
      const data = await res.json();
      if (data && data.strategy) {
        const updated: PatientSession = {
          ...selectedSession,
          aiStrategy: data.strategy,
        };
        onUpdateSession(updated);
        fireToast('Gemini analyzed fresh custom styles successfully!');
      }
    } catch (e: any) {
      fireToast(`Gemini error: ${e.message || 'Check Server Logs'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const saveAssessment = () => {
    if (!selectedSession) return;

    const auditAssessment: CsrAssessment = {
      csrName: csrName.trim() || 'Retail Stylist',
      outcome,
      purchaseAmount: outcome === 'purchased' ? parseFloat(purchaseAmount) || 0 : 0,
      invoiceNumber: outcome === 'purchased' ? invoiceNumber : '',
      purchaseType: outcome === 'purchased' ? purchaseType : '',
      noSaleReason: outcome === 'no-sale' ? noSaleReason : '',
      followupNote: outcome === 'followup' ? followupNote : '',
      notes,
      skills,
    };

    const updated: PatientSession = {
      ...selectedSession,
      csrAssessment: auditAssessment,
    };

    onUpdateSession(updated);
    fireToast('Outcome and skills card saved successfully!');
  };

  // Helper for rendering skills stars toggle
  const renderSkillStarsGrid = (skillKey: keyof typeof skills, label: string) => {
    const value = skills[skillKey];
    return (
      <div id={`skill-field-${String(skillKey)}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-100/70 rounded-xl">
        <span className="text-xs font-bold text-slate-700 tracking-tight">{label}</span>
        <div className="flex gap-1.5 mt-2 sm:mt-0">
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const active = starIdx <= value;
            return (
              <button
                id={`star-${String(skillKey)}-${starIdx}`}
                key={starIdx}
                type="button"
                onClick={() => setSkills(prev => ({ ...prev, [skillKey]: starIdx }))}
                className="focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-300 rounded"
              >
                <Star
                  size={18}
                  className={`transition duration-150 p-0.5 rounded ${
                    active 
                      ? 'fill-amber-400 stroke-amber-500 scale-110' 
                      : 'stroke-slate-300 hover:stroke-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-[80px] font-sans">
      {/* Dynamic calculations for sidebar */}
      {(() => {
        const totalSessions = sessions.length;
        const assessedSessions = sessions.filter(s => !!s.csrAssessment);
        const soldSessions = sessions.filter(s => s.csrAssessment?.outcome === 'purchased');
        const conversionRate = assessedSessions.length > 0 
          ? Math.round((soldSessions.length / assessedSessions.length) * 100) 
          : 0;

        return (
          <>
            {/* Top Navigation Bar - Professional Polish style */}
            <nav id="csr-navbar" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center shadow-sm" style={{ backgroundColor: config.primaryColor || '#4f46e5' }}>
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight text-slate-800">IQ.CustomerEngine</span>
                  <span className="ml-2.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                    {config.storeName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Stylist Portal Active</span>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-3 hidden sm:flex">
                  <div className="text-right">
                    <p className="text-xs font-bold leading-none text-slate-800">Practitioner Console</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Retail Stylist Portal</p>
                  </div>
                  <div className="w-9 h-9 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center font-black text-xs text-indigo-600 uppercase shadow-sm">
                    PC
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Grid Layout */}
            <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-cardIn">
              
              {/* LEFT COLUMN (4 spans): Today's Patient Queue */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-4">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                      Active Customer Queue ({sessions.length})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                    {sessions.length === 0 ? (
                      <div id="no-patients-alert" className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <User size={28} className="stroke-slate-400 mx-auto mb-2 text-slate-400" />
                        <p className="text-xs font-bold text-slate-600">No Pre-visit Registrations</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                          Fill the form on Patient mode first or scan the QR code to populate active queues.
                        </p>
                      </div>
                    ) : (
                      sessions.map((sess) => {
                        const isCur = sess.id === activeSessionId;
                        const isAssessed = !!sess.csrAssessment;

                        // High-fidelity badge computation
                        const prSymbol = sess.score.purchaseReadiness >= 70 
                          ? { tag: '🔥 High', style: 'bg-rose-50 text-rose-700 border-rose-150' }
                          : sess.score.purchaseReadiness >= 45
                          ? { tag: '⚡ Mid', style: 'bg-amber-50 text-amber-700 border-amber-150' }
                          : { tag: '❄️ Low', style: 'bg-slate-50 text-slate-600 border-slate-150' };

                        return (
                          <button
                            id={`queue-patient-${sess.id}`}
                            key={sess.id}
                            onClick={() => selectPatient(sess)}
                            className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex justify-between items-center relative focus:outline-none ${
                              isCur 
                                ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-900 ring-4 ring-indigo-50 shadow-sm font-medium' 
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-705'
                            }`}
                            style={isCur ? { borderLeftColor: config.primaryColor || '#4f46e5' } : {}}
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 leading-tight">
                                  {sess.contact.name || 'Anonymous Patient'}
                                </span>
                                {sess.isNewPatient && (
                                  <span className="text-[8px] bg-pink-50 border border-pink-200 text-pink-700 font-extrabold px-1.5 rounded uppercase leading-none">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">
                                🕰️ {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {sess.score.budgetTier.toUpperCase()}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase ${
                                sess.csrAssessment?.outcome === 'purchased'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                                  : sess.csrAssessment?.outcome === 'no-sale'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-250'
                                  : sess.csrAssessment?.outcome === 'followup'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-250'
                                  : prSymbol.style
                              }`}>
                                {sess.csrAssessment?.outcome || prSymbol.tag}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200/50">
                                {sess.score.frameStyle}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Efficiency progress panel matching template */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Weekly Goal Efficiency</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{conversionRate}%</span>
                    <span className="text-emerald-600 text-[10px] font-extrabold tracking-tight">+2.4% vs last week</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${conversionRate || 75}%` }}></div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (8 spans): Selected Patient Profile and Inputs */}
              <div className="lg:col-span-8 space-y-6">
                {!selectedSession ? (
                  <div id="no-patient-active-alert" className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center my-auto">
                    <Sparkles size={36} className="stroke-indigo-500 mx-auto mb-3" />
                    <h3 className="text-base font-black text-slate-800">No Patient Selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Please register a patient at the front kiosk node or pick an active queue ticket on the Left sidebar.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header bar matching Billing Dispute template structure */}
                    <div id="patient-identity-card" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div>
                          <h2 className="text-base font-black flex items-center flex-wrap gap-2 text-slate-800 leading-snug">
                            Ticket #{selectedSession.id.substring(0, 7).toUpperCase()} — {selectedSession.contact.name || 'Anonymous Guest'}
                            {selectedSession.isNewPatient && (
                              <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
                                First Visit
                              </span>
                            )}
                            {selectedSession.score.purchaseReadiness >= 70 && (
                              <span className="bg-rose-100 text-rose-700 text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
                                Urgent Buyer
                              </span>
                            )}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Current phone: <strong className="text-slate-600 font-medium">{selectedSession.contact.phone}</strong> {selectedSession.contact.email ? `• Email: ${selectedSession.contact.email}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleRegenerateAi} 
                            disabled={aiLoading}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                            {aiLoading ? 'Re-analyzing...' : 'Refresh Playbook'}
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        {/* Inline Contact CRM Fields Editor */}
                        <div id="form-contact-editor" className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3">
                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Consultation Name</label>
                            <div className="relative">
                              <User size={12} className="absolute left-3 top-3.5 text-slate-400" />
                              <input
                                id="editor-name"
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-xs font-bold p-2.5 pl-8 bg-slate-50/70 hover:bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Registered Phone</label>
                            <div className="relative">
                              <Phone size={12} className="absolute left-3 top-3.5 text-slate-400" />
                              <input
                                id="editor-phone"
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full text-xs font-bold p-2.5 pl-8 bg-slate-50/70 hover:bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5">Audit Email ID</label>
                            <div className="relative">
                              <Mail size={12} className="absolute left-3 top-3.5 text-slate-400" />
                              <input
                                id="editor-email"
                                type="text"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full text-xs font-bold p-2.5 pl-8 bg-slate-50/70 hover:bg-slate-50 text-slate-800 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pb-4 border-b border-slate-100">
                          <button
                            id="update-contact-btn"
                            onClick={handleUpdateContact}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 shadow-sm text-xs text-white font-bold rounded-lg transition cursor-pointer"
                          >
                            Update CRM Metadata
                          </button>
                        </div>

                        {/* Customer IQ Diagnostics Cards grid matching layout templates */}
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer IQ Insights</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                            <div className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-lg border border-slate-200/60 transition shadow-sm">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Calculated Frame</span>
                              <span className="font-extrabold text-slate-800 text-sm">{selectedSession.score.frameStyle}</span>
                            </div>
                            <div className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-lg border border-slate-200/60 transition shadow-sm">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Anatomy Structure</span>
                              <span className="font-extrabold text-slate-800 text-sm">{selectedSession.score.faceShape} Face</span>
                            </div>
                            <div className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-lg border border-slate-200/60 transition shadow-sm">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Aesthetic Color</span>
                              <span className="font-extrabold text-slate-800 text-sm line-clamp-1">{selectedSession.score.colorPref}</span>
                            </div>
                            <div className="p-3 bg-slate-50 hover:bg-slate-100/40 rounded-lg border border-slate-200/60 transition shadow-sm">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Budget Class</span>
                              <span className="font-extrabold text-indigo-700 text-sm uppercase">{selectedSession.score.budgetTier}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Lens physical triggers */}
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {selectedSession.score.lensFlags.map((flag) => (
                            <span key={flag} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-650 rounded-md text-[10px] font-bold tracking-wide uppercase">
                              🛡️ Target: {flag.split('/')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

              {/* Gemini AI Strategic Sales Guide card */}
              <div id="gemini-strategy-card" className="bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden shadow-sm relative animate-cardIn">
                <div className="p-5 border-b border-indigo-100/60 flex items-center justify-between bg-white/45">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                        Gemini AI Stylist Playbook
                      </h4>
                      <p className="text-[10px] text-indigo-600/80">
                        Smart communication plans &amp; tailored stylistic advice.
                      </p>
                    </div>
                  </div>

                  <button
                    id="regenerate-ai-btn"
                    onClick={handleRegenerateAi}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={11} className={aiLoading ? 'animate-spin' : ''} />
                    {aiLoading ? 'Analyzing...' : 'Ask Gemini'}
                  </button>
                </div>

                {aiLoading ? (
                  /* Shimmer loader skeleton */
                  <div className="p-5 space-y-4">
                    <div className="h-5 bg-indigo-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-indigo-100 rounded animate-pulse w-full" />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="h-14 bg-indigo-100 rounded animate-pulse" />
                      <div className="h-14 bg-indigo-100 rounded animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    
                    {/* Opening greeting lines with big visual quotes */}
                    <div className="p-4 bg-white/80 rounded-lg border border-indigo-100 relative shadow-sm">
                      <span className="absolute left-3 top-[-9px] px-1.5 py-0.5 bg-indigo-600 text-[8px] font-black rounded tracking-widest uppercase text-white leading-none">
                        Rapport Opener Line (Dialogue)
                      </span>
                      <p className="text-xs md:text-sm italic font-semibold text-indigo-950 mt-1 leading-relaxed">
                        "{selectedSession.aiStrategy?.rapportOpener || `Welcome back ${selectedSession.contact.name}! I see you have high screen protection priorities for your busy daily environments...`}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Stylist frame tips */}
                      <div className="p-4 bg-white/60 rounded-lg border border-indigo-100">
                        <span className="text-[10px] font-bold tracking-wider text-rose-700 uppercase block mb-1">
                          📐 Ideal Silhouette &amp; Fits
                        </span>
                        <p className="text-xs text-slate-750 leading-relaxed font-semibold">
                          {selectedSession.aiStrategy?.styleAdvice || getFrameAdvice(selectedSession.score.frameStyle, selectedSession.score.faceShape, selectedSession.score.colorPref)}
                        </p>
                      </div>

                      {/* Lens advice */}
                      <div className="p-4 bg-white/60 rounded-lg border border-indigo-100">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase block mb-1">
                          💎 Specialty Lens upgrades
                        </span>
                        <ul className="text-xs text-slate-750 space-y-1 list-disc pl-4 font-semibold">
                          {selectedSession.aiStrategy ? (
                            <li>{selectedSession.aiStrategy.lensUpgradeStrategy}</li>
                          ) : (
                            getLensAdvice(selectedSession.score.lensFlags, selectedSession.score.budgetTier).map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Communicative style */}
                      <div className="p-4 bg-white/60 rounded-lg border border-indigo-100">
                        <span className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase block mb-1">
                          🤝 Stylist Communication Guide
                        </span>
                        <p className="text-xs text-slate-750 leading-relaxed font-semibold">
                          {selectedSession.aiStrategy?.serviceApproach || `This is a ${selectedSession.score.budgetTier} buyer. Emphasize comfort characteristics and longevity ratios.`}
                        </p>
                      </div>

                      {/* Objection bypasser */}
                      <div className="p-4 bg-white/60 rounded-lg border border-indigo-100">
                        <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase block mb-1">
                          💸 Objection Tactic (Price/Wait friction)
                        </span>
                        <p className="text-xs text-slate-750 leading-relaxed font-semibold">
                          {selectedSession.aiStrategy?.objectionHandling || `Focus heavily on comfort longevity. Propose installment splits or remind them they use spectacles every minute.`}
                        </p>
                      </div>
                    </div>

                    {selectedSession.aiStrategy?.upSellingTips && (
                      <div className="p-3 bg-indigo-100/55 rounded-lg border border-indigo-100/80">
                        <span className="text-[9px] font-black text-indigo-800 uppercase block mb-0.5">🚀 Extra Upselling Advice</span>
                        <p className="text-xs text-slate-755 leading-relaxed font-semibold">{selectedSession.aiStrategy.upSellingTips}</p>
                      </div>
                    )}

                    {!selectedSession.aiStrategy && (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-center text-xs text-amber-850 font-semibold flex items-center justify-center gap-2">
                        <span>💡 Local rule-based module running. Connect your GEMINI_API_KEY in Secrets panel to unlock real-time Gemini AI playbooks.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Patient CRM and Sales outcome assessment */}
              <div id="csr-assessment-card" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="pb-3 border-b border-slate-250">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <FileText size={18} /> Record Transaction &amp; Assess Performance
                  </h3>
                  <p className="text-xs text-slate-400">Complete this file upon finalizing the appointment.</p>
                </div>

                {/* Outcome Toggle Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Appointment Outcome</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      id="outcome-purchased"
                      type="button"
                      onClick={() => setOutcome('purchased')}
                      className={`py-3 text-sm font-extrabold rounded-xl transition border text-center cursor-pointer ${
                        outcome === 'purchased'
                          ? 'bg-emerald-500 text-white border-transparent shadow shadow-emerald-100'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                      }`}
                    >
                      ✅ Purchased
                    </button>
                    <button
                      id="outcome-no-sale"
                      type="button"
                      onClick={() => setOutcome('no-sale')}
                      className={`py-3 text-sm font-extrabold rounded-xl transition border text-center cursor-pointer ${
                        outcome === 'no-sale'
                          ? 'bg-rose-500 text-white border-transparent shadow shadow-rose-100'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                      }`}
                    >
                      ❌ No Sale
                    </button>
                    <button
                      id="outcome-followup"
                      type="button"
                      onClick={() => setOutcome('followup')}
                      className={`py-3 text-sm font-extrabold rounded-xl transition border text-center cursor-pointer ${
                        outcome === 'followup'
                          ? 'bg-amber-500 text-white border-transparent shadow shadow-amber-100'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                      }`}
                    >
                      🔄 Follow-up
                    </button>
                  </div>
                </div>

                {/* Conditional Outcomes layout */}
                <div className="space-y-4 pt-1">
                  {outcome === 'purchased' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Purchase Value ($) *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">$</span>
                          <input
                            id="assessment-amount"
                            type="number"
                            placeholder="399"
                            required
                            value={purchaseAmount}
                            onChange={(e) => setPurchaseAmount(e.target.value)}
                            className="w-full p-3.5 pl-8 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Invoice/Sale Number *</label>
                        <input
                          id="assessment-invoice"
                          type="text"
                          placeholder="e.g. INV-20381"
                          required
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Visual Configuration</label>
                        <select
                          id="assessment-purchase-type"
                          value={purchaseType}
                          onChange={(e) => setPurchaseType(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="frames only">Frames Only Selection</option>
                          <option value="frames+SV">Frames + Single Vision Lenses</option>
                          <option value="frames+progressives">Frames + Progressive Lenses</option>
                          <option value="frames+lenses+upgrades">Frames + Lenses + Premium Upgrades</option>
                          <option value="contacts only">Contact Lenses Only</option>
                          <option value="contacts+glasses">Combined Contacts &amp; Frame Bundle</option>
                          <option value="sunglasses">Designer Prescription Sunglasses</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {outcome === 'no-sale' && (
                    <div className="max-w-md">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Primary Objection Clue *</label>
                      <select
                        id="assessment-nosale-reason"
                        value={noSaleReason}
                        onChange={(e) => setNoSaleReason(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="price/budget">Pricing was beyond expected budget</option>
                        <option value="wanted to compare">Wants to compare competitors/Researching online</option>
                        <option value="style not available">Desired stylistic silhouettes not currently stocked</option>
                        <option value="already bought elsewhere">Already purchased elsewhere last week</option>
                        <option value="came for exam only">Attended for clinical test only (No accessories)</option>
                        <option value="felt rushed">Felt pressured or clinical rushing</option>
                        <option value="couldn't find fit">Did not find comfortable physical bridge fits</option>
                        <option value="prescription not ready">Awaiting medical prescription updates</option>
                        <option value="other">Other unstated external triggers</option>
                      </select>
                    </div>
                  )}

                  {outcome === 'followup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Callback/Followup parameters *</label>
                      <input
                        id="assessment-followup"
                        type="text"
                        placeholder="e.g. Call on Saturday when insurance resets..."
                        required
                        value={followupNote}
                        onChange={(e) => setFollowupNote(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Styling Summary &amp; Notes</label>
                    <textarea
                      id="assessment-notes"
                      rows={3}
                      placeholder="Discuss frame materials reviewed, specific lens upgrades and tint colors chosen, or follow up targets..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                {/* Self-Assessment Star Skills Panel */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-black text-slate-800 mb-1">
                    🌟 Self-Coaching Skill Breakdown
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 pb-2 border-b border-slate-100">
                    Grade your personal customer alignment capabilities during this specific transaction.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {renderSkillStarsGrid('rapport', '🤝 Established Rapport Immediately')}
                    {renderSkillStarsGrid('discovery', '🔍 Discovered Underlying Needs')}
                    {renderSkillStarsGrid('presentation', '👓 Presented Stylist Fits')}
                    {renderSkillStarsGrid('lensUpsell', '💎 Recommended Upgrade Enhancers')}
                    {renderSkillStarsGrid('close', '💳 Confidently Closed the Deal')}
                  </div>
                </div>

                {/* CSR Name and Submission */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Name/Initials *</label>
                    <input
                      id="assessment-csr-name"
                      type="text"
                      placeholder="Sarah K. (Sales Counselor)"
                      required
                      value={csrName}
                      onChange={(e) => setCsrName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <button
                    id="save-assessment-btn"
                    onClick={saveAssessment}
                    className="w-full py-4 text-xs font-extrabold text-white text-center rounded-xl shadow-md transition duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Save Stylist Assessment File
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
          </>
        )
      })()}

      {/* Floating dynamic success toast */}
      {toastMessage && (
        <div id="csr-toast" className="fixed bottom-6 right-6 p-4 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl flex items-center gap-3 z-[1500] animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
