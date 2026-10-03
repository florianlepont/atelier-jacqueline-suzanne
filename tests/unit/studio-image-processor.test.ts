// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest'
import {IMAGE_UPLOAD_CONFIG} from '../../sanity/editorial/imageUploadConfig'
import {MAX_INPUT_BYTES} from '../../sanity/editorial/imageUploadLogic'
import type {ImageUploadConfig} from '../../sanity/editorial/imageUploadLogic'
import {createBrowserDeps, processImageFile} from '../../sanity/editorial/imageUploadProcessor'
import type {ProcessorDeps} from '../../sanity/editorial/imageUploadProcessor'

type FakeContext = {
  imageSmoothingEnabled?: boolean
  imageSmoothingQuality?: string
  font?: string
  textAlign?: string
  textBaseline?: string
  fillStyle?: string
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  drawImage: ReturnType<typeof vi.fn>
  fillText: ReturnType<typeof vi.fn>
}

interface Harness {
  deps: ProcessorDeps
  bitmap: {width: number; height: number; close: ReturnType<typeof vi.fn>}
  canvas: {
    width: number
    height: number
    getContext: ReturnType<typeof vi.fn>
    toBlob: ReturnType<typeof vi.fn>
  }
  context: FakeContext
  createCanvas: ReturnType<typeof vi.fn>
  createBitmap: ReturnType<typeof vi.fn>
  order: string[]
}

interface HarnessOptions {
  width?: number
  height?: number
  blobType?: string | null
  context?: null
  createBitmapError?: unknown
  createCanvasError?: unknown
}

function makeHarness(options: HarnessOptions = {}): Harness {
  const order: string[] = []
  const context: FakeContext = {
    drawImage: vi.fn(() => order.push('drawImage')),
    fillText: vi.fn(() => order.push('fillText')),
  }
  const requested: {mime?: string} = {}
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => (options.context === null ? null : context)),
    toBlob: vi.fn((callback: (blob: Blob | null) => void, mime: string) => {
      requested.mime = mime
      if (options.blobType === null) callback(null)
      else callback(new Blob([new Uint8Array(1234)], {type: options.blobType ?? mime}))
    }),
  }
  const bitmap = {
    width: options.width ?? 6000,
    height: options.height ?? 4000,
    close: vi.fn(),
  }
  const createBitmap = vi.fn(() =>
    options.createBitmapError === undefined
      ? Promise.resolve(bitmap as unknown as ImageBitmap)
      : Promise.reject(options.createBitmapError),
  )
  const createCanvas = vi.fn((width: number, height: number) => {
    if (options.createCanvasError !== undefined) throw options.createCanvasError
    canvas.width = width
    canvas.height = height
    return canvas as unknown as HTMLCanvasElement
  })
  return {
    deps: {createBitmap, createCanvas},
    bitmap,
    canvas,
    context,
    createCanvas,
    createBitmap,
    order,
  }
}

function makeFile(name = 'photo.jpg', type = 'image/jpeg', bytes = 5000): File {
  return new File([new Uint8Array(bytes)], name, {type, lastModified: 1_700_000_000_000})
}

