import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getToken } from '@/lib/auth-server'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  description: '账芽 · 慢慢记，慢慢长',
  icons: {
    icon: '/site-icon.png',
  },
  title: '账芽',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = await getToken()

  return (
    <html lang='zh-CN'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider initialToken={token ?? null}>
          <TooltipProvider>{children}</TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
