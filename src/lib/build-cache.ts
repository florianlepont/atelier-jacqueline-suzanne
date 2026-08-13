type CacheModeOverride = boolean | null

const promiseCache = new Map<string, Promise<unknown>>()
let cacheModeOverride: CacheModeOverride = null

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value) ?? String(value)
}

function isBuildCacheEnabled(): boolean {
  if (cacheModeOverride !== null) return cacheModeOverride
  return Boolean(import.meta.env.PROD && !import.meta.env.TEST)
}

export function createBuildCacheKey(name: string, parameters: unknown = null): string {
  return `${name}:${stableSerialize(parameters)}`
}

/**
 * Shares successful in-flight and settled reads during a production static
 * build. Development and tests deliberately bypass the cache so editorial
 * changes and test fixtures are always fresh.
 */
export function getBuildCached<T>(
  name: string,
  parameters: unknown,
  load: () => Promise<T>,
): Promise<T> {
  if (!isBuildCacheEnabled()) return load()

  const key = createBuildCacheKey(name, parameters)
  const existing = promiseCache.get(key) as Promise<T> | undefined
  if (existing) return existing

  const pending = load().catch((error: unknown) => {
    if (promiseCache.get(key) === pending) promiseCache.delete(key)
    throw error
  })
  promiseCache.set(key, pending)
  return pending
}

/** Test seam: avoids mutating process.env or Vite's import.meta.env object. */
export function setBuildCacheEnabledForTests(enabled: CacheModeOverride): void {
  cacheModeOverride = enabled
  promiseCache.clear()
}

export function resetBuildCacheForTests(): void {
  cacheModeOverride = null
  promiseCache.clear()
}
