import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Variable mode: exposes --font-inter for Tailwind's font-sans
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenzo",
  description: "Membership management for recurring-attendance businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
