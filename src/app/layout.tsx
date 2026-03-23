import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Festival Mainstage Builder | Design Your Dream Festival",
  description:
    "Create your ultimate music festival - take a lineup quiz, design a 3D mainstage with lasers and pyrotechnics, find a real-world venue, and generate an AI-powered festival poster.",
  keywords: [
    "festival",
    "music",
    "mainstage",
    "3D",
    "WebGL",
    "lineup",
    "poster generator",
  ],
  openGraph: {
    title: "Festival Mainstage Builder | Design Your Dream Festival",
    description:
      "Create your ultimate music festival - take a lineup quiz, design a 3D mainstage with lasers and pyrotechnics, find a real-world venue, and generate an AI-powered festival poster.",
    type: "website",
    siteName: "Festival Mainstage Builder",
  },
  twitter: {
    card: "summary_large_image",
    title: "Festival Mainstage Builder | Design Your Dream Festival",
    description:
      "Create your ultimate music festival - take a lineup quiz, design a 3D mainstage with lasers and pyrotechnics, find a real-world venue, and generate an AI-powered festival poster.",
  },
  themeColor: "#7c3aed",
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#09090b] text-zinc-200">{children}</body>
    </html>
  );
}
