"use client";

import { useState } from "react";
import Link from "next/link";
import { AtomIcon } from "@/components/AtomLogo";
import { STUDENTS, COURSES, type Student } from "@/lib/data";

function RiskBadge({ score }: { score: number }) {
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const configs = {
    high: { label: "High Risk", bg: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "rgba(239,68,68,0.3)" },
    medium: { label: "At Risk", bg: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "rgba(245,158,11,0.3)" },
    low: { label: "On Track", bg: "rgba(16,185,129,0.12)", color: "#6EE7B7", border: "rgba(16,185,129,0.3)" },
  };
  const c = configs[level];
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider"
      style={{ background: c.bg, color: c.color, borderColor: c.border }}
    >
      {c.label}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[#1E1E45] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color, transition: "width 0.5s ease" }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

export default function InstructorPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<Record<string, { outreachMessage: string; instructorActions: string[]; pathAdjustment: string }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"risk" | "progress" | "name">("risk");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const sorted = [...STUDENTS]
    .filter((s) => {
      if (filter === "all") return true;
      if (filter === "high") return s.riskScore >= 70;
      if (filter === "medium") return s.riskScore >= 40 && s.riskScore < 70;
      return s.riskScore < 40;
    })
    .sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const aAvg = Object.values(a.progress).reduce((x, y) => x + y, 0) / (Object.values(a.progress).length || 1);
      const bAvg = Object.values(b.progress).reduce((x, y) => x + y, 0) / (Object.values(b.progress).length || 1);
      return aAvg - bAvg;
    });

  const atRisk = STUDENTS.filter((s) => s.riskScore >= 40).length;
  const avgProgress = Math.round(
    STUDENTS.reduce((acc, s) => {
      const avg = Object.values(s.progress).reduce((a, b) => a + b, 0) / (Object.values(s.progress).length || 1);
      return acc + avg;
    }, 0) / STUDENTS.length
  );

  const generateIntervention = async (student: Student) => {
    if (interventions[student.id]) {
      setExpandedId(expandedId === student.id ? null : student.id);
      return;
    }
    setLoadingId(student.id);
    setExpandedId(student.id);
    try {
      const res = await fetch("/api/intervention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student }),
      });
      const data = await res.json();
      setInterventions((prev) => ({ ...prev, [student.id]: data }));
    } catch {
      setInterventions((prev) => ({
        ...prev,
        [student.id]: {
          outreachMessage: `Hi ${student.name}, I noticed you haven't been active recently. I wanted to check in — is everything okay? We're here to help if you need support or a different approach.`,
          instructorActions: [
            "Schedule a 15-minute 1-on-1 check-in this week",
            "Simplify their current module — offer an alternative lower-difficulty track",
          ],
          pathAdjustment: "Move to a foundational review module before continuing with the current content.",
        },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050D] bg-grid">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(6,182,212,0.06), transparent)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-[#1E1E45]">
        <Link href="/" className="flex items-center gap-2">
          <AtomIcon className="w-7 h-7" />
          <span className="font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            atom<span className="text-[#7C3AED]">camp</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 text-xs rounded-full border font-mono"
            style={{
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.25)",
              color: "#67E8F9",
            }}
          >
            Instructor View
          </span>
          <Link href="/dashboard" className="text-sm text-[#64748B] hover:text-white transition-colors ml-3">
            Student View
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <p className="text-[#06B6D4] text-xs font-mono uppercase tracking-widest mb-1">
            Instructor Intelligence Dashboard
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Class Overview
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            AI-powered student insights. Click any at-risk student to generate an intervention plan.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: STUDENTS.length, icon: "👥", color: "#94A3B8" },
            { label: "At Risk", value: atRisk, icon: "⚠️", color: "#EF4444" },
            { label: "Avg Progress", value: `${avgProgress}%`, icon: "📊", color: "#06B6D4" },
            { label: "Active Today", value: 3, icon: "🟢", color: "#10B981" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="glass-card rounded-2xl p-5 animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-[10px] font-mono text-[#475569] uppercase">{s.label}</span>
              </div>
              <div
                className="text-3xl font-extrabold"
                style={{ fontFamily: "Syne, sans-serif", color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* AI banner */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl mb-6 animate-slide-up"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            animationDelay: "0.3s",
          }}
        >
          <span className="text-lg">🤖</span>
          <p className="text-sm text-[#94A3B8]">
            <span className="text-[#A78BFA] font-medium">GPT-4o Intervention Engine:</span>{" "}
            Click any at-risk student row to generate a personalized outreach message and action plan — powered by AI and based on their specific risk signals.
          </p>
        </div>

        {/* Filters & sort */}
        <div className="flex flex-wrap items-center gap-3 mb-5 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <div className="flex gap-1">
            {(["all", "high", "medium", "low"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: filter === f ? "#7C3AED" : "#1E1E45",
                  color: filter === f ? "white" : "#64748B",
                }}
              >
                {f === "all" ? "All Students" : f === "high" ? "High Risk" : f === "medium" ? "At Risk" : "On Track"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-[#64748B]">
            Sort by:
            {(["risk", "progress", "name"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-2.5 py-1 rounded-lg capitalize transition-all"
                style={{
                  background: sortBy === s ? "rgba(124,58,237,0.2)" : "transparent",
                  color: sortBy === s ? "#A78BFA" : "#64748B",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Student table */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1E1E45" }}>
                {["Student", "Last Active", "Courses", "Quiz Avg", "Risk Score", "Status", "AI Action"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[10px] font-mono text-[#475569] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((student, i) => {
                const isExpanded = expandedId === student.id;
                const intervention = interventions[student.id];
                const isLoading = loadingId === student.id;
                const isAtRisk = student.riskScore >= 40;

                return (
                  <>
                    <tr
                      key={student.id}
                      className="group cursor-pointer transition-all duration-200"
                      style={{
                        borderBottom: "1px solid #1E1E45",
                        background: isExpanded
                          ? "rgba(124,58,237,0.06)"
                          : i % 2 === 0
                          ? "transparent"
                          : "rgba(12,12,30,0.4)",
                      }}
                      onClick={() => isAtRisk && generateIntervention(student)}
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${student.riskScore >= 70 ? "#EF4444" : student.riskScore >= 40 ? "#F59E0B" : "#10B981"}, ${student.riskScore >= 70 ? "#B91C1C" : student.riskScore >= 40 ? "#B45309" : "#059669"})`,
                            }}
                          >
                            {student.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{student.name}</div>
                            <div className="text-[10px] text-[#475569]">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Last Active */}
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-mono"
                          style={{
                            color: student.lastActive.includes("hour") || student.lastActive.includes("minutes")
                              ? "#10B981"
                              : student.lastActive.includes("days") && parseInt(student.lastActive) >= 5
                              ? "#EF4444"
                              : "#F59E0B",
                          }}
                        >
                          {student.lastActive}
                        </span>
                      </td>
                      {/* Courses */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.enrolledCourses.map((cId) => {
                            const c = COURSES.find((x) => x.id === cId);
                            return c ? (
                              <span
                                key={cId}
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(124,58,237,0.12)",
                                  color: "#A78BFA",
                                  border: "1px solid rgba(124,58,237,0.2)",
                                }}
                              >
                                {c.icon} {c.title.split(" ")[0]}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      {/* Quiz Avg */}
                      <td className="px-5 py-4">
                        <span
                          className="text-sm font-mono font-bold"
                          style={{
                            color: student.quizAvg >= 80 ? "#10B981" : student.quizAvg >= 60 ? "#F59E0B" : "#EF4444",
                          }}
                        >
                          {student.quizAvg > 0 ? `${student.quizAvg}%` : "—"}
                        </span>
                      </td>
                      {/* Risk */}
                      <td className="px-5 py-4">
                        <RiskBar score={student.riskScore} />
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <RiskBadge score={student.riskScore} />
                      </td>
                      {/* Action */}
                      <td className="px-5 py-4">
                        {isAtRisk ? (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: isExpanded ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)",
                              color: "#A78BFA",
                              border: "1px solid rgba(124,58,237,0.25)",
                              fontFamily: "Syne, sans-serif",
                            }}
                          >
                            {isLoading ? (
                              <>
                                <div
                                  className="w-3 h-3 border border-[#7C3AED] border-t-transparent rounded-full"
                                  style={{ animation: "spin 0.8s linear infinite" }}
                                />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                Generating...
                              </>
                            ) : isExpanded ? "Hide Plan ▲" : "AI Plan ✨"}
                          </button>
                        ) : (
                          <span className="text-xs text-[#475569]">No action needed</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded intervention panel */}
                    {isExpanded && (
                      <tr key={`${student.id}-expanded`}>
                        <td colSpan={7} className="px-5 py-5" style={{ background: "rgba(124,58,237,0.04)", borderBottom: "1px solid #1E1E45" }}>
                          {isLoading ? (
                            <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                              <div
                                className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full"
                                style={{ animation: "spin 0.8s linear infinite" }}
                              />
                              GPT-4o is analyzing {student.name}'s learning profile and drafting an intervention plan...
                            </div>
                          ) : intervention ? (
                            <div className="animate-fade-in">
                              {/* Risk reasons */}
                              {student.riskReasons.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-[10px] font-mono text-[#475569] uppercase tracking-wider mb-2">Risk Signals</p>
                                  <div className="flex flex-wrap gap-2">
                                    {student.riskReasons.map((r) => (
                                      <span
                                        key={r}
                                        className="text-xs px-2.5 py-1 rounded-lg"
                                        style={{
                                          background: "rgba(239,68,68,0.1)",
                                          color: "#FCA5A5",
                                          border: "1px solid rgba(239,68,68,0.2)",
                                        }}
                                      >
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Outreach message */}
                                <div
                                  className="rounded-xl p-4"
                                  style={{ background: "rgba(12,12,30,0.8)", border: "1px solid #1E1E45" }}
                                >
                                  <p className="text-[10px] font-mono text-[#7C3AED] uppercase tracking-wider mb-2">
                                    ✉️ Outreach Message
                                  </p>
                                  <p className="text-xs text-[#CBD5E1] leading-relaxed italic">
                                    "{intervention.outreachMessage}"
                                  </p>
                                  <button
                                    className="mt-3 text-[10px] font-semibold text-[#7C3AED] hover:text-[#A78BFA] transition-colors"
                                    onClick={() => navigator.clipboard?.writeText(intervention.outreachMessage)}
                                  >
                                    Copy message →
                                  </button>
                                </div>

                                {/* Actions */}
                                <div
                                  className="rounded-xl p-4"
                                  style={{ background: "rgba(12,12,30,0.8)", border: "1px solid #1E1E45" }}
                                >
                                  <p className="text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider mb-2">
                                    ✅ This Week's Actions
                                  </p>
                                  <div className="space-y-2">
                                    {intervention.instructorActions.map((action, i) => (
                                      <div key={i} className="flex gap-2">
                                        <span className="text-[#7C3AED] text-xs font-bold shrink-0">{i + 1}.</span>
                                        <p className="text-xs text-[#CBD5E1] leading-relaxed">{action}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Path adjustment */}
                                <div
                                  className="rounded-xl p-4"
                                  style={{ background: "rgba(12,12,30,0.8)", border: "1px solid #1E1E45" }}
                                >
                                  <p className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-wider mb-2">
                                    🗺️ Path Adjustment
                                  </p>
                                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                                    {intervention.pathAdjustment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-[#2D2D6B] mt-6">
          AtomCamp Instructor Intelligence · Powered by GPT-4o
        </p>
      </div>
    </div>
  );
}
