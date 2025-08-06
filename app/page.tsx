'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="bg-[#5D4D3D] min-h-screen text-brown-900">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center text-center">
        <Image
          src="/images/tissus_froisses.png"
          alt="Hero"
          fill
          className="object-cover z-0"
        />
        <div className="z-10 relative text-white">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 drop-shadow-md">
            Préparez vos tenues<br />tout simplement
          </h1>
          <div className="flex gap-4 justify-center">
            <Link href="/create" className="bg-[#5D4D3D] text-white px-6 py-2 rounded shadow">
              Créer une tenue
            </Link>
            <Link href="/dressing" className="bg-transparent border border-white px-6 py-2 rounded text-white">
              Voir le dressing
            </Link>
          </div>
        </div>
      </section>

      {/* Tenues Preview */}
      <section className="py-12 px-6 bg-[#8A7C6E]">
        <h2 className="text-2xl font-bold mb-6 text-white">Mes dernières tenues</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full h-48 bg-[#C9BDB1] rounded" />
          ))}
        </div>
      </section>

      {/* Dressing Preview */}
      <section className="py-12 px-6 bg-[#5D4D3D]">
        <h2 className="text-2xl font-bold mb-6 text-white">Aperçu de mon dressing</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-60 h-60 bg-[#C9BDB1] rounded-full mx-auto" />
          ))}
        </div>
      </section>

      
    </main>
  )
}