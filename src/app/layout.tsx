import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knights Rolden — Chess Club",
  description:
    "Official website of the kinghts rolden chess.com club. Meet the players, watch club matches, replay recent games move-by-move, and join the Golden Knights.",
  keywords: [
    "chess",
    "chess.com club",
    "Knights Rolden",
    "kinghts rolden",
    "chess club",
    "live chess",
    "game replay",
  ],
  openGraph: {
    title: "Knights Rolden — Chess Club",
    description:
      "Players directory, live club matches and a game replay theater for the kinghts rolden chess.com club.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knights Rolden — Chess Club",
    description:
      "Players directory, live club matches and a game replay theater for the kinghts rolden chess.com club.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
