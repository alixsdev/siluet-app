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
      <div className="w-full md:w-[640px]">
        {/* Import */}
        <div className="border-2 border-dashed border-gray-400 p-4 rounded bg-[#EDE7DF] text-center w-full">
          <p className="mb-2">Glissez une image ou cliquez sur Importer</p>
          <label className="bg-[#4B3C2F] text-white px-4 py-2 rounded cursor-pointer inline-block">
            Importer
            <input type="file" multiple onChange={handleChange} className="hidden" />
          </label>
        </div>

        {/* Galerie : grille, hauteur uniforme, scroll vertical */}
        <div className="mt-4 max-h-[520px] overflow-y-auto pr-2 pl-1 pt-1">
          <div className="grid grid-cols-3 gap-3">
            {previews.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', src)}
                  className="w-full"
                  style={{ height: GALLERY_CELL_H, objectFit: 'cover' }}
                  alt={`preview-${index}`}
                />
                {/* Suppression de la galerie */}
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
      </div>
    </div>
  )
}