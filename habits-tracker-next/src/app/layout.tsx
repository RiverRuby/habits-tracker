import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habits Tracker",
  description: "Track your habits every day",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-screen-xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
