import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PublicHeader } from "@/components/layout/PublicHeader";

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const rawUrl = process.env.NEXTAUTH_URL ?? "https://kk-about.me";
// Guarantee https — NEXTAUTH_URL on the server may be set to http
const siteUrl = rawUrl.replace(/^http:\/\//, "https://");
const siteDescription =
  "UX designer with 6+ years in fintech, focused on banking products, complex user flows, and scalable design systems.";
const ogImageUrl = `${siteUrl}/og-cover.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Konstantin Kuznichenko | UX Designer",
    template: "%s | Konstantin Kuznichenko",
  },
  description: siteDescription,
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "kk-about.me",
    title: "Konstantin Kuznichenko | UX Designer",
    description: siteDescription,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Konstantin Kuznichenko portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konstantin Kuznichenko | UX Designer",
    description: siteDescription,
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={nunitoSans.className}>
        <Providers>
          <PublicHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
