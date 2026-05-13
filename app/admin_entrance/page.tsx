"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/TopBar";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

type AdminView = "login" | "dashboard";

export default function AdminEntrancePage() {
  const [view, setView] = useState<AdminView>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchInstructors = useCallback(async () => {
    setFetchLoading(true);
    const res = await fetch("/api/admin/instructors");
    if (res.status === 401) { setView("login"); setFetchLoading(false); return; }
    const data = await res.json();
    setInstructors(data.instructors ?? []);
    setFetchLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const d = await res.json();
      setLoginError(d.error ?? "Login failed");
      setLoginLoading(false);
      return;
    }
    setLoginLoading(false);
    setView("dashboard");
    fetchInstructors();
  };

  const handleAction = async (userId: string, status: "approved" | "rejected") => {
    setActionLoading(userId + status);
    await fetch("/api/admin/instructors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    setInstructors((prev) =>
      prev.map((i) => i.id === userId ? { ...i, status } : i)
    );
    setActionLoading(null);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setView("login");
    setUsername("");
    setPassword("");
  };

  useEffect(() => {
    // Check if already authed by probing the endpoint
    fetch("/api/admin/instructors").then((res) => {
      if (res.ok) { setView("dashboard"); res.json().then((d) => setInstructors(d.instructors ?? [])); }
    });
  }, []);

  const filtered = filter === "all" ? instructors : instructors.filter((i) => i.status === filter);
  const counts = {
    all: instructors.length,
    pending: instructors.filter((i) => i.status === "pending").length,
    approved: instructors.filter((i) => i.status === "approved").length,
    rejected: instructors.filter((i) => i.status === "rejected").length,
  };

  const statusBadge = (s: Instructor["status"]) => {
    const map = {
      pending: { bg: "rgba(23,16,230,0.08)", border: "rgba(23,16,230,0.25)", color: "#1710E6", label: "pending" },
      approved: { bg: "rgba(141,198,81,0.08)", border: "rgba(141,198,81,0.4)", color: "#3a6a0e", label: "approved" },
      rejected: { bg: "rgba(230,59,23,0.06)", border: "rgba(230,59,23,0.3)", color: "#e63b17", label: "rejected" },
    };
    const m = map[s];
    return (
      <span style={{
        padding: "3px 10px", borderRadius: 2,
        background: m.bg, border: `1px solid ${m.border}`,
        fontFamily: "JetBrains Mono, monospace", fontSize: 10,
        color: m.color, letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        {m.label}
      </span>
    );
  };

  if (view === "login") {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e12", color: "#f6f4ef" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {/* Minimal dark top bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 56,
          borderBottom: "1px solid rgba(246,244,239,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", zIndex: 50,
          background: "#0e0e12",
        }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(246,244,239,0.4)" }}>
            AtomCamp · Admin
          </div>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            padding: "4px 10px", borderRadius: 2,
            border: "1px solid rgba(246,244,239,0.12)",
            color: "rgba(246,244,239,0.4)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            restricted access
          </div>
        </div>

        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(246,244,239,0.35)", marginBottom: 16 }}>
                Admin Entrance
              </div>
              <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", color: "#f6f4ef" }}>
                Restricted<span style={{ color: "#1710E6" }}>.</span>
              </h1>
            </div>

            <div style={{
              background: "rgba(246,244,239,0.04)", border: "1px solid rgba(246,244,239,0.1)",
              borderRadius: 6, padding: "32px 28px",
            }}>
              {loginError && (
                <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(230,59,23,0.12)", border: "1px solid rgba(230,59,23,0.3)", borderRadius: 4, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e63b17" }}>
                  {loginError}
                </div>
              )}
              <form onSubmit={handleLogin}>
                {[
                  { label: "Username", type: "text", value: username, set: setUsername, placeholder: "admin username" },
                  { label: "Password", type: "password", value: password, set: setPassword, placeholder: "••••••••" },
                ].map((f) => (
                  <div key={f.label} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(246,244,239,0.45)", marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      required
                      placeholder={f.placeholder}
                      style={{
                        width: "100%", padding: "10px 12px",
                        background: "rgba(246,244,239,0.06)",
                        border: "1px solid rgba(246,244,239,0.12)",
                        borderRadius: 4, color: "#f6f4ef",
                        fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
                <button type="submit" disabled={loginLoading} style={{
                  width: "100%", marginTop: 8, padding: "12px 20px",
                  background: loginLoading ? "rgba(246,244,239,0.08)" : "#1710E6",
                  color: loginLoading ? "rgba(246,244,239,0.4)" : "#f6f4ef",
                  border: "none", borderRadius: 4,
                  fontFamily: "JetBrains Mono, monospace", fontSize: 13,
                  cursor: loginLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loginLoading ? (
                    <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(246,244,239,0.3)", borderTop: "2px solid rgba(246,244,239,0.7)", animation: "spin 0.8s linear infinite" }} />Authenticating...</>
                  ) : "Enter Admin →"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#0e0e12" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <TopBar status="Admin Dashboard" statusColor="lime" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 28px 60px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b6458", marginBottom: 8 }}>
              Admin · Instructor Management
            </div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 40, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Instructor Applications<span style={{ color: "#1710E6" }}>.</span>
            </h1>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
              Review and approve instructor accounts. Approved accounts get immediate dashboard access.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={fetchInstructors} disabled={fetchLoading} style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "8px 14px",
              border: "1px solid #eceae2", borderRadius: 3, background: "transparent",
              color: "#6b6458", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              {fetchLoading ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid #eceae2", borderTop: "1.5px solid #6b6458", animation: "spin 0.8s linear infinite" }} /> : "↻"}
              Refresh
            </button>
            <button onClick={handleLogout} style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11, padding: "8px 14px",
              border: "1px solid #eceae2", borderRadius: 3, background: "transparent",
              color: "#6b6458", cursor: "pointer",
            }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {(["all", "pending", "approved", "rejected"] as const).map((f) => {
            const colors = {
              all: "#0e0e12",
              pending: "#1710E6",
              approved: "#3a6a0e",
              rejected: "#e63b17",
            };
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "16px 20px", borderRadius: 4, textAlign: "left", cursor: "pointer",
                background: filter === f ? "#fff" : "transparent",
                border: `1px solid ${filter === f ? "#0e0e12" : "#eceae2"}`,
                transition: "border-color 150ms, background 150ms",
              }}>
                <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 32, letterSpacing: "-0.02em", color: colors[f], lineHeight: 1, marginBottom: 4 }}>
                  {counts[f]}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b6458" }}>
                  {f}
                </div>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #0e0e12", borderRadius: 4, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 140px 120px 200px",
            padding: "12px 20px", borderBottom: "1px solid #eceae2",
            background: "#f6f4ef",
          }}>
            {["Name", "Email", "Applied", "Status", "Actions"].map((h) => (
              <div key={h} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b6458" }}>
                {h}
              </div>
            ))}
          </div>

          {fetchLoading && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #eceae2", borderTop: "2px solid #1710E6", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>Loading instructors...</div>
            </div>
          )}

          {!fetchLoading && filtered.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 32, color: "#eceae2", marginBottom: 8 }}>—</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6458" }}>
                No {filter === "all" ? "" : filter} instructors found.
              </div>
            </div>
          )}

          {!fetchLoading && filtered.map((instructor, i) => (
            <div
              key={instructor.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 140px 120px 200px",
                padding: "16px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid #f6f4ef" : "none",
                transition: "background 150ms",
              }}
            >
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", background: "#0e0e12",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#f6f4ef",
                  fontWeight: 600, flexShrink: 0,
                }}>
                  {(instructor.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#0e0e12" }}>
                  {instructor.full_name}
                </span>
              </div>

              {/* Email */}
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#4a453d" }}>
                {instructor.email}
              </div>

              {/* Applied */}
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458" }}>
                {new Date(instructor.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>

              {/* Status */}
              <div>{statusBadge(instructor.status)}</div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {instructor.status !== "approved" && (
                  <button
                    onClick={() => handleAction(instructor.id, "approved")}
                    disabled={actionLoading === instructor.id + "approved"}
                    style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                      padding: "6px 14px", borderRadius: 3,
                      background: "rgba(141,198,81,0.1)", border: "1px solid rgba(141,198,81,0.5)",
                      color: "#3a6a0e", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === instructor.id + "approved" ? (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #3a6a0e", borderTop: "1.5px solid transparent", animation: "spin 0.8s linear infinite" }} />
                    ) : "✓"} Approve
                  </button>
                )}
                {instructor.status !== "rejected" && (
                  <button
                    onClick={() => handleAction(instructor.id, "rejected")}
                    disabled={actionLoading === instructor.id + "rejected"}
                    style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                      padding: "6px 14px", borderRadius: 3,
                      background: "rgba(230,59,23,0.06)", border: "1px solid rgba(230,59,23,0.3)",
                      color: "#e63b17", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === instructor.id + "rejected" ? (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #e63b17", borderTop: "1.5px solid transparent", animation: "spin 0.8s linear infinite" }} />
                    ) : "✗"} Reject
                  </button>
                )}
                {instructor.status !== "pending" && (
                  <button
                    onClick={() => handleAction(instructor.id, instructor.status === "approved" ? "rejected" : "approved")}
                    style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                      padding: "6px 12px", borderRadius: 3,
                      background: "transparent", border: "1px solid #eceae2",
                      color: "#6b6458", cursor: "pointer",
                    }}
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 20, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#6b6458", textAlign: "center" }}>
          Changes take effect immediately — approved instructors can log in right away.
        </div>
      </div>
    </div>
  );
}
