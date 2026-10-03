import type {ImageUploadNotice} from './imageUploadLogic'

/** An upload notice, or the marker emitted when the processing queue becomes idle. */
export type UploadNoticeEvent = ImageUploadNotice | {kind: 'idle'}

type Listener = (event: UploadNoticeEvent) => void

const listeners = new Set<Listener>()

export function subscribeToUploadNotices(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitUploadNotice(event: UploadNoticeEvent): void {
  for (const listener of [...listeners]) {
    try {
      listener(event)
    } catch (error) {
      // A faulty subscriber must never break an upload.
      console.error('[image-upload] upload notice listener failed', error)
    }
  }
}
