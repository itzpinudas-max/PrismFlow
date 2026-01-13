import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TubeState } from '../types.ts';

interface TubeProps {
  tube: TubeState;
  index: number;
  isSelected: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  isPouringSource?: boolean;
  isPouringTarget?: boolean;
  pouringColor?: string;
  pourDirection?: 'left' | 'right' | null;
  onClick: () => void;
  capacity: number;
}

interface Ripple {
  id: number;
  x: number;
}

interface Splash {
  id: number;
}

const Tube: React.FC<TubeProps> = ({ 
  tube, index, isSelected, isHintSource, isHintTarget, 
  isPouringSource, isPouringTarget, pouringColor, pourDirection,
  onClick, capacity 
}) => {
  const layerHeight = 100 / capacity;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [isDeforming, setIsDeforming] = useState(false);
  const nextRippleId = useRef(0);
  const nextSplashId = useRef(0);

  const bubbles = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      left: `${15 + Math.random() * 70}%`,
      delay: `${Math.random() * 3.5}s`,
      size: `${1 + Math.random() * 1.5}px`,
      duration: `${3 + Math.random() * 2}s`
    }));
  }, []);

  const handleTubeClick = (e: React.MouseEvent) => {
    if (tube.layers.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      const id = nextRippleId.current++;
      setRipples(prev => [...prev.slice(-1), { id, x }]); // Reduced number of concurrent ripples for performance
      
      setIsDeforming(true);
      setTimeout(() => setIsDeforming(false), 400);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 750);
    }
    onClick();
  };

  // Splash and deformation when being filled
  useEffect(() => {
    if (isPouringTarget) {
      const splashId = nextSplashId.current++;
      setSplashes(prev => [...prev, { id: splashId }]);
      setIsDeforming(true);
      
      const timer = setTimeout(() => setIsDeforming(false), 800);
      const splashTimer = setTimeout(() => {
        setSplashes(prev => prev.filter(s => s.id !== splashId));
      }, 650);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(splashTimer);
      };
    }
  }, [isPouringTarget, tube.layers.length]);

  // Combined transform optimized for 120fps with no snapping/blinking
  const combinedTransform = useMemo(() => {
    if (isPouringSource) {
      if (pourDirection === 'left') return 'translate3d(-15px, -25px, 0) rotate(-30deg)';
      if (pourDirection === 'right') return 'translate3d(15px, -25px, 0) rotate(30deg)';
    }
    if (isSelected) {
      return 'translate3d(0, -32px, 0)';
    }
    return 'translate3d(0, 0, 0)';
  }, [isSelected, isPouringSource, pourDirection]);

  return (
    <div 
      onClick={handleTubeClick}
      data-tube-index={index}
      style={{ 
        width: '12.5mm', 
        height: '42mm',
        transform: combinedTransform,
      }}
      className="relative cursor-pointer transition-transform duration-[600ms] cubic-bezier(0.23, 1, 0.32, 1) flex flex-col-reverse items-center justify-start overflow-visible group will-change-transform"
    >
      {/* Selection/Action Aura - Transition opacity specifically */}
      <div 
        className={`absolute -inset-10 rounded-[60px] blur-[50px] transition-opacity duration-500 pointer-events-none will-change-opacity
          ${(isSelected || isPouringSource || isPouringTarget) ? 'opacity-[0.18]' : 'opacity-0'}
          ${isSelected ? 'bg-white' : isPouringSource ? 'bg-indigo-400' : 'bg-cyan-400'}
        `}
      ></div>

      {/* The Glass Cylinder */}
      <div className={`absolute inset-0 glass-tube z-0 
        ${isSelected ? 'border-white/40 ring-1 ring-white/10' : 'border-white/15'}
        ${isHintSource ? 'border-indigo-400/50' : ''}
        ${isHintTarget ? 'border-cyan-400/50' : ''}
      `}>
        <div className="absolute top-0 left-0 w-full h-[6px] bg-white/5 border-b border-white/15 rounded-t-[14px]"></div>
        <div className="absolute left-[12%] top-0 h-full w-[2px] bg-white/5 blur-[0.5px]"></div>
        <div className="absolute right-[15%] top-0 h-full w-[1px] bg-white/10"></div>
        
        {/* Liquid Contents */}
        <div className={`absolute left-[8%] bottom-[1.5%] w-[84%] h-[97%] flex flex-col-reverse rounded-b-[20px] overflow-hidden z-10 pointer-events-none 
          ${isDeforming ? 'scale-y-[1.03]' : 'scale-y-1'}
          transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1) origin-bottom will-change-transform
        `}>
          {tube.layers.map((color, idx) => (
            <div 
              key={`${tube.id}-${idx}`}
              className="liquid-layer w-full"
              style={{ 
                background: color, 
                height: `${layerHeight}%`,
                boxShadow: `inset 0 4px 10px rgba(255,255,255,0.1), inset 0 -4px 10px rgba(0,0,0,0.15)`
              }}
            >
               {/* Surface effects for top-most layer only */}
               {idx === tube.layers.length - 1 && (
                 <>
                   <div className="liquid-surface"></div>
                   
                   {/* Render Splashes when filling */}
                   {splashes.map(s => (
                     <div key={s.id} className="liquid-splash" />
                   ))}

                   {/* Render Ripples when touched */}
                   {ripples.map(r => (
                     <div 
                       key={r.id}
                       className="liquid-ripple"
                       style={{
                         left: `${Math.min(90, Math.max(10, (r.x / 47) * 100))}%`,
                         width: '32px',
                         height: '8px'
                       }}
                     />
                   ))}
                 </>
               )}

               {/* Inner glow blend to make layers look connected */}
               <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {isSelected && !isPouringSource && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_#fff] animate-pulse"></div>
          <div className="w-px h-6 bg-gradient-to-b from-white to-transparent opacity-50"></div>
        </div>
      )}

      {isHintSource && !isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-indigo-300 text-base animate-bounce">
           <i className="fa-solid fa-chevron-up"></i>
        </div>
      )}
      {isHintTarget && !isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-cyan-300 text-base animate-bounce">
           <i className="fa-solid fa-chevron-down"></i>
        </div>
      )}
    </div>
  );
};

export default React.memo(Tube);