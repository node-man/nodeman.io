"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFullPage } from "@/hooks/useFullPage";
import { SECTIONS, PERSONAL, CURRENT_ROLES, JOURNEY, CONTACT } from "@/lib/constants";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { currentSection, goToSection } = useFullPage({ 
    totalSections: SECTIONS.length 
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="loading-screen"
          >
            <span className="loading-text">LOADING</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="fullpage-container">
        {/* Navigation Dots */}
        <nav className="nav-dots">
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              className={`nav-dot ${currentSection === index ? "active" : ""}`}
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
          {/* Section 1: Intro */}
          <SectionIntro isActive={currentSection === 0} onNext={() => goToSection(1)} />

          {/* Section 2: About */}
          <SectionAbout isActive={currentSection === 1} />

          {/* Section 3: Current Roles */}
          <SectionRoles isActive={currentSection === 2} />

          {/* Section 4: Journey */}
          <SectionJourney isActive={currentSection === 3} />

          {/* Section 5: Contact */}
          <SectionContact isActive={currentSection === 4} />
        </div>
      </div>
    </>
  );
}

// ===== Section Components =====

function SectionIntro({ isActive, onNext }: { isActive: boolean; onNext: () => void }) {
  return (
    <section className="section gradient-subtle">
      <div className="text-center max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-caption text-secondary mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Welcome
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-display text-hero mb-8"
        >
          {PERSONAL.name.split(" ")[0]}
          <span style={{ color: "var(--text-muted)" }}>.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-subtitle mb-12"
          style={{ color: "var(--text-secondary)" }}
        >
          {PERSONAL.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="flex justify-center gap-4 flex-wrap"
          style={{ margin: "1rem 0rem" }}
        >
          {CURRENT_ROLES.map((role) => (
            <span key={role.title} className="role-tag">
              {role.title}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="scroll-indicator"
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
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          About
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-12"
          style={{ margin: "1rem 0rem" }}
        >
          Story
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-body leading-relaxed whitespace-pre-line"
          style={{ color: "var(--text-secondary)" }}
        >
          {PERSONAL.bio}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <div>
            <div className="font-display text-title">17+</div>
            <div className="text-small" style={{ color: "var(--text-muted)" }}>Years</div>
          </div>
          <div>
            <div className="font-display text-title">3</div>
            <div className="text-small" style={{ color: "var(--text-muted)" }}>Current Roles</div>
          </div>
          <div>
            <div className="font-display text-title">∞</div>
            <div className="text-small" style={{ color: "var(--text-muted)" }}>Passion</div>
          </div>
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
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Current Roles
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-16"
          style={{ margin: "1rem 0rem" }}
        >
          What I Do
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {CURRENT_ROLES.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isActive ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="card"
            >
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionJourney({ isActive }: { isActive: boolean }) {
  return (
    <section className="section">
      <div className="max-w-3xl mx-auto w-full">
        <motion.span
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Journey
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-12"
        >
          Timeline
        </motion.h2>

        <div>
          {JOURNEY.map((item, index) => (
            <motion.div
              key={item.period}
              initial={{ opacity: 0, x: -20 }}
              animate={isActive ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="timeline-item"
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
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          className="text-caption block mb-8"
          style={{ color: "var(--text-muted)" }}
        >
          Contact
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="font-display text-title mb-8"
          style={{ margin: "1rem 0rem" }}
        >
          Let&apos;s Connect
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-body mb-16"
          style={{ color: "var(--text-secondary)" }}
        >
          새로운 기회, 협업, 또는 대화를 환영합니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <a
            href={`mailto:${CONTACT.email}`}
            className="contact-item justify-center"
          >
            <span className="text-body">{CONTACT.email}</span>
          </a>
          
          {/* <div className="flex justify-center gap-8 mt-8">
            <a
              href={`https://${CONTACT.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-underline text-small"
            >
              GitHub
            </a>
            <a
              href={`https://${CONTACT.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-underline text-small"
            >
              LinkedIn
            </a>
          </div> */}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-caption mt-20"
          style={{ color: "var(--text-muted)" }}
        >
          {/* © 2024 */}
        </motion.p>
      </div>
    </section>
  );
}
