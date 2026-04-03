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

const siteUrl = process.env.NEXTAUTH_URL ?? "https://kk-about.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Konstantin Kuznichenko | UX Designer",
    template: "%s | Konstantin Kuznichenko",
  },
  description:
    "6+ years in fintech: banking products, complex user flows, and design systems.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "kk-about.me",
    title: "Konstantin Kuznichenko | UX Designer",
    description:
      "6+ years in fintech: banking products, complex user flows, and design systems.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Превью портфолио Константина Кузниченко",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konstantin Kuznichenko | UX Designer",
    description:
      "6+ years in fintech: banking products, complex user flows, and design systems.",
    images: ["/opengraph-image"],
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
