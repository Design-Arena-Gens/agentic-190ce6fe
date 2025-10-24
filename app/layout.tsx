import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Group Agent",
  description: "Autonomous WhatsApp agent for managing group conversations"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
