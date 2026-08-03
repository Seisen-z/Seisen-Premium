'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export default function LoadingScreen() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check if showing loading screen is necessary (e.g. session storage)
    const hasShown = sessionStorage.getItem('seisen_loading_shown');
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    // Simulate initialization time
    const timer = setTimeout(() => {
       // Start fade out
       setIsFading(true);
       
       // Remove from DOM after fade
       setTimeout(() => {
           setIsVisible(false);
           sessionStorage.setItem('seisen_loading_shown', 'true');
       }, 800);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted || !isVisible) return null;

  return (
    <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-800 ease-in-out ${
            isFading ? 'opacity-0' : 'opacity-100'
        }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        
        {/* Geometric Centerpiece */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 mb-12 flex items-center justify-center">
            
            {/* Rotating Outer Diamond */}
            <div className="absolute w-full h-full border border-[#c9a97a]/20 transform rotate-45 animate-spin-slow" />

            {/* Counter-Rotating Inner Diamond */}
            <div className="absolute w-3/4 h-3/4 border border-[#c9a97a]/40 transform rotate-45 animate-spin-slow [animation-direction:reverse]" />

            {/* Static Pulse Core */}
            <div className="absolute w-1/2 h-1/2 border-2 border-[#c9a97a]/80 transform rotate-45 shadow-[0_0_30px_rgba(201,169,122,0.3)] animate-pulse" />

            {/* Center Icon */}
            <div className="relative z-10">
                 <Zap className="w-8 h-8 md:w-10 md:h-10 text-white fill-[#c9a97a]/20 drop-shadow-[0_0_10px_rgba(201,169,122,0.5)]" />
            </div>

        </div>

        {/* Text Sequence */}
        <div className="space-y-2 text-center">
             <h2 className="text-2xl md:text-3xl font-bold text-white tracking-[0.2em] font-mono">
                 SEISEN
             </h2>
             <div className="flex items-center justify-center gap-2">
                 <div className="w-2 h-2 bg-[#c9a97a] rounded-full animate-bounce [animation-delay:-0.3s]" />
                 <div className="w-2 h-2 bg-[#c9a97a] rounded-full animate-bounce [animation-delay:-0.15s]" />
                 <div className="w-2 h-2 bg-[#c9a97a] rounded-full animate-bounce" />
             </div>
             <p className="text-[#c9a97a]/60 text-xs tracking-[0.3em] font-mono uppercase mt-4">
                 Initializing System
             </p>
        </div>

      </div>
       
       {/* Vignette Overlay */}
       <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
