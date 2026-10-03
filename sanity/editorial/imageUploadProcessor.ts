/**
 * Thin browser glue: decode, resize on a canvas, draw the signature, re-encode.
 * All decisions (sizes, layout, MIME, names) come from imageUploadLogic; the
 * browser APIs are injected so everything is testable with fakes.
 * This module never throws and never logs: the Uploader wrapper owns that.
 */
import {IMAGE_UPLOAD_CONFIG} from './imageUploadConfig'
import {
  MAX_INPUT_BYTES,
  computeSignatureLayout,
  computeTargetSize,
  detectImageMime,
  outputFileName,
  usesQuality,
  validateImageUploadConfig,
} from './imageUploadLogic'
import type {ImageStats, ImageUploadConfig, ProcessFailureReason} from './imageUploadLogic'

export interface ProcessorDeps {
  createBitmap(file: Blob): Promise<ImageBitmap>
  createCanvas(width: number, height: number): HTMLCanvasElement
}

export type ProcessResult =
  | {
      status: 'processed'
      file: File
      original: ImageStats
      output: ImageStats
      resized: boolean
      signed: boolean
    }
  | {
      status: 'skipped'
      file: File
      reason: 'disabled' | 'unsupported-type' | 'nothing-to-do'
    }
  | {status: 'failed'; file: File; reason: ProcessFailureReason; detail?: string}

export function createBrowserDeps(): ProcessorDeps {
  return {
    async createBitmap(file) {
      try {
        // Bakes the EXIF orientation into the bitmap: width and height are the oriented ones.
        return await createImageBitmap(file, {imageOrientation: 'from-image'})
      } catch (error) {
        // Older engines reject the option value with a TypeError: retry once without options.
        if (error instanceof TypeError) return createImageBitmap(file)
        throw error
      }
    },
    createCanvas(width, height) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      return canvas
    },
  }
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number | undefined,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality)
  })
}

function failed(file: File, reason: ProcessFailureReason, detail?: string): ProcessResult {
  return detail === undefined ? {status: 'failed', file, reason} : {status: 'failed', file, reason, detail}
}

export async function processImageFile(
  file: File,
  config: ImageUploadConfig = IMAGE_UPLOAD_CONFIG,
  deps?: ProcessorDeps,
): Promise<ProcessResult> {
  try {
    if (config.enabled === false) return {status: 'skipped', file, reason: 'disabled'}

    const errors = validateImageUploadConfig(config)
    if (errors.length > 0) return failed(file, 'invalid-config', errors.join(' '))

    const mime = detectImageMime(file.type, file.name)
    if (mime === null) return {status: 'skipped', file, reason: 'unsupported-type'}

    if (file.size > MAX_INPUT_BYTES) return failed(file, 'too-large')

    const resolvedDeps = deps ?? createBrowserDeps()

    let bitmap: ImageBitmap
    try {
      bitmap = await resolvedDeps.createBitmap(file)
    } catch (error) {
      return failed(file, 'decode-failed', error instanceof Error ? error.message : String(error))
    }

    try {
      const original: ImageStats = {width: bitmap.width, height: bitmap.height, bytes: file.size}
      const target = computeTargetSize(bitmap.width, bitmap.height, config.maxDimension)
      const resized = target.width !== bitmap.width || target.height !== bitmap.height
      const layout = config.signature.enabled
        ? computeSignatureLayout(target.width, target.height, config.signature)
        : null

      if (!resized && layout === null) return {status: 'skipped', file, reason: 'nothing-to-do'}

      const canvas = resolvedDeps.createCanvas(target.width, target.height)
      try {
        const context = canvas.getContext('2d')
        if (!context) return failed(file, 'canvas-unavailable')

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.drawImage(bitmap, 0, 0, target.width, target.height)
        bitmap.close()

        if (layout !== null) {
          context.font = layout.font
          context.textAlign = layout.textAlign
          context.textBaseline = layout.textBaseline
          context.fillStyle = layout.fillStyle
          context.shadowColor = layout.shadow.color
          context.shadowBlur = layout.shadow.blur
          context.shadowOffsetX = layout.shadow.offsetX
          context.shadowOffsetY = layout.shadow.offsetY
          context.fillText(layout.text, layout.x, layout.y)
        }

        const blob = await encodeCanvas(canvas, mime, usesQuality(mime) ? config.quality : undefined)
        if (blob === null) return failed(file, 'encode-failed')
        if (blob.type !== mime) {
          return failed(file, 'encode-type-mismatch', `${mime} demandé, ${blob.type || 'type vide'} reçu`)
        }

        const output = new File([blob], outputFileName(file.name, mime), {
          type: mime,
          lastModified: file.lastModified,
        })
        return {
          status: 'processed',
          file: output,
          original,
          output: {width: target.width, height: target.height, bytes: output.size},
          resized,
          signed: layout !== null,
        }
      } finally {
        // Release the canvas backing store as early as possible.
        canvas.width = 0
        canvas.height = 0
      }
    } finally {
      // close() is idempotent; guarantees the bitmap is freed on every path.
      bitmap.close()
    }
  } catch (error) {
    return failed(file, 'unexpected', error instanceof Error ? error.message : String(error))
  }
}
