"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 100); return () => clearTimeout(id); }, []);
  return (
    <div style={{
      position: "absolute",
      padding: "10px 20px",
      borderRadius: 999,
      boxShadow: "0 8px 24px rgba(14,14,18,0.12)",
      opacity: mounted ? 1 : 0,
      transition: "opacity 700ms ease",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 13,
      ...style,
    }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { n: "01", title: "AI Learning Path Generator", desc: "Student shares their goal and skill level — the model builds a personalised sequence of topics with real free resources sourced from the web." },
  { n: "02", title: "Socratic AI Tutor Chat", desc: "A chat block on every lesson. AtomBot guides students with follow-up questions using the Socratic method — thinking, not just answering." },
  { n: "03", title: "AI Quiz Generator", desc: "Instructors paste lesson content. The model generates exam-quality MCQs with distractors, correct answers, and explanations — ready to import." },
  { n: "04", title: "Adaptive Difficulty Engine", desc: "After every quiz, the system scores the student, adjusts their path, and sends personalised next-step guidance. Below 60% flags the instructor." },
  { n: "05", title: "AI Progress Insights", desc: "Instructors see a plain-English class analysis: which students are at risk, which concepts are hardest, and exactly what to do today." },
  { n: "06", title: "AI Lesson Summariser", desc: 'One click on "Summarise this lesson" returns bullet-point key takeaways and a quiz hint — so students consolidate without re-reading.' },
];

function FeatureBlock({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const { ref, inView } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        display: "grid", gridTemplateColumns: "60px 1fr",
        gap: 24, padding: "36px 40px",
        borderBottom: "1px solid #0e0e12",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 700ms ${i * 80}ms cubic-bezier(.2,.7,.2,1), transform 700ms ${i * 80}ms cubic-bezier(.2,.7,.2,1)`,
      }}
    >
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", paddingTop: 4 }}>{f.n}</div>
      <div>
        <h3 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 10 }}>
          {f.title}
        </h3>
        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#4a453d", lineHeight: 1.65, maxWidth: 600 }}>
          {f.desc}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 80); return () => clearTimeout(id); }, []);

  const reveal = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
  });

  const { ref: featRef, inView: featIn } = useReveal();
  const { ref: ctaRef, inView: ctaIn } = useReveal();

  return (
    <div style={{ background: "#f6f4ef", color: "#0e0e12", minHeight: "100vh" }}>
      <TopBar status="Smart LMS" statusColor="blue" />

      {/* ── Hero ── */}
      <section style={{
        minHeight: "100vh", paddingTop: 120, paddingBottom: 160,
        paddingLeft: 40, paddingRight: 40,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* kicker */}
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b6458",
          marginBottom: 52, ...reveal(100),
        }}>
          — AtomCamp · Smart Adaptive LMS —
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "Instrument Serif, serif", fontWeight: 400,
          fontSize: "clamp(48px, 7vw, 96px)", lineHeight: 1.0,
          letterSpacing: "-0.03em", textAlign: "center",
          maxWidth: 860, position: "relative", zIndex: 2, margin: 0,
          ...reveal(200),
        }}>
          Learn smarter,{" "}
          <em style={{ fontStyle: "italic", color: "#8DC651", position: "relative" }}>
            beautifully
            <svg viewBox="0 0 360 14" preserveAspectRatio="none" style={{
              position: "absolute", left: 0, bottom: -6, width: "100%", height: 10,
              opacity: mounted ? 1 : 0, transition: "opacity 600ms 1000ms",
            }}>
              <path d="M2 8 Q 90 2 180 7 T 358 5" stroke="#8DC651" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </svg>
          </em>
          <span style={{ color: "#1710E6" }}>.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 15,
          color: "#4a453d", marginTop: 64, maxWidth: 620,
          textAlign: "center", lineHeight: 1.65,
          ...reveal(450),
        }}>
          AtomCamp's AI-powered LMS adapts the learning journey for each student —
          from onboarding to completion — while giving instructors actionable
          intelligence to lift outcomes at scale.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, marginTop: 52, ...reveal(600) }}>
          <Link href="/signup" style={{
            background: "#1710E6", color: "#f6f4ef",
            border: "none", borderRadius: 4,
            padding: "14px 24px",
            fontFamily: "JetBrains Mono, monospace", fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 12,
            textDecoration: "none",
          }}>
            Start Learning
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, background: "#f6f4ef", color: "#1710E6",
              borderRadius: 999, fontSize: 14, fontWeight: 700,
            }}>→</span>
          </Link>
          <Link href="/login" style={{
            background: "transparent", color: "#6b6458",
            border: "1.5px solid #eceae2", borderRadius: 4,
            padding: "14px 20px",
            fontFamily: "JetBrains Mono, monospace", fontSize: 13,
            display: "inline-flex", alignItems: "center",
            textDecoration: "none",
          }}>
            Sign In
          </Link>
        </div>

        {/* Floating accent chips */}
        <Chip style={{ left: "4%", top: "22%", background: "#1710E6", color: "#f6f4ef", transform: "rotate(-6deg)" }}>
          <span style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontSize: 22 }}>adaptive</span>
        </Chip>
        <Chip style={{ right: "4%", top: "20%", background: "#fff", color: "#0e0e12", transform: "rotate(5deg)", border: "1.5px solid #0e0e12" }}>
          <span style={{ fontSize: 12 }}>AI Tutor ✓</span>
        </Chip>
        <Chip style={{ left: "5%", bottom: "18%", background: "#8DC651", color: "#0e0e12", transform: "rotate(4deg)" }}>
          <span style={{ fontSize: 12 }}>Quiz Generator</span>
        </Chip>
        <Chip style={{ right: "5%", bottom: "22%", background: "#0e0e12", color: "#f6f4ef", transform: "rotate(-4deg)" }}>
          <span style={{ fontSize: 12 }}>Progress Insights ·•·</span>
        </Chip>
      </section>

      {/* ── Features ── */}
      <section ref={featRef} style={{ background: "#f6f4ef", borderTop: "1px solid #0e0e12" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{
            padding: "60px 40px 40px",
            opacity: featIn ? 1 : 0,
            transition: "opacity 700ms",
          }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6b6458" }}>
              ( AI Modules ) — 06 features
            </div>
          </div>
          {FEATURES.map((f, i) => <FeatureBlock key={f.n} f={f} i={i} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} style={{
        background: "#0e0e12", color: "#f6f4ef",
        padding: "140px 40px 180px",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          color: "rgba(246,244,239,0.45)", letterSpacing: "0.3em", textTransform: "uppercase",
          opacity: ctaIn ? 1 : 0, transition: "opacity 700ms",
        }}>
          Still here?
        </div>
        <h2 style={{
          fontFamily: "Instrument Serif, serif", fontWeight: 400,
          fontSize: "clamp(64px, 10vw, 160px)", lineHeight: 1,
          letterSpacing: "-0.04em", margin: "40px 0 20px",
          opacity: ctaIn ? 1 : 0,
          transform: ctaIn ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 800ms 100ms, transform 800ms 100ms cubic-bezier(.2,.7,.2,1)",
        }}>
          Start learning<span style={{ fontStyle: "italic" }}> now</span>
          <span style={{ color: "#1710E6" }}>.</span>
        </h2>
        <div style={{
          display: "flex", gap: 12, justifyContent: "center", marginTop: 40,
          opacity: ctaIn ? 1 : 0, transition: "opacity 700ms 300ms",
        }}>
          <Link href="/signup" style={{
            background: "#1710E6", color: "#f6f4ef",
            border: "none", borderRadius: 4,
            padding: "16px 28px",
            fontFamily: "JetBrains Mono, monospace", fontSize: 14,
            display: "inline-flex", alignItems: "center", gap: 12,
            textDecoration: "none",
          }}>
            Create Account →
          </Link>
          <Link href="/login" style={{
            background: "transparent", color: "#f6f4ef",
            border: "1.5px solid rgba(246,244,239,0.35)", borderRadius: 4,
            padding: "16px 24px",
            fontFamily: "JetBrains Mono, monospace", fontSize: 14,
            textDecoration: "none",
          }}>
            Sign In
          </Link>
        </div>
        <div style={{
          position: "absolute", bottom: 28, left: 28,
          fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          color: "rgba(246,244,239,0.35)",
        }}>
          © 2026 AtomCamp — Adaptive AI LMS
        </div>
      </section>
    </div>
  );
}
