import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sundown — expiry audit",
  description: "Paste a public GitHub repo. See what dies when.",
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