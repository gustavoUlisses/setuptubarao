import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-dm",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SetupTubarão — Configure seu ambiente de dev em minutos",
  description:
    "O setup completo que devs brasileiros precisam. Scripts, configs e ferramentas prontas. Uma vez, pra sempre.",
  openGraph: {
    title: "SetupTubarão — Configure seu ambiente de dev em minutos",
    description: "O setup completo que devs brasileiros precisam.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
