'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if user prefers reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    // If reduced motion is preferred, trigger immediately
    if (reducedMotionQuery.matches) {
      setIsIntersecting(true);
      setHasTriggered(true);
      return;
    }

    // Use requestAnimationFrame for smooth intersection detection
    let animationFrameId: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        
        // Use requestAnimationFrame to ensure smooth animations
        animationFrameId = requestAnimationFrame(() => {
          if (isVisible && (!triggerOnce || !hasTriggered)) {
            setIsIntersecting(true);
            setHasTriggered(true);
          } else if (!triggerOnce && !isVisible) {
            setIsIntersecting(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref: elementRef, isIntersecting, prefersReducedMotion };
}