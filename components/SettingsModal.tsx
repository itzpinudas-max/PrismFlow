import React from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onUpdate: (newSettings: Settings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onUpdate }) => {
  const toggleSound = () => onUpdate({ ...settings, sound: !settings.sound });
  const toggleVibration = () => onUpdate({ ...settings, vibration: !settings.vibration });
  const setTheme = (theme: Settings['theme']) => onUpdate({ ...settings, theme });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
      {/* Outer Glow Wrapper */}
      <div className="relative w-full max-w-sm modal-active">
        {/* Extreme Backdrop Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 via-transparent to-cyan-500/20 blur-[100px] rounded-[60px] opacity-60"></div>
        
        {/* Main Frosted Container */}
        <div className="relative glass-panel rounded-[48px] p-8 pb-10 border border-white/20 shadow-[0_32px_120px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Refractive Ambient Orbs - Moving inside the glass */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[90px] animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-white tracking-tightest italic leading-tight">CORE SYSTEM</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 w-6 bg-indigo-500 rounded-full"></div>
                <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.4em]">v2.5.0-Stable</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="btn-touch w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/15 text-white/60 transition-all shadow-inner"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          {/* Interactive Controls */}
          <div className="space-y-9 relative z-10">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-13 h-13 rounded-[20px] bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center transition-all group-hover:scale-110 shadow-inner p-3">
                  <i className={`fa-solid ${settings.sound ? 'fa-volume-high' : 'fa-volume-xmark'} text-indigo-400 text-xl`}></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm tracking-wide">Audio Stream</span>
                  <span className="text-white/30 text-[9px] uppercase font-black tracking-widest mt-0.5">Physics Soundscape</span>
                </div>
              </div>
              <div 
                onClick={toggleSound}
                className={`liquid-toggle ${settings.sound ? 'active' : ''}`}
              >
                <div className="toggle-fill"></div>
              </div>
            </div>

            {/* Haptic Toggle */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-13 h-13 rounded-[20px] bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center transition-all group-hover:scale-110 shadow-inner p-3">
                  <i className={`fa-solid fa-wave-square text-cyan-400 text-xl`}></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm tracking-wide">Haptic Link</span>
                  <span className="text-white/30 text-[9px] uppercase font-black tracking-widest mt-0.5">Tactile Feedback</span>
                </div>
              </div>
              <div 
                onClick={toggleVibration}
                className={`liquid-toggle ${settings.vibration ? 'active' : ''}`}
              >
                <div className="toggle-fill"></div>
              </div>
            </div>

            {/* Theme Spectrum Selector */}
            <div className="space-y-5 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.45em]">Visual Modality</span>
                <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3.5">
                {(['vibrant', 'pastel', 'neon'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`btn-touch relative py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden border ${
                      settings.theme === t 
                      ? 'bg-white text-slate-950 border-white shadow-[0_12px_24px_rgba(255,255,255,0.2)] scale-105 z-10' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="relative z-10">{t}</span>
                    {settings.theme === t && (
                      <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
                    )}
                    <div className="absolute inset-0 shimmer-bg opacity-[0.03] pointer-events-none"></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={onClose}
            className="btn-touch w-full mt-12 py-5.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-[28px] shadow-[0_20px_40px_rgba(79,70,229,0.3)] tracking-[0.3em] uppercase text-[10px] border border-white/10 group overflow-hidden relative"
          >
            <div className="absolute inset-0 shimmer-bg opacity-15 group-hover:opacity-30 transition-opacity"></div>
            <span className="relative z-10">Confirm Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;