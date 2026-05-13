"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TopBarProps {
  mode?: "light" | "dark";
  status?: string;
  statusColor?: "blue" | "lime";
  username?: string;
}

export default function TopBar({
  mode = "light",
  status = "Beta",
  statusColor = "blue",
  username,
}: TopBarProps) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  const isDark = mode === "dark";
  const fg = isDark ? "#f6f4ef" : "#0e0e12";
  const bg = isDark ? "#0e0e12" : "#f6f4ef";
  const pillBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const pillBorder = isDark ? "rgba(246,244,239,0.3)" : "#0e0e12";

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      height: 60,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 12,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: fg,
      background: bg,
      borderBottom: `1px solid ${isDark ? "rgba(246,244,239,0.12)" : "#0e0e12"}`,
    }}>
      {/* Brand */}
      <Link href="/" style={{ color: fg, textDecoration: "none", fontWeight: 500 }}>
        AtomCamp&nbsp;LMS
      </Link>

      {/* Status pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: pillBg, border: `1.5px solid ${pillBorder}`,
        padding: "5px 14px 5px 8px", borderRadius: 999,
        fontSize: 12, color: fg, textTransform: "none", letterSpacing: 0,
      }}>
        <span style={{
          width: 12, height: 12, borderRadius: 999,
          background: statusColor === "lime" ? "#8DC651" : "#1710E6",
          display: "inline-block", flexShrink: 0,
        }} />
        {status}
      </div>

      {/* Clock + user / model indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ color: isDark ? "#8DC651" : "#1710E6", fontVariantNumeric: "tabular-nums" }}>
          {hh}&nbsp;{mm}&nbsp;{ss}
        </span>

        {username ? (
          /* Show logged-in user's name */
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            textTransform: "none", letterSpacing: 0,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "#1710E6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, color: "#f6f4ef", flexShrink: 0,
            }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ color: fg, fontSize: 12 }}>{username}</span>
          </div>
        ) : (
          /* Default: model active indicator */
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: fg, textTransform: "none", letterSpacing: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#8DC651", display: "inline-block" }} />
            Model Active
          </span>
        )}
      </div>
    </div>
  );
}
