"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/client";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  subscriberCount: number;
  subscribed: boolean;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setUsername(p?.full_name ?? "");
      }
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      setInstructors(data.instructors ?? []);
      setLoading(false);
    })();
  }, []);

  const toggle = async (inst: Instructor) => {
    setActionId(inst.id);
    const method = inst.subscribed ? "DELETE" : "POST";
    await fetch("/api/subscriptions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructorId: inst.id }),
    });
    setInstructors((prev) =>
      prev.map((i) => i.id === inst.id
        ? { ...i, subscribed: !i.subscribed, subscriberCount: i.subscriberCount + (i.subscribed ? -1 : 1) }
        : i
      )
    );
    setActionId(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Instructors" statusColor="blue" username={username} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "88px 28px 60px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
              <Link href="/dashboard" style={{ color: "#6b6458", textDecoration: "none" }}>Dashboard</Link>
              {" "}›{" "}Browse Instructors
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Instructors<span style={{ color: "#1710E6" }}>.</span>
            </h1>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              Subscribe to instructors — get notified when they publish quizzes, assignments, or videos.
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #1710E6", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>Loading instructors...</div>
          </div>
        )}

        {!loading && instructors.length === 0 && (
          <div style={{
            padding: "60px 40px", textAlign: "center",
            border: "1px dashed #eceae2", borderRadius: 4,
          }}>
            <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 36, color: "#eceae2", marginBottom: 12 }}>—</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              No approved instructors yet. Check back soon.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {instructors.map((inst) => (
            <div
              key={inst.id}
              style={{
                background: "#fff",
                border: `1px solid ${inst.subscribed ? "#1710E6" : "#0e0e12"}`,
                borderRadius: 4, padding: "24px 28px",
                display: "flex", alignItems: "center", gap: 20,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: inst.subscribed ? "#1710E6" : "#0e0e12",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 600,
                color: "#f6f4ef",
              }}>
                {inst.full_name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, letterSpacing: "-0.01em", marginBottom: 2 }}>
                  {inst.full_name}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                  {inst.email}
                </div>
              </div>

              {/* Subscriber count */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 28, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {inst.subscriberCount}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6458", marginTop: 2 }}>
                  students
                </div>
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => toggle(inst)}
                disabled={actionId === inst.id}
                style={{
                  flexShrink: 0,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                  padding: "10px 20px", borderRadius: 4,
                  background: inst.subscribed ? "transparent" : "#1710E6",
                  color: inst.subscribed ? "#6b6458" : "#f6f4ef",
                  border: inst.subscribed ? "1px solid #eceae2" : "none",
                  cursor: actionId === inst.id ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: actionId === inst.id ? 0.6 : 1,
                  transition: "background 150ms, color 150ms",
                }}
              >
                {actionId === inst.id ? (
                  <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid currentColor", borderTop: "1.5px solid transparent", animation: "spin 0.8s linear infinite" }} />
                ) : inst.subscribed ? "✓ Subscribed" : "Subscribe →"}
              </button>
            </div>
          ))}
        </div>

        {!loading && instructors.length > 0 && (
          <div style={{ marginTop: 24, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", textAlign: "center" }}>
            Subscribed instructors' content appears in your notifications on the dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
