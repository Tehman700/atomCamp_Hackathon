"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";

const ROLES = [
  { value: "student", label: "Student", tag: "/ learner", desc: "Personalized paths, AI tutor, adaptive quizzes" },
  { value: "teacher", label: "Instructor", tag: "/ educator", desc: "Class insights, quiz generator, at-risk alerts" },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push(role === "teacher" ? "/pending-approval" : "/onboarding");
      router.refresh();
    }, 1200);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 64, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Welcome<span style={{ color: "#1710E6", fontStyle: "italic" }}> aboard</span><span style={{ color: "#1710E6" }}>.</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458", letterSpacing: "0.1em" }}>
            Redirecting to {role === "teacher" ? "approval queue" : "onboarding"}...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Sign Up" statusColor="lime" />

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 20px",
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b6458", marginBottom: 12 }}>
              AtomCamp LMS
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em" }}>
              Join the platform<span style={{ color: "#1710E6" }}>.</span>
            </h1>
          </div>

          {/* Card */}
          <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 6, padding: "32px 28px" }}>
            {error && (
              <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(230,59,23,0.08)", border: "1px solid rgba(230,59,23,0.3)", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e63b17" }}>
                {error}
              </div>
            )}

            {/* Role selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 10 }}>
                I am a
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 4,
                      border: `1.5px solid ${role === r.value ? "#1710E6" : "#eceae2"}`,
                      background: role === r.value ? "rgba(23,16,230,0.04)" : "#f6f4ef",
                      cursor: "pointer",
                      transition: "border-color 150ms, background 150ms",
                    }}
                  >
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 500, color: "#0e0e12", marginBottom: 2 }}>
                      {r.label}{" "}
                      <span style={{ color: "#6b6458", fontWeight: 400 }}>{r.tag}</span>
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b6458", lineHeight: 1.5 }}>
                      {r.desc}
                    </div>
                    {role === r.value && (
                      <div style={{ marginTop: 8, width: 20, height: 2, background: "#1710E6", borderRadius: 1 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSignup}>
              {[
                { label: "Full Name", type: "text", value: fullName, set: setFullName, placeholder: "Your full name" },
                { label: "Email", type: "email", value: email, set: setEmail, placeholder: "you@example.com" },
                { label: "Password", type: "password", value: password, set: setPassword, placeholder: "Min 8 characters" },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type} value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    required
                    minLength={f.type === "password" ? 8 : undefined}
                    placeholder={f.placeholder}
                    className="input"
                  />
                </div>
              ))}

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", marginTop: 8,
                  background: loading ? "#eceae2" : "#1710E6",
                  color: loading ? "#6b6458" : "#f6f4ef",
                  border: "none", borderRadius: 4, padding: "13px 20px",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eceae2", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#1710E6", textDecoration: "none", borderBottom: "1px solid #1710E6" }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
