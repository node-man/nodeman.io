import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodeman",
  description: "showcasing 17+ years of software engineering evolution",
  keywords: ["developer", "portfolio", "CEO", "CTO", "professor", "web development"],
  authors: [{ name: "Nodeman" }],
  openGraph: {
    title: "Nodeman",
    description: "showcasing 17+ years of software engineering evolution",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
