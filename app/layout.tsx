import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velvet",
  description: "AI album foundry for cinematic jazz releases."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
