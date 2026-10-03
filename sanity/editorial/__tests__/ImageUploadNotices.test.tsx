import {createElement} from 'react'
import {act, render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {
  ImageUploadNotices,
  NOTICE_MAX_WAIT_MS,
  SUCCESS_TOAST_DURATION_MS,
  WARNING_TOAST_DURATION_MS,
} from '../ImageUploadNotices'
import type {ImageUploadNotice} from '../imageUploadLogic'
import {StudioLayout} from '../StudioLayout'
import {emitUploadNotice} from '../uploadNoticeChannel'
import {sanityTestState} from '../test/mocks'

const processed = (fileName = 'photo.jpg'): ImageUploadNotice => ({
  kind: 'processed',
  fileName,
  original: {width: 6000, height: 4000, bytes: 14 * 1048576},
  output: {width: 2400, height: 1600, bytes: 1048576},
  resized: true,
  signed: true,
})

const fallback = (fileName = 'broken.jpg'): ImageUploadNotice => ({
  kind: 'fallback',
  fileName,
  reason: 'decode-failed',
})

function emit(...events: Parameters<typeof emitUploadNotice>[0][]) {
  act(() => {
    for (const event of events) emitUploadNotice(event)
  })
}

describe('ImageUploadNotices', () => {
  it('renders no visible DOM', () => {
    const {container} = render(createElement(ImageUploadNotices))
    expect(container.innerHTML).toBe('')
  })

  it('pushes one success toast for a single processed image once the queue is idle', () => {
    render(createElement(ImageUploadNotices))
    emit(processed())
    expect(sanityTestState.toastPush).not.toHaveBeenCalled()
    emit({kind: 'idle'})

    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)
    const params = sanityTestState.toastPush.mock.calls[0][0]
    expect(params).toMatchObject({
      status: 'success',
      title: 'Image optimisée',
      closable: true,
      duration: SUCCESS_TOAST_DURATION_MS,
    })
    expect(params.description).toContain('photo.jpg : 6000 × 4000 px → 2400 × 1600 px')
    expect(typeof params.duration).toBe('number')
  })

  it('groups a whole batch into one toast', () => {
    render(createElement(ImageUploadNotices))
    emit(processed('a.jpg'), processed('b.jpg'), processed('c.jpg'), {kind: 'idle'})
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)
    expect(sanityTestState.toastPush.mock.calls[0][0]).toMatchObject({
      status: 'success',
      title: '3 images optimisées',
    })
  })

  it('pushes a longer warning toast for a fallback', () => {
    render(createElement(ImageUploadNotices))
    emit(fallback(), {kind: 'idle'})
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)
    const params = sanityTestState.toastPush.mock.calls[0][0]
    expect(params).toMatchObject({
      status: 'warning',
      title: 'Image envoyée sans optimisation',
      closable: true,
    })
    expect(params.description).toContain('broken.jpg')
    expect(params.duration).toBe(WARNING_TOAST_DURATION_MS)
    expect(params.duration).toBeGreaterThan(SUCCESS_TOAST_DURATION_MS)
  })

  it('pushes nothing for an idle event without pending notice', () => {
    render(createElement(ImageUploadNotices))
    emit({kind: 'idle'})
    expect(sanityTestState.toastPush).not.toHaveBeenCalled()
  })

  it('flushes after the maximum wait without an idle event, then starts a new wait', () => {
    vi.useFakeTimers()
    render(createElement(ImageUploadNotices))
    emit(processed('a.jpg'))
    act(() => {
      vi.advanceTimersByTime(NOTICE_MAX_WAIT_MS - 1)
    })
    expect(sanityTestState.toastPush).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)

    // The timer is not left running, and a second batch gets its own wait.
    act(() => {
      vi.advanceTimersByTime(NOTICE_MAX_WAIT_MS * 2)
    })
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)
    emit(processed('b.jpg'))
    act(() => {
      vi.advanceTimersByTime(NOTICE_MAX_WAIT_MS)
    })
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(2)
  })

  it('does not drop pending notices when the toast API changes identity between renders', () => {
    const {rerender} = render(createElement(ImageUploadNotices))
    emit(processed())
    const replacement = vi.fn()
    sanityTestState.toastPush = replacement
    rerender(createElement(ImageUploadNotices))
    emit({kind: 'idle'})
    expect(replacement).toHaveBeenCalledTimes(1)
  })

  it('cleans up its subscription and timer on unmount', () => {
    vi.useFakeTimers()
    const {unmount} = render(createElement(ImageUploadNotices))
    emit(processed())
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    emit(processed(), {kind: 'idle'})
    act(() => {
      vi.advanceTimersByTime(NOTICE_MAX_WAIT_MS * 2)
    })
    expect(sanityTestState.toastPush).not.toHaveBeenCalled()
  })

  it('is mounted exactly once by StudioLayout', () => {
    const renderDefault = vi.fn(() => createElement('div', null, 'layout'))
    render(createElement(StudioLayout, {renderDefault, tone: 'default'} as never))
    emit(processed(), {kind: 'idle'})
    expect(renderDefault).toHaveBeenCalledOnce()
    expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1)
  })
})
