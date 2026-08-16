'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Transition } from 'framer-motion';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeatureTourProps {
  steps: TourStep[];
  loop?: boolean;
  className?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const FAST_OUT = [0.22, 1, 0.36, 1] as const;

const SPRING_ICON: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

const SPRING_BG: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 30,
  mass: 0.8,
};

const ACCENT = '#c9a97a';

export function FeatureTour({ steps, loop = false, className = '' }: FeatureTourProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToStep = useCallback((index: number) => {
    setCurrentIndex(prev => (index === prev ? prev : index));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex(prev =>
      prev === steps.length - 1 ? (loop ? 0 : prev) : prev + 1,
    );
  }, [loop, steps.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev =>
      prev === 0 ? (loop ? steps.length - 1 : prev) : prev - 1,
    );
  }, [loop, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (!steps.length) return null;

  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={`relative w-full rounded-[28px] p-7 sm:p-9 flex flex-col overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        minHeight: '420px',
      }}
    >
      {/* Subtle top gradient sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[28px]"
        style={{ background: 'linear-gradient(135deg, rgba(201,169,122,0.04) 0%, transparent 60%)' }}
      />

      {/* Step counter */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <span className="font-mono text-xs font-bold" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {String(currentIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
        <div className="h-px flex-1 mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
          FEATURE TOUR
        </span>
      </div>

      {/* Icon + Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, scale: 0.92, y: 8, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.92, y: -6, filter: 'blur(3px)' }}
            transition={{ duration: 0.16, ease: FAST_OUT }}
            className="relative flex items-center justify-center min-h-[100px]"
          >
            <motion.div
              layoutId="tour-icon-bg"
              transition={SPRING_BG}
              className="absolute w-20 h-20 rounded-2xl"
              style={{ backgroundColor: 'rgba(201,169,122,0.1)', border: '1px solid rgba(201,169,122,0.15)' }}
            />
            <motion.div
              layoutId="tour-icon"
              transition={SPRING_ICON}
              className="relative"
              style={{ color: ACCENT }}
            >
              {currentStep.icon}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentStep.id}`}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="mt-8 text-center px-2"
          >
            <h3
              className="font-bold text-white mb-3 leading-tight"
              style={{ fontSize: '1.45rem', letterSpacing: '-0.025em' }}
            >
              {currentStep.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)', lineHeight: 1.75 }}>
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav row */}
      <div className="mt-8 flex items-center justify-between relative z-10">
        {/* Prev button */}
        <button
          onClick={goPrev}
          disabled={isFirst && !loop}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-25"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="Previous"
        >
          ← Prev
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2" role="tablist">
          {steps.map((step, index) => (
            <button
              key={step.id}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to ${step.title}`}
              onClick={() => goToStep(index)}
              className="focus:outline-none"
            >
              <motion.div
                animate={{ scale: index === currentIndex ? 1.25 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-2.5 h-2.5 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: index === currentIndex
                    ? ACCENT
                    : 'rgba(255,255,255,0.15)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          disabled={isLast && !loop}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-25"
          style={{
            backgroundColor: isLast && !loop ? 'rgba(201,169,122,0.08)' : 'rgba(201,169,122,0.1)',
            color: isLast && !loop ? 'rgba(201,169,122,0.4)' : ACCENT,
            border: `1px solid ${isLast && !loop ? 'rgba(201,169,122,0.1)' : 'rgba(201,169,122,0.2)'}`,
          }}
          aria-label="Next"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
