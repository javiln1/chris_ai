import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
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
        baseTheme: dark,
        variables: {
          // Brand colors - Green accent theme
          colorPrimary: '#00ff00',
          colorSuccess: '#00ff00',

          // Dark backgrounds matching your app
          colorBackground: '#191919',
          colorInputBackground: '#1F1F1F',

          // Text colors
          colorText: '#EAEAEA',
          colorTextSecondary: '#B3B3B3',
          colorTextOnPrimaryBackground: '#191919', // Dark text on green buttons

          // Alerts
          colorDanger: '#ff4444',
          colorWarning: '#ffaa00',

          // Styling
          borderRadius: '0.5rem',
          fontFamily: 'Inter, system-ui, sans-serif',
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
