import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Agent View — a live browser the agent controls',
  description:
    'Watch an AI SDK agent drive a real cloud browser on Kernel, with its reasoning, actions, and every Playwright and MCP tool call broken out around the live view. Runs on your own Kernel and AI Gateway via Vercel Connect.',
  generator: 'v0.app',
  applicationName: 'Agent View',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0d0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${plexMono.variable} bg-background`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
