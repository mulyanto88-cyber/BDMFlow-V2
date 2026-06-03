import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BDMFlow — Bandarmologi & Data-Driven Market Flow",
  description: "Institutional-grade stock analytics platform for IDX market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
