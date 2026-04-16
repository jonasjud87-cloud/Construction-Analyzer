import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KI Analyse Plattform",
  description: "Automatische Prüfung von Bauplänen gegen Normen und Vorschriften",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
