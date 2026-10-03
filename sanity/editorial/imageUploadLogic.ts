/**
 * Pure logic for the automatic resize and signature applied to every image
 * uploaded through the Studio. No DOM, no React, no 'sanity' import: this file
 * is unit-tested in plain Node (tests/unit/studio-image-upload-logic.test.ts).
 */

export type SignaturePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface SignatureConfig {
  enabled: boolean
  text: string
  opacity: number
  sizeRatio: number
  marginRatio: number
  position: SignaturePosition
}

export interface ImageUploadConfig {
  enabled: boolean
  maxDimension: number
  quality: number
  signature: SignatureConfig
}

export interface Dimensions {
  width: number
  height: number
}

export interface ImageStats extends Dimensions {
  bytes: number
}

export type ProcessableMime = 'image/jpeg' | 'image/png' | 'image/webp'

export type ProcessFailureReason =
  | 'invalid-config'
  | 'too-large'
  | 'decode-failed'
  | 'canvas-unavailable'
  | 'encode-failed'
  | 'encode-type-mismatch'
  | 'timeout'
  | 'unexpected'

export type ImageUploadNotice =
  | {
      kind: 'processed'
      fileName: string
      original: ImageStats
      output: ImageStats
      resized: boolean
      signed: boolean
    }
  | {kind: 'fallback'; fileName: string; reason: ProcessFailureReason}

export interface ToastSpec {
  status: 'success' | 'warning'
  title: string
  description: string
}

export interface SignatureLayout {
  text: string
  font: string
  fillStyle: string
  x: number
  y: number
  textAlign: 'left' | 'right'
  textBaseline: 'top' | 'bottom'
  shadow: {color: string; blur: number; offsetX: number; offsetY: number}
}

export const PROCESSABLE_MIME_TYPES: readonly ProcessableMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
]
/** Same floor as the offline script (scripts/lib/sanity-image-downsize.mjs). */
export const MIN_MAX_DIMENSION = 800
export const MAX_MAX_DIMENSION = 8000
export const MAX_INPUT_BYTES = 100 * 1024 * 1024
export const SIGNATURE_MIN_FONT_PX = 10
export const SIGNATURE_MIN_DRAWABLE_FONT_PX = 8
/** Deliberately generous average glyph width (in em), only used to shrink an over-long text. */
export const SIGNATURE_GLYPH_WIDTH_FACTOR = 0.6
export const SIGNATURE_FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
export const SIGNATURE_SHADOW_COLOR = 'rgba(0, 0, 0, 0.6)'

const SIGNATURE_POSITIONS: readonly SignaturePosition[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
]
const SIGNATURE_TEXT_MAX_LENGTH = 60

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

/** Returns French error messages, one per problem; empty when the config is valid. */
export function validateImageUploadConfig(config: unknown): string[] {
  if (!isRecord(config)) return ['config : objet attendu.']
  const errors: string[] = []

  if (typeof config.enabled !== 'boolean') errors.push('enabled : vrai ou faux attendu.')

  const maxDimension = config.maxDimension
  if (
    typeof maxDimension !== 'number' ||
    !Number.isInteger(maxDimension) ||
    maxDimension < MIN_MAX_DIMENSION ||
    maxDimension > MAX_MAX_DIMENSION
  ) {
    errors.push(
      `maxDimension : entier entre ${MIN_MAX_DIMENSION} et ${MAX_MAX_DIMENSION} attendu.`,
    )
  }

  if (!isNumberInRange(config.quality, 0.5, 1)) {
    errors.push('quality : nombre entre 0,5 et 1 attendu.')
  }

  const signature = config.signature
  if (!isRecord(signature)) {
    errors.push('signature : objet attendu.')
    return errors
  }
  if (typeof signature.enabled !== 'boolean') {
    errors.push('signature.enabled : vrai ou faux attendu.')
    return errors
  }
  if (!signature.enabled) return errors

  const text = signature.text
  if (typeof text !== 'string' || text.trim() === '' || text.length > SIGNATURE_TEXT_MAX_LENGTH) {
    errors.push(`signature.text : texte de 1 à ${SIGNATURE_TEXT_MAX_LENGTH} caractères attendu.`)
  }
  if (!isNumberInRange(signature.opacity, 0.1, 1)) {
    errors.push('signature.opacity : nombre entre 0,1 et 1 attendu.')
  }
  if (!isNumberInRange(signature.sizeRatio, 0.005, 0.1)) {
    errors.push('signature.sizeRatio : nombre entre 0,005 et 0,1 attendu.')
  }
  if (!isNumberInRange(signature.marginRatio, 0, 0.1)) {
    errors.push('signature.marginRatio : nombre entre 0 et 0,1 attendu.')
  }
  if (!SIGNATURE_POSITIONS.includes(signature.position as SignaturePosition)) {
    errors.push(`signature.position : l’une des valeurs ${SIGNATURE_POSITIONS.join(', ')} attendue.`)
  }
  return errors
}

