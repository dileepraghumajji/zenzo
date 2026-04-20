import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@zenzo/ui";

// Variable mode: exposes --font-inter for Tailwind's font-sans
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.zenzo.in";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Zenzo — Club Management Made Simple",
    template: "%s | Zenzo",
  },
  description:
    "Zenzo helps gyms, martial arts academies, dance studios, and yoga centres manage members, batches, attendance, and payments — all in one place.",
  keywords: [
    "gym management software",
    "martial arts club management",
    "dance studio software",
    "yoga studio management",
    "attendance tracking",
    "membership management India",
  ],
  authors: [{ name: "Zenzo" }],
  creator: "Zenzo",
  publisher: "Zenzo",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Zenzo",
    title: "Zenzo — Club Management Made Simple",
    description:
      "Manage members, batches, attendance, and payments for your gym or studio.",
  },
  twitter: {
    card: "summary",
    title: "Zenzo — Club Management Made Simple",
    description:
      "Manage members, batches, attendance, and payments for your gym or studio.",
    creator: "@zenzo_in",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes sets class="dark" client-side —
    // this prevents the hydration mismatch warning for that attribute only.
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#C84A08" />
        <meta name="color-scheme" content="light dark" />
        {/* Service worker registration — enables offline attendance */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
