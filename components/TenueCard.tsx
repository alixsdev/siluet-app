// components/TenueCard.tsx

import Image from 'next/image'
import React from 'react'

type Props = {
  imageName: string // ex: 'tenue_1.jpeg'
}

export default function TenueCard({ imageName }: Props) {
  const src = `/images/${imageName}` // Images dans /public/images/

  return (
    <div className="w-32 h-48 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
      <Image
        src={src}
        alt="Visuel tenue"
        width={128}
        height={192}
        className="object-cover"
        onError={(e) => {
          // Masquer l’image si elle échoue
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    </div>
  )
}