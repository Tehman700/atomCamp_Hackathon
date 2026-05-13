"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";

interface Resource {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  order: number;
  resources?: Resource[];
}

interface PathData {
  topics: Topic[];
  personalizedMessage: string;
  estimatedCompletion: string;
  focusArea: string;
  weeklyGoal: string;
}

const SOURCE_ICON: Record<string, string> = {
  "youtube.com": "▶",
  "youtu.be": "▶",
  "coursera.org": "🎓",
  "edx.org": "🎓",
  "udemy.com": "🎓",
  "freecodecamp.org": "💻",
  "w3schools.com": "📖",
  "geeksforgeeks.org": "💡",
  "medium.com": "✍",
  "towardsdatascience.com": "📊",
  "kaggle.com": "📊",
  "github.com": "⌥",
  "docs.python.org": "🐍",
  "developer.mozilla.org": "🌐",
};

function sourceIcon(source: string) {
  return SOURCE_ICON[source] ?? "🔗";
}

export default function LearningPathPage() {
  const router = useRouter();
  const [pathData, setPathData] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: pathRow } = await supabase
          .from("learning_paths")
          .select("path_data")
          .eq("user_id", user.id)
          .single();

        if (pathRow?.path_data) {
          setPathData(pathRow.path_data as PathData);
          setLoading(false);
          return;
        }
      }

      // Fallback: try localStorage (from onboarding session before auth saved)
      const saved = localStorage.getItem("learningPath");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle both old format (recommendedPath[]) and new format (topics[])
        if (parsed.topics) {
          setPathData(parsed);
        } else {
          // Old format — show basic fallback
          setPathData({
            topics: [],
            personalizedMessage: parsed.personalizedMessage ?? "Your personalized path is ready.",
            estimatedCompletion: parsed.estimatedCompletion ?? "3 months",
            focusArea: parsed.focusArea ?? "Tech Skills",
            weeklyGoal: parsed.weeklyGoal ?? "3 lessons per week",
          });
        }
      } else {
        router.push("/onboarding");
        return;
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
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>Loading your path...</div>
        </div>
      </div>
    );
  }

  const topics = pathData?.topics ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="My Path" statusColor="blue" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 12 }}>
            Your Personalized Learning Path
          </div>
          <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 16 }}>
            Path to{" "}
            <em style={{ fontStyle: "italic", color: "#1710E6" }}>{pathData?.focusArea ?? "Tech Mastery"}</em>
            <span style={{ color: "#1710E6" }}>.</span>
          </h1>
          {pathData && (
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#4a453d", lineHeight: 1.7, maxWidth: 600 }}>
              {pathData.personalizedMessage}
            </p>
          )}
        </div>

        {/* Meta */}
        {pathData && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            {[
              { label: pathData.estimatedCompletion, sub: "to complete" },
              { label: pathData.weeklyGoal, sub: "weekly target" },
              { label: `${topics.length} topics`, sub: "in your path" },
            ].map((m) => (
              <div key={m.label} style={{ padding: "10px 16px", border: "1px solid #0e0e12", borderRadius: 4, background: "#fff" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500, color: "#0e0e12", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tavily badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: "rgba(141,198,81,0.1)", border: "1px solid rgba(141,198,81,0.4)", borderRadius: 4,
          marginBottom: 32, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#3a6a0e",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8DC651", flexShrink: 0 }} />
          Path generated by AI · Resources sourced live from the web via Tavily Search
        </div>

        {/* Topic list */}
        <div>
          {topics.map((topic, index) => {
            const isCurrent = index === 0;
            const isExpanded = expandedId === topic.id;

            return (
              <div key={topic.id} style={{ marginBottom: 8 }}>
                {index > 0 && <div style={{ width: 1, height: 12, background: "#eceae2", marginLeft: 20, marginBottom: 8 }} />}

                <div style={{
                  background: "#fff",
                  border: `1px solid ${isCurrent ? "#1710E6" : "#0e0e12"}`,
                  borderRadius: 4,
                }}>
                  {/* Topic header — always visible */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : topic.id)}
                    style={{ padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}
                  >
                    {/* Order number */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: isCurrent ? "#1710E6" : "#f6f4ef",
                      border: `1px solid ${isCurrent ? "#1710E6" : "#0e0e12"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 600,
                      color: isCurrent ? "#f6f4ef" : "#0e0e12",
                    }}>
                      {String(topic.order).padStart(2, "0")}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {isCurrent && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#1710E6", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1710E6" }} />
                            Current
                          </div>
                        )}
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>
                          ~{topic.estimatedHours}h
                        </div>
                        {topic.resources && topic.resources.length > 0 && (
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458" }}>
                            · {topic.resources.length} resources
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>
                        {topic.title}
                      </div>
                      <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", lineHeight: 1.6 }}>
                        {topic.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {isCurrent && (
                        <Link href="/lesson/py-l1" onClick={(e) => e.stopPropagation()} style={{
                          fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                          padding: "8px 16px", background: "#1710E6", borderRadius: 3,
                          color: "#f6f4ef", textDecoration: "none",
                        }}>
                          Start →
                        </Link>
                      )}
                      <div style={{ color: "#6b6458", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", fontSize: 12 }}>▾</div>
                    </div>
                  </div>

                  {/* Expanded — real resources from Tavily */}
                  {isExpanded && topic.resources && topic.resources.length > 0 && (
                    <div style={{ borderTop: "1px solid #eceae2", padding: "20px 24px" }}>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 14 }}>
                        Free Resources
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {topic.resources.map((r, ri) => (
                          <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "12px 16px", border: "1px solid #eceae2", borderRadius: 3,
                            background: "#f6f4ef", textDecoration: "none",
                            transition: "border-color 150ms",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1710E6")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eceae2")}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 3, background: "#fff", border: "1px solid #eceae2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                              {sourceIcon(r.source)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#0e0e12", marginBottom: 3, lineHeight: 1.4 }}>
                                {r.title}
                              </div>
                              {r.snippet && (
                                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                                  {r.snippet}
                                </div>
                              )}
                              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#1710E6", marginTop: 4 }}>
                                {r.source}
                              </div>
                            </div>
                            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#1710E6", flexShrink: 0 }}>↗</div>
                          </a>
                        ))}
                      </div>

                      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                        <Link href="/lesson/py-l1" style={{
                          fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                          padding: "9px 16px", background: isCurrent ? "#1710E6" : "#0e0e12", borderRadius: 3,
                          color: "#f6f4ef", textDecoration: "none",
                        }}>
                          {isCurrent ? "Continue Learning" : "Preview Lesson"}
                        </Link>
                        <Link href={`/quiz/${topic.id}`} style={{
                          fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                          padding: "9px 16px", border: "1px solid #0e0e12", borderRadius: 3,
                          color: "#0e0e12", textDecoration: "none",
                        }}>
                          Take Quiz
                        </Link>
                      </div>
                    </div>
                  )}

                  {isExpanded && (!topic.resources || topic.resources.length === 0) && (
                    <div style={{ borderTop: "1px solid #eceae2", padding: "16px 24px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
                      Resources are being fetched — try regenerating your path.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {topics.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #eceae2", borderRadius: 4 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", marginBottom: 16 }}>
                No topics found in your path.
              </div>
              <Link href="/onboarding" style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                padding: "10px 20px", background: "#1710E6", borderRadius: 3,
                color: "#f6f4ef", textDecoration: "none",
              }}>
                Retake Assessment →
              </Link>
            </div>
          )}

          {topics.length > 0 && (
            <div style={{ marginTop: 16, padding: "14px 20px", border: "1px dashed #eceae2", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", textAlign: "center" }}>
              Click any topic to expand its free resources — sourced live from the web.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
