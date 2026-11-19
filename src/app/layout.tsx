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
  title: {
    default: "DevPulse | API Monitoring & Observability",
    template: "%s | DevPulse",
  },
  description:
    "Monitor API availability, track response times, and manage service incidents with DevPulse.",
  applicationName: "DevPulse",
  keywords: [
    "API monitoring",
    "Uptime monitoring",
    "Observability",
    "Incident management",
    "Developer tools",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}