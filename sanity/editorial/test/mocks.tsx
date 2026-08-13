import type {ComponentPropsWithoutRef, ElementType, ReactNode} from 'react'
import {vi} from 'vitest'

type FetchImplementation = (
  query: string,
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
) => Promise<unknown>

export interface SanityTestClient {
  fetch: ReturnType<typeof vi.fn<FetchImplementation>>
  listen: ReturnType<typeof vi.fn>
  action: ReturnType<typeof vi.fn>
  transaction: ReturnType<typeof vi.fn>
}

function defaultFetch(query: string): Promise<unknown> {
  if (query.includes('"assets"')) return Promise.resolve({assets: [], galleries: []})
  if (query.includes("_id == 'siteDeployment'")) return Promise.resolve(null)
  return Promise.resolve([])
}

export const sanityTestState = {
  unsubscribe: vi.fn(),
  openInspector: vi.fn(),
  toastPush: vi.fn(),
  historyStore: {getTransactions: vi.fn(() => Promise.resolve([]))},
  userStore: {getUsers: vi.fn(() => Promise.resolve([]))},
  editState: {
    draft: null as Record<string, unknown> | null,
    published: {_id: 'gallery-1', _type: 'gallery', title: 'Collection test'} as Record<
      string,
      unknown
    > | null,
  },
  documentPane: {
    documentId: 'gallery-1',
    documentType: 'gallery',
    ready: true,
    inspector: {name: 'checklist'} as unknown,
    openInspector: vi.fn(),
  },
  client: null as unknown as SanityTestClient,
}

export function createSanityTestClient(fetchImplementation: FetchImplementation = defaultFetch) {
  const transaction = {
    createIfNotExists: vi.fn(),
    patch: vi.fn(),
    commit: vi.fn(() => Promise.resolve({})),
  }
  const client: SanityTestClient = {
    fetch: vi.fn(fetchImplementation),
    listen: vi.fn(() => ({
      subscribe: vi.fn(() => ({unsubscribe: sanityTestState.unsubscribe})),
    })),
    action: vi.fn(() => Promise.resolve({})),
    transaction: vi.fn(() => transaction),
  }
  sanityTestState.client = client
  return client
}

export function resetSanityTestState() {
  sanityTestState.unsubscribe = vi.fn()
  sanityTestState.openInspector = vi.fn()
  sanityTestState.toastPush = vi.fn()
  sanityTestState.historyStore = {getTransactions: vi.fn(() => Promise.resolve([]))}
  sanityTestState.userStore = {getUsers: vi.fn(() => Promise.resolve([]))}
  sanityTestState.editState = {
    draft: null,
    published: {_id: 'gallery-1', _type: 'gallery', title: 'Collection test'},
  }
  sanityTestState.documentPane = {
    documentId: 'gallery-1',
    documentType: 'gallery',
    ready: true,
    inspector: {name: 'checklist'},
    openInspector: vi.fn(),
  }
  createSanityTestClient()
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return {promise, resolve, reject}
}

type PrimitiveProps<T extends ElementType> = {
  as?: T
  children?: ReactNode
  text?: ReactNode
  icon?: ElementType
  iconRight?: ElementType
  loading?: boolean
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'> &
  Record<string, unknown>

export function Primitive<T extends ElementType = 'div'>({
  as,
  children,
  text,
  icon: Icon,
  iconRight: IconRight,
  loading: _loading,
  tone: _tone,
  mode: _mode,
  padding: _padding,
  paddingX: _paddingX,
  paddingY: _paddingY,
  paddingTop: _paddingTop,
  paddingBottom: _paddingBottom,
  paddingLeft: _paddingLeft,
  paddingRight: _paddingRight,
  radius: _radius,
  shadow: _shadow,
  space: _space,
  gap: _gap,
  align: _align,
  justify: _justify,
  wrap: _wrap,
  columns: _columns,
  muted: _muted,
  size: _size,
  weight: _weight,
  fontSize: _fontSize,
  textOverflow: _textOverflow,
  border: _border,
  sizing: _sizing,
  overflow: _overflow,
  ...props
}: PrimitiveProps<T>) {
  const Component = (as ?? 'div') as ElementType
  return (
    <Component {...props}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {text ?? children}
      {IconRight ? <IconRight aria-hidden="true" /> : null}
    </Component>
  )
}

export function TestButton(props: PrimitiveProps<'button'>) {
  return <Primitive as={props.as ?? 'button'} type={props.as ? undefined : 'button'} {...props} />
}

export function TestCheckbox({checked, onChange, ...props}: Record<string, unknown>) {
  return (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={onChange as ComponentPropsWithoutRef<'input'>['onChange']}
      {...(props as ComponentPropsWithoutRef<'input'>)}
    />
  )
}

export function TestSelect(props: ComponentPropsWithoutRef<'select'>) {
  return <select {...props} />
}

export function TestTextInput(props: ComponentPropsWithoutRef<'input'>) {
  return <input {...props} />
}

resetSanityTestState()
