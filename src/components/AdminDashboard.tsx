/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { PatientSession, StoreConfig } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Target, Sparkles, 
  Settings, Link, Copy, Printer, Check, Search
} from 'lucide-react';

interface AdminDashboardProps {
  config: StoreConfig;
  sessions: PatientSession[];
  onUpdateConfig: (updated: StoreConfig) => void;
  onTriggerPrint: () => void;
}

export default function AdminDashboard({ config, sessions, onUpdateConfig, onTriggerPrint }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'csr' | 'focus' | 'setup'>('overview');
  
  // Setup fields
  const [storeName, setStoreName] = useState<string>(config.storeName);
  const [storeAddress, setStoreAddress] = useState<string>(config.storeAddress);
  const [welcomeMessage, setWelcomeMessage] = useState<string>(config.welcomeMessage);
  const [primaryColor, setPrimaryColor] = useState<string>(config.primaryColor);
  const [accentColor, setAccentColor] = useState<string>(config.accentColor);
  const [csrPin, setCsrPin] = useState<string>(config.csrPin);
  const [adminPin, setAdminPin] = useState<string>(config.adminPin);
  const [storeId, setStoreId] = useState<string>(config.storeId || 'default');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Dynamic calculations
  const totalSessions = sessions.length;
  
  const assessedSessions = sessions.filter(s => !!s.csrAssessment);
  const soldSessions = sessions.filter(s => s.csrAssessment?.outcome === 'purchased');
  const noSaleSessions = sessions.filter(s => s.csrAssessment?.outcome === 'no-sale');
  
  const conversionRate = assessedSessions.length > 0 
    ? Math.round((soldSessions.length / assessedSessions.length) * 100) 
    : 0;

  const totalRevenue = soldSessions.reduce((acc, curr) => acc + (curr.csrAssessment?.purchaseAmount || 0), 0);
  
  const avgReadiness = totalSessions > 0
    ? Math.round(sessions.reduce((acc, curr) => acc + curr.score.purchaseReadiness, 0) / totalSessions)
    : 0;

  // Top Opportunities: uncompleted sessions with high purchase readiness >= 60
  const opportunities = sessions
    .filter(s => !s.csrAssessment && s.score.purchaseReadiness >= 60)
    .sort((a, b) => b.score.purchaseReadiness - a.score.purchaseReadiness);

  // Dynamic coaching logic based on real stats
  const getCoachingInsight = () => {
    if (noSaleSessions.length > soldSessions.length && noSaleSessions.length > 0) {
      return {
        title: '⚠️ Objection Handling Focused Training Suggested',
        text: 'Patients are leaving without purchasing despite completing visual intakes. Many list "price/budget" barriers. Organize an active team huddle focusing on demonstrating "price-per-day breakdown values" for everyday items.',
        type: 'warning'
      };
    }
    
    // Check if blue light triggers are highly prevalent
    const blueLightTriggers = sessions.filter(s => s.score.lensFlags.includes('blue-light')).length;
    if (blueLightTriggers >= 2) {
      return {
        title: '💡 Large Blue-Light Filter Upsell Pipeline Active',
        text: `${blueLightTriggers} waiting room profiles reported heavy (4+ hour) weekday screen exposure. Tell your stylists to show high-definition anti-glare lens materials at the dispensing table.`,
        type: 'info'
      };
    }

    const highUrgencyCount = sessions.filter(s => s.score.urgency === 'high').length;
    if (highUrgencyCount >= 2) {
      return {
        title: '🔥 High Urgency Patients Waiting',
        text: `There are ${highUrgencyCount} clients today whose current glasses are over 3 years old. These patients have high clinical urgency. Confidently make a premium prescription recommendation.`,
        type: 'danger'
      };
    }

    return {
      title: '🌟 Strong Performance Trend Today',
      text: 'Your current pre-visit pipeline is functioning exceptionally. Reinforce customized dual-focus office progressives for screen professionals to sustain high dispensing margins.',
      type: 'success'
    };
  };

  const insight = getCoachingInsight();

  // Recharts: CSR Staff metrics grouping
  const csrMap: Record<string, { count: number, revenue: number, salesCount: number, assessedCount: number }> = {};
  sessions.forEach(sess => {
    if (sess.csrAssessment) {
      const name = sess.csrAssessment.csrName || 'Unknown Stylist';
      if (!csrMap[name]) {
        csrMap[name] = { count: 0, revenue: 0, salesCount: 0, assessedCount: 0 };
      }
      csrMap[name].count += 1;
      csrMap[name].assessedCount += 1;
      if (sess.csrAssessment.outcome === 'purchased') {
        csrMap[name].revenue += sess.csrAssessment.purchaseAmount;
        csrMap[name].salesCount += 1;
      }
    }
  });

  const csrPerformanceData = Object.entries(csrMap).map(([name, stats]) => ({
    name,
    consultations: stats.count,
    revenue: stats.revenue,
    conversion: stats.assessedCount > 0 ? Math.round((stats.salesCount / stats.assessedCount) * 100) : 0
  }));

  // Recharts: Average skills radar/column dataset
  let skillSums = { rapport: 0, discovery: 0, presentation: 0, lensUpsell: 0, close: 0 };
  let skillCount = 0;
  sessions.forEach(sess => {
    if (sess.csrAssessment) {
      const s = sess.csrAssessment.skills;
      skillSums.rapport += s.rapport;
      skillSums.discovery += s.discovery;
      skillSums.presentation += s.presentation;
      skillSums.lensUpsell += s.lensUpsell;
      skillSums.close += s.close;
      skillCount += 1;
    }
  });

  const skillsChartData = skillCount > 0 ? [
    { subject: 'Rapport', Rating: parseFloat((skillSums.rapport / skillCount).toFixed(1)) },
    { subject: 'Discovery', Rating: parseFloat((skillSums.discovery / skillCount).toFixed(1)) },
    { subject: 'Presentation', Rating: parseFloat((skillSums.presentation / skillCount).toFixed(1)) },
    { subject: 'Lens Upsell', Rating: parseFloat((skillSums.lensUpsell / skillCount).toFixed(1)) },
    { subject: 'Call to Close', Rating: parseFloat((skillSums.close / skillCount).toFixed(1)) },
  ] : [
    { subject: 'Rapport', Rating: 5 },
    { subject: 'Discovery', Rating: 4.5 },
    { subject: 'Presentation', Rating: 4.1 },
    { subject: 'Lens Upsell', Rating: 4.2 },
    { subject: 'Call to Close', Rating: 3.8 },
  ];

  const COLORS = ['#4F46E5', '#06B6D4', '#6366F1', '#10B981', '#F59E0B'];

  // Calculated percentage triggers for the Pipeline checklist
  const getFlagPercent = (flag: string) => {
    if (totalSessions === 0) return 0;
    const count = sessions.filter(s => s.score.lensFlags.includes(flag)).length;
    return Math.round((count / totalSessions) * 100);
  };

  const newPatientPercent = totalSessions > 0
    ? Math.round((sessions.filter(s => s.isNewPatient).length / totalSessions) * 100)
    : 0;

  const luxuryPercent = totalSessions > 0
    ? Math.round((sessions.filter(s => s.score.budgetTier === 'luxury' || s.score.budgetTier === 'premium').length / totalSessions) * 100)
    : 0;

  const highUrgencyPercent = totalSessions > 0
    ? Math.round((sessions.filter(s => s.score.urgency === 'high').length / totalSessions) * 100)
    : 0;

  // Store url generation
  const buildStoreUrl = () => {
    const origin = window.location.origin;
    return `${origin}/?store=${storeId}`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(buildStoreUrl())}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(buildStoreUrl());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleApplyBranding = () => {
    const updated: StoreConfig = {
      storeId: storeId.trim() || 'default',
      storeName: storeName.trim(),
      storeAddress: storeAddress.trim(),
      welcomeMessage: welcomeMessage.trim(),
      primaryColor,
      accentColor,
      csrPin,
      adminPin
    };
    onUpdateConfig(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-[100px] font-sans antialiased">
      {/* Top Banner Dashboard */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black tracking-widest uppercase rounded">
                Admin Console
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              📊 Optical Analytics &amp; Retail Insights
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review pre-visit pipeline statistics, aggregate revenue conversion, and custom store setup.
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl max-w-xl shrink-0">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'patients', label: 'Patients File' },
              { id: 'csr', label: 'CSR Performance' },
              { id: 'focus', label: 'Focus Areas' },
              { id: 'setup', label: 'Store Setup' },
            ].map((tab) => (
              <button
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition duration-150 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {tab.id === 'setup' ? '⚙️ ' : ''}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Core Body */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* OVERVIEW TAB VIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-cardIn">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div id="kpi-patients-today" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4">
                <span className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                  <Users size={22} />
                </span>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Patients Today</span>
                  <span className="text-2xl font-black text-slate-900">{totalSessions}</span>
                  <span className="text-[10px] block text-slate-500 font-medium mt-0.5">Registrations filed</span>
                </div>
              </div>

              <div id="kpi-conversion" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4">
                <span className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                  <Target size={22} />
                </span>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Conversion Rate</span>
                  <span className="text-2xl font-black text-slate-900">{conversionRate}%</span>
                  <span className="text-[10px] block text-slate-500 font-medium mt-0.5">
                    {soldSessions.length} of {assessedSessions.length} completed
                  </span>
                </div>
              </div>

              <div id="kpi-revenue" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4">
                <span className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                  <DollarSign size={22} />
                </span>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Revenue Today</span>
                  <span className="text-2xl font-black text-slate-900">${totalRevenue}</span>
                  <span className="text-[10px] block text-slate-500 font-medium mt-0.5">
                    Combined values of sales
                  </span>
                </div>
              </div>

              <div id="kpi-avg-readiness" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4">
                <span className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                  <TrendingUp size={22} />
                </span>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Avg Readiness</span>
                  <span className="text-2xl font-black text-slate-900">{avgReadiness}%</span>
                  <span className="text-[10px] block text-slate-500 font-medium mt-0.5">
                    Average purchase urgency
                  </span>
                </div>
              </div>
            </div>

            {/* COACHING COMPLIANCE & OPPORTUNITIES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* TOP OPPORTUNITIES LIST (LEFT 7 spans) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" /> Waitlist Sales Opportunities (PR &ge; 60%)
                </h3>
                
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {opportunities.length === 0 ? (
                    <div id="no-ops-alert" className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs font-bold text-slate-500">No high-readiness candidates are currently pending.</p>
                      <p className="text-[10px] text-slate-400 mt-1">All qualified profiles have either been closed or represent low/medium readiness levels.</p>
                    </div>
                  ) : (
                    opportunities.map((opp) => (
                      <div id={`opp-card-${opp.id}`} key={opp.id} className="p-4 bg-slate-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded uppercase leading-none">
                              PR {opp.score.purchaseReadiness}%
                            </span>
                            <span className="text-sm font-bold text-slate-900">{opp.contact.name || 'Anonymous Patient'}</span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Preferred style: <strong className="text-slate-800 font-semibold">{opp.score.frameStyle}</strong> &bull; Face Shape: <strong className="text-slate-850 font-semibold">{opp.score.faceShape}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 italic font-medium">
                            Recommended Strategy: Recommend {opp.score.frameStyle} with customized protection filters.
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded">
                            {opp.score.budgetTier.toUpperCase()} BUDGET
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COACHING INSIGHT ALERTS (RIGHT 5 spans) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-indigo-950 border border-indigo-900 rounded-xl p-5 shadow-sm text-indigo-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-300 tracking-wider mb-2">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-indigo-200/90 leading-relaxed mb-4 font-medium">
                      {insight.text}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-950/40 border border-indigo-800/40 rounded-xl">
                    <span className="text-[9px] font-black tracking-wider text-indigo-300 uppercase block mb-1">Focus Target</span>
                    <p className="text-xs text-white leading-relaxed font-semibold">
                      Verify that each retail counselor incorporates the pre-visit "Rapport Opener Questions" prompted on their screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PATIENTS FILE TAB VIEW */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm animate-cardIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Patient Records File</h3>
                <p className="text-xs text-slate-400">Search and navigate through today's patient files, fits, and logs.</p>
              </div>

              {/* Direct Filter Search Input */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="patient-search-input"
                  type="text"
                  placeholder="Filter name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold p-2 pl-9 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table id="patients-data-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                    <th className="py-3 px-4">Name / Contact</th>
                    <th className="py-3 px-4">Readiness</th>
                    <th className="py-3 px-4">Calculated Style Arch</th>
                    <th className="py-3 px-4">Lenses Flags</th>
                    <th className="py-3 px-4">Notes &amp; Dialogues</th>
                    <th className="py-3 px-4 text-right">Outcome Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sessions
                    .filter(s => s.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.contact.phone.includes(searchQuery))
                    .map((sess) => {
                      const isAssessed = !!sess.csrAssessment;
                      return (
                        <tr id={`table-row-${sess.id}`} key={sess.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 block">{sess.contact.name || 'Anonymous Patient'}</span>
                            <span className="text-[10px] text-slate-500 block">{sess.contact.phone} &bull; {sess.contact.email || 'No email provided'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-700">{sess.score.purchaseReadiness}%</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-bold text-indigo-650 block">{sess.score.frameStyle}</span>
                            <span className="text-[10px] text-slate-500">{sess.score.colorPref}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-[140px]">
                            <div className="flex flex-wrap gap-1">
                              {sess.score.lensFlags.map(f => (
                                <span key={f} className="text-[8px] font-extrabold bg-slate-150 text-slate-600 border border-slate-200 px-1 py-0.5 rounded leading-none">
                                  {f.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px] text-slate-600 truncate whitespace-normal leading-relaxed text-[11px] font-medium">
                            {isAssessed ? sess.csrAssessment?.notes : <span className="text-slate-400 italic">No notes filed yet</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isAssessed ? (
                              <div className="inline-flex flex-col items-end">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                  sess.csrAssessment?.outcome === 'purchased' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {sess.csrAssessment?.outcome} ${sess.csrAssessment?.purchaseAmount}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5">By {sess.csrAssessment?.csrName}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-black tracking-wider">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSR PERFORMANCE TAB VIEW */}
        {activeTab === 'csr' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-cardIn">
            
            {/* SCOREBOARD TABLE (LEFT 6 spans) */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">CSR Stylist Scoreboard</h3>
                <p className="text-xs text-slate-400">Total consultations, overall revenue contributions, and conversion ratios.</p>
              </div>

              <div className="space-y-3">
                {csrPerformanceData.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic">No styling performance statistics logged yet today.</div>
                ) : (
                  csrPerformanceData.map((csr, i) => (
                    <div id={`csr-score-${i}`} key={csr.name} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 font-black text-xs flex items-center justify-center text-indigo-600 uppercase">
                          {csr.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{csr.name}</span>
                          <span className="text-[10px] text-slate-500 block">{csr.consultations} consultations assessed</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600 block">${csr.revenue}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block ${
                          csr.conversion >= 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {csr.conversion}% Conv
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RADAR BAR CHART (RIGHT 6 spans) */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                  Average Team Capability Levels
                </h3>
                <p className="text-xs text-slate-400 mb-6">Generated from combined stylistic self-assessment scores (out of 5.0).</p>
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="subject" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 5]} tickCount={6} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', color: '#1E293B', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Rating" fill="#312e81" radius={[8, 8, 0, 0]}>
                      {skillsChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* FOCUS AREAS TAB VIEW */}
        {activeTab === 'focus' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-cardIn">
            
            {/* CONVERSION METRICS PROGRESS BARS (LEFT 7 spans) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-sm">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Conversion Focus Triggers</h3>
                <p className="text-xs text-slate-400">Calculated percentage rates matching actual waiting room client files.</p>
              </div>

              {[
                { label: 'Blue Light Lens Upsell Potential (Weekday heavy screens)', val: getFlagPercent('blue-light'), col: '#6366F1' },
                { label: 'Progressive Lens Check Candidates (Aged frames >2 yrs)', val: getFlagPercent('progressive check'), col: '#0EA5E9' },
                { label: 'Premium/Luxury Budgets Allocation', val: luxuryPercent, col: '#10B981' },
                { label: 'Urgent Fit Overdue Triggers', val: highUrgencyPercent, col: '#F59E0B' },
                { label: 'Secondary Backup Frame Opportunity', val: getFlagPercent('backup pair opp.'), col: '#EF4444' },
                { label: 'New Patient Conversion Ratios', val: newPatientPercent, col: '#4F46E5' },
              ].map((flag, idx) => (
                <div id={`focus-bar-${idx}`} key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{flag.label}</span>
                    <span className="font-mono text-slate-800">{flag.val}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${flag.val}%`, backgroundColor: flag.col }} />
                  </div>
                </div>
              ))}
            </div>

            {/* PIPELINE VALUATION (RIGHT 5 spans) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Estimated Lens Upsell Pipeline Value</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculated potential dollar index value currently waiting inside your physical lounge based on triggers.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">Blue Light Protection</span>
                      <span className="text-[9px] text-indigo-650 uppercase tracking-wider font-extrabold">est. $60–$80 upgrade</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-white border px-2.5 py-1 rounded-md">
                      {sessions.filter(s => s.score.lensFlags.includes('blue-light')).length} triggers
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">Digital Progressives</span>
                      <span className="text-[9px] text-indigo-650 uppercase tracking-wider font-extrabold">est. $120–$200 upgrade</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-white border px-2.5 py-1 rounded-md">
                      {sessions.filter(s => s.score.lensFlags.includes('progressive check')).length} triggers
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">Transitions Tints</span>
                      <span className="text-[9px] text-indigo-650 uppercase tracking-wider font-extrabold">est. $80–$120 upgrade</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-white border px-2.5 py-1 rounded-md">
                      {sessions.filter(s => s.score.lensFlags.includes('transitions')).length} triggers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STORE SETUP TAB VIEW */}
        {activeTab === 'setup' && (
          <div className="space-y-6 animate-cardIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* STORE SETUP FIELDS (LEFT 7 spans) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">⚙️ Store Identity &amp; Branding Setup</h3>
                  <p className="text-xs text-slate-400">Configure customized name, welcome greetings, primary color themes, and pins.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Optical Store Name</label>
                      <input
                        id="setup-store-name"
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Store Slug/ID</label>
                      <input
                        id="setup-store-id"
                        type="text"
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Physical Address</label>
                    <input
                      id="setup-store-address"
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Welcome Messages Announcement</label>
                    <textarea
                      id="setup-welcome"
                      rows={2}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg leading-relaxed focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="setup-color-primary"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded shrink-0 border border-slate-200 cursor-pointer bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-slate-700 uppercase font-black">{primaryColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="setup-color-accent"
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-8 h-8 rounded shrink-0 border border-slate-200 cursor-pointer bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-slate-700 uppercase font-black">{accentColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Stylist PIN (4x)</label>
                      <input
                        id="setup-csr-pin"
                        type="text"
                        maxLength={4}
                        value={csrPin}
                        onChange={(e) => setCsrPin(e.target.value)}
                        className="w-full text-xs font-black font-mono p-2.5 bg-slate-55 border border-slate-200 rounded-lg text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Admin PIN (4x)</label>
                      <input
                        id="setup-admin-pin"
                        type="text"
                        maxLength={4}
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full text-xs font-black font-mono p-2.5 bg-slate-55 border border-slate-200 rounded-lg text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <button
                    id="save-branding-btn"
                    onClick={handleApplyBranding}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white text-center rounded-xl transition duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    Save &amp; Instantly Apply Branding Settings
                  </button>
                </div>
              </div>

              {/* QR CODE GENERATOR (RIGHT 5 spans) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Tablet &amp; Kiosk QR Link</h3>
                  <p className="text-xs text-slate-400">Print or present this QR code to let visitors parse their styles while waiting.</p>
                </div>

                <div className="text-center bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col justify-center items-center">
                  <div className="p-3 bg-white rounded-xl mb-4 border shadow-sm">
                    <img
                      id="store-qr-display"
                      src={qrCodeUrl}
                      alt="Store URL QR code generator"
                      className="w-36 h-36"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 block break-all font-mono mb-4 px-3 py-2 bg-white border border-slate-200 rounded-lg select-all">
                    {buildStoreUrl()}
                  </span>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      id="copy-store-url-btn"
                      onClick={copyStoreLink}
                      className="py-2.5 text-xs font-black rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
                      {copied ? 'Copied URL!' : 'Copy Link'}
                    </button>
                    <button
                      id="print-qr-flyer-btn"
                      onClick={onTriggerPrint}
                      className="py-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={14} /> Print Flyer
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
