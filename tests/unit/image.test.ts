import {beforeEach, describe, expect, it, vi} from 'vitest'

const builderState = vi.hoisted(() => ({operations: [] as string[]}))

vi.mock('@sanity/image-url', () => {
  const chain = {
    image: (value: unknown) => {
      builderState.operations.push(`image:${JSON.stringify(value)}`)
      return chain
    },
    width: (value: number) => {
      builderState.operations.push(`width:${value}`)
      return chain
    },
    height: (value: number) => {
      builderState.operations.push(`height:${value}`)
      return chain
    },
    fit: (value: string) => {
      builderState.operations.push(`fit:${value}`)
      return chain
    },
    blur: (value: number) => {
      builderState.operations.push(`blur:${value}`)
      return chain
    },
    auto: (value: string) => {
      builderState.operations.push(`auto:${value}`)
      return chain
    },
    url: () => builderState.operations.join('|'),
  }
  return {createImageUrlBuilder: () => chain}
})

vi.mock('../../src/lib/sanity', () => ({sanityClient: {}}))

import {blurPlaceholderUrl, fullSizeUrl, thumbnailUrl} from '../../src/lib/image'

const image = {asset: {_ref: 'image-test-100x100-jpg'}}

describe('Sanity image URL helpers', () => {
  beforeEach(() => {
    builderState.operations = []
  })

  it('builds a square crop thumbnail with the default size', () => {
    expect(thumbnailUrl(image as never)).toContain('width:600|height:600|fit:crop|auto:format')
  })

  it('builds an uncropped full-size URL with an explicit maximum width', () => {
    expect(fullSizeUrl(image as never, 1200)).toContain('width:1200|fit:max|auto:format')
  })

  it('builds the tiny blurred placeholder rendition', () => {
    expect(blurPlaceholderUrl(image as never)).toContain('width:24|blur:50|auto:format')
  })
})
