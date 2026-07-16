import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FleetCargex Driver',
  description: 'FleetCargex Driver Partner Portal — manage rides, earnings, and availability.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
