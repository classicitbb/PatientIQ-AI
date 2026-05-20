/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Delete, X, ShieldAlert } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => boolean;
  title: string;
  hintPin: string;
}

export default function PinModal({ isOpen, onClose, onVerify, title, hintPin }: PinModalProps) {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setErrorShake(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (errorShake) return;
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        // Trigger verification on the 4th digit
        setTimeout(() => {
          const success = onVerify(newPin);
          if (!success) {
            setErrorShake(true);
            setTimeout(() => {
              setErrorShake(false);
              setPin('');
            }, 800);
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    if (errorShake) return;
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-[1100] p-4 transition-opacity">
      <div 
        id="pin-modal-card"
        className={`bg-white rounded-[24px] shadow-2xl p-6 max-w-sm w-full border border-slate-100 transform transition-transform ${
          errorShake ? 'animate-bounce border-rose-500 shadow-rose-100' : ''
        }`}
        style={errorShake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <ShieldAlert size={18} />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">Security Clearance</h3>
          </div>
          <button 
            id="pin-close-btn"
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-xs text-slate-400 mt-1">Please type your 4-digit access code.</p>
        </div>

        {/* Pin Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => {
            const hasNum = pin.length > index;
            return (
              <div
                id={`pin-dot-${index}`}
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  errorShake
                    ? 'bg-rose-500 scale-110'
                    : hasNum
                    ? 'bg-indigo-700 scale-110'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        {/* Keyboard Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              id={`numpad-key-${num}`}
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 text-xl font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl transition duration-150 flex items-center justify-center focus:outline-none"
            >
              {num}
            </button>
          ))}
          <div /> {/* Blank spacing */}
          <button
            id="numpad-key-0"
            onClick={() => handleKeyPress('0')}
            className="h-14 text-xl font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl transition duration-150 flex items-center justify-center focus:outline-none"
          >
            0
          </button>
          <button
            id="numpad-key-back"
            onClick={handleBackspace}
            className="h-14 text-slate-500 hover:text-slate-800 active:scale-95 rounded-xl transition flex items-center justify-center focus:outline-none hover:bg-slate-100"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Hint Box (For Demo Users) */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
          <p className="text-xs font-semibold text-indigo-700">
            💡 DEMO ACCESS CODE: <span className="font-mono bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-900">{hintPin}</span>
          </p>
        </div>
      </div>

      {/* Embedded shake keyframe for errors */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
