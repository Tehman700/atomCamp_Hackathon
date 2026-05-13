"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/client";
import { QUIZ_QUESTIONS } from "@/lib/data";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

interface AnswerRecord {
  questionId: string;
  question: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  feedback: string;
}

interface AdaptiveRec {
  tier: string;
  headline: string;
  message: string;
  nextAction: string;
  flagInstructor: boolean;
}

// Detect if id is a topic slug (not a legacy "q1" style id)
function isTopicId(id: string) {
  return !/^q\d+$/i.test(id);
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const topicMode = isTopicId(params.id);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicTitle, setTopicTitle] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(topicMode);
  const [username, setUsername] = useState("");

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [done, setDone] = useState(false);
  const [adaptiveRec, setAdaptiveRec] = useState<AdaptiveRec | null>(null);
  const [saving, setSaving] = useState(false);

  // Load user + questions
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setUsername(prof?.full_name?.split(" ")[0] ?? "");
      }

      if (!topicMode) {
        // Legacy mode — use hardcoded questions
        const start = Math.max(0, QUIZ_QUESTIONS.findIndex((q) => q.id === params.id));
        setQuestions(QUIZ_QUESTIONS.slice(start) as Question[]);
        setTopicTitle("Python & ML Fundamentals");
        setLoadingQuestions(false);
        return;
      }

      // Topic mode — try sessionStorage cache first
      const cacheKey = `quiz_${params.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setQuestions(parsed.questions);
        setTopicTitle(parsed.topicTitle);
        setLoadingQuestions(false);
        return;
      }

      // Look up topic from learning path (Supabase or localStorage)
      let title = params.id.replace(/-/g, " ");
      let description = "";

      if (user) {
        const { data: pathRow } = await supabase
          .from("learning_paths")
          .select("path_data")
          .eq("user_id", user.id)
          .single();

        const topics: { id: string; title: string; description: string }[] =
          pathRow?.path_data?.topics ?? [];
        const match = topics.find((t) => t.id === params.id);
        if (match) { title = match.title; description = match.description; }
      } else {
        const saved = localStorage.getItem("learningPath");
        if (saved) {
          const parsed = JSON.parse(saved);
          const match = (parsed.topics ?? []).find((t: { id: string; title: string; description: string }) => t.id === params.id);
          if (match) { title = match.title; description = match.description; }
        }
      }

      setTopicTitle(title);

      // Generate questions from API
      try {
        const res = await fetch("/api/quiz-for-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicTitle: title, topicDescription: description, numQuestions: 5 }),
        });
        const data = await res.json();
        const qs: Question[] = data.questions ?? [];
        setQuestions(qs);
        sessionStorage.setItem(cacheKey, JSON.stringify({ questions: qs, topicTitle: title }));
      } catch {
        // Fallback questions about the topic
        setQuestions([
          { id: "fb1", question: `What is the primary purpose of ${title}?`, options: ["To manage databases", "To process and analyze information in this domain", "To build mobile apps", "To design graphics"], correctIndex: 1, explanation: `${title} focuses on processing and analyzing information specific to this domain.`, difficulty: "easy" },
          { id: "fb2", question: `Which skill is most fundamental for mastering ${title}?`, options: ["Graphic design", "Core programming and problem-solving", "Hardware engineering", "Marketing"], correctIndex: 1, explanation: "Core programming and problem-solving skills underpin all technical domains.", difficulty: "easy" },
        ]);
      }
      setLoadingQuestions(false);
    })();
  }, [params.id, topicMode]);

  const question = questions[currentIdx];

  const handleSelect = async (index: number) => {
    if (selected !== null || loadingFeedback || !question) return;
    setSelected(index);
    setLoadingFeedback(true);

    let feedbackText = question.explanation;
    let isCorrect = index === question.correctIndex;

    try {
      const res = await fetch("/api/quiz-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          selectedIndex: index,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
        }),
      });
      const data = await res.json();
      feedbackText = data.feedback ?? question.explanation;
      isCorrect = data.isCorrect ?? isCorrect;
    } catch {}

    setFeedback({ text: feedbackText, isCorrect });
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, question: question.question, selectedIndex: index, correctIndex: question.correctIndex, isCorrect, feedback: feedbackText },
    ]);
    setLoadingFeedback(false);
  };

  const finishQuiz = async (finalAnswers: AnswerRecord[]) => {
    setDone(true);
    setSaving(true);
    const score = finalAnswers.filter((a) => a.isCorrect).length;
    const total = finalAnswers.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    // Get adaptive recommendation
    let rec: AdaptiveRec | null = null;
    try {
      const res = await fetch("/api/adaptive-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, total, courseTitle: topicTitle, lessonTitle: topicTitle, studentName: username || "Student" }),
      });
      rec = await res.json();
      setAdaptiveRec(rec);
    } catch {}

    // Save full result to Supabase
    try {
      await fetch("/api/save-quiz-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: params.id,
          quizId: `${params.id}-${Date.now()}`,
          score,
          total,
          percentage: pct,
          answers: finalAnswers,
          recommendation: rec,
        }),
      });
    } catch {}

    setSaving(false);
  };

  const handleNext = () => {
    const newAnswers = answers; // already updated in handleSelect
    if (currentIdx >= questions.length - 1) {
      finishQuiz(newAnswers);
    } else {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setFeedback(null);
    }
  };

  // ── Loading questions ──
  if (loadingQuestions) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TopBar status="Quiz" statusColor="blue" username={username} />
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "2px solid #eceae2", borderTop: "2px solid #1710E6", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Model cooking<span style={{ color: "#1710E6" }}>.</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
            Generating questions for <em>{params.id.replace(/-/g, " ")}</em>...
          </div>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  if (done) {
    const score = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const tier = pct >= 80 ? "excellent" : pct >= 60 ? "satisfactory" : "struggling";
    const tierColor = tier === "excellent" ? "#8DC651" : tier === "satisfactory" ? "#1710E6" : "#e63b17";

    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
        <TopBar status="Results" statusColor={tier === "excellent" ? "lime" : "blue"} username={username} />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "88px 24px 80px" }}>
          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 10 }}>
                {topicTitle}
              </div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 48, letterSpacing: "-0.025em", lineHeight: 1 }}>
                {tier === "excellent" ? "Excellent" : tier === "satisfactory" ? "Good work" : "Keep going"}
                <span style={{ color: tierColor }}>.</span>
              </h1>
            </div>
            {/* Score ring */}
            <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
              <svg width="96" height="96" style={{ position: "absolute" }}>
                <circle cx="48" cy="48" r="42" fill="none" stroke="#eceae2" strokeWidth="5" />
                <circle cx="48" cy="48" r="42" fill="none" stroke={tierColor} strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px", transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: tierColor }}>{pct}%</span>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", marginBottom: 28 }}>
            {score} of {total} correct
            {saving && <span style={{ marginLeft: 12, color: "#8DC651" }}>· Saving to dashboard...</span>}
          </div>

          {/* Adaptive recommendation */}
          {adaptiveRec && (
            <div style={{
              marginBottom: 28, padding: "20px 24px", borderRadius: 4,
              border: `1px solid ${tier === "struggling" ? "rgba(230,59,23,0.3)" : tier === "excellent" ? "rgba(141,198,81,0.4)" : "rgba(23,16,230,0.3)"}`,
              background: tier === "struggling" ? "rgba(230,59,23,0.04)" : tier === "excellent" ? "rgba(141,198,81,0.06)" : "rgba(23,16,230,0.03)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500, color: tierColor }}>
                  {adaptiveRec.headline}
                </div>
                {adaptiveRec.flagInstructor && (
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, padding: "2px 8px", borderRadius: 2, background: "rgba(230,59,23,0.08)", color: "#e63b17", border: "1px solid rgba(230,59,23,0.3)" }}>
                    Instructor notified
                  </div>
                )}
              </div>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#4a453d", lineHeight: 1.65, marginBottom: 10 }}>
                {adaptiveRec.message}
              </p>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: tierColor }}>
                Next: {adaptiveRec.nextAction}
              </div>
            </div>
          )}

          {/* Per-question breakdown */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
              Question Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {answers.map((a, i) => (
                <div key={i} style={{
                  background: "#fff", border: `1px solid ${a.isCorrect ? "rgba(141,198,81,0.4)" : "rgba(230,59,23,0.3)"}`,
                  borderRadius: 4, padding: "14px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: a.isCorrect ? "#8DC651" : "#e63b17",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "#fff", fontWeight: 700,
                    }}>
                      {a.isCorrect ? "✓" : "✗"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#0e0e12", marginBottom: 6, lineHeight: 1.5 }}>
                        {a.question}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                        <div>
                          <span style={{ color: "#6b6458" }}>Your answer: </span>
                          <span style={{ color: a.isCorrect ? "#3a6a0e" : "#e63b17" }}>
                            {String.fromCharCode(65 + a.selectedIndex)}
                          </span>
                        </div>
                        {!a.isCorrect && (
                          <div>
                            <span style={{ color: "#6b6458" }}>Correct: </span>
                            <span style={{ color: "#3a6a0e" }}>{String.fromCharCode(65 + a.correctIndex)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#4a453d", lineHeight: 1.6, paddingLeft: 30, borderTop: "1px solid #f6f4ef", paddingTop: 8 }}>
                    💡 {a.feedback}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/learning-path" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "12px 20px", border: "1px solid #0e0e12", borderRadius: 4, color: "#0e0e12", textDecoration: "none" }}>
              ← Back to Path
            </Link>
            <Link href="/dashboard" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "12px 20px", background: "#1710E6", borderRadius: 4, color: "#f6f4ef", textDecoration: "none" }}>
              Dashboard →
            </Link>
            <button
              onClick={() => { setDone(false); setCurrentIdx(0); setSelected(null); setFeedback(null); setAnswers([]); setAdaptiveRec(null); sessionStorage.removeItem(`quiz_${params.id}`); setLoadingQuestions(true); }}
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "12px 20px", border: "1px solid #eceae2", borderRadius: 4, color: "#6b6458", background: "transparent", cursor: "pointer" }}
            >
              Retry Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No questions fallback ──
  if (!question) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TopBar status="Quiz" statusColor="blue" username={username} />
        <div style={{ textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
          No questions found. <Link href="/learning-path" style={{ color: "#1710E6" }}>Go back to your path.</Link>
        </div>
      </div>
    );
  }

  // ── Active quiz ──
  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status={`Q${currentIdx + 1} / ${questions.length}`} statusColor="blue" username={username} />

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 60, left: 0, right: 0, height: 2, background: "#eceae2", zIndex: 40 }}>
        <div style={{ height: "100%", background: "#1710E6", width: `${(currentIdx / questions.length) * 100}%`, transition: "width 400ms" }} />
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Topic + dots */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {topicTitle}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: i === currentIdx ? 20 : 7, height: 7, borderRadius: 3.5,
                background: answers[i]?.isCorrect ? "#8DC651" : answers[i] ? "#e63b17" : i === currentIdx ? "#1710E6" : "#eceae2",
                transition: "width 300ms",
              }} />
            ))}
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-block", fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            padding: "3px 9px", borderRadius: 2, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em",
            border: `1px solid ${question.difficulty === "easy" ? "rgba(141,198,81,0.4)" : question.difficulty === "medium" ? "rgba(230,167,23,0.4)" : "rgba(230,59,23,0.4)"}`,
            background: question.difficulty === "easy" ? "rgba(141,198,81,0.08)" : question.difficulty === "medium" ? "rgba(230,167,23,0.08)" : "rgba(230,59,23,0.08)",
            color: question.difficulty === "easy" ? "#3a6a0e" : question.difficulty === "medium" ? "#7a5200" : "#e63b17",
          }}>
            {question.difficulty}
          </div>
          <h2 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {question.question.split("\n")[0]}
          </h2>
          {question.question.includes("\n") && (
            <pre style={{ marginTop: 12, fontSize: 13 }}>{question.question.split("\n").slice(1).join("\n")}</pre>
          )}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === question.correctIndex;
            const showResult = selected !== null;
            let border = "#0e0e12", bg = "#fff", color = "#0e0e12";
            if (showResult) {
              if (isCorrect) { border = "#8DC651"; bg = "rgba(141,198,81,0.08)"; color = "#3a6a0e"; }
              else if (isSelected) { border = "#e63b17"; bg = "rgba(230,59,23,0.06)"; color = "#e63b17"; }
            } else if (isSelected) { border = "#1710E6"; bg = "rgba(23,16,230,0.04)"; }

            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null || loadingFeedback}
                style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", width: "100%", padding: "14px 18px", border: `1.5px solid ${border}`, borderRadius: 4, background: bg, cursor: selected !== null ? "default" : "pointer", transition: "border-color 150ms, background 150ms" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 500, background: showResult ? (isCorrect ? "#8DC651" : isSelected ? "#e63b17" : "#eceae2") : "#eceae2", color: showResult && (isCorrect || isSelected) ? "#fff" : "#6b6458" }}>
                  {showResult && isCorrect ? "✓" : showResult && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color, lineHeight: 1.5 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Loading feedback */}
        {loadingFeedback && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", marginBottom: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #1710E6", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Model thinking...
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 4, border: `1px solid ${feedback.isCorrect ? "rgba(141,198,81,0.4)" : "rgba(230,167,23,0.4)"}`, background: feedback.isCorrect ? "rgba(141,198,81,0.06)" : "rgba(230,167,23,0.06)" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 500, color: feedback.isCorrect ? "#3a6a0e" : "#7a5200", marginBottom: 6 }}>
              {feedback.isCorrect ? "✓ Correct" : "✗ Not quite"}
            </div>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#4a453d", lineHeight: 1.65 }}>{feedback.text}</p>
          </div>
        )}

        {feedback && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleNext} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, padding: "12px 24px", background: "#1710E6", borderRadius: 4, color: "#f6f4ef", border: "none", cursor: "pointer" }}>
              {currentIdx < questions.length - 1 ? "Next Question →" : "View Results →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
