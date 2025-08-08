import '../styles/globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Siluet',
  description: 'Préparez vos tenues avec style',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      {/* autorise le scroll + réserve de la place pour la nav */}
      <body className="min-h-screen overflow-y-auto bg-neutral-100 pb-20">
        {children}
        <div className="fixed bottom-0 left-0 w-full z-50">
          <Navbar />
        </div>
      </body>
    </html>
  )
}