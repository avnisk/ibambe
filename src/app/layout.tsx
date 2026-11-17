import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoltGuard — Cyber-Physical Digital Twin",
  description:
    "Physics-informed flow conservation, side-channel current verification, and automated honeypot deception for industrial manufacturing systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
