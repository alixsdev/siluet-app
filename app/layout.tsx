

import '../styles/globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Siluet',
  description: 'Préparez vos tenues avec style',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-100">
        <Navbar />
        {children}
      </body>
    </html>
  )
}