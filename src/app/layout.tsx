import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CashFlow Pro - Smart Financial Analytics",
  description: "Transform your bank data into actionable insights with our modern cash flow analytics platform",
  keywords: ["cash flow", "financial analytics", "bank data", "business intelligence"],
  authors: [{ name: "CashFlow Pro Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <HeroUIProvider>
            <div className="min-h-screen bg-background text-foreground">
              {children}
            </div>
          </HeroUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}