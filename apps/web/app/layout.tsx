import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sundown | expiry audit",
  description: "Scan a public GitHub repo for deprecations and expiry dates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}