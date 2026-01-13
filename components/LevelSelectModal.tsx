import React from 'react';
import { LevelDefinition } from '../types';

interface LevelSelectModalProps {
  levels: LevelDefinition[];
  currentLevelId: number;
  onSelect: (levelId: number) => void;
  onClose: () => void;
}

const LevelSelectModal: React.FC<LevelSelectModalProps> = ({ levels, currentLevelId, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
      <div className="relative w-full max-w-lg h-[80vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative glass-panel rounded-[40px] p-6 flex flex-col h-full border border-white/10 overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-white italic tracking-tightest">ARCHIVE</h2>
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.4em]">Memory Fragments</span>
            </div>
            <button 
              onClick={onClose}
              className="btn-touch w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Level Grid */}
          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar grid grid-cols-4 sm:grid-cols-5 gap-3 pb-8">
            {levels.map((level) => {
              const isActive = level.id === currentLevelId;
              return (
                <button
                  key={level.id}
                  onClick={() => onSelect(level.id)}
                  className={`btn-touch aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all relative overflow-hidden group ${
                    isActive 
                    ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className={`text-lg font-black italic ${isActive ? 'text-slate-950' : 'text-white/80'}`}>
                    {level.id}
                  </span>
                  {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
                  )}
                  <div className="absolute inset-0 shimmer-bg opacity-[0.03] pointer-events-none"></div>
                </button>
              );
            })}
          </div>

          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default LevelSelectModal;
