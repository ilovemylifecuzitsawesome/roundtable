import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roundtable PA",
  description: "Anonymous, nonbiased civic discourse for Pennsylvania",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-civic-50 text-civic-900`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-civic-200 py-6 text-center text-sm text-civic-500">
              Roundtable PA - Civic discourse, anonymously
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
