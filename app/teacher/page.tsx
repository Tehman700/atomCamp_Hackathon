"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/client";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  quizAvg: number | null;
  quizCount: number;
  lastActive: string;
  riskScore: number;
  isReal: boolean;
}

const DUMMY_STUDENTS: StudentRow[] = [
  { id: "dummy-1", name: "Ahmed Raza", email: "ahmed.raza@example.com", avatar: "AR", quizAvg: 72, quizCount: 4, lastActive: "2 hours ago", riskScore: 45, isReal: false },
  { id: "dummy-2", name: "Fatima Malik", email: "fatima.malik@example.com", avatar: "FM", quizAvg: 88, quizCount: 7, lastActive: "1 day ago", riskScore: 18, isReal: false },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "#e63b17" : score >= 40 ? "#e6a717" : "#8DC651";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 3, background: "#eceae2", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color }}>{score}</span>
    </div>
  );
}

export default function TeacherPage() {
  const router = useRouter();
  const [instructorName, setInstructorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // Publish state
  const [showPublish, setShowPublish] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubType, setPubType] = useState<"quiz" | "assignment" | "video">("quiz");
  const [pubDesc, setPubDesc] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState("");

  // Insights
  const [insights, setInsights] = useState<{ summary: string; urgentAction: string; positiveHighlight: string } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", user.id)
        .single();

      if (prof?.role !== "teacher" || prof?.status !== "approved") {
        router.push("/pending-approval");
        return;
      }

      setInstructorName(prof.full_name ?? "Instructor");

      // Fetch real subscribers
      const res = await fetch("/api/instructor/subscribers");
      if (res.ok) {
        const data = await res.json();
        const realStudents: StudentRow[] = (data.subscribers ?? []).map((s: {
          id: string; name: string; email: string; quizAvg: number | null;
          quizCount: number; lastActive: string;
        }) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          avatar: s.name.slice(0, 2).toUpperCase(),
          quizAvg: s.quizAvg,
          quizCount: s.quizCount,
          lastActive: timeAgo(s.lastActive),
          riskScore: s.quizAvg === null ? 60 : s.quizAvg < 60 ? 70 : s.quizAvg < 75 ? 40 : 15,
          isReal: true,
        }));
        // Real subscribers first, then dummy rows
        setStudents([...realStudents, ...DUMMY_STUDENTS]);
      } else {
        setStudents(DUMMY_STUDENTS);
      }

      setLoading(false);
    })();
  }, [router]);

  const publish = async () => {
    if (!pubTitle.trim()) return;
    setPublishing(true);
    const res = await fetch("/api/instructor/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: pubTitle, type: pubType, description: pubDesc }),
    });
    const data = await res.json();
    setPublishing(false);
    setPublishedMsg(`Published! ${data.notified} subscriber${data.notified !== 1 ? "s" : ""} notified.`);
    setPubTitle(""); setPubDesc("");
    setTimeout(() => { setPublishedMsg(""); setShowPublish(false); }, 3000);
  };

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/progress-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, courseTitle: "All Courses" }),
      });
      const data = await res.json();
      setInsights({ summary: data.summary, urgentAction: data.urgentAction, positiveHighlight: data.positiveHighlight });
    } catch {
      setInsights({
        summary: `${students.filter(s => s.riskScore >= 40).length} students are at risk and require attention.`,
        urgentAction: "Schedule a check-in with students who have not taken any quizzes yet.",
        positiveHighlight: students.find(s => (s.quizAvg ?? 0) >= 80)
          ? `${students.find(s => (s.quizAvg ?? 0) >= 80)?.name} is performing strongly with ${students.find(s => (s.quizAvg ?? 0) >= 80)?.quizAvg}% quiz average.`
          : "Keep encouraging consistent quiz participation.",
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const riskLabel = (score: number) =>
    score >= 70 ? { label: "High Risk", cls: "badge-high" } :
    score >= 40 ? { label: "At Risk", cls: "badge-medium" } :
    { label: "On Track", cls: "badge-low" };

  const atRisk = students.filter((s) => s.riskScore >= 40).length;
  const withQuiz = students.filter((s) => s.quizAvg !== null);
  const classAvg = withQuiz.length
    ? Math.round(withQuiz.reduce((a, s) => a + (s.quizAvg ?? 0), 0) / withQuiz.length)
    : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "2px solid #eceae2", borderTop: "2px solid #1710E6", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Instructor" statusColor="lime" username={instructorName} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 28px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
              Instructor Dashboard
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 4 }}>
              Welcome back, {instructorName.split(" ")[0]}<span style={{ color: "#1710E6" }}>.</span>
            </h1>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              {students.length} students subscribed · {atRisk} at risk
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowPublish(!showPublish)}
              style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                padding: "11px 18px",
                background: showPublish ? "#0e0e12" : "#1710E6",
                color: "#f6f4ef", border: "none", borderRadius: 4,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {showPublish ? "✕ Cancel" : "+ Publish Content"}
            </button>
            <Link href="/teacher/quiz-generator" style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 12,
              padding: "11px 18px", border: "1px solid #0e0e12", borderRadius: 4,
              color: "#0e0e12", textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
            }}>
              📝 Quiz Generator
            </Link>
          </div>
        </div>

        {/* Publish content panel */}
        {showPublish && (
          <div style={{
            background: "#fff", border: "1px solid #1710E6", borderRadius: 4,
            padding: "24px 28px", marginBottom: 24,
          }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1710E6", marginBottom: 16 }}>
              Publish to Subscribers
            </div>

            {publishedMsg && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(141,198,81,0.1)", border: "1px solid rgba(141,198,81,0.4)", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#3a6a0e" }}>
                ✓ {publishedMsg}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
              <input
                value={pubTitle}
                onChange={(e) => setPubTitle(e.target.value)}
                placeholder="Title — e.g. Python Functions Quiz, Week 3 Assignment..."
                className="input"
                style={{ fontSize: 13 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {(["quiz", "assignment", "video"] as const).map((t) => (
                  <button key={t} onClick={() => setPubType(t)} style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "0 14px",
                    borderRadius: 3, border: `1px solid ${pubType === t ? "#0e0e12" : "#eceae2"}`,
                    background: pubType === t ? "#0e0e12" : "transparent",
                    color: pubType === t ? "#f6f4ef" : "#6b6458",
                    cursor: "pointer", textTransform: "capitalize", height: "100%",
                  }}>
                    {t === "quiz" ? "📝" : t === "assignment" ? "📋" : "🎬"} {t}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={pubDesc}
              onChange={(e) => setPubDesc(e.target.value)}
              placeholder="Optional description or instructions for students..."
              rows={2}
              className="input"
              style={{ resize: "none", fontSize: 12, fontFamily: "JetBrains Mono, monospace", marginBottom: 12 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                Will notify {students.filter(s => s.isReal).length} real subscriber{students.filter(s => s.isReal).length !== 1 ? "s" : ""}
              </span>
              <button onClick={publish} disabled={publishing || !pubTitle.trim()} style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                padding: "10px 22px", borderRadius: 4,
                background: pubTitle.trim() && !publishing ? "#1710E6" : "#eceae2",
                color: pubTitle.trim() && !publishing ? "#f6f4ef" : "#6b6458",
                border: "none", cursor: pubTitle.trim() && !publishing ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {publishing ? (
                  <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #6b6458", animation: "spin 0.8s linear infinite" }} />Publishing...</>
                ) : "Publish & Notify →"}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Students", value: students.length },
            { label: "At Risk", value: atRisk },
            { label: "Class Quiz Avg", value: classAvg ? `${classAvg}%` : "—" },
            { label: "Quizzes Taken", value: students.reduce((a, s) => a + s.quizCount, 0) },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "18px 22px" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 40, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights strip */}
        {!insights ? (
          <div style={{ marginBottom: 20, padding: "20px 24px", border: "1px dashed #0e0e12", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
            <div>
              <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, letterSpacing: "-0.01em", marginBottom: 4 }}>AI Class Analysis</div>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>Let the model analyze your students and surface actionable insights.</p>
            </div>
            <button onClick={generateInsights} disabled={loadingInsights} style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 18px",
              background: loadingInsights ? "#eceae2" : "#1710E6",
              color: loadingInsights ? "#6b6458" : "#f6f4ef",
              border: "none", borderRadius: 4, cursor: loadingInsights ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
              {loadingInsights ? <><div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #6b6458", animation: "spin 0.8s linear infinite" }} />Analyzing...</> : "Generate Insights →"}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 20, background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8DC651" }} /> AI Analysis
              </div>
              <button onClick={() => setInsights(null)} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", background: "none", border: "none", cursor: "pointer" }}>Refresh</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Summary", text: insights.summary, accent: "#1710E6" },
                { label: "Urgent Action", text: insights.urgentAction, accent: "#e63b17" },
                { label: "Positive Highlight", text: insights.positiveHighlight, accent: "#3a6a0e" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "12px 16px", background: "#f6f4ef", borderRadius: 3, borderLeft: `2px solid ${item.accent}` }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 6 }}>{item.label}</div>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#0e0e12", lineHeight: 1.6 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student table */}
        <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #eceae2", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 500 }}>Student Roster</span>
              <span style={{ color: "#6b6458" }}>— {students.length} students</span>
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>
              Click any at-risk student for AI intervention plan
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                {["Student", "Last Active", "Quizzes", "Quiz Avg", "Risk", "Status", "Source"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const risk = riskLabel(student.riskScore);
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: student.riskScore >= 70 ? "#e63b17" : student.riskScore >= 40 ? "#e6a717" : "#8DC651",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 600, color: "#fff",
                        }}>
                          {student.avatar}
                        </div>
                        <div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500 }}>{student.name}</div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#4a453d" }}>
                        {student.lastActive}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#0e0e12" }}>
                        {student.quizCount}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, color: (student.quizAvg ?? 0) >= 80 ? "#3a6a0e" : (student.quizAvg ?? 0) >= 60 ? "#7a5200" : "#e63b17" }}>
                        {student.quizAvg !== null ? `${student.quizAvg}%` : "—"}
                      </span>
                    </td>
                    <td><RiskBar score={student.riskScore} /></td>
                    <td><span className={risk.cls}>{risk.label}</span></td>
                    <td>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace", fontSize: 10, padding: "3px 8px", borderRadius: 2,
                        background: student.isReal ? "rgba(141,198,81,0.08)" : "#f6f4ef",
                        border: `1px solid ${student.isReal ? "rgba(141,198,81,0.4)" : "#eceae2"}`,
                        color: student.isReal ? "#3a6a0e" : "#6b6458",
                        letterSpacing: "0.1em", textTransform: "uppercase",
                      }}>
                        {student.isReal ? "subscribed" : "demo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
