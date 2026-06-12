import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Merriweather } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";
import SWRProvider from "@/components/SWRProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArtPriv Admin Portal",
  description: "Admin dashboard for managing banks, donors, and subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${merriweather.variable} antialiased`}
      >
        <SWRProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </SWRProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
