"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).single();
      const role = profile?.role ?? "student";
      if (role === "teacher") {
        const teacherStatus = profile?.status ?? "pending";
        if (teacherStatus === "approved") {
          router.push("/teacher");
        } else {
          router.push("/pending-approval");
        }
      } else if (role === "admin") {
        router.push("/teacher");
      } else {
        // Check if this student has already completed onboarding
        const { data: pathRow } = await supabase
          .from("learning_paths")
          .select("user_id")
          .eq("user_id", data.user.id)
          .single();
        router.push(pathRow ? "/dashboard" : "/onboarding");
      }
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <TopBar status="Sign In" statusColor="blue" />

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "80px 20px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b6458", marginBottom: 12 }}>
              AtomCamp LMS
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em" }}>
              Welcome back<span style={{ color: "#1710E6" }}>.</span>
            </h1>
          </div>

          {/* Card */}
          <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 6, padding: "32px 28px" }}>
            {error && (
              <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(230,59,23,0.08)", border: "1px solid rgba(230,59,23,0.3)", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e63b17" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {[
                { label: "Email", type: "email", value: email, set: setEmail, placeholder: "you@example.com" },
                { label: "Password", type: "password", value: password, set: setPassword, placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6458", marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type} value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    required placeholder={f.placeholder}
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
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eceae2", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              No account?{" "}
              <Link href="/signup" style={{ color: "#1710E6", textDecoration: "none", borderBottom: "1px solid #1710E6" }}>
                Sign up free
              </Link>
            </div>
          </div>

          {/* Demo hint */}
          <div style={{ marginTop: 12, padding: "10px 14px", border: "1px solid #eceae2", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
            <span style={{ color: "#1710E6" }}>Demo:</span> Create any account — choose Student or Instructor role on signup.
          </div>
        </div>
      </div>
    </div>
  );
}
