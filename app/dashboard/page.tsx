"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";

interface Profile {
  full_name: string;
  role: string;
  avatar_initials: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  order: number;
  resources?: { title: string; url: string; source: string }[];
}

interface PathData {
  topics: Topic[];
  personalizedMessage: string;
  estimatedCompletion: string;
  focusArea: string;
  weeklyGoal: string;
}

interface QuizResult {
  id: string;
  score: number;
  total: number;
  percentage: number;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  type: string;
  read: boolean;
  created_at: string;
  instructor_name: string;
  content_id: string;
}

function calculateStreak(results: QuizResult[]): number {
  if (!results.length) return 0;
  const uniqueDays = [...new Set(results.map((r) => r.created_at.split("T")[0]))].sort().reverse();
  let streak = 0;
  let check = new Date().toISOString().split("T")[0];
  for (const day of uniqueDays) {
    if (day === check) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().split("T")[0];
    } else break;
  }
  return streak;
}

function buildHeatmap(results: QuizResult[]) {
  const dayMap: Record<string, number> = {};
  results.forEach((r) => {
    const day = r.created_at.split("T")[0];
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  });
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split("T")[0];
    const count = dayMap[key] ?? 0;
    return { day: i, count };
  });
}

const intensityColor = (count: number) => {
  if (count === 0) return "#eceae2";
  if (count === 1) return "rgba(23,16,230,0.25)";
  if (count === 2) return "rgba(23,16,230,0.55)";
  return "#1710E6";
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pathData, setPathData] = useState<PathData | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: prof }, { data: pathRow }, { data: quizData }, notifRes] = await Promise.all([
        supabase.from("profiles").select("full_name, role, avatar_initials").eq("id", user.id).single(),
        supabase.from("learning_paths").select("path_data").eq("user_id", user.id).single(),
        supabase.from("quiz_results").select("id, score, total, percentage, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        fetch("/api/notifications"),
      ]);

      if (!pathRow) { router.push("/onboarding"); return; }

      setProfile(prof);
      setPathData(pathRow.path_data as PathData);
      setQuizResults(quizData ?? []);
      if (notifRes.ok) {
        const nd = await notifRes.json();
        setNotifications(nd.notifications ?? []);
      }
      setLoading(false);
    })();
  }, [router]);

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

  const streak = calculateStreak(quizResults);
  const quizAvg = quizResults.length
    ? Math.round(quizResults.reduce((s, r) => s + r.percentage, 0) / quizResults.length)
    : 0;
  const topics = pathData?.topics ?? [];
  const heatmap = buildHeatmap(quizResults);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Learner";
  const initials = profile?.avatar_initials ?? firstName.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Dashboard" statusColor="blue" username={profile?.full_name ?? ""} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 28px 60px" }}>
        {/* Welcome */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
              Welcome back
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {firstName}<span style={{ color: "#1710E6" }}>.</span>
            </h1>
            {streak > 0 && (
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
                {streak}-day streak — keep the momentum going.
              </p>
            )}
            {streak === 0 && quizResults.length === 0 && (
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
                Your path is ready — start your first lesson today.
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "#1710E6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 600, color: "#f6f4ef",
            }}>
              {initials}
            </div>
            <Link href="/instructors" style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 12,
              padding: "12px 16px", border: "1px solid #0e0e12", borderRadius: 4,
              color: "#0e0e12", textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            }}>
              Browse Instructors
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  background: "#e63b17", color: "#fff", borderRadius: 999,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                  padding: "1px 6px", lineHeight: 1.4,
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Link>
            <Link href="/learning-path" style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 13,
              padding: "12px 20px", background: "#1710E6", borderRadius: 4,
              color: "#f6f4ef", textDecoration: "none",
            }}>
              Continue Learning →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Day Streak", value: streak || "—" },
            { label: "Quizzes Taken", value: quizResults.length || "—" },
            { label: "Quiz Average", value: quizAvg ? `${quizAvg}%` : "—" },
            { label: "Topics in Path", value: topics.length || "—" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px 24px" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 40, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          {/* Learning path topics */}
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
              My Learning Path — {pathData?.focusArea}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topics.map((topic, i) => {
                const isCurrent = i === 0;
                const isDone = quizResults.some((r) => r.created_at > new Date(Date.now() - 7 * 864e5).toISOString()); // rough proxy
                return (
                  <div key={topic.id} style={{
                    background: "#fff", borderRadius: 4, padding: "18px 22px",
                    border: `1px solid ${isCurrent ? "#1710E6" : "#0e0e12"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: isCurrent ? "#1710E6" : "#eceae2",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 600,
                        color: isCurrent ? "#f6f4ef" : "#6b6458",
                      }}>
                        {topic.order}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div>
                            <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, letterSpacing: "-0.01em", marginBottom: 2 }}>
                              {topic.title}
                            </div>
                            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                              ~{topic.estimatedHours}h · {isCurrent ? "In Progress" : "Upcoming"}
                            </div>
                          </div>
                          {isCurrent && (
                            <Link href="/learning-path" style={{
                              fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "7px 14px",
                              background: "#1710E6", borderRadius: 3, color: "#f6f4ef", textDecoration: "none", whiteSpace: "nowrap",
                            }}>
                              Start →
                            </Link>
                          )}
                        </div>
                        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#4a453d", lineHeight: 1.6, marginTop: 6 }}>
                          {topic.description}
                        </p>
                        {/* Real resources */}
                        {topic.resources && topic.resources.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                            {topic.resources.slice(0, 3).map((r, ri) => (
                              <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                                fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                                padding: "3px 8px", borderRadius: 2, textDecoration: "none",
                                border: "1px solid #eceae2", background: "#f6f4ef",
                                color: "#1710E6",
                              }}>
                                {r.source} ↗
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Activity heatmap */}
            <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
                Activity · 30 Days
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
                {heatmap.map((d) => (
                  <div key={d.day} title={`${d.count} quiz${d.count !== 1 ? "zes" : ""}`} style={{
                    aspectRatio: "1", borderRadius: 2,
                    background: intensityColor(d.count),
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* AI path summary */}
            {pathData && (
              <div style={{ background: "#fff", border: "1px solid #1710E6", borderRadius: 4, padding: "20px" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1710E6", marginBottom: 10 }}>
                  Your AI Path
                </div>
                <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#0e0e12", lineHeight: 1.7, marginBottom: 16 }}>
                  {pathData.personalizedMessage}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Est. completion", value: pathData.estimatedCompletion },
                    { label: "Weekly goal", value: pathData.weeklyGoal },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                      <span style={{ color: "#6b6458" }}>{m.label}</span>
                      <span style={{ color: "#0e0e12" }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <Link href="/learning-path" style={{
                  display: "block", marginTop: 16, textAlign: "center",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                  padding: "10px", background: "#1710E6", borderRadius: 3,
                  color: "#f6f4ef", textDecoration: "none",
                }}>
                  View Full Path →
                </Link>
              </div>
            )}

            {/* Recent quiz results */}
            {quizResults.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
                  Recent Quizzes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {quizResults.slice(0, 4).map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                        {r.score}/{r.total} correct
                      </div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 600, color: r.percentage >= 80 ? "#3a6a0e" : r.percentage >= 60 ? "#7a5200" : "#e63b17" }}>
                        {r.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizResults.length === 0 && (
              <div style={{ background: "#fff", border: "1px dashed #eceae2", borderRadius: 4, padding: "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", lineHeight: 1.7 }}>
                  No quizzes taken yet. Complete a topic and test your knowledge.
                </div>
                <Link href="/quiz/q1" style={{
                  display: "inline-block", marginTop: 12,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                  padding: "8px 16px", background: "#0e0e12", borderRadius: 3,
                  color: "#f6f4ef", textDecoration: "none",
                }}>
                  Take First Quiz →
                </Link>
              </div>
            )}

            {/* Notifications from subscribed instructors */}
            {notifications.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", display: "flex", alignItems: "center", gap: 8 }}>
                    Instructor Updates
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span style={{ background: "#e63b17", color: "#fff", borderRadius: 999, fontSize: 9, padding: "1px 5px" }}>
                        {notifications.filter(n => !n.read).length} new
                      </span>
                    )}
                  </div>
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={async () => {
                        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }}
                      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {notifications.slice(0, 5).map((n) => {
                    const typeIcon = n.type === "quiz" ? "📝" : n.type === "assignment" ? "📋" : "🎬";
                    return (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.read) {
                            await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: n.id }) });
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                          }
                        }}
                        style={{
                          padding: "10px 12px", borderRadius: 3, cursor: "pointer",
                          background: n.read ? "#f6f4ef" : "rgba(23,16,230,0.04)",
                          border: `1px solid ${n.read ? "#eceae2" : "rgba(23,16,230,0.15)"}`,
                          display: "flex", alignItems: "flex-start", gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{typeIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#0e0e12", lineHeight: 1.4, marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>
                            {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1710E6", flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    );
                  })}
                </div>
                <Link href="/instructors" style={{
                  display: "block", marginTop: 12, textAlign: "center",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                  padding: "8px", border: "1px solid #eceae2", borderRadius: 3,
                  color: "#6b6458", textDecoration: "none",
                }}>
                  Manage subscriptions →
                </Link>
              </div>
            )}

            {notifications.length === 0 && (
              <div style={{ background: "#fff", border: "1px dashed #eceae2", borderRadius: 4, padding: "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", lineHeight: 1.7 }}>
                  No notifications yet. Subscribe to instructors to get their updates.
                </div>
                <Link href="/instructors" style={{
                  display: "inline-block", marginTop: 12,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                  padding: "8px 16px", background: "#0e0e12", borderRadius: 3,
                  color: "#f6f4ef", textDecoration: "none",
                }}>
                  Browse Instructors →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
