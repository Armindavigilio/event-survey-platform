// src/app/layout.tsx
// Composes the shared page shell, fonts, and route content.
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { SiteFooter } from "@/shared/ui/SiteFooter/SiteFooter";
import { SiteHeader } from "@/shared/ui/SiteHeader/SiteHeader";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const satoshi = localFont({
  src: "../styles/fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Deja tu huella | Event Survey Platform",
  description: "Deja tu huella. Arte urbano para transformar tu entorno.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader name="Event Survey Platform" />
        {children}
        <SiteFooter name="Event Survey Platform" year={new Date().getFullYear()} />
      </body>
    </html>
  );
}
