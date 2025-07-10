import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { Montserrat, Open_Sans } from "next/font/google";

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-montserrat',
});

const openSans = Open_Sans({
    subsets: ['latin'],
    weight: ['400', '600'],
    variable: '--font-open-sans',
});

export const metadata: Metadata = {
  title: "PollPulse - Your Vote, Your Voice",
  description: "A modern, secure, and intuitive voting application created for you.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased min-h-screen bg-background", montserrat.variable, openSans.variable)}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
