import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vault.Notes - Premium Study Notes",
  description: "South African study notes marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

