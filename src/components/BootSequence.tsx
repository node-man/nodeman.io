"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
  text?: string;
}

export default function BootSequence({ onComplete, text = "NODEMAN" }: BootSequenceProps) {
  const [isVisible, setIsVisible] = useState(true);
  const chars = text.split("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="boot-sequence"
        >
          {/* Scanlines effect */}
          <div className="boot-scanlines" />
          
          {/* Main text */}
          <div className="boot-text">
            {chars.map((char, index) => (
              <motion.span
                key={index}
                className="boot-char"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  textShadow: "0 0 20px rgba(37, 99, 235, 0.5)",
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-caption mt-8"
            style={{ color: "var(--text-muted)", letterSpacing: "0.3em" }}
          >
            INITIALIZING
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: "linear" }}
            className="mt-4 h-px w-32 origin-left"
            style={{ background: "var(--accent)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
