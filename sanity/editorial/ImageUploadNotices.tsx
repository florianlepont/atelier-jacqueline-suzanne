import {useToast} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import {summarizeNotices} from './imageUploadLogic'
import type {ImageUploadNotice} from './imageUploadLogic'
import {subscribeToUploadNotices} from './uploadNoticeChannel'

/** Longest a notice waits for the end of its batch before being shown anyway. */
export const NOTICE_MAX_WAIT_MS = 6000
export const SUCCESS_TOAST_DURATION_MS = 6000
export const WARNING_TOAST_DURATION_MS = 12000

/**
 * Mounted once in StudioLayout. Turns the notices emitted by the image upload
 * wrapper into ONE French toast per batch (flushed when the processing queue
 * goes idle, or after a maximum wait). Renders nothing.
 */
export function ImageUploadNotices() {
  const {push} = useToast()

  // Keep the latest `push` in a ref so the subscription below is created once:
  // re-subscribing when the toast API changes identity would drop pending notices.
  const pushRef = useRef(push)
  useEffect(() => {
    pushRef.current = push
  }, [push])

  useEffect(() => {
    let pending: ImageUploadNotice[] = []
    let timer: ReturnType<typeof setTimeout> | undefined

    const flush = () => {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      const batch = pending
      pending = []
      const spec = summarizeNotices(batch)
      if (!spec) return
      pushRef.current({
        ...spec,
        closable: true,
        duration: spec.status === 'success' ? SUCCESS_TOAST_DURATION_MS : WARNING_TOAST_DURATION_MS,
      })
    }

    const unsubscribe = subscribeToUploadNotices((event) => {
      if (event.kind === 'idle') {
        flush()
        return
      }
      pending.push(event)
      timer ??= setTimeout(flush, NOTICE_MAX_WAIT_MS)
    })

    return () => {
      unsubscribe()
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [])

  return null
}
