"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "loading">("loading");
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, status, role")
      .eq("id", user.id)
      .single();

    if (!profile) { router.push("/login"); return; }
    if (profile.role !== "teacher") { router.push("/dashboard"); return; }

    setUserName(profile.full_name ?? "");
    setStatus(profile.status ?? "pending");

    if (profile.status === "approved") {
      setTimeout(() => router.push("/teacher"), 1500);
    }
    setChecking(false);
  };

  useEffect(() => { checkStatus(); }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #1710E6", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Instructor Portal" statusColor="blue" username={userName} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

          {status === "approved" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 24 }}>✓</div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 12 }}>
                You're approved<span style={{ color: "#8DC651" }}>.</span>
              </h1>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#6b6458", lineHeight: 1.65 }}>
                Redirecting to your instructor dashboard...
              </p>
              <div style={{ marginTop: 24, width: 32, height: 32, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #8DC651", animation: "spin 0.9s linear infinite", margin: "24px auto 0" }} />
            </>
          )}

          {status === "rejected" && (
            <>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(230,59,23,0.08)", border: "1px solid rgba(230,59,23,0.3)",
                fontSize: 28, marginBottom: 24,
              }}>✗</div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 12 }}>
                Application declined<span style={{ color: "#e63b17" }}>.</span>
              </h1>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#6b6458", lineHeight: 1.65, marginBottom: 32 }}>
                Your instructor application was not approved at this time. Please contact AtomCamp support if you believe this is an error.
              </p>
              <div style={{
                padding: "16px 20px", background: "rgba(230,59,23,0.06)",
                border: "1px solid rgba(230,59,23,0.2)", borderRadius: 4,
                fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e63b17",
                marginBottom: 24, textAlign: "left",
              }}>
                support@atomcamp.com
              </div>
              <button onClick={handleSignOut} style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 20px",
                border: "1px solid #eceae2", borderRadius: 4, background: "transparent",
                color: "#6b6458", cursor: "pointer",
              }}>
                Sign out
              </button>
            </>
          )}

          {status === "pending" && (
            <>
              {/* Animated waiting indicator */}
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 32px" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid #eceae2",
                }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid transparent", borderTop: "2px solid #1710E6",
                  animation: "spin 1.4s linear infinite",
                }} />
                <div style={{
                  position: "absolute", inset: 8, borderRadius: "50%",
                  border: "2px solid transparent", borderTop: "2px solid rgba(23,16,230,0.25)",
                  animation: "spin 2s linear infinite reverse",
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "JetBrains Mono, monospace",
                  fontSize: 20,
                }}>⏳</div>
              </div>

              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 16 }}>
                Application Under Review
              </div>

              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 16 }}>
                Waiting for admin approval<span style={{ color: "#1710E6" }}>.</span>
              </h1>

              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#4a453d", lineHeight: 1.65, maxWidth: 380, margin: "0 auto 40px" }}>
                Your instructor account is pending review. The AtomCamp admin team will approve or reject your application shortly.
              </p>

              {/* Status card */}
              <div style={{
                background: "#fff", border: "1px solid #0e0e12", borderRadius: 6,
                padding: "24px 28px", marginBottom: 20, textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: "#1710E6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#f6f4ef", fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#0e0e12", fontWeight: 500 }}>
                      {userName}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Instructor · Pending
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto", padding: "4px 10px", borderRadius: 2,
                    background: "rgba(23,16,230,0.08)", border: "1px solid rgba(23,16,230,0.25)",
                    fontFamily: "JetBrains Mono, monospace", fontSize: 10,
                    color: "#1710E6", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    pending
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { step: "01", label: "Account created", done: true },
                    { step: "02", label: "Admin review", done: false },
                    { step: "03", label: "Access granted", done: false },
                  ].map((s) => (
                    <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: s.done ? "#8DC651" : "#eceae2",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: s.done ? "#fff" : "#6b6458", fontWeight: 600,
                        fontFamily: "JetBrains Mono, monospace",
                      }}>
                        {s.done ? "✓" : s.step}
                      </div>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                        color: s.done ? "#0e0e12" : "#6b6458",
                      }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={checkStatus}
                  disabled={checking}
                  style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 12,
                    padding: "10px 20px", borderRadius: 4,
                    background: checking ? "#eceae2" : "#1710E6",
                    color: checking ? "#6b6458" : "#f6f4ef",
                    border: "none", cursor: checking ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {checking ? (
                    <><div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #6b6458", borderTop: "1.5px solid #4a453d", animation: "spin 0.8s linear infinite" }} />Checking...</>
                  ) : "Check Status →"}
                </button>
                <button onClick={handleSignOut} style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 12, padding: "10px 20px",
                  border: "1px solid #eceae2", borderRadius: 4, background: "transparent",
                  color: "#6b6458", cursor: "pointer",
                }}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
