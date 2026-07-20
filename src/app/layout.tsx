import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookFlow — Booking, payments & clients for service businesses",
  description:
    "BookFlow is the booking, payments, and client-management platform for barbers, salons, cleaners, and detailers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
