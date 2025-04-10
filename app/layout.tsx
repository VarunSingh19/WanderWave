import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/components/auth-provider"
import Header from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "Plan your trips with friends and manage expenses",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <Header />
            <main className="min-h-screen pt-16">{children}</main>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'