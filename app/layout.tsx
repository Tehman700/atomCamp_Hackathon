import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AtomCamp LMS — Smart Adaptive Learning",
  description: "Personalised learning powered by AI. Built for AtomCamp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#f6f4ef", color: "#0e0e12" }}>
        {children}
      </body>
    </html>
  );
}
