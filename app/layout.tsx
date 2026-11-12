import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Alpine · স্টাফ",
  description: "Alpine Restaurant — ওয়েটার ও কিচেনের ওয়েব অ্যাপ",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/alpine-logo.png", apple: "/alpine-logo.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alpine",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14141f",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
