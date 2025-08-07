'use client'

import FileUploader from '@/components/FileUploader'

export default function CreatePage() {
  return (
    <main className="bg-[#5D4D3D] min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Créer une tenue</h1>
      <FileUploader />
    </main>
  )
}