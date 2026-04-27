import type { Metadata } from "next";
import { DM_Serif_Display, DM_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";

const dmSerif = DM_Serif_Display({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-serif"
});

const dmMono = DM_Mono({ 
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "FairLens - AI Fairness Auditing Platform",
  description: "Enterprise-grade AI fairness auditing platform for detecting and mitigating bias in machine learning models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${dmMono.variable} font-sans`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}