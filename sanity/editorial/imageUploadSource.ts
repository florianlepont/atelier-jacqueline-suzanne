/**
 * Intercepts every Studio image upload: wraps the Uploader of the default
 * dataset asset source (through the global `form.image.assetSources` resolver)
 * so each file is resized and signed in the browser before the standard upload
 * path receives it. The wrapper works by composition against the public
 * AssetSourceUploader interface and never adds a second asset source.
 */
import type {
  AssetSource,
  AssetSourceUploadEvent,
  AssetSourceUploadFile,
  AssetSourceUploader,
  AssetSourceUploaderClass,
} from 'sanity'
import {IMAGE_UPLOAD_CONFIG} from './imageUploadConfig'
import type {ImageUploadConfig, ImageUploadNotice} from './imageUploadLogic'
import {processImageFile} from './imageUploadProcessor'
import type {ProcessResult} from './imageUploadProcessor'
import {emitUploadNotice} from './uploadNoticeChannel'
import type {UploadNoticeEvent} from './uploadNoticeChannel'

export const PROCESSING_TIMEOUT_MS = 30000

export const TIMED_OUT = Symbol('image-processing-timed-out')

/** Resolves with the promise's value, or with TIMED_OUT when it does not settle in time. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export interface SerialQueue {
  enqueue<T>(task: () => Promise<T>): Promise<T>
}

/** Concurrency-1 queue; `onIdle` fires once each time the pending count returns to zero. */
export function createSerialQueue(onIdle?: () => void): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve()
  let pending = 0

  const settle = () => {
    pending -= 1
    if (pending === 0 && onIdle) {
      try {
        onIdle()
      } catch (error) {
        console.error('[image-upload] idle callback failed', error)
      }
    }
  }

  return {
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      pending += 1
      const result = tail.then(() => task())
      tail = result.then(settle, settle)
      return result
    },
  }
}

const defaultQueue = createSerialQueue(() => emitUploadNotice({kind: 'idle'}))

export interface ProcessingUploaderOptions {
  config?: ImageUploadConfig
  process?: (file: File, config: ImageUploadConfig) => Promise<ProcessResult>
  queue?: SerialQueue
  notify?: (event: UploadNoticeEvent) => void
  timeoutMs?: number
}

export type ProcessingUploaderClass = (new () => AssetSourceUploader) & {
  readonly imageProcessing: true
}

type UploadOptions = Parameters<AssetSourceUploader['upload']>[1]
type Subscriber = (event: AssetSourceUploadEvent) => void