function assertPositiveFinite(name: string, value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`)
  }
}

/**
 * Scales so the LONGEST side is at most `maxDimension`. Never upscales, keeps
 * the ratio, keeps at least 1 px on the short side.
 */
export function computeTargetSize(width: number, height: number, maxDimension: number): Dimensions {
  assertPositiveFinite('width', width)
  assertPositiveFinite('height', height)
  assertPositiveFinite('maxDimension', maxDimension)

  const longest = Math.max(width, height)
  if (longest <= maxDimension) return {width, height}

  const scale = maxDimension / longest
  if (width >= height) {
    return {width: maxDimension, height: Math.max(1, Math.round(height * scale))}
  }
  return {width: Math.max(1, Math.round(width * scale)), height: maxDimension}
}

const MIME_BY_TYPE: Record<string, ProcessableMime> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

const MIME_BY_EXTENSION: Record<string, ProcessableMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function extensionOf(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return null
  return fileName.slice(dot + 1).toLowerCase()
}

/** JPEG/PNG/WebP only; anything else (GIF, SVG, AVIF, PDF...) returns null. */
export function detectImageMime(type: string, fileName: string): ProcessableMime | null {
  const normalizedType = type.trim().toLowerCase()
  if (normalizedType !== '') return MIME_BY_TYPE[normalizedType] ?? null
  const extension = extensionOf(fileName)
  return extension === null ? null : (MIME_BY_EXTENSION[extension] ?? null)
}

const CANONICAL_EXTENSION: Record<ProcessableMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const KNOWN_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'jpe',
  'jfif',
  'png',
  'webp',
  'gif',
  'avif',
  'heic',
  'heif',
  'tif',
  'tiff',
  'bmp',
  'svg',
])

/** Makes the file extension match the output MIME type. */
export function outputFileName(fileName: string, mime: ProcessableMime): string {
  const trimmed = fileName.trim()
  const dot = trimmed.lastIndexOf('.')
  const extension = dot >= 0 ? trimmed.slice(dot + 1).toLowerCase() : ''
  const hasKnownExtension = dot >= 0 && KNOWN_IMAGE_EXTENSIONS.has(extension)
  const rawBase = hasKnownExtension ? trimmed.slice(0, dot) : trimmed
  const base = rawBase === '' ? 'image' : rawBase

  if (hasKnownExtension && MIME_BY_EXTENSION[extension] === mime) {
    return `${base}.${extension}`
  }
  return `${base}.${CANONICAL_EXTENSION[mime]}`
}

/** JPEG and WebP take a quality argument; PNG is lossless. */
export function usesQuality(mime: ProcessableMime): boolean {
  return mime !== 'image/png'
}

/** Where and how to draw the signature; null when nothing legible fits. */
export function computeSignatureLayout(
  width: number,
  height: number,
  signature: SignatureConfig,
): SignatureLayout | null {
  const text = signature.text.trim()
  if (text === '') return null

  const longest = Math.max(width, height)
  const margin = Math.round(longest * signature.marginRatio)
  let fontSize = Math.max(SIGNATURE_MIN_FONT_PX, Math.round(longest * signature.sizeRatio))

  const available = width - 2 * margin
  const fittingFontSize = Math.floor(available / (text.length * SIGNATURE_GLYPH_WIDTH_FACTOR))
  if (fontSize > fittingFontSize) fontSize = fittingFontSize
  if (fontSize < SIGNATURE_MIN_DRAWABLE_FONT_PX) return null

  const isRight = signature.position.endsWith('right')
  const isBottom = signature.position.startsWith('bottom')

  return {
    text,
    font: `600 ${fontSize}px ${SIGNATURE_FONT_FAMILY}`,
    fillStyle: `rgba(255, 255, 255, ${signature.opacity})`,
    x: isRight ? width - margin : margin,
    y: isBottom ? height - margin : margin,
    textAlign: isRight ? 'right' : 'left',
    textBaseline: isBottom ? 'bottom' : 'top',
    shadow: {
      color: SIGNATURE_SHADOW_COLOR,
      blur: Math.max(1, Math.round(fontSize * 0.12)),
      offsetX: 0,
      offsetY: Math.max(1, Math.round(fontSize * 0.04)),
    },
  }
}

export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height} px`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / 1048576).toFixed(1).replace('.', ',')} Mo`
}

const FAILURE_REASON_LABELS: Record<ProcessFailureReason, string> = {
  'invalid-config': 'réglage d’envoi d’images invalide',
  'too-large': 'fichier trop volumineux pour être traité dans le navigateur',
  'decode-failed': 'image illisible par le navigateur',
  'canvas-unavailable': 'traitement d’image indisponible dans ce navigateur',
  'encode-failed': 'échec de la réécriture de l’image',
  'encode-type-mismatch': 'format de sortie non géré par ce navigateur',
  timeout: 'traitement trop long',
  unexpected: 'erreur inattendue',
}

export function describeFailureReason(reason: ProcessFailureReason): string {
  return FAILURE_REASON_LABELS[reason]
}

const MAX_LISTED_FALLBACKS = 3
const FALLBACK_CLOSING = 'L’original a été envoyé tel quel (ni réduction ni signature).'

type ProcessedNotice = Extract<ImageUploadNotice, {kind: 'processed'}>
type FallbackNotice = Extract<ImageUploadNotice, {kind: 'fallback'}>

function describeProcessed(notice: ProcessedNotice): string {
  const weights = `${formatBytes(notice.original.bytes)} → ${formatBytes(notice.output.bytes)}`
  const ending = notice.signed ? ', signature ajoutée.' : '.'
  if (notice.resized) {
    const sizes = `${formatDimensions(notice.original.width, notice.original.height)} → ${formatDimensions(notice.output.width, notice.output.height)}`
    return `${notice.fileName} : ${sizes}, ${weights}${ending}`
  }
  const kept = `dimensions conservées (${formatDimensions(notice.output.width, notice.output.height)})`
  return `${notice.fileName} : ${kept}, ${weights}${ending}`
}

function summarizeProcessedOnly(processed: ProcessedNotice[]): ToastSpec {
  if (processed.length === 1) {
    return {
      status: 'success',
      title: 'Image optimisée',
      description: describeProcessed(processed[0]),
    }
  }
  const total = processed.length
  const resized = processed.filter((notice) => notice.resized).length
  const signed = processed.filter((notice) => notice.signed).length
  const before = processed.reduce((sum, notice) => sum + notice.original.bytes, 0)
  const after = processed.reduce((sum, notice) => sum + notice.output.bytes, 0)
  return {
    status: 'success',
    title: `${total} images optimisées`,
    description: `Réduites : ${resized}/${total} · signées : ${signed}/${total} · poids total : ${formatBytes(before)} → ${formatBytes(after)}.`,
  }
}

function summarizeWithFallbacks(
  processed: ProcessedNotice[],
  fallbacks: FallbackNotice[],
): ToastSpec {
  const title =
    fallbacks.length === 1
      ? 'Image envoyée sans optimisation'
      : `${fallbacks.length} images envoyées sans optimisation`

  const parts: string[] = []
  if (processed.length === 1) parts.push('1 autre image optimisée.')
  else if (processed.length > 1) parts.push(`${processed.length} autres images optimisées.`)

  const listed = fallbacks
    .slice(0, MAX_LISTED_FALLBACKS)
    .map((notice) => `${notice.fileName} : ${describeFailureReason(notice.reason)}`)
  const remaining = fallbacks.length - listed.length
  const list = listed.join(' ; ')
  if (remaining > 0) {
    parts.push(`${list} et ${remaining} ${remaining === 1 ? 'autre' : 'autres'}.`)
  } else {
    parts.push(`${list}.`)
  }
  parts.push(FALLBACK_CLOSING)

  return {status: 'warning', title, description: parts.join(' ')}
}

/** One toast for a whole batch of upload notices; null when there is nothing to say. */
export function summarizeNotices(notices: readonly ImageUploadNotice[]): ToastSpec | null {
  if (notices.length === 0) return null
  const processed = notices.filter((notice): notice is ProcessedNotice => notice.kind === 'processed')
  const fallbacks = notices.filter((notice): notice is FallbackNotice => notice.kind === 'fallback')
  if (fallbacks.length > 0) return summarizeWithFallbacks(processed, fallbacks)
  return summarizeProcessedOnly(processed)
}
