'use client'

import React, { useState, useRef } from 'react'
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
  const [resizingIndex, setResizingIndex] = useState<number | null>(null)
  const zIndexCounter = useRef<number>(1)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newPreviews = Array.from(files).map(file =>
      URL.createObjectURL(file)
    )
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const src = e.dataTransfer.getData('text/plain')
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    zIndexCounter.current += 1
    setDroppedItems(prev => [
      ...prev,
      { src, x, y, size: 100, zIndex: zIndexCounter.current },
    ])
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleMouseDown = (
    index: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault()
    setDraggingIndex(index)
    bringToFront(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top

    if (draggingIndex !== null) {
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

    if (resizingIndex !== null) {
      setDroppedItems(prev => {
        const updated = [...prev]
        const item = updated[resizingIndex]
        const newSize = Math.max(50, x - item.x)
        updated[resizingIndex] = {
          ...item,
          size: newSize,
        }
        return updated
      })
    }
  }

  const handleMouseUp = () => {
    setDraggingIndex(null)
    setResizingIndex(null)
  }

  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setResizingIndex(index)
    bringToFront(index)
  }

  const bringToFront = (index: number) => {
    zIndexCounter.current += 1
    setDroppedItems(prev => {
      const updated = [...prev]
      updated[index].zIndex = zIndexCounter.current
      return updated
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-[300px] h-[500px] bg-gray-100 rounded shadow"
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
            onMouseDown={e => handleMouseDown(index, e)}
          >
            <img
              src={item.src}
              alt="dragged"
              className="w-full h-full object-contain pointer-events-none"
            />
            <div
              onMouseDown={e => handleResizeStart(index, e)}
              className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-500 cursor-se-resize"
            />
          </div>
        ))}
      </div>

      <div className="border-2 border-dashed border-gray-400 p-4 rounded bg-[#EDE7DF] text-center max-w-sm w-full">
        <p className="mb-2">Glissez une image ou cliquez sur Importer</p>
        <label className="bg-[#4B3C2F] text-white px-4 py-2 rounded cursor-pointer inline-block">
          Importer
          <input
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex gap-4 overflow-x-auto max-w-sm w-full">
        {previews.map((src, index) => (
          <img
            key={index}
            src={src}
            draggable
            onDragStart={e => e.dataTransfer.setData('text/plain', src)}
            className="w-20 h-20 object-cover border rounded cursor-grab"
          />
        ))}
      </div>
    </div>
  )
}