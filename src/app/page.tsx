"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFullPage } from "@/hooks/useFullPage";
import { SECTIONS, PERSONAL, CURRENT_ROLES, JOURNEY, CONTACT } from "@/lib/constants";
import BootSequence from "@/components/BootSequence";
import NoiseOverlay from "@/components/NoiseOverlay";
import GlassCard from "@/components/GlassCard";
import GalaxyBackground from "@/components/GalaxyBackground";

export default function Home() {
  const [isBooting, setIsBooting] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const { currentSection, goToSection } = useFullPage({
    totalSections: SECTIONS.length,
  });

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    setTimeout(() => setShowContent(true), 100);
  }, []);

  return (
    <>
      {/* Effect 7: Noise & Scanline Overlay */}
      <NoiseOverlay />

      {/* Effect 1: Boot Sequence */}
      {isBooting && <BootSequence onComplete={handleBootComplete} text="NODEMAN" />}

      {/* Effect 3: Dynamic Galaxy Background */}
      <GalaxyBackground currentSection={currentSection} />

      {/* Main Content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fullpage-container"
          >
            {/* Navigation Dots */}
            <nav className="nav-dots">
              {SECTIONS.map((section, index) => (
                <button
                  key={section.id}
                  className={`nav-dot interactive ${currentSection === index ? "active" : ""}`}
                  onClick={() => goToSection(index)}
                  aria-label={section.label}
                />
              ))}
            </nav>

            {/* Sections Wrapper */}
            <div
              className="fullpage-wrapper"
              style={{
                transform: `translateY(-${currentSection * 100}vh)`,
              }}
            >
              <SectionIntro isActive={currentSection === 0} onNext={() => goToSection(1)} />
              <SectionAbout isActive={currentSection === 1} />
              <SectionRoles isActive={currentSection === 2} />
              <SectionJourney isActive={currentSection === 3} />
              <SectionContact isActive={currentSection === 4} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ===== Section Components with Enhanced Effects =====

function SectionIntro({ isActive, onNext }: { isActive: boolean; onNext: () => void }) {
  const [showChromatic, setShowChromatic] = useState(false);
  const chars = PERSONAL.name.split("");

  useEffect(() => {
    if (isActive) {
      setShowChromatic(true);
      const timer = setTimeout(() => setShowChromatic(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <section className="section">
      <div className="text-center max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="text-caption text-secondary mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Welcome
        </motion.p>

        {/* Effect 2: Character-by-character with chromatic aberration */}
        <h1 className={`font-display text-hero mb-8 whitespace-nowrap ${showChromatic ? "chromatic-active" : ""}`}>
          {chars.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{
                delay: 0.3 + index * 0.05,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.8 }}
            style={{ color: "var(--text-muted)" }}
          >
            .
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6 }}
          className="text-subtitle mb-12"
          style={{ color: "var(--text-secondary)" }}
        >
          {PERSONAL.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4 flex-wrap"
          style={{ margin: "1rem 0rem" }}
        >
          {CURRENT_ROLES.map((role, index) => (
            <motion.span
              key={role.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="role-tag interactive"
            >
              {role.title}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.2 }}
        className="scroll-indicator interactive"
        onClick={onNext}
      >
        <span className="text-caption">Scroll</span>
        <div className="scroll-line" />
      </motion.div>
    </section>
  );
}

function SectionAbout({ isActive }: { isActive: boolean }) {
  return (
    <section className="section">
      <div className="max-w-3xl mx-auto">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          About
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-12"
        >
          Story
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.32 }}
          className="text-body leading-relaxed whitespace-pre-line"
          style={{ color: "var(--text-secondary)", marginTop: "10px", marginBottom: "10px" }}
        >
          {PERSONAL.bio}
        </motion.p>

        {/* Effect 5: Glass cards with tilt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-6"
        >
          {[
            { value: "17+", label: "Years" },
            { value: "3", label: "Current Roles" },
            { value: "∞", label: "Passion" },
          ].map((stat, index) => (
            <GlassCard key={stat.label} className="text-center py-6" tiltIntensity={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="font-display text-title">{stat.value}</div>
                <div className="text-small" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </motion.div>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function SectionRoles({ isActive }: { isActive: boolean }) {
  return (
    <section className="section">
      <div className="max-w-4xl mx-auto w-full">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Current Roles
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-16"
          style={{ marginTop: "10px", marginBottom: "10px" }}
        >
          What I Do
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {CURRENT_ROLES.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.32 + index * 0.12 }}
            >
              <GlassCard tiltIntensity={3}>
                <div className="text-caption mb-4" style={{ color: "var(--text-muted)" }}>
                  {role.period}
                </div>
                <h3 className="font-display text-subtitle mb-2">{role.title}</h3>
                <p className="text-small mb-4" style={{ color: "var(--accent-light)" }}>
                  {role.organization}
                </p>
                <p className="text-small" style={{ color: "var(--text-secondary)" }}>
                  {role.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Effect 6: Enhanced Timeline with progress bar
function SectionJourney({ isActive }: { isActive: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev < JOURNEY.length - 1 ? prev + 1 : prev));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setActiveIndex(0);
    }
  }, [isActive]);

  const progressHeight = isActive ? ((activeIndex + 1) / JOURNEY.length) * 100 : 0;

  return (
    <section className="section">
      <div className="max-w-3xl mx-auto w-full">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Journey
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-12"
        >
          Timeline
        </motion.h2>

        <div className="timeline-container">
          {/* Progress bar */}
          <div className="timeline-progress">
            <div
              className="timeline-progress-fill"
              style={{ height: `${progressHeight}%` }}
            />
          </div>

          {/* Timeline items */}
          {JOURNEY.map((item, index) => (
            <motion.div
              key={item.period}
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`timeline-item-enhanced ${index <= activeIndex ? "active" : ""}`}
            >
              <div className="timeline-year">{item.period}</div>
              <div className="timeline-content">
                <h3 className="text-small font-medium mb-1">{item.title}</h3>
                <p className="text-small" style={{ color: "var(--text-muted)" }}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionContact({ isActive }: { isActive: boolean }) {
  return (
    <section className="section">
      <div className="max-w-2xl mx-auto text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Contact
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-8"
        >
          Let&apos;s Connect
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.32 }}
          className="text-body mb-16"
          style={{ color: "var(--text-secondary)" }}
        >
          새로운 기회, 협업, 또는 대화를 환영합니다.
        </motion.p>

        <motion.a
          href={`mailto:${CONTACT.email}`}
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.44 }}
          className="text-subtitle font-display interactive inline-block"
          style={{ color: "var(--accent-light)" }}
        >
          {CONTACT.email}
        </motion.a>
      </div>
    </section>
  );
}
