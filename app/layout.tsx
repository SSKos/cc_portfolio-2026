import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio CMS",
  description: "Self-hosted portfolio with admin panel",
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
          <Header />
          {/* Спейсер под фиксированным хедером */}
          <div style={{ height: 'var(--header-height)' }} aria-hidden />
          {children}
        </Providers>
      </body>
    </html>
  );
}
