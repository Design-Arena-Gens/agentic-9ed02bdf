import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LTC Cloud Mining Platform",
  description: "Manage Litecoin cloud mining with automated earnings and admin control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}
      >
        <Providers>
          <div className="min-h-screen">
            <Navbar />
            <main className="mx-auto min-h-[calc(100vh-80px)] w-full max-w-6xl px-4 py-10">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
