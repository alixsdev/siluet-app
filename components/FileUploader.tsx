'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'

interface DroppedItem {
  src: string
  x: number
  y: number
  size: number
  zIndex: number
}

export default function FileUploader() {
  const [previews, setPreviews] = useState<string[]>([])
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const zIndexCounter = useRef<number>(1)

  const [toast, setToast] = useState<string | null>(null)
  const [collection, setCollection] = useState<string>("")
  const [showModal, setShowModal] = useState(false)

  const [lookbooks, setLookbooks] = useState<string[]>([])
  const [selectedLookbook, setSelectedLookbook] = useState<string>("")

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('siluet:lookbooks')
      const list: string[] = raw ? JSON.parse(raw) : []
      const base = list.length ? list : ['Lookbook par défaut']
      setLookbooks(base)
      setSelectedLookbook(base[0])
    } catch {
      const base = ['Lookbook par défaut']
      setLookbooks(base)
      setSelectedLookbook(base[0])
    }
  }, [])

  // UI constants
  const SIL_WIDTH = 320 // largeur silhouette
  const GALLERY_CELL_H = 112 // hauteur uniforme des vignettes

  // -------- Import local --------
  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newPreviews = Array.from(files).map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }
  const handleDeletePreview = (i: number) => {
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  // -------- Drop sur silhouette --------
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/plain')
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    zIndexCounter.current += 1
    setDroppedItems((prev) => [
      ...prev,
      { src, x, y, size: 120, zIndex: zIndexCounter.current },
    ])
    setSelectedIndex(droppedItems.length)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

  // -------- Sélection / Drag --------
  const bringToFront = (index: number) => {
    zIndexCounter.current += 1
    setDroppedItems((prev) => {
      const updated = [...prev]
      updated[index].zIndex = zIndexCounter.current
      return updated
    })
  }

  const handleMouseDown = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setSelectedIndex(index)
    bringToFront(index)
    setDraggingIndex(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingIndex === null) return
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    setDroppedItems((prev) => {
      const updated = [...prev]
      updated[draggingIndex] = {
        ...updated[draggingIndex],
        x: x - updated[draggingIndex].size / 2,
        y: y - updated[draggingIndex].size / 2,
      }
      return updated
    })
  }

  const handleMouseUp = () => setDraggingIndex(null)

  // -------- Toolbar actions --------
  const nudgeSize = (delta: number) => {
    if (selectedIndex === null) return
    setDroppedItems((prev) => {
      const updated = [...prev]
      const s = Math.max(40, Math.min(800, updated[selectedIndex].size + delta))
      updated[selectedIndex].size = s
      return updated
    })
    bringToFront(selectedIndex)
  }

  const handleDeleteSelected = () => {
    if (selectedIndex === null) return
    setDroppedItems((prev) => prev.filter((_, i) => i !== selectedIndex))
    setSelectedIndex(null)
  }

  const resetComposition = () => {
    setDroppedItems([])
    setSelectedIndex(null)
  }

  const saveProject = () => {
    const project = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      createdAt: new Date().toISOString(),
      collection,
      lookbook: selectedLookbook,
      items: droppedItems,
    }
    const key = 'siluet:projects'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([project, ...existing]))
    setToast('Tenue enregistrée ✅')
    setTimeout(() => setToast(null), 2200)
  }

  const confirmSaveToLookbook = () => {
    saveProject()
    setShowModal(false)
  }

  // ---- UI helper (bouton secondaire carré) ----
  const ToolBtn = ({
    title,
    onClick,
    disabled,
    children,
  }: {
    title: string
    onClick: () => void
    disabled?: boolean
    children: React.ReactNode
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-md border transition ${
        disabled
          ? 'bg-white text-[#4B3C2F]/40 border-[#4B3C2F]/30 cursor-not-allowed'
          : 'bg-white text-[#4B3C2F] border-[#4B3C2F] hover:bg-[#F5EFE7]'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="max-w-6xl mx-auto py-6 flex flex-col md:flex-row items-start justify-center gap-8">
      {/* Colonne gauche : 2× silhouette = 640px */}
      <div className="w-full md:w-[640px]" style={{ height: 520 }}>
        <div className="h-full flex flex-col">
          {/* Galerie : hauteur uniforme, largeur proportionnelle, pas de crop */}
          <div className="flex-1 overflow-y-auto pr-2 pl-1 pt-1">
            {previews.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-600 text-center px-4">
                vous n'avez pas encore ajouté de vêtement à cette tenue.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-start">
                {previews.map((src, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={src}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', src)}
                      className="h-[112px] w-auto object-contain border rounded bg-white"
                      alt={`preview-${index}`}
                      loading="lazy"
                    />
                    {/* Pastille suppression (fond blanc, croix noire) */}
                    <button
                      onClick={() => handleDeletePreview(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs leading-6 text-center shadow border border-gray-300 hover:bg-gray-100"
                      title="Supprimer de la galerie"
                      aria-label="Supprimer de la galerie"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteur de dressing spécifique */}
          <div className="mt-3 px-1">
            <label className="block text-sm font-medium text-[#4B3C2F] mb-1">Dressing</label>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full border border-[#4B3C2F] rounded-md px-2 py-2 bg-white text-[#4B3C2F] focus:outline-none focus:ring-1 focus:ring-[#4B3C2F]"
            >
              <option value="" disabled>Sélectionner une collection…</option>
              <option>Louis Vuitton - Fall 25</option>
              <option>Dior - Resort 25</option>
              <option>Basics Siluet</option>
            </select>
          </div>

          {/* Zone d'import (bouton secondary) alignée en bas */}
          <div className="mt-3">
            <div className="border-2 border-dashed border-gray-400 p-4 rounded bg-[#EDE7DF] text-center w-full">
              <p className="mb-2">Glissez une image ou utilisez Importer</p>
              <label className="inline-flex items-center justify-center px-4 py-2 rounded border border-[#4B3C2F] text-[#4B3C2F] bg-white hover:bg-[#F5EFE7] cursor-pointer">
                Importer (local)
                <input type="file" multiple onChange={handleChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Silhouette */}
      <div className="flex flex-col items-center gap-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative rounded shadow bg-gray-100"
          style={{ width: SIL_WIDTH, height: 520 }}
        >
          <Image
            src="/images/silhouette.png"
            alt="Silhouette"
            fill
            className="object-contain z-0 pointer-events-none"
          />

          {droppedItems.map((item, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: item.x,
                top: item.y,
                width: item.size,
                height: item.size,
                zIndex: item.zIndex,
              }}
              onMouseDown={(e) => handleMouseDown(index, e)}
            >
              <img
                src={item.src}
                alt="dragged"
                className="w-full h-full object-contain select-none cursor-move"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Toolbox (secondary) */}
      <div className="w-full md:w-48 flex md:flex-col gap-3 md:gap-4 justify-start">
        {/* Agrandir */}
        <ToolBtn
          title="Agrandir"
          onClick={() => nudgeSize(+16)}
          disabled={selectedIndex === null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </ToolBtn>

        {/* Réduire */}
        <ToolBtn
          title="Réduire"
          onClick={() => nudgeSize(-16)}
          disabled={selectedIndex === null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </ToolBtn>

        {/* Supprimer */}
        <ToolBtn
          title="Supprimer"
          onClick={handleDeleteSelected}
          disabled={selectedIndex === null}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </ToolBtn>

        {/* Réinitialiser (supprimer tous les éléments déposés) */}
        <ToolBtn
          title="Réinitialiser"
          onClick={resetComposition}
          disabled={droppedItems.length === 0}
        >
          {/* Reset icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64"/>
            <path d="M3 3v6h6"/>
          </svg>
        </ToolBtn>

        {/* Enregistrer (primary, icône rond check) */}
        <button
          onClick={() => setShowModal(true)}
          title="Enregistrer"
          aria-label="Enregistrer"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4B3C2F] text-white hover:brightness-110 border border-[#4B3C2F]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </button>
      </div>

      {/* Modal Aperçu d'enregistrement */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />

          {/* modal card */}
          <div className="relative z-10 w-[min(92vw,720px)] bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-[#4B3C2F]">Aperçu de la tenue</h3>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-4">
              {/* Aperçu visuel : re-rendu de la silhouette et des items (lecture seule) */}
              <div className="relative bg-gray-100 rounded" style={{ width: '100%', aspectRatio: '320 / 520' }}>
                {/* cadre proportionnel */}
                <div className="absolute inset-0">
                  <Image src="/images/silhouette.png" alt="Silhouette" fill className="object-contain pointer-events-none" />
                  {droppedItems.map((item, idx) => (
                    <div key={idx} className="absolute" style={{ left: item.x, top: item.y, width: item.size, height: item.size, zIndex: item.zIndex }}>
                      <img src={item.src} alt="dragged" className="w-full h-full object-contain select-none pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Infos */}
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-700">
                  Vous êtes sur le point d'enregistrer cette tenue dans votre lookbook.
                </p>
                <div>
                  <div className="text-xs text-gray-500">Dressing</div>
                  <div className="text-sm font-medium">{collection || 'Sans collection'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Éléments</div>
                  <div className="text-sm">{droppedItems.length} image(s)</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Enregistrer dans un lookbook</div>
                  <select
                    value={selectedLookbook}
                    onChange={(e) => setSelectedLookbook(e.target.value)}
                    className="mt-1 w-full border border-[#4B3C2F] rounded-md px-2 py-2 bg-white text-[#4B3C2F] focus:outline-none focus:ring-1 focus:ring-[#4B3C2F]"
                  >
                    {lookbooks.map((lb) => (
                      <option key={lb} value={lb}>{lb}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              {/* Primary = Enregistrer dans un lookbook */}
              <button
                onClick={confirmSaveToLookbook}
                className="px-4 py-2 rounded bg-[#4B3C2F] text-white hover:brightness-110"
              >
                Enregistrer la tenue
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
    </div>
  )
}