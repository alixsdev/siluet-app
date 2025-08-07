'use client'
import FileUploader from '@/components/FileUploader'

export default function CreatePage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4 text-white">Créer une tenue</h1>
      <FileUploader />
    </main>
  )
}