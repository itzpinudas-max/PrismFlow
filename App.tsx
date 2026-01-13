import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TubeState, GameState, LevelDefinition, Settings } from './types.ts';
import { generateLevels, CAPACITY } from './constants.ts';
import { canMove, executeMove, checkWin, findBestMove, Hint } from './services/gameService.ts';
import { audioService } from './services/audioService.ts';
import Tube from './components/Tube.tsx';
import SettingsModal from './components/SettingsModal.tsx';

interface AnimatingHint extends Hint {
  color: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
}

interface PouringAction {
  from: number;
  to: number;
  color: string;
  direction: 'left' | 'right';
  fromCoord: { x: number, y: number };
  toCoord: { x: number, y: number };
}

export default function App() {
  const savedLevel = Number(localStorage.getItem('prism_level') || '1');
  const savedSettings = JSON.parse(localStorage.getItem('prism_settings') || '{"sound": true, "vibration": true, "theme": "vibrant"}');

  const [currentLevelId, setCurrentLevelId] = useState<number>(savedLevel);
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [settings, setSettings] = useState<Settings>(savedSettings);
  const [tubes, setTubes] = useState<TubeState[]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<TubeState[][]>([]);
  const [currentHint, setCurrentHint] = useState<AnimatingHint | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(3);
  const [hintCooldown, setHintCooldown] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [pouring, setPouring] = useState<PouringAction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdLoading, setIsAdLoading] = useState<boolean>(false);
  
  const levels = useMemo(() => generateLevels(), []);
  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0];
  const totalLevels = levels.length;

  const initLevel = useCallback((level: LevelDefinition) => {
    const initialTubes = level.tubes.map((layers, index) => ({
      id: index,
      layers: [...layers]
    }));
    setTubes(initialTubes);
    setHistory([]);
    setSelectedTubeIndex(null);
    setCurrentHint(null);
    setHintsRemaining(3);
    setHintCooldown(false);
    setIsAnimating(false);
    setPouring(null);
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevelId, initLevel, currentLevel]);

  useEffect(() => {
    localStorage.setItem('prism_level', currentLevelId.toString());
    localStorage.setItem('prism_settings', JSON.stringify(settings));
    audioService.updateBGMVolume(settings.sound);
  }, [currentLevelId, settings]);

  const hapticFeedback = useCallback((intensity: number = 25) => {
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(intensity);
    }
  }, [settings.vibration]);

  const playSound = useCallback((type: 'tap' | 'pour' | 'win') => {
    if (!settings.sound) return;
    if (type === 'tap') audioService.playTap();
    if (type === 'win') audioService.playWin();
  }, [settings.sound]);

  const handleTubeClick = useCallback(async (index: number) => {
    if (gameState !== GameState.PLAYING || isAnimating) return;
    
    setCurrentHint(null);

    if (selectedTubeIndex === null) {
      if (tubes[index].layers.length > 0) {
        setSelectedTubeIndex(index);
        hapticFeedback(15);
        playSound('tap');
      }
    } else if (selectedTubeIndex === index) {
      setSelectedTubeIndex(null);
      playSound('tap');
    } else {
      const fromTube = tubes[selectedTubeIndex];
      const toTube = tubes[index];

      if (canMove(fromTube, toTube, CAPACITY)) {
        setIsAnimating(true);
        const color = fromTube.layers[fromTube.layers.length - 1];
        const direction = index < selectedTubeIndex ? 'left' : 'right';
        
        const fromEl = document.querySelector(`[data-tube-index="${selectedTubeIndex}"]`);
        const toEl = document.querySelector(`[data-tube-index="${index}"]`);
        
        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          
          setPouring({ 
            from: selectedTubeIndex, 
            to: index, 
            color, 
            direction,
            fromCoord: { 
              x: direction === 'left' ? fromRect.left + 5 : fromRect.right - 5, 
              y: fromRect.top + 12
            },
            toCoord: { 
              x: toRect.left + toRect.width / 2, 
              y: toRect.top + 25 
            }
          });
        }
        
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(tubes))]);
        hapticFeedback(25);
        audioService.startPouring(settings.sound);

        // Wait for tilt to start
        await new Promise(r => setTimeout(r, 200));

        // Start level changes while stream is active
        const { updatedFrom, updatedTo } = executeMove(fromTube, toTube, CAPACITY);
        const newTubes = [...tubes];
        newTubes[selectedTubeIndex] = updatedFrom;
        newTubes[index] = updatedTo;
        setTubes(newTubes);

        // Wait for pouring to finish
        await new Promise(r => setTimeout(r, 650));
        
        setPouring(null);
        setSelectedTubeIndex(null);
        setIsAnimating(false);
        audioService.stopPouring();

        if (checkWin(newTubes, CAPACITY)) {
          setGameState(GameState.LEVEL_COMPLETE);
          hapticFeedback(50);
          playSound('win');
          setTimeout(() => {
            const nextLevelId = currentLevelId + 1;
            if (nextLevelId <= totalLevels) {
              setCurrentLevelId(nextLevelId);
              setGameState(GameState.PLAYING);
            } else {
              setGameState(GameState.HOME);
            }
          }, 2400);
        }
      } else {
        if (tubes[index].layers.length > 0) {
          setSelectedTubeIndex(index);
        } else {
          setSelectedTubeIndex(null);
        }
        hapticFeedback(10);
        playSound('tap');
      }
    }
  }, [gameState, isAnimating, selectedTubeIndex, tubes, settings.sound, hapticFeedback, playSound, currentLevelId, totalLevels]);

  const undoMove = () => {
    if (history.length > 0 && !isAnimating) {
      const lastState = history[history.length - 1];
      setTubes(lastState);
      setHistory(prev => prev.slice(0, -1));
      setSelectedTubeIndex(null);
      setCurrentHint(null);
      hapticFeedback(15);
      playSound('tap');
    }
  };

  const restartLevel = () => {
    if (isAnimating) return;
    initLevel(currentLevel);
    hapticFeedback(30);
    playSound('tap');
  };

  const getHint = () => {
    if (gameState !== GameState.PLAYING || hintsRemaining <= 0 || hintCooldown || isAnimating) return;
    
    const hint = findBestMove(tubes, CAPACITY);
    if (hint) {
      const fromEl = document.querySelector(`[data-tube-index="${hint.fromIndex}"]`);
      const toEl = document.querySelector(`[data-tube-index="${hint.toIndex}"]`);
      
      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const fromTube = tubes[hint.fromIndex];
        const color = fromTube.layers[fromTube.layers.length - 1];

        setCurrentHint({
          ...hint,
          color,
          startX: fromRect.left + fromRect.width / 2,
          startY: findTopLiquidY(hint.fromIndex),
          dx: (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2),
          dy: (toRect.top + 10) - findTopLiquidY(hint.fromIndex)
        });
        
        setHintsRemaining(prev => prev - 1);
        setHintCooldown(true);
        hapticFeedback(20);
        playSound('tap');
        setTimeout(() => setHintCooldown(false), 2500);
      }
    }
  };

  const findTopLiquidY = (tubeIndex: number) => {
    const el = document.querySelector(`[data-tube-index="${tubeIndex}"]`);
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const tube = tubes[tubeIndex];
    const layersCount = tube.layers.length;
    if (layersCount === 0) return rect.bottom - 10;
    const unitHeight = rect.height * 0.97 / CAPACITY;
    return rect.bottom - (layersCount * unitHeight) - 5;
  };

  const handleWatchAd = () => {
    if (isAdLoading || isAnimating) return;
    setIsAdLoading(true);
    hapticFeedback(30);
    playSound('tap');

    setTimeout(() => {
      setIsAdLoading(false);
      setHintsRemaining(prev => prev + 2);
      hapticFeedback(50);
    }, 3500);
  };

  const pouringStream = useMemo(() => {
    if (!pouring) return null;
    const { fromCoord, toCoord, color } = pouring;
    const midY = (fromCoord.y + toCoord.y) / 2;
    const path = `M ${fromCoord.x} ${fromCoord.y} C ${fromCoord.x} ${midY}, ${toCoord.x} ${midY}, ${toCoord.x} ${toCoord.y}`;
    const strokeColor = color.match(/#[a-fA-F0-9]{3,6}/g)?.[0] || 'white';
    const secondaryColor = color.match(/#[a-fA-F0-9]{3,6}/g)?.[1] || strokeColor;

    return (
      <svg className="fixed inset-0 pointer-events-none z-[60] w-full h-full overflow-visible">
        <defs>
          <filter id="stream-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="stream-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="12" strokeLinecap="round" className="opacity-20 blur-md" style={{ strokeDasharray: '600', strokeDashoffset: '600', animation: 'stream-draw-main 0.85s ease-in-out forwards' }} />
        <path d={path} fill="none" stroke="url(#stream-grad)" strokeWidth="6" strokeLinecap="round" filter="url(#stream-glow)" style={{ strokeDasharray: '600', strokeDashoffset: '600', animation: 'stream-draw-main 0.85s ease-in-out forwards' }} />
        <path d={path} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" className="opacity-40" transform="translate(-1, 0)" style={{ strokeDasharray: '600', strokeDashoffset: '600', animation: 'stream-draw-highlight 0.85s ease-in-out forwards' }} />
      </svg>
    );
  }, [pouring]);

  const handleStartGame = () => {
    audioService.resumeContext();
    audioService.startBGM();
    audioService.updateBGMVolume(settings.sound);
    playSound('tap');
    hapticFeedback(30);
    setGameState(GameState.PLAYING);
  };

  if (gameState === GameState.HOME) {
    return (
      <div className="relative h-screen w-screen flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
           <div className="relative mb-2" style={{ animation: 'title-float 6s infinite ease-in-out' }}>
              <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20"></div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none relative z-10">Prism<span className="text-indigo-400">Flow</span></h1>
           </div>
           <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/30"></div>
              <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em]">Neon Dynamics</span>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/30"></div>
           </div>
        </div>

        <div className="relative w-full max-w-xs flex flex-col items-center animate-in fade-in zoom-in duration-1000 delay-300">
          <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full"></div>
          
          <button 
            onClick={handleStartGame}
            className="btn-touch relative w-full h-24 rounded-[36px] play-button-gradient flex items-center justify-center group overflow-hidden border border-white/20 mb-8"
          >
            <div className="absolute inset-0 shimmer-bg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <i className="fa-solid fa-play text-white text-xl translate-x-0.5"></i>
               </div>
               <span className="text-2xl font-black text-white italic tracking-tighter uppercase">PLAY</span>
            </div>
          </button>

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => {
                audioService.resumeContext();
                setIsSettingsOpen(true);
                playSound('tap');
              }}
              className="btn-touch flex-1 h-16 rounded-[28px] glass-panel flex items-center justify-center border-white/10 text-white/70"
            >
              <i className="fa-solid fa-sliders text-lg"></i>
            </button>
            <div className="flex-[3] h-16 rounded-[28px] glass-panel flex flex-col items-center justify-center border-white/10">
               <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 opacity-80 mb-0.5">Progress</span>
               <span className="text-xl font-black text-white italic tracking-tighter">Level {currentLevelId}</span>
            </div>
          </div>
        </div>

        {isSettingsOpen && (
          <SettingsModal 
            settings={settings}
            onClose={() => {
              setIsSettingsOpen(false);
              playSound('tap');
            }}
            onUpdate={setSettings}
          />
        )}
      </div>
    );
  }

  const progressPercentage = (currentLevelId / totalLevels) * 100;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-slate-950">
      {pouringStream}
      
      <div className="px-6 pt-safe-top mt-4 mb-2 relative z-50">
        <header className="max-w-md mx-auto glass-panel rounded-2xl p-3.5 px-6 flex flex-col relative overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 shimmer-bg opacity-[0.02] pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-10 w-full mb-3">
            <div className="flex flex-col relative z-10">
              <span className="text-[9px] uppercase font-black tracking-[0.35em] text-indigo-400 mb-0.5 opacity-80">PrismFlow OS</span>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none">{currentLevelId}</h1>
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 glow-active"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20"></div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 relative z-10">
              <button 
                onClick={hintsRemaining > 0 ? getHint : handleWatchAd}
                disabled={(hintsRemaining > 0 && (hintCooldown || isAnimating)) || isAdLoading}
                className={`relative btn-touch w-11 h-11 flex items-center justify-center rounded-xl glass-panel border-white/10 ${
                  (hintsRemaining > 0 && hintCooldown) || isAdLoading ? 'opacity-20 grayscale scale-90' : hintsRemaining > 0 ? 'text-indigo-300' : 'text-rose-400'
                } ${!isAdLoading && hintsRemaining > 0 ? 'hover:shadow-[0_0_15px_rgba(129,140,248,0.2)]' : ''}`}
              >
                {hintsRemaining > 0 ? (
                  <i className="fa-solid fa-bolt-lightning text-base"></i>
                ) : (
                  <i className="fa-solid fa-circle-play text-base animate-pulse"></i>
                )}
                {hintsRemaining > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-slate-950 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-950">
                    {hintsRemaining}
                  </span>
                )}
                {hintsRemaining === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black px-1 py-0.5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-950 uppercase tracking-tighter">
                    +2
                  </span>
                )}
              </button>
              <button 
                onClick={() => {
                  if (isAnimating) return;
                  audioService.resumeContext();
                  setIsSettingsOpen(true);
                  playSound('tap');
                }}
                className="btn-touch w-11 h-11 flex items-center justify-center rounded-xl glass-panel border-white/10 text-white/70"
              >
                <i className="fa-solid fa-sliders text-base"></i>
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full px-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Level Progress</span>
              <span className="text-[8px] font-black text-indigo-400/80 uppercase tracking-widest">{currentLevelId} / {totalLevels}</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10 flex-1 flex flex-wrap items-center justify-center content-center gap-x-5 gap-y-12 p-6 no-scrollbar overflow-y-auto max-w-lg mx-auto pb-24">
        {tubes.map((tube, index) => (
          <Tube 
            key={tube.id}
            index={index}
            tube={tube}
            isSelected={selectedTubeIndex === index}
            isHintSource={currentHint?.fromIndex === index}
            isHintTarget={currentHint?.toIndex === index}
            isPouringSource={pouring?.from === index}
            isPouringTarget={pouring?.to === index}
            pouringColor={pouring?.color}
            pourDirection={pouring?.direction}
            onClick={() => handleTubeClick(index)}
            capacity={CAPACITY}
          />
        ))}

        {gameState === GameState.LEVEL_COMPLETE && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center animate-in zoom-in fade-in duration-700">
             <div className="relative mb-10">
                <div className="absolute inset-0 bg-indigo-500 blur-[70px] opacity-30 animate-pulse"></div>
                <div className="w-24 h-24 rounded-[32px] glass-panel border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
                   <i className="fa-solid fa-check-double text-4xl text-indigo-400"></i>
                </div>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tightest mb-4 uppercase italic">Level Complete</h2>
             <div className="flex items-center gap-3 text-indigo-400 font-bold tracking-[0.3em] uppercase text-[9px]">
                <span>Calibrating Matrix</span>
                <div className="flex gap-1">
                   {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: `${i*200}ms` }}></div>)}
                </div>
             </div>
          </div>
        )}

        {isAdLoading && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20 animate-pulse"></div>
               <div className="w-28 h-28 rounded-[40px] glass-panel border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
                  <i className="fa-solid fa-film text-4xl text-cyan-400 animate-bounce"></i>
               </div>
            </div>
            
            <div className="text-center max-w-xs px-6">
              <h3 className="text-2xl font-black text-white tracking-tight italic mb-2">FETCHING REWARDS</h3>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.3em] mb-8">Synchronizing Data Stream...</p>
              
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-indigo-500 animate-[progress_3.5s_linear_forwards]"></div>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-cyan-400/60">
                <span>Buffering</span>
                <span className="text-white/20">Prism AD Network</span>
              </div>
            </div>

            <style>{`
              @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-8 pt-0 pb-10 pointer-events-none z-50">
        <div className="max-w-xs mx-auto flex justify-center items-center gap-12 glass-panel rounded-[34px] p-4 border-white/10 shadow-2xl relative overflow-hidden pointer-events-auto">
          <div className="absolute inset-0 shimmer-bg opacity-[0.03] pointer-events-none"></div>
          
          <button 
            onClick={() => {
              audioService.resumeContext();
              playSound('tap');
              setGameState(GameState.HOME);
            }}
            className="btn-touch flex flex-col items-center gap-1.5 relative z-10 text-white/60"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <i className="fa-solid fa-house text-lg"></i>
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Home</span>
          </button>

          <button 
            onClick={undoMove}
            disabled={history.length === 0 || isAnimating}
            className={`btn-touch flex flex-col items-center gap-1.5 relative z-10 ${history.length === 0 || isAnimating ? 'opacity-10 grayscale' : 'text-indigo-400'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <i className="fa-solid fa-arrow-rotate-left text-lg"></i>
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Undo</span>
          </button>
          
          <button 
            onClick={restartLevel}
            disabled={isAnimating}
            className={`btn-touch flex flex-col items-center gap-1.5 relative z-10 ${isAnimating ? 'opacity-10' : 'text-rose-400'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <i className="fa-solid fa-power-off text-lg"></i>
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Reset</span>
          </button>
        </div>
      </footer>

      {currentHint && (
        <div 
          className="pointer-events-none fixed z-[80] hint-particle"
          style={{
            left: `${currentHint.startX}px`,
            top: `${currentHint.startY}px`,
            width: '24px',
            height: '24px',
            background: currentHint.color,
            borderRadius: '50%',
            boxShadow: `0 0 30px 10px rgba(255,255,255,0.2), 0 0 15px ${currentHint.color.includes('#') ? currentHint.color : '#fff'}`,
            '--dx': `${currentHint.dx}px`,
            '--dy': `${currentHint.dy}px`,
            animation: 'hint-flow 1.5s ease-in-out forwards'
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-white/40 blur-sm rounded-full scale-50"></div>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onClose={() => {
            setIsSettingsOpen(false);
            playSound('tap');
          }}
          onUpdate={setSettings}
        />
      )}
    </div>
  );
}
