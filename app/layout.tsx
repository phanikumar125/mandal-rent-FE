import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "./_components/language-toggle";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MandalRent — Farm equipment to rent or buy",
  description: "Rent or buy trusted tractors and farm equipment near your village in Andhra Pradesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
