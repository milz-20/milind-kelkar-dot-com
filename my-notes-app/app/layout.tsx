import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/ui/SessionProvider";

export const metadata: Metadata = {
  title: "My Brain",
  description: "Personal knowledge system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}