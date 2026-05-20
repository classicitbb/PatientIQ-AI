/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import PatientIntake from './components/PatientIntake';
import CsrDashboard from './components/CsrDashboard';
import AdminDashboard from './components/AdminDashboard';
import PinModal from './components/PinModal';
import PrintFlyer from './components/PrintFlyer';
import { getStoredConfig, saveStoredConfig, getStoredSessions, saveStoredSessions } from './utils/mockData';
import { StoreConfig, PatientSession } from './types';
import { ShieldCheck, UserCheck, BarChart4 } from 'lucide-react';

export default function App() {
  const [storeId, setStoreId] = useState<string>('default');
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  
  // Navigation states
  const [mode, setMode] = useState<'patient' | 'csr' | 'admin'>('patient');
  const [printActive, setPrintActive] = useState<boolean>(false);

  // Verification overlay state
  const [pinTarget, setPinTarget] = useState<'csr' | 'admin' | null>(null);
  const [pinTitle, setPinTitle] = useState<string>('');
  const [pinHint, setPinHint] = useState<string>('');

  // Extract query URL parameters on mount and run real-time background sync polling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeSlug = params.get('store') || 'default';
    setStoreId(storeSlug);

    const loadData = async () => {
      // 1. Try to fetch configuration from server first with local storage fallbacks
      try {
        const resConfig = await fetch(`/api/config?storeId=${storeSlug}`);
        if (resConfig.ok) {
          const serverConfig = await resConfig.json();
          if (serverConfig && serverConfig.storeId) {
            setConfig(serverConfig);
            saveStoredConfig(storeSlug, serverConfig);
          } else {
            setConfig(getStoredConfig(storeSlug));
          }
        } else {
          setConfig(getStoredConfig(storeSlug));
        }
      } catch (e) {
        setConfig(getStoredConfig(storeSlug));
      }

      // 2. Try to fetch sessions from server first with local storage fallbacks and auto-heal missing items
      try {
        const resSessions = await fetch(`/api/sessions?storeId=${storeSlug}`);
        if (resSessions.ok) {
          const serverSessions = await resSessions.json();
          if (Array.isArray(serverSessions)) {
            const local = getStoredSessions(storeSlug);
            const merged = [...serverSessions];
            
            // Check if client has local submissions not present on the server yet, and back-fill them
            for (const loc of local) {
              if (!merged.some(s => s.id === loc.id)) {
                merged.push(loc);
                
                // Back-fill to server
                fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ storeId: storeSlug, session: loc }),
                }).catch(e => console.debug('[Sync] Failed to backfill local session:', e));
              }
            }
            merged.sort((a, b) => b.timestamp - a.timestamp);
            setSessions(merged);
            saveStoredSessions(storeSlug, merged);
          } else {
            setSessions(getStoredSessions(storeSlug));
          }
        } else {
          setSessions(getStoredSessions(storeSlug));
        }
      } catch (e) {
        setSessions(getStoredSessions(storeSlug));
      }
    };

    loadData();

    // Live update polling: fetches any updates submitted by other kiosk screens or portal pages instantly
    const interval = setInterval(async () => {
      try {
        const currentUrlParams = new URLSearchParams(window.location.search);
        const activeSlug = currentUrlParams.get('store') || 'default';

        const resSessions = await fetch(`/api/sessions?storeId=${activeSlug}`);
        if (resSessions.ok) {
          const serverSessions = await resSessions.json();
          if (Array.isArray(serverSessions)) {
            // Merge gracefully - don't overwrite local-only sessions that are fresh/pending
            setSessions(prev => {
              const merged = [...serverSessions];
              for (const p of prev) {
                if (!merged.some(s => s.id === p.id)) {
                  merged.push(p);
                }
              }
              merged.sort((a, b) => b.timestamp - a.timestamp);
              saveStoredSessions(activeSlug, merged);
              return merged;
            });
          }
        }

        const resConfig = await fetch(`/api/config?storeId=${activeSlug}`);
        if (resConfig.ok) {
          const serverConfig = await resConfig.json();
          if (serverConfig && serverConfig.storeId) {
             setConfig(serverConfig);
             saveStoredConfig(activeSlug, serverConfig);
          }
        }
      } catch (err) {
        console.debug('Background sync interval offline:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Set CSS variables inside document :root to accommodate real-time store branding changes
  useEffect(() => {
    if (config) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', config.primaryColor || '#003087');
      root.style.setProperty('--brand-accent', config.accentColor || '#CC0000');
    }
  }, [config]);

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-905 flex flex-col justify-center items-center text-white p-6">
        <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-slate-800 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400">Loading Patient IQ Intelligent Core Configuration...</p>
      </div>
    );
  }

  // Update sessions list locally & save
  const handleSessionComplete = (newSession: PatientSession) => {
    setSessions(prev => {
      if (prev.some(s => s.id === newSession.id)) {
        return prev;
      }
      const updated = [newSession, ...prev];
      saveStoredSessions(storeId, updated);
      return updated;
    });
  };

  const handleUpdateSession = async (updatedSession: PatientSession) => {
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    setSessions(updated);
    saveStoredSessions(storeId, updated);

    // Sync assessment to server
    try {
      await fetch(`/api/sessions/${updatedSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, session: updatedSession }),
      });
    } catch (e) {
      console.warn('Sync updated assessment to server failed:', e);
    }
  };

  const handleUpdateConfig = async (newConfig: StoreConfig) => {
    // Check if store ID changed, if so synchronize URL query parameter in background history securely
    if (newConfig.storeId !== storeId) {
      setStoreId(newConfig.storeId);
      const url = new URL(window.location.href);
      url.searchParams.set('store', newConfig.storeId);
      window.history.replaceState({}, '', url.toString());
    }

    setConfig(newConfig);
    saveStoredConfig(newConfig.storeId, newConfig);

    // Sync updated store config to server
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.warn('Sync configuration to server failed:', e);
    }

    // Seed/migrate sessions for new namespace
    const newSessions = getStoredSessions(newConfig.storeId);
    setSessions(newSessions);
  };

  // Secure PIN Clearance Trigger
  const handleModeNavigate = (targetMode: 'patient' | 'csr' | 'admin') => {
    if (targetMode === 'patient') {
      setMode('patient');
      return;
    }

    if (targetMode === 'csr') {
      setPinTarget('csr');
      setPinTitle('Authorization: Stylist and Counsel Credentials');
      setPinHint(config.csrPin || '1234');
    } else {
      setPinTarget('admin');
      setPinTitle('Authorization: Management Analytics Security');
      setPinHint(config.adminPin || '9999');
    }
  };

  const verifyPinAndGrantAccess = (enteredPin: string): boolean => {
    if (pinTarget === 'csr') {
      if (enteredPin === config.csrPin) {
        setMode('csr');
        setPinTarget(null);
        return true;
      }
    } else if (pinTarget === 'admin') {
      if (enteredPin === config.adminPin) {
        setMode('admin');
        setPinTarget(null);
        return true;
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 antialiased overflow-x-hidden transition">
      
      {/* Dynamic View Selector */}
      <div className="view-stage">
        {mode === 'patient' && (
          <PatientIntake
            config={config}
            onSessionComplete={handleSessionComplete}
          />
        )}

        {mode === 'csr' && (
          <CsrDashboard
            config={config}
            sessions={sessions}
            onUpdateSession={handleUpdateSession}
          />
        )}

        {mode === 'admin' && (
          <AdminDashboard
            config={config}
            sessions={sessions}
            onUpdateConfig={handleUpdateConfig}
            onTriggerPrint={() => setPrintActive(true)}
          />
        )}
      </div>

      {/* Floating Mode Navigation Dock at bottom (Hidden on physical printouts) - Professional Polish Floating Dock style */}
      <nav 
        id="mode-strip-nav" 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md py-2.5 px-4 bg-slate-950/95 text-slate-300 flex items-center justify-around border border-slate-800/80 rounded-2xl backdrop-blur-xl z-[999] shadow-2xl print:hidden select-none"
      >
        <button
          id="strip-btn-patient"
          onClick={() => handleModeNavigate('patient')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition cursor-pointer select-none focus:outline-none ${
            mode === 'patient' 
              ? 'text-white font-bold tracking-tight scale-105 bg-white/10 border border-white/10 shadow shadow-slate-950' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck size={16} style={mode === 'patient' ? { color: config.accentColor } : {}} />
          <span className="text-[9px] uppercase font-black tracking-wider">Patient Kiosk</span>
        </button>

        <button
          id="strip-btn-csr"
          onClick={() => handleModeNavigate('csr')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition cursor-pointer select-none focus:outline-none ${
            mode === 'csr' 
              ? 'text-white font-bold tracking-tight scale-105 bg-white/10 border border-white/10 shadow shadow-slate-950' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck size={16} style={mode === 'csr' ? { color: config.accentColor } : {}} />
          <span className="text-[9px] uppercase font-black tracking-wider">Stylist Portal</span>
        </button>

        <button
          id="strip-btn-admin"
          onClick={() => handleModeNavigate('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition cursor-pointer select-none focus:outline-none ${
            mode === 'admin' 
              ? 'text-white font-bold tracking-tight scale-105 bg-white/10 border border-white/10 shadow shadow-slate-950' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart4 size={16} style={mode === 'admin' ? { color: config.accentColor } : {}} />
          <span className="text-[9px] uppercase font-black tracking-wider">Insights Admin</span>
        </button>
      </nav>

      {/* Dynamic Security PIN verification Modal */}
      <PinModal
        isOpen={pinTarget !== null}
        onClose={() => setPinTarget(null)}
        onVerify={verifyPinAndGrantAccess}
        title={pinTitle}
        hintPin={pinHint}
      />

      {/* Dedicated physical Print Poster overlays */}
      {printActive && (
        <PrintFlyer
          config={config}
          onClose={() => setPrintActive(false)}
        />
      )}
    </div>
  );
}
