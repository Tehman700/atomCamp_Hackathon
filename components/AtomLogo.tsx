"use client";

interface AtomLogoProps {
  size?: number;
  animated?: boolean;
}

export default function AtomLogo({ size = 160, animated = true }: AtomLogoProps) {
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* Orbit rings */}
      {[
        { r: size * 0.25, delay: "0s", dur: "4s", color: "#06B6D4", reverse: false },
        { r: size * 0.375, delay: "0.3s", dur: "7s", color: "#A78BFA", reverse: true },
        { r: size * 0.48, delay: "0.6s", dur: "10s", color: "#F59E0B", reverse: false },
      ].map((orbit, i) => (
        <svg
          key={i}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.25 }}
          viewBox={`0 0 ${size} ${size}`}
        >
          <ellipse
            cx={size / 2}
            cy={size / 2}
            rx={orbit.r}
            ry={orbit.r * 0.35}
            fill="none"
            stroke={orbit.color}
            strokeWidth="1"
            transform={`rotate(${i * 60}, ${size / 2}, ${size / 2})`}
          />
        </svg>
      ))}

      {/* Nucleus */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #A78BFA, #7C3AED)",
          boxShadow: "0 0 20px rgba(124,58,237,0.8), 0 0 40px rgba(124,58,237,0.4)",
          zIndex: 10,
        }}
      />

      {/* Electrons */}
      {animated && (
        <>
          <div className="electron-1" />
          <div className="electron-2" />
          <div className="electron-3" />
        </>
      )}
    </div>
  );
}

export function AtomIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="3.5" fill="#7C3AED" />
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke="#7C3AED" strokeWidth="1.5" strokeOpacity="0.7" />
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.5"
        transform="rotate(60, 16, 16)" />
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity="0.5"
        transform="rotate(120, 16, 16)" />
      <circle cx="29" cy="16" r="2" fill="#06B6D4" />
      <circle cx="9.5" cy="6.7" r="2" fill="#A78BFA" />
      <circle cx="9.5" cy="25.3" r="2" fill="#F59E0B" />
    </svg>
  );
}
