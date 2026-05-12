'use client'

import { createClient } from '@/lib/supabase/client'

const MAX_DATA_URL_CHARS = 550_000
const PHOTO_BUCKET = 'player-photos'

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No pudimos abrir esa imagen. Probá JPG o PNG.'))
    img.src = url
  })
}

/**
 * Reduce imagen cliente → JPEG por canvas (ideal para guardar en `photo_url`).
 */
export async function fileToJpegDataUrl(file: File, maxEdge = 480): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleccioná una imagen (JPG, PNG o WEBP)')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageFromUrl(objectUrl)
    let { naturalWidth: width, naturalHeight: height } = img
    if (!width || !height) {
      throw new Error('Archivo vacío o no es una imagen válida.')
    }
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible en este navegador')
    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.86
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    for (let step = 0; step < 6 && dataUrl.length > MAX_DATA_URL_CHARS; step++) {
      quality *= 0.82
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error('La foto sigue siendo muy grande. Probá una imagen más chica.')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Comprime una imagen a JPEG Blob — para subir a Supabase Storage.
 */
export async function fileToJpegBlob(file: File, maxEdge = 720): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Seleccioná una imagen (JPG, PNG o WEBP)')
  }
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageFromUrl(objectUrl)
    let { naturalWidth: width, naturalHeight: height } = img
    if (!width || !height) {
      throw new Error('Archivo vacío o no es una imagen válida.')
    }
    const scale = Math.min(1, maxEdge / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    )
    if (!blob) throw new Error('No se pudo generar la imagen optimizada.')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Sube la foto del jugador al bucket `player-photos` y devuelve la URL pública
 * (con cache-buster para que el browser muestre la nueva inmediatamente).
 *
 * Path en el bucket: `<playerId>.jpg` — siempre se sobrescribe (upsert).
 *
 * Requiere correr antes la migración 007_storage_bucket.sql.
 */
export async function uploadPlayerPhoto(
  file: File,
  playerId: string
): Promise<string> {
  const blob = await fileToJpegBlob(file, 720)
  const supabase = createClient()
  const path = `${playerId}.jpg`

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw error

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  // cache-buster para invalidar el cache del browser tras un re-upload
  return `${data.publicUrl}?v=${Date.now()}`
}
