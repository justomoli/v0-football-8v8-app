import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppShell } from '@/components/app-shell'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: '--font-jakarta',
  display: 'swap',
})

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: '--font-syne',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://v0-football-8v8-app.vercel.app'),
  title: 'Fulbito SB5 - Jueves 20hs',
  description:
    'Resultados, estadísticas, goleadores, MVPs e historial del fulbito de los jueves entre los pibes.',

  generator: 'v0.app',

  openGraph: {
    title: 'Fulbito SB5 - Jueves 20hs',
    description:
      'Resultados, estadísticas, goleadores, MVPs e historial del fulbito de los jueves entre los pibes.',
    url: 'https://v0-football-8v8-app.vercel.app',
    siteName: 'Fulbito SB5',
    images: [
      {
        url: '/fotolink.jpeg',
        alt: 'Fulbito SB5',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Fulbito SB5 - Jueves 20hs',
    description:
      'Donde se guarda la magia del fulbito de los jueves entre los pibes, resultados, mvp, puntajes, all in perris.',
    images: ['/fotolink.jpeg'],
  },

  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#080d18',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark bg-background">
      <body
        className={`${plusJakarta.variable} ${syne.variable} ${jetBrainsMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}
      >
        <AppShell>{children}</AppShell>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
