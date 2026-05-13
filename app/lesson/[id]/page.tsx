"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { LESSONS, COURSES } from "@/lib/data";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\| (.+) \|$/gm, (m) => {
      const cells = m.slice(2, -2).split(" | ");
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => `<table>${m}</table>`)
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[htup])(.+)$/gm, "$1");
}

interface Summary {
  title: string;
  bullets: string[];
  quizHint: string;
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = LESSONS.find((l) => l.id === params.id) ?? LESSONS[0];
  const course = COURSES.find((c) => c.id === lesson.courseId);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const generateSummary = async () => {
    if (summary) { setShowSummary(!showSummary); return; }
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const res = await fetch("/api/summarize-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonTitle: lesson.title, content: lesson.content, lessonId: lesson.id }),
      });
      setSummary(await res.json());
    } catch {
      setSummary({
        title: `Key Takeaways: ${lesson.title}`,
        bullets: ["Variables store data with names you choose", "Python is dynamically typed — no type declarations needed", "f-strings are the cleanest way to format strings", "Use int(), float(), str() for type conversion", "type() tells you what type a variable is"],
        quizHint: "Most likely tested: the difference between int and float, and f-string syntax.",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi — I'm AtomBot, your AI tutor for this lesson.\n\nYou're studying **${lesson.title}**. Ask me anything — I'll guide you with questions, give examples, or quiz you on what you've learned.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    const apiMessages = [...messages, { role: "user" as const, content: userMsg }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, lessonTitle: lesson.title, lessonContext: lesson.content }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text } = JSON.parse(data);
            assistantMsg += text;
            setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: assistantMsg }]);
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting. Try rephrasing!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ height: "100vh", background: "#f6f4ef", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar status={lesson.title} statusColor="blue" />

      {/* Sub-nav */}
      <div style={{
        position: "fixed", top: 60, left: 0, right: 0, zIndex: 39,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 44,
        background: "#fff", borderBottom: "1px solid #eceae2",
        fontFamily: "JetBrains Mono, monospace", fontSize: 11,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b6458" }}>
          <Link href="/learning-path" style={{ color: "#6b6458", textDecoration: "none" }}>My Path</Link>
          <span>›</span>
          <span style={{ color: "#6b6458" }}>{course?.title ?? "Course"}</span>
          <span>›</span>
          <span style={{ color: "#0e0e12" }}>{lesson.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={generateSummary}
            disabled={summaryLoading}
            style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11,
              padding: "5px 12px", borderRadius: 3,
              border: "1px solid #8DC651", background: "rgba(141,198,81,0.1)", color: "#3a6a0e",
              cursor: "pointer",
            }}
          >
            {summaryLoading ? "..." : "⚡ Summary"}
          </button>
          <Link href="/quiz/q1" style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 11,
            padding: "5px 12px", borderRadius: 3,
            background: "#1710E6", color: "#f6f4ef", textDecoration: "none",
          }}>
            Take Quiz →
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11,
              padding: "5px 12px", borderRadius: 3,
              border: "1px solid #eceae2", background: "transparent", color: "#6b6458",
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? "Hide Tutor" : "AtomBot"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", marginTop: 104 }}>
        {/* Lesson content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* AI Summary Panel */}
            {showSummary && (
              <div style={{
                marginBottom: 28, borderRadius: 4,
                border: "1px solid rgba(141,198,81,0.5)", overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "rgba(141,198,81,0.08)", borderBottom: "1px solid rgba(141,198,81,0.2)",
                }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#3a6a0e", display: "flex", gap: 8, alignItems: "center" }}>
                    <span>⚡</span>
                    <span>{summary?.title ?? "Generating summary..."}</span>
                  </div>
                  <button onClick={() => setShowSummary(false)} style={{ background: "none", border: "none", color: "#6b6458", cursor: "pointer", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>✕</button>
                </div>
                {summaryLoading ? (
                  <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", background: "#fff" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #8DC651", animation: "spin 0.8s linear infinite" }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    Model cooking your summary...
                  </div>
                ) : summary ? (
                  <div style={{ padding: "16px 18px", background: "#fff" }}>
                    <div style={{ marginBottom: 14 }}>
                      {summary.bullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#0e0e12", lineHeight: 1.6 }}>
                          <span style={{ color: "#8DC651", fontWeight: 600, flexShrink: 0 }}>→</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "8px 12px", borderRadius: 3, background: "rgba(230,167,23,0.08)", border: "1px solid rgba(230,167,23,0.25)", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#7a5200" }}>
                      <span style={{ fontWeight: 600 }}>Quiz hint: </span>{summary.quizHint}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Lesson header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", marginBottom: 10, letterSpacing: "0.05em" }}>
                {course?.icon} {course?.title} · {lesson.duration}
              </div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 16 }}>
                {lesson.title}
              </h1>
              <div style={{ width: 48, height: 2, background: "#1710E6", borderRadius: 1 }} />
            </div>

            <div className="lesson-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content) }} />

            {/* Footer nav */}
            <div style={{ display: "flex", gap: 10, marginTop: 48, paddingTop: 28, borderTop: "1px solid #eceae2" }}>
              <Link href="/learning-path" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 18px", border: "1px solid #0e0e12", borderRadius: 4, color: "#0e0e12", textDecoration: "none" }}>
                ← Back to Path
              </Link>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 18px", border: "1px solid #8DC651", borderRadius: 4, background: "rgba(141,198,81,0.08)", color: "#3a6a0e", cursor: "pointer" }}
              >
                {summaryLoading ? "Summarizing..." : showSummary ? "Hide Summary" : "⚡ Summarize"}
              </button>
              <Link href="/quiz/q1" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 18px", background: "#1710E6", borderRadius: 4, color: "#f6f4ef", textDecoration: "none" }}>
                Test Knowledge →
              </Link>
            </div>
          </div>
        </div>

        {/* AI Tutor Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 360, display: "flex", flexDirection: "column",
            borderLeft: "1px solid #0e0e12", background: "#fff",
            flexShrink: 0,
          }}>
            {/* Sidebar header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eceae2", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1710E6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                🤖
              </div>
              <div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500, color: "#0e0e12" }}>AtomBot</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8DC651", letterSpacing: "0.05em" }}>● AI Tutor · Online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                  {msg.role === "assistant" && (
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1710E6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 2 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px",
                    borderRadius: 4,
                    background: msg.role === "user" ? "#1710E6" : "#f6f4ef",
                    color: msg.role === "user" ? "#f6f4ef" : "#0e0e12",
                    fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    border: msg.role === "assistant" ? "1px solid #eceae2" : "none",
                  }}>
                    {msg.content || (
                      <span style={{ display: "flex", gap: 3 }}>
                        {[0, 150, 300].map((d) => (
                          <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "#6b6458", display: "inline-block", animation: `bounce 1s ${d}ms infinite` }} />
                        ))}
                        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div style={{ padding: "0 16px 10px" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Suggested</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {["Can you give a simpler example?", "What's the most common mistake here?", "Quiz me on this concept"].map((q) => (
                    <button key={q} onClick={() => setInput(q)} style={{
                      textAlign: "left", fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                      padding: "8px 12px", border: "1px solid #eceae2", borderRadius: 3, background: "#f6f4ef",
                      color: "#0e0e12", cursor: "pointer",
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #eceae2", display: "flex", gap: 8 }}>
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask AtomBot anything..."
                className="input"
                style={{ flex: 1, fontSize: 12, padding: "9px 12px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                style={{
                  width: 38, height: 38, borderRadius: 4, flexShrink: 0,
                  background: input.trim() ? "#1710E6" : "#eceae2",
                  border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke={input.trim() ? "#f6f4ef" : "#6b6458"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
