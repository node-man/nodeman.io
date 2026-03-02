import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
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

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="antialiased">
        {children}
        {GA_MEASUREMENT_ID ? <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} /> : null}
      </body>
    </html>
  );
}