interface Run {
  placeholders: AssetSourceUploadFile[]
  aborted: boolean
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function createProcessingUploaderClass(
  Base: AssetSourceUploaderClass,
  options: ProcessingUploaderOptions = {},
): ProcessingUploaderClass {
  const config = options.config ?? IMAGE_UPLOAD_CONFIG
  const processFile = options.process ?? processImageFile
  const queue = options.queue ?? defaultQueue
  const notify = options.notify ?? emitUploadNotice
  const timeoutMs = options.timeoutMs ?? PROCESSING_TIMEOUT_MS

  class ProcessingUploader implements AssetSourceUploader {
    static readonly imageProcessing = true as const

    private readonly inner: AssetSourceUploader = new Base()
    private readonly subscribers = new Set<Subscriber>()
    private readonly runs = new Set<Run>()
    private counter = 0

    constructor() {
      this.inner.subscribe((event) => this.emit(event))
    }

    private emit(event: AssetSourceUploadEvent) {
      for (const subscriber of [...this.subscribers]) subscriber(event)
    }

    subscribe(subscriber: Subscriber): () => void {
      this.subscribers.add(subscriber)
      return () => {
        this.subscribers.delete(subscriber)
      }
    }

    upload(files: File[], uploadOptions?: UploadOptions): AssetSourceUploadFile[] {
      const placeholders: AssetSourceUploadFile[] = files.map((file) => {
        this.counter += 1
        return {id: `image-processing-${this.counter}`, file, progress: 0, status: 'pending'}
      })
      const run: Run = {placeholders, aborted: false}
      this.runs.add(run)
      void this.run(run, uploadOptions)
      return placeholders
    }

    private async run(run: Run, uploadOptions: UploadOptions) {
      try {
        // Every task is enqueued synchronously so a whole batch counts as one idle cycle.
        const toUpload = await Promise.all(
          run.placeholders.map((placeholder) =>
            queue.enqueue(() => this.processOne(run, placeholder.file)),
          ),
        )
        if (run.aborted) return
        this.runs.delete(run)
        this.inner.upload(toUpload, uploadOptions)
      } catch (error) {
        if (run.aborted) return
        this.runs.delete(run)
        this.surfaceError(run, toError(error))
      }
    }

    private async processOne(run: Run, file: File): Promise<File> {
      if (run.aborted) return file

      let result: ProcessResult
      try {
        const outcome = await withTimeout(processFile(file, config), timeoutMs)
        result = outcome === TIMED_OUT ? {status: 'failed', file, reason: 'timeout'} : outcome
      } catch (error) {
        result = {status: 'failed', file, reason: 'unexpected', detail: toError(error).message}
      }
      if (run.aborted) return file

      let notice: ImageUploadNotice | null = null
      if (result.status === 'processed') {
        notice = {
          kind: 'processed',
          fileName: file.name,
          original: result.original,
          output: result.output,
          resized: result.resized,
          signed: result.signed,
        }
      } else if (result.status === 'failed') {
        const detail = result.detail ? ` (${result.detail})` : ''
        console.error(`[image-upload] ${file.name} : ${result.reason}${detail}`)
        notice = {kind: 'fallback', fileName: file.name, reason: result.reason}
      }
      if (notice) {
        try {
          notify(notice)
        } catch (error) {
          console.error('[image-upload] notice delivery failed', error)
        }
      }
      return result.status === 'processed' ? result.file : file
    }

    private surfaceError(run: Run, error: Error) {
      const files = run.placeholders.map((placeholder) => ({
        ...placeholder,
        status: 'error' as const,
        error,
      }))
      this.emit({type: 'error', files})
      this.emit({type: 'all-complete', files})
    }

    abort(file?: AssetSourceUploadFile): void {
      if (this.runs.size === 0) {
        this.inner.abort(file)
        return
      }
      const files: AssetSourceUploadFile[] = []
      for (const run of this.runs) {
        run.aborted = true
        for (const placeholder of run.placeholders) {
          placeholder.status = 'aborted'
          files.push(placeholder)
        }
      }
      this.runs.clear()
      this.emit({type: 'abort', files})
      this.emit({type: 'all-complete', files})
    }

    getFiles(): AssetSourceUploadFile[] {
      if (this.runs.size === 0) return this.inner.getFiles()
      return [...this.runs].flatMap((run) => run.placeholders)
    }

    updateFile(fileId: string, data: Parameters<AssetSourceUploader['updateFile']>[1]): void {
      this.inner.updateFile(fileId, data)
    }

    reset(): void {
      this.inner.reset()
    }
  }

  return ProcessingUploader
}

/**
 * Returns the source unchanged when it cannot or need not be wrapped (no
 * Uploader, component upload mode, already wrapped); otherwise a copy with only
 * `Uploader` replaced, so name, component, icon and openInSource stay identical.
 */
export function withImageProcessing(
  source: AssetSource,
  options?: ProcessingUploaderOptions,
): AssetSource {
  const {Uploader} = source
  if (!Uploader || source.uploadMode === 'component') return source
  if ((Uploader as {imageProcessing?: unknown}).imageProcessing === true) return source
  return {...source, Uploader: createProcessingUploaderClass(Uploader, options)}
}

/** `form.image.assetSources` resolver: wraps every eligible source, same order, same length. */
export function resolveImageAssetSources(prev: AssetSource[]): AssetSource[] {
  return prev.map((source) => withImageProcessing(source))
}
