import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPC AI Assistant",
  description: "AI-powered assistant for GPC with advanced capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00ff00',
          colorBackground: '#191919',
          colorInputBackground: '#1F1F1F',
          colorInputText: '#EAEAEA',
          colorText: '#EAEAEA',
          colorTextSecondary: '#B3B3B3',
          colorTextOnPrimaryBackground: '#191919',
          colorDanger: '#ff4444',
          colorSuccess: '#00ff00',
          colorWarning: '#ffaa00',
          borderRadius: '0.5rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          colorAlphaShade: '#191919',
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