function config(overrides: Partial<ImageUploadConfig> = {}): ImageUploadConfig {
  return {...IMAGE_UPLOAD_CONFIG, ...overrides}
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('processImageFile', () => {
  it('resizes, signs and re-encodes a large landscape JPEG', async () => {
    const harness = makeHarness()
    const file = makeFile('IMG_0001.JPG')
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)

    expect(harness.createCanvas).toHaveBeenCalledWith(2400, 1600)
    expect(harness.context.drawImage).toHaveBeenCalledWith(harness.bitmap, 0, 0, 2400, 1600)
    expect(harness.context.imageSmoothingEnabled).toBe(true)
    expect(harness.context.imageSmoothingQuality).toBe('high')
    expect(harness.context.fillText).toHaveBeenCalledWith('© Romane Lepont', 2352, 1552)
    expect(harness.context.fillStyle).toBe('rgba(255, 255, 255, 0.55)')
    expect(harness.context.textAlign).toBe('right')
    expect(harness.context.textBaseline).toBe('bottom')
    expect(harness.context.shadowBlur).toBe(6)
    expect(harness.context.shadowOffsetY).toBe(2)
    expect(harness.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9)
    expect(harness.bitmap.close).toHaveBeenCalled()
    // Canvas released at the end.
    expect(harness.canvas.width).toBe(0)

    expect(result.status).toBe('processed')
    if (result.status !== 'processed') throw new Error('unreachable')
    expect(result.resized).toBe(true)
    expect(result.signed).toBe(true)
    expect(result.original).toEqual({width: 6000, height: 4000, bytes: file.size})
    expect(result.output).toEqual({width: 2400, height: 1600, bytes: result.file.size})
    expect(result.file).not.toBe(file)
    expect(result.file.type).toBe('image/jpeg')
    expect(result.file.name).toBe('IMG_0001.jpg')
    expect(result.file.lastModified).toBe(file.lastModified)
  })

  it('draws the image before the signature, setting the font first', async () => {
    const harness = makeHarness()
    await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(harness.order).toEqual(['drawImage', 'fillText'])
    expect(harness.context.font).toContain('600 53px')
  })

  it('caps a portrait on its longest side', async () => {
    const harness = makeHarness({width: 4000, height: 6000})
    await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(harness.createCanvas).toHaveBeenCalledWith(1600, 2400)
  })

  it('does not upscale a small image but still signs it', async () => {
    const harness = makeHarness({width: 1200, height: 800})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(harness.createCanvas).toHaveBeenCalledWith(1200, 800)
    expect(result.status).toBe('processed')
    if (result.status === 'processed') {
      expect(result.resized).toBe(false)
      expect(result.signed).toBe(true)
    }
  })

  it('leaves a small image untouched when the signature is off', async () => {
    const harness = makeHarness({width: 1200, height: 800})
    const file = makeFile()
    const result = await processImageFile(
      file,
      config({signature: {...IMAGE_UPLOAD_CONFIG.signature, enabled: false}}),
      harness.deps,
    )
    expect(result).toEqual({status: 'skipped', file, reason: 'nothing-to-do'})
    expect(result.file).toBe(file)
    expect(harness.createCanvas).not.toHaveBeenCalled()
    expect(harness.bitmap.close).toHaveBeenCalled()
  })

  it('skips as nothing-to-do when the signature does not fit a tiny image', async () => {
    const harness = makeHarness({width: 70, height: 50})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result.status).toBe('skipped')
    expect(harness.createCanvas).not.toHaveBeenCalled()
  })

  it('resizes without signing when the signature is off', async () => {
    const harness = makeHarness()
    const result = await processImageFile(
      makeFile(),
      config({signature: {...IMAGE_UPLOAD_CONFIG.signature, enabled: false}}),
      harness.deps,
    )
    expect(result.status).toBe('processed')
    if (result.status === 'processed') expect(result.signed).toBe(false)
    expect(harness.context.fillText).not.toHaveBeenCalled()
  })

  it('keeps PNG lossless and WebP as WebP', async () => {
    const png = makeHarness()
    const pngResult = await processImageFile(makeFile('shot.png', 'image/png'), IMAGE_UPLOAD_CONFIG, png.deps)
    expect(png.canvas.toBlob.mock.calls[0][1]).toBe('image/png')
    expect(png.canvas.toBlob.mock.calls[0][2]).toBeUndefined()
    expect(pngResult.file.name.endsWith('.png')).toBe(true)

    const webp = makeHarness()
    const webpResult = await processImageFile(makeFile('a.webp', 'image/webp'), IMAGE_UPLOAD_CONFIG, webp.deps)
    expect(webp.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.9)
    expect(webpResult.file.name.endsWith('.webp')).toBe(true)
  })

  it.each([
    ['photo.gif', 'image/gif'],
    ['logo.svg', 'image/svg+xml'],
  ])('passes %s through untouched without decoding it', async (name, type) => {
    const harness = makeHarness()
    const file = makeFile(name, type)
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toEqual({status: 'skipped', file, reason: 'unsupported-type'})
    expect(result.file).toBe(file)
    expect(harness.createBitmap).not.toHaveBeenCalled()
  })

  it('treats an empty MIME type with a .JPG name as JPEG', async () => {
    const harness = makeHarness()
    const result = await processImageFile(makeFile('PHOTO.JPG', ''), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result.status).toBe('processed')
    expect(harness.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9)
  })

  it('does nothing when the master switch is off, even with an invalid config', async () => {
    const harness = makeHarness()
    const file = makeFile()
    const result = await processImageFile(file, {...config({quality: 5}), enabled: false}, harness.deps)
    expect(result).toEqual({status: 'skipped', file, reason: 'disabled'})
    expect(harness.createBitmap).not.toHaveBeenCalled()
  })

  it('falls back to the original with an invalid config', async () => {
    const harness = makeHarness()
    const file = makeFile()
    const result = await processImageFile(file, config({quality: 5}), harness.deps)
    expect(result.status).toBe('failed')
    if (result.status === 'failed') {
      expect(result.reason).toBe('invalid-config')
      expect(result.detail).toContain('quality')
    }
    expect(result.file).toBe(file)
    expect(harness.createBitmap).not.toHaveBeenCalled()
  })

  it('refuses files over the input guard before decoding', async () => {
    const harness = makeHarness()
    const file = makeFile()
    Object.defineProperty(file, 'size', {value: MAX_INPUT_BYTES + 1})
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'too-large'})
    expect(result.file).toBe(file)
    expect(harness.createBitmap).not.toHaveBeenCalled()
  })

  it('reports an undecodable image', async () => {
    const harness = makeHarness({createBitmapError: new Error('bad image')})
    const file = makeFile()
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'decode-failed', detail: 'bad image'})
    expect(result.file).toBe(file)
  })

  it('reports a non-Error decode rejection', async () => {
    const harness = makeHarness({createBitmapError: 'nope'})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'decode-failed', detail: 'nope'})
  })

  it('reports an unavailable canvas context and still closes the bitmap', async () => {
    const harness = makeHarness({context: null})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'canvas-unavailable'})
    expect(harness.bitmap.close).toHaveBeenCalled()
  })

  it('reports a null blob', async () => {
    const harness = makeHarness({blobType: null})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'encode-failed'})
  })

  it('reports an encoder that answers with another MIME type', async () => {
    const harness = makeHarness({blobType: 'image/png'})
    const file = makeFile('a.webp', 'image/webp')
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'encode-type-mismatch'})
    expect(result.file).toBe(file)
  })

  it('reports an empty blob type as a mismatch', async () => {
    const harness = makeHarness({blobType: ''})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'encode-type-mismatch'})
  })

  it('converts any unexpected error into a failure', async () => {
    const harness = makeHarness({createCanvasError: new Error('boom')})
    const file = makeFile()
    const result = await processImageFile(file, IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'unexpected', detail: 'boom'})
    expect(result.file).toBe(file)
    expect(harness.bitmap.close).toHaveBeenCalled()
  })

  it('converts a thrown non-Error into a failure', async () => {
    const harness = makeHarness({createCanvasError: 'string error'})
    const result = await processImageFile(makeFile(), IMAGE_UPLOAD_CONFIG, harness.deps)
    expect(result).toMatchObject({status: 'failed', reason: 'unexpected', detail: 'string error'})
  })

  it('builds the browser deps lazily when none are injected', async () => {
    const bitmap = {width: 1000, height: 700, close: vi.fn()}
    vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.resolve(bitmap)))
    const result = await processImageFile(
      makeFile(),
      config({signature: {...IMAGE_UPLOAD_CONFIG.signature, enabled: false}}),
    )
    // Small image, signature off: nothing to do, but the bitmap went through the real deps.
    expect(result.status).toBe('skipped')
    expect(bitmap.close).toHaveBeenCalled()
  })

  it('reports a canvas-unavailable failure with the real deps under jsdom (no 2d context)', async () => {
    const bitmap = {width: 6000, height: 4000, close: vi.fn()}
    vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.resolve(bitmap)))
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null)
    const result = await processImageFile(makeFile())
    getContext.mockRestore()
    expect(result).toMatchObject({status: 'failed', reason: 'canvas-unavailable'})
  })
})

