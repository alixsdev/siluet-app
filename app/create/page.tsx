'use client'

import FileUploader from '@/components/FileUploader'

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-neutral-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-xl font-bold mb-4">Créer une tenue</h1>
        <FileUploader />
      </div>
    </main>
  )
}