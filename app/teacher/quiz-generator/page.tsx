"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { COURSES } from "@/lib/data";

interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  accepted?: boolean;
}

interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuestion[];
}

export default function QuizGeneratorPage() {
  const [content, setContent] = useState("");
  const [courseId, setCourseId] = useState(COURSES[0].id);
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedCourse = COURSES.find((c) => c.id === courseId)!;

  const handleGenerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setQuiz(null);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, courseTitle: selectedCourse.title, numQuestions }),
      });
      const data = await res.json();
      setQuiz({ ...data, questions: data.questions.map((q: GeneratedQuestion) => ({ ...q, accepted: true })) });
    } catch {
      alert("Failed to generate quiz. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAccept = (index: number) => {
    if (!quiz) return;
    setQuiz({ ...quiz, questions: quiz.questions.map((q, i) => i === index ? { ...q, accepted: !q.accepted } : q) });
  };

  const exportJSON = () => {
    if (!quiz) return;
    const accepted = quiz.questions.filter((q) => q.accepted);
    const blob = new Blob([JSON.stringify({ title: quiz.title, questions: accepted }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${quiz.title.replace(/\s+/g, "_")}.json`;
    a.click();
  };

  const copyJSON = () => {
    if (!quiz) return;
    navigator.clipboard.writeText(JSON.stringify({ title: quiz.title, questions: quiz.questions.filter((q) => q.accepted) }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const difficultyStyle = (d: string) => ({
    easy: { cls: "badge-low" },
    medium: { cls: "badge-medium" },
    hard: { cls: "badge-high" },
  }[d as "easy" | "medium" | "hard"] ?? { cls: "badge-low" });

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Quiz Generator" statusColor="lime" />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 28px 60px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
              <Link href="/teacher" style={{ color: "#6b6458", textDecoration: "none" }}>Instructor</Link>
              {" "}›{" "}Quiz Generator
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 6 }}>
              AI Quiz Generator<span style={{ color: "#8DC651" }}>.</span>
            </h1>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", maxWidth: 480 }}>
              Paste any lesson content — the model generates exam-quality MCQs with distractors, answers, and explanations.
            </p>
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, padding: "4px 10px", borderRadius: 2, border: "1px solid rgba(141,198,81,0.4)", background: "rgba(141,198,81,0.08)", color: "#3a6a0e", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Module 03
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Input panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Settings */}
            <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px 24px" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
                Settings
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b6458", marginBottom: 6 }}>
                    Course
                  </label>
                  <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input" style={{ fontSize: 12 }}>
                    {COURSES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b6458", marginBottom: 6 }}>
                    Questions
                  </label>
                  <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="input" style={{ fontSize: 12 }}>
                    {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px 24px", flex: 1 }}>
              <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 10 }}>
                Lesson Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your lesson content here — a paragraph, a transcript, markdown. The model will extract key concepts and build quiz questions from it."
                rows={14}
                className="input"
                style={{ resize: "none", lineHeight: 1.65, fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>{content.length} chars</span>
                <button onClick={handleGenerate} disabled={loading || !content.trim()} style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                  padding: "10px 20px",
                  background: content.trim() && !loading ? "#1710E6" : "#eceae2",
                  color: content.trim() && !loading ? "#f6f4ef" : "#6b6458",
                  border: "none", borderRadius: 4,
                  cursor: content.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {loading ? (
                    <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #6b6458", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Generating...</>
                  ) : "Generate Quiz →"}
                </button>
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div>
            {!quiz && !loading && (
              <div style={{
                minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1px dashed #eceae2", borderRadius: 4, padding: 40, textAlign: "center",
              }}>
                <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 48, letterSpacing: "-0.02em", color: "#eceae2", marginBottom: 12 }}>
                  📝
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
                  Questions will appear here
                </div>
              </div>
            )}

            {loading && (
              <div style={{
                minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1px solid #eceae2", borderRadius: 4, background: "#fff", textAlign: "center",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #1710E6", animation: "spin 0.9s linear infinite", marginBottom: 20 }} />
                <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, letterSpacing: "-0.01em", marginBottom: 6 }}>
                  Generating {numQuestions} questions
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                  Model cooking your questions...
                </div>
              </div>
            )}

            {quiz && (
              <div>
                {/* Export header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, letterSpacing: "-0.01em" }}>{quiz.title}</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                      {quiz.questions.filter((q) => q.accepted).length}/{quiz.questions.length} accepted
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={copyJSON} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "7px 14px", border: "1px solid #eceae2", borderRadius: 3, background: "transparent", color: "#6b6458", cursor: "pointer" }}>
                      {copied ? "✓ Copied" : "Copy JSON"}
                    </button>
                    <button onClick={exportJSON} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "7px 14px", background: "#0e0e12", borderRadius: 3, color: "#f6f4ef", border: "none", cursor: "pointer" }}>
                      Export →
                    </button>
                  </div>
                </div>

                {/* Questions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {quiz.questions.map((q, i) => (
                    <div key={q.id} style={{
                      background: "#fff",
                      border: `1px solid ${q.accepted ? "#0e0e12" : "#eceae2"}`,
                      borderRadius: 4, padding: "18px 20px",
                      opacity: q.accepted ? 1 : 0.5,
                    }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: q.accepted ? "#0e0e12" : "#eceae2", color: q.accepted ? "#f6f4ef" : "#6b6458", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#0e0e12", lineHeight: 1.65, flex: 1 }}>
                          {q.question}
                        </p>
                        <button onClick={() => toggleAccept(i)} style={{
                          flexShrink: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                          padding: "4px 10px", borderRadius: 2, cursor: "pointer",
                          border: `1px solid ${q.accepted ? "rgba(141,198,81,0.4)" : "rgba(230,59,23,0.3)"}`,
                          background: q.accepted ? "rgba(141,198,81,0.08)" : "rgba(230,59,23,0.06)",
                          color: q.accepted ? "#3a6a0e" : "#e63b17",
                        }}>
                          {q.accepted ? "✓ Accept" : "✗ Reject"}
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "7px 12px", borderRadius: 3, fontSize: 11,
                            fontFamily: "JetBrains Mono, monospace",
                            background: oi === q.correctIndex ? "rgba(141,198,81,0.08)" : "#f6f4ef",
                            border: `1px solid ${oi === q.correctIndex ? "rgba(141,198,81,0.4)" : "#eceae2"}`,
                            color: oi === q.correctIndex ? "#3a6a0e" : "#4a453d",
                          }}>
                            <span style={{ width: 18, height: 18, borderRadius: "50%", background: oi === q.correctIndex ? "#8DC651" : "#eceae2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, flexShrink: 0, color: oi === q.correctIndex ? "#fff" : "#6b6458" }}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                            {oi === q.correctIndex && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓ Correct</span>}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", lineHeight: 1.6, fontStyle: "italic" }}>
                          💡 {q.explanation}
                        </p>
                        <span className={difficultyStyle(q.difficulty).cls} style={{ flexShrink: 0 }}>{q.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