describe('createBrowserDeps', () => {
  it('asks for the EXIF orientation to be applied', async () => {
    const bitmap = {width: 1, height: 1}
    const stub = vi.fn(() => Promise.resolve(bitmap))
    vi.stubGlobal('createImageBitmap', stub)
    const blob = new Blob(['x'])
    await expect(createBrowserDeps().createBitmap(blob)).resolves.toBe(bitmap)
    expect(stub).toHaveBeenCalledTimes(1)
    expect(stub).toHaveBeenCalledWith(blob, {imageOrientation: 'from-image'})
  })

  it('retries once without options after a TypeError', async () => {
    const bitmap = {width: 1, height: 1}
    const stub = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('bad option'))
      .mockResolvedValueOnce(bitmap)
    vi.stubGlobal('createImageBitmap', stub)
    const blob = new Blob(['x'])
    await expect(createBrowserDeps().createBitmap(blob)).resolves.toBe(bitmap)
    expect(stub).toHaveBeenCalledTimes(2)
    expect(stub.mock.calls[1]).toEqual([blob])
  })

  it('does not retry other rejections', async () => {
    const error = new DOMException('closed', 'InvalidStateError')
    const stub = vi.fn().mockRejectedValue(error)
    vi.stubGlobal('createImageBitmap', stub)
    await expect(createBrowserDeps().createBitmap(new Blob(['x']))).rejects.toBe(error)
    expect(stub).toHaveBeenCalledTimes(1)
  })

  it('creates a real canvas with the requested size', () => {
    const canvas = createBrowserDeps().createCanvas(300, 200)
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(200)
  })
})
