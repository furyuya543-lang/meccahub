import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeccaHub — Meccha Chameleon Community Rankings',
  description:
    'The ultimate community hub for Meccha Chameleon. Submit your best hides, vote on favorites, and compete for weekly rankings.',
  keywords: ['Meccha Chameleon', 'MeccaHub', 'hide ranking', 'community', 'gaming'],
  openGraph: {
    title: 'MeccaHub — Meccha Chameleon Community Rankings',
    description: 'Submit, vote, and rank the best hides in Meccha Chameleon.',
    siteName: 'MeccaHub',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
