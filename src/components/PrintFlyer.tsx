/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreConfig } from '../types';
import { ArrowLeft, Printer } from 'lucide-react';

interface PrintFlyerProps {
  config: StoreConfig;
  onClose: () => void;
}

export default function PrintFlyer({ config, onClose }: PrintFlyerProps) {
  const getStoreUrl = () => {
    const origin = window.location.origin;
    return `${origin}/?store=${config.storeId || 'default'}`;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(getStoreUrl())}`;

  const triggerPrintProtocol = () => {
    window.print();
  };

  return (
    <div id="print-overlay" className="fixed inset-0 bg-white z-[2000] overflow-y-auto flex flex-col justify-between print:p-0">
      
      {/* Top action bar (Automatically hidden on physical printing processes) */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
        <button
          id="print-back-btn"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Return to setup
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Prepare waiting room printouts</span>
          <button
            id="print-flyer-exec"
            onClick={triggerPrintProtocol}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold text-white transition cursor-pointer"
          >
            <Printer size={14} /> Send to printer
          </button>
        </div>
      </div>

      {/* Physical Poster Print Canvas Layout */}
      <div className="flex-1 max-w-xl w-full mx-auto p-8 md:p-12 flex flex-col justify-between my-auto border border-dashed border-slate-200 shadow-xl my-6 bg-white rounded-3xl print:border-none print:shadow-none print:my-0 print:p-0">
        
        {/* Poster Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-white font-extrabold uppercase text-sm tracking-wide bg-indigo-900" style={{ backgroundColor: config.primaryColor }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M6 14C8.20914 14 10 12.2091 10 10C10 7.79086 8.20914 6 6 6C3.79086 6 2 7.79086 2 10C2 12.2091 3.79086 14 6 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 14C20.2091 14 22 12.2091 22 10C22 7.79086 20.2091 6 18 6C15.7909 6 14 7.79086 14 10C14 12.2091 15.7909 14 18 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 10C11.5 10 12.5 10 14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{config.storeName}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none pt-2">
            Welcome to Our Clinic
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-sm mx-auto font-medium">
            While you wait, let us align with your custom styling preference vectors in under 3 minutes!
          </p>
        </div>

        {/* QR Core Container */}
        <div className="my-8 text-center flex flex-col items-center justify-center">
          <div className="p-4 bg-slate-50 border-2 rounded-[24px] inline-block shadow">
            <img
              id="print-poster-qr"
              src={qrCodeUrl}
              alt="Intelligent intake terminal QR flyer link"
              className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply"
            />
          </div>

          <p className="text-xs font-extrabold text-indigo-900 tracking-widest uppercase mt-4 mb-2">
            📲 Scan to Start Your Pre-visit Fitting Form
          </p>
          <span className="text-[10px] text-slate-400 font-mono select-all bg-slate-50 px-3 py-1.5 rounded-lg border">
            {getStoreUrl()}
          </span>
        </div>

        {/* Poster Footer Instructions */}
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">How it works</p>
          <div className="grid grid-cols-3 gap-3 text-left max-w-sm mx-auto">
            <div className="text-center">
              <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700 mx-auto mb-1">1</span>
              <p className="text-[9px] text-slate-500 font-semibold leading-tight">Focus camera and scan QR</p>
            </div>
            <div className="text-center">
              <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700 mx-auto mb-1">2</span>
              <p className="text-[9px] text-slate-500 font-semibold leading-tight">Answer 12 conversational questions</p>
            </div>
            <div className="text-center">
              <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700 mx-auto mb-1">3</span>
              <p className="text-[9px] text-slate-500 font-semibold leading-tight font-sans">Counselor retrievals analysis!</p>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-300 font-medium mt-6 leading-none">
            {config.storeAddress} &bull; Powered by Patient IQ Pre-Visit Operations
          </p>
        </div>

      </div>

      {/* Bottom info footer */}
      <div className="w-full text-center text-[10px] text-slate-400 pb-4 print:hidden">
        Adjust scale properties dynamically via browser print margins layout config.
      </div>
    </div>
  );
}
