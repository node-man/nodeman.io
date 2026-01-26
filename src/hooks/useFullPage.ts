"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFullPageOptions {
  totalSections: number;
  transitionDuration?: number;
}

export function useFullPage({ totalSections, transitionDuration = 800 }: UseFullPageOptions) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);

  const goToSection = useCallback(
    (index: number) => {
      if (isAnimating) return;
      if (index < 0 || index >= totalSections) return;

      setIsAnimating(true);
      setCurrentSection(index);

      setTimeout(() => {
        setIsAnimating(false);
      }, transitionDuration);
    },
    [isAnimating, totalSections, transitionDuration]
  );

  const goNext = useCallback(() => {
    goToSection(currentSection + 1);
  }, [currentSection, goToSection]);

  const goPrev = useCallback(() => {
    goToSection(currentSection - 1);
  }, [currentSection, goToSection]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime.current < transitionDuration + 100) return;
      lastScrollTime.current = now;

      if (e.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goNext, goPrev, transitionDuration]);

  return {
    currentSection,
    goToSection,
    goNext,
    goPrev,
    isAnimating,
  };
}
