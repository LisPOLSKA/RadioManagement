import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/Providers/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AuthorizationProvider from "@/Providers/AuthorizationProvider";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import LanguageSelector from "@/components/LanguageSelector";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radio Management App",
  description: "YoloSevices solution for managing radio stations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexClientProvider>
        <html suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NextIntlClientProvider>
                <AuthorizationProvider>
                  <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="max-w-full overflow-auto">
                      <header className="flex h-14 items-center gap-2 border-b px-4 justify-between">
                        <SidebarTrigger className="md:hidden" />
                        <LanguageSelector />
                      </header>

                      <div>
                        <Toaster />
                        {children}
                      </div>
                    </SidebarInset>
                  </SidebarProvider>
                </AuthorizationProvider>
              </NextIntlClientProvider>
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ConvexAuthNextjsServerProvider >
  );
}
