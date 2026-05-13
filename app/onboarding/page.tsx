"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

const QUESTIONS = [
  {
    id: "background",
    question: "What best describes your background?",
    subtitle: "We'll calibrate the depth of explanations to your experience.",
    options: [
      { value: "student", label: "University Student", tag: "enrolled", desc: "Currently in a degree program" },
      { value: "professional", label: "Working Professional", tag: "employed", desc: "Looking to upskill on the job" },
      { value: "switcher", label: "Career Switcher", tag: "transitioning", desc: "Moving into tech from another field" },
      { value: "selflearner", label: "Self-Learner", tag: "independent", desc: "Learning at my own pace" },
    ],
  },
  {
    id: "goal",
    question: "What's your primary learning goal?",
    subtitle: "Your goal shapes which courses matter most for you.",
    options: [
      { value: "job", label: "Land a Tech Job", tag: "career", desc: "Build skills that make me hireable" },
      { value: "upskill", label: "Upskill in My Role", tag: "growth", desc: "Become better at what I do" },
      { value: "project", label: "Build My Own Project", tag: "create", desc: "Bring an idea to life" },
      { value: "explore", label: "Explore AI & Data", tag: "curiosity", desc: "Curious about the future of tech" },
    ],
  },
  {
    id: "timeAvailable",
    question: "How much time can you dedicate daily?",
    subtitle: "Honest answers build realistic paths. No judgment here.",
    options: [
      { value: "less-1hr", label: "Less than 1 hour", tag: "< 1hr", desc: "Busy schedule — bite-sized learning" },
      { value: "1-2hrs", label: "1–2 hours", tag: "1–2hr", desc: "Consistent daily sessions" },
      { value: "2-4hrs", label: "2–4 hours", tag: "2–4hr", desc: "Serious commitment to growth" },
      { value: "4hrs-plus", label: "4+ hours", tag: "> 4hr", desc: "Full focus — fast-track everything" },
    ],
  },
  {
    id: "programmingLevel",
    question: "What's your comfort level with programming?",
    subtitle: "This determines your starting point — not your ceiling.",
    options: [
      { value: "zero", label: "Complete Beginner", tag: "level 0", desc: "Never written a line of code" },
      { value: "basics", label: "Know the Basics", tag: "level 1", desc: "Variables, loops — done some coding" },
      { value: "intermediate", label: "Intermediate", tag: "level 2", desc: "Built small projects before" },
      { value: "advanced", label: "Advanced", tag: "level 3", desc: "Comfortable with complex systems" },
    ],
  },
  {
    id: "interest",
    question: "Which domain excites you most?",
    subtitle: "Your path will be anchored around this core interest.",
    options: [
      { value: "ai-ml", label: "AI & Machine Learning", tag: "AI", desc: "Build intelligent systems" },
      { value: "data-science", label: "Data Science", tag: "data", desc: "Turn data into decisions" },
      { value: "web-dev", label: "Web Development", tag: "web", desc: "Build products people use" },
      { value: "cloud", label: "Cloud & DevOps", tag: "cloud", desc: "Scale infrastructure like a pro" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const current = QUESTIONS[step];

  const handleNext = async () => {
    if (!selected) return;
    const newAnswers = { ...answers, [current.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const res = await fetch("/api/generate-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: newAnswers }),
        });
        const data = await res.json();
        localStorage.setItem("learnerProfile", JSON.stringify(newAnswers));
        localStorage.setItem("learningPath", JSON.stringify(data));
        router.push("/learning-path");
      } catch {
        const fallback = {
          recommendedPath: ["python-101", "data-science", "ml-bootcamp"],
          personalizedMessage: "Based on your profile, we've crafted a path that takes you from Python fundamentals to building real machine learning models — at a pace that fits your schedule.",
          estimatedCompletion: "4 months",
          focusArea: "AI & Machine Learning",
          weeklyGoal: "3 lessons + 1 quiz per week",
        };
        localStorage.setItem("learnerProfile", JSON.stringify(newAnswers));
        localStorage.setItem("learningPath", JSON.stringify(fallback));
        router.push("/learning-path");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "2px solid #eceae2", borderTop: "2px solid #1710E6",
            animation: "spin 0.9s linear infinite",
            margin: "0 auto 24px",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 32, letterSpacing: "-0.02em", marginBottom: 8 }}>
            Building your path<span style={{ color: "#1710E6" }}>.</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
            Model thinking, your path is cooking...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status={`${step + 1} / ${QUESTIONS.length}`} statusColor="blue" />

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 60, left: 0, right: 0, height: 2, background: "#eceae2", zIndex: 40 }}>
        <div style={{
          height: "100%",
          background: "#1710E6",
          width: `${((step + (selected ? 1 : 0)) / QUESTIONS.length) * 100}%`,
          transition: "width 400ms cubic-bezier(.2,.7,.2,1)",
        }} />
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 48, justifyContent: "center" }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === step ? 32 : 8,
              background: i < step ? "#1710E6" : i === step ? "#1710E6" : "#eceae2",
              transition: "width 300ms, background 300ms",
              opacity: i > step ? 0.5 : 1,
            }} />
          ))}
        </div>

        {/* Question */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 12 }}>
            Step {String(step + 1).padStart(2, "0")}
          </div>
          <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 }}>
            {current.question}
          </h1>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#6b6458", lineHeight: 1.6 }}>
            {current.subtitle}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 40 }}>
          {current.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                style={{
                  textAlign: "left",
                  padding: "18px 20px",
                  borderRadius: 4,
                  border: `1.5px solid ${isSelected ? "#1710E6" : "#0e0e12"}`,
                  background: isSelected ? "rgba(23,16,230,0.04)" : "#fff",
                  cursor: "pointer",
                  transition: "border-color 150ms, background 150ms",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500, color: "#0e0e12" }}>
                    {opt.label}
                  </div>
                  <div style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                    color: isSelected ? "#1710E6" : "#6b6458",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: isSelected ? "rgba(23,16,230,0.08)" : "#f6f4ef",
                    padding: "2px 7px", borderRadius: 2,
                    transition: "color 150ms, background 150ms",
                  }}>
                    {opt.tag}
                  </div>
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", lineHeight: 1.5 }}>
                  {opt.desc}
                </div>
                {isSelected && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#1710E6", borderRadius: "0 0 2px 2px" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {step > 0 ? (
            <button
              onClick={() => { setStep(step - 1); setSelected(answers[QUESTIONS[step - 1].id] ?? null); }}
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", background: "none", border: "none", cursor: "pointer", padding: "10px 0" }}
            >
              ← Back
            </button>
          ) : <div />}
          <button
            onClick={handleNext}
            disabled={!selected}
            style={{
              background: selected ? "#1710E6" : "#eceae2",
              color: selected ? "#f6f4ef" : "#6b6458",
              border: "none", borderRadius: 4,
              padding: "13px 24px",
              fontFamily: "JetBrains Mono, monospace", fontSize: 13,
              cursor: selected ? "pointer" : "not-allowed",
              transition: "background 150ms, color 150ms",
            }}
          >
            {step < QUESTIONS.length - 1 ? "Continue →" : "Generate My Path →"}
          </button>
        </div>
      </div>
    </div>
  );
}
