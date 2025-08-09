'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'

/* ----------------------------- Types & helpers ---------------------------- */

interface DroppedItem {
  src: string
  x: number
  y: number
  size: number
  zIndex: number
}

type Dressing = {
  id: string
  name: string
  items: string[] // list of image URLs
}

const todayLabel = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

/* ------------------------------------------------------------- */

export default function FileUploader() {
  /* ------------------------------- Silhouette ------------------------------ */
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const zIndexCounter = useRef<number>(1)

  /* -------------------------------- Toast/UX ------------------------------- */
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  /* --------------------------- Dressings & gallery ------------------------- */
  // Basics toujours présent et visible
  const basics: Dressing = {
    id: 'basics',
    name: 'Basics',
    items: [
      '/images/visuel-defaut-1.png',
      '/images/visuel-defaut-2.png',
      '/images/visuel-defaut-3.png',
      '/images/visuel-defaut-4.png',
    ],
  }

  // Dressings: only "Basics" by default, ignore persisted dressings
  const [dressings, setDressings] = useState<Record<string, Dressing>>(() => ({
    [basics.id]: basics,
  }))
  React.useEffect(() => {
    // Reset any previously saved dressings so the dropdown starts with only "Basics"
    localStorage.removeItem('siluet:dressings')
  }, [])

  // Vêtements du jour (non persistés)
  const [dayItems, setDayItems] = useState<string[]>([])

  // Sélection multi pour affichage
  const [openDressingPicker, setOpenDressingPicker] = useState(false)
  const [selectedDressingIds, setSelectedDressingIds] = useState<Set<string>>(
    () => new Set<string>(['basics'])
  )

  const toggleDressingSelection = (id: string) => {
    setSelectedDressingIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const persistDressings = (map: Record<string, Dressing>) => {
    const arr = Object.values(map).filter(d => d.id !== 'basics' && d.id !== 'today')
    localStorage.setItem('siluet:dressings', JSON.stringify(arr))
  }

  /* --------------------------- Import modal (files) ------------------------ */
  const [pendingFiles, setPendingFiles] = useState<{ name: string; url: string }[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [saveToDressing, setSaveToDressing] = useState(false)
  const [newDressingName, setNewDressingName] = useState(`Dressing du ${todayLabel()}`)

  // Zone d’import (ouvre la modale de confirmation)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files.length) return
    const list = Array.from(files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    setPendingFiles(list)
    setSaveToDressing(false)
    setNewDressingName(`Dressing du ${todayLabel()}`)
    setShowImportModal(true)
    // reset input
    e.currentTarget.value = ''
  }

  // Confirme l’import dans un dressing (optionnel)
  const confirmImport = () => {
    if (!pendingFiles.length) {
      setShowImportModal(false)
      return
    }
    if (saveToDressing) {
      const id = `dr_${Date.now()}`
      const dressing: Dressing = {
        id,
        name: newDressingName?.trim() || `Dressing du ${todayLabel()}`,
        items: pendingFiles.map(p => p.url),
      }
      const map = { ...dressings, [dressing.id]: dressing }
      setDressings(map)
      persistDressings(map)
      // le dressing vient d’être créé ⇒ l’afficher
      setSelectedDressingIds(prev => new Set(prev).add(id))
      showToast('Dressing créé ✅')
    } else {
      // Ajoute les fichiers dans le dressing éphémère "Vêtements du jour"
      const urls = pendingFiles.map(p => p.url)
      setDayItems(prev => [...prev, ...urls])
      setSelectedDressingIds(prev => new Set(prev).add('today'))
      showToast('Ajouté à « Vêtements du jour » ✅')
    }
    setPendingFiles([])
    setShowImportModal(false)
  }

  // Supprimer une image d’un dressing (persisté ou éphémère)
  const removeItemFromDressing = (dressingId: string, indexInDressing: number) => {
    // Special case: ephemeral "Vêtements du jour"
    if (dressingId === 'today') {
      setDayItems(prev => {
        const next = prev.filter((_, i) => i !== indexInDressing)
        // If empty, also unselect this dressing so it disappears entirely
        if (next.length === 0) {
          setSelectedDressingIds(prevSel => {
            const n = new Set(prevSel)
            n.delete('today')
            return n
          })
        }
        return next
      })
      return
    }

    // Persisted dressings
    setDressings(prev => {
      const clone = { ...prev }
      const d = clone[dressingId]
      if (!d) return prev

      const items = d.items.filter((_, i) => i !== indexInDressing)

      // If the dressing becomes empty, delete it entirely (no empty state kept)
      if (items.length === 0) {
        delete clone[dressingId]
        persistDressings(clone)
        setSelectedDressingIds(prevSel => {
          const n = new Set(prevSel)
          n.delete(dressingId)
          return n
        })
        showToast('Dressing supprimé ✅')
        return clone
      }

      // Otherwise just save the reduced list
      clone[dressingId] = { ...d, items }
      persistDressings(clone)
      return clone
    })
  }

  /* --------------------- Drag & drop sur la silhouette --------------------- */

  const bringToFront = (index: number) => {
    zIndexCounter.current += 1
    setDroppedItems(prev => {
      const updated = [...prev]
      updated[index].zIndex = zIndexCounter.current
      return updated
    })
  }

  const handleDropOnSilhouette = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/plain')
    if (!src) return
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    zIndexCounter.current += 1
    setDroppedItems(prev => [
      ...prev,
      { src, x, y, size: 120, zIndex: zIndexCounter.current },
    ])
    setSelectedIndex(droppedItems.length)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()

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
    setDroppedItems(prev => {
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

  /* ------------------------------ Toolbar actions ------------------------- */

  const nudgeSize = (delta: number) => {
    if (selectedIndex === null) return
    setDroppedItems(prev => {
      const updated = [...prev]
      const s = Math.max(40, Math.min(800, updated[selectedIndex].size + delta))
      updated[selectedIndex].size = s
      return updated
    })
    bringToFront(selectedIndex)
  }
  const handleDeleteSelected = () => {
    if (selectedIndex === null) return
    setDroppedItems(prev => prev.filter((_, i) => i !== selectedIndex))
    setSelectedIndex(null)
  }
  const resetComposition = () => {
    setDroppedItems([])
    setSelectedIndex(null)
  }

  /* ------------------------------- Save project --------------------------- */

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [lookbooks, setLookbooks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('siluet:lookbooks')
      const list: string[] = raw ? JSON.parse(raw) : []
      return list.length ? list : ['Lookbook par défaut']
    } catch {
      return ['Lookbook par défaut']
    }
  })
  const [selectedLookbook, setSelectedLookbook] = useState<string>(() => lookbooks[0])

  const saveProject = () => {
    const project = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: droppedItems,
      lookbook: selectedLookbook,
    }
    const key = 'siluet:projects'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([project, ...existing]))
    showToast('Tenue enregistrée ✅')
  }
  const confirmSave = () => {
    saveProject()
    setShowSaveModal(false)
  }

  /* ---------------------------------- UI ---------------------------------- */

  const SIL_WIDTH = 320
  const CELL_H = 112

  // Agrégation des dressings (persistés + éphémère)
  const allDressings: Record<string, Dressing> = dayItems.length
    ? { ...dressings, today: { id: 'today', name: 'Vêtements du jour', items: dayItems } }
    : { ...dressings }

  return (
    <div className="max-w-6xl mx-auto py-6 flex flex-col md:flex-row items-start justify-center gap-8">
      {/* Colonne gauche (import en haut + dropdown + grilles) */}
      <div className="w-full md:w-[640px]" style={{ minHeight: 520 }}>
        {/* Zone IMPORT tout en haut */}
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-400 p-4 rounded bg-[#EDE7DF]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#4B3C2F]">
                Glissez et déposez dans la zone pour importer de nouvelles tenues
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#4B3C2F] text-[#4B3C2F] bg-white hover:bg-[#F5EFE7] cursor-pointer">
                <span>Importer</span>
                <input type="file" multiple onChange={handleChange} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Dropdown multi-sélection des dressings */}
        <div className="relative mb-3">
          <button
            onClick={() => setOpenDressingPicker(o => !o)}
            className="w-full border border-[#4B3C2F] rounded-md px-3 py-2 text-left bg-white text-[#4B3C2F] flex items-center justify-between"
          >
            <span>Sélectionner des dressings</span>
            <span className="text-xs opacity-70">
              {Array.from(selectedDressingIds).map(id => allDressings[id]?.name).join(', ')}
            </span>
          </button>
          {openDressingPicker && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-[#4B3C2F] rounded-md shadow">
              <ul className="max-h-64 overflow-auto py-2">
                {Object.values(allDressings).map(d => (
                  <li key={d.id} className="px-3 py-1 flex items-center gap-2 hover:bg-gray-50">
                    <input
                      id={`pick_${d.id}`}
                      type="checkbox"
                      checked={selectedDressingIds.has(d.id)}
                      onChange={() => toggleDressingSelection(d.id)}
                    />
                    <label htmlFor={`pick_${d.id}`} className="cursor-pointer">{d.name}</label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Grilles par dressing sélectionné (hauteur fixe + scroll) */}
        <div className="flex flex-col gap-6 max-h-[520px] overflow-y-auto pr-2">
          {Array.from(selectedDressingIds).map(id => {
            const d = allDressings[id]
            if (!d) return null
            // Skip rendering empty dressings entirely
            if (d.items.length === 0) return null
            return (
              <div key={id}>
                <div className="font-semibold text-[#4B3C2F] mb-2">{d.name}</div>
                {d.items.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {d.items.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', src)}
                          alt=""
                          className="h-[112px] w-auto object-contain bg-white border rounded"
                          style={{ maxWidth: '100%' }}
                        />
                        {id !== 'basics' && (
                          <button
                            onClick={() => removeItemFromDressing(id, idx)}
                            title="Supprimer de ce dressing"
                            aria-label="Supprimer de ce dressing"
                            className="absolute top-0 right-0 px-1 text-black/80 hover:text-black text-lg leading-none"
                            style={{ lineHeight: 1 }}
                            type="button"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Silhouette */}
      <div className="flex flex-col items-center gap-4">
        <div
          onDrop={handleDropOnSilhouette}
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

      {/* Toolbox (agrandir / réduire / supprimer / réinitialiser / enregistrer) */}
      <div className="w-full md:w-48 flex md:flex-col gap-3 md:gap-4 justify-start">
        {/* Agrandir */}
        <ToolBtn title="Agrandir" onClick={() => nudgeSize(+16)} disabled={selectedIndex === null}>
          <PlusIcon />
        </ToolBtn>
        {/* Réduire */}
        <ToolBtn title="Réduire" onClick={() => nudgeSize(-16)} disabled={selectedIndex === null}>
          <MinusIcon />
        </ToolBtn>
        {/* Supprimer */}
        <ToolBtn title="Supprimer" onClick={handleDeleteSelected} disabled={selectedIndex === null}>
          <TrashIcon />
        </ToolBtn>
        {/* Réinitialiser */}
        <ToolBtn title="Réinitialiser" onClick={resetComposition} disabled={droppedItems.length === 0}>
          <ResetIcon />
        </ToolBtn>
        {/* Enregistrer (ouvre la modale de sauvegarde) */}
        <button
          onClick={() => setShowSaveModal(true)}
          title="Enregistrer"
          aria-label="Enregistrer"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#4B3C2F] text-white hover:brightness-110 border border-[#4B3C2F]"
        >
          <CheckCircleIcon />
        </button>
      </div>

      {/* Modale IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowImportModal(false)} />
          <div className="relative z-10 w-[min(92vw,720px)] bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-[#4B3C2F]">Importer des vêtements</h3>
            </div>
            <div className="p-4 space-y-4">
              {pendingFiles.length === 0 ? (
                <div className="text-sm text-gray-500">Aucun fichier sélectionné.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {pendingFiles.map((f, i) => (
                    <img key={i} src={f.url} alt={f.name} className="h-[112px] w-auto object-contain border rounded bg-white mx-auto" />
                  ))}
                </div>
              )}

              <div className="mt-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveToDressing}
                    onChange={(e) => setSaveToDressing(e.target.checked)}
                  />
                  <span>Enregistrer dans un dressing</span>
                </label>
                {saveToDressing && (
                  <input
                    type="text"
                    value={newDressingName}
                    onChange={(e) => setNewDressingName(e.target.value)}
                    className="mt-2 w-full border border-[#4B3C2F] rounded-md px-2 py-2 bg-white text-[#4B3C2F]"
                    placeholder={`Dressing du ${todayLabel()}`}
                  />
                )}
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={confirmImport} className="px-4 py-2 rounded bg-[#4B3C2F] text-white hover:brightness-110">
                Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale ENREGISTRER */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSaveModal(false)} />
          <div className="relative z-10 w-[min(92vw,720px)] bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-[#4B3C2F]">Aperçu de la tenue</h3>
            </div>
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div className="relative bg-gray-100 rounded" style={{ width: '100%', aspectRatio: '320 / 520' }}>
                <div className="absolute inset-0">
                  <Image src="/images/silhouette.png" alt="Silhouette" fill className="object-contain pointer-events-none" />
                  {droppedItems.map((item, idx) => (
                    <div key={idx} className="absolute" style={{ left: item.x, top: item.y, width: item.size, height: item.size, zIndex: item.zIndex }}>
                      <img src={item.src} alt="dragged" className="w-full h-full object-contain select-none pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
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
                    {lookbooks.map(lb => (
                      <option key={lb} value={lb}>{lb}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={confirmSave} className="px-4 py-2 rounded bg-[#4B3C2F] text-white hover:brightness-110">
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

/* ----------------------------- Small UI bits ----------------------------- */
function ToolBtn({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
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
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" />
  </svg>
)
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64"/>
    <path d="M3 3v6h6"/>
  </svg>
)
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
)