import type { Metadata } from "next";
import { DM_Mono, Inter, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PointerField } from "@/components/motion/PointerField";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display face for the SENTRIX wordmark (per the front-page handoff).
const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Forensic metadata / HUD / data traces.
const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentrix — Bitcoin Intelligence",
  description:
    "A premium blockchain forensics and risk intelligence command center.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <PointerField />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
