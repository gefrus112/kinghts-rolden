import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinghts Rolden — Chess Club",
  description:
    "Official hub for the Kinghts Rolden chess club on Chess.com. Browse club players, watch live games, and replay recent matches move by move. Join the club and follow every game.",
  keywords: ["Kinghts Rolden", "chess club", "chess.com", "live chess", "chess games"],
  authors: [{ name: "Kinghts Rolden Club" }],
  openGraph: {
    title: "Kinghts Rolden — Chess Club",
    description:
      "Browse club players, watch live games, and replay recent matches move by move.",
    siteName: "Kinghts Rolden",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#14532d",
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
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
