import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NOCTEA Admin",
  description: "Interface d'administration NOCTEA — tableau de bord parental",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-[#0f1621] text-[#e5e7eb]`}>
        {children}
      </body>
    </html>
  );
}
