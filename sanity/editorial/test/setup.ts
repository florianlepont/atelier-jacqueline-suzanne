import {cleanup} from '@testing-library/react'
import {createElement} from 'react'
import {afterEach, vi} from 'vitest'

vi.mock('@sanity/ui', async () => {
  const {
    Primitive,
    TestButton,
    TestCheckbox,
    TestSelect,
    TestTextInput,
    sanityTestState,
  } = await import('./mocks')
  return {
    Badge: Primitive,
    Box: Primitive,
    Button: TestButton,
    Card: Primitive,
    Checkbox: TestCheckbox,
    Flex: Primitive,
    Grid: Primitive,
    Heading: Primitive,
    Label: Primitive,
    Select: TestSelect,
    Spinner: () => createElement('span', {role: 'status'}, 'Chargement'),
    Stack: Primitive,
    Switch: TestCheckbox,
    Text: Primitive,
    TextInput: TestTextInput,
    useToast: () => ({push: sanityTestState.toastPush}),
  }
})

vi.mock('sanity', async (importOriginal) => {
  const {TestButton, sanityTestState} = await import('./mocks')
  // defineField/defineType/defineArrayMember are real (not stubbed): they're
  // pure identity builders with no Studio/React dependency, so schemas/'s
  // own tests (sanity/schemas/__tests__/) can exercise real schema-building
  // helpers under this same setup file without a separate mock surface.
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    defineArrayMember: actual.defineArrayMember,
    defineField: actual.defineField,
    defineType: actual.defineType,
    IntentButton: TestButton,
    useClient: () => sanityTestState.client,
    useEditState: () => sanityTestState.editState,
    useHistoryStore: () => sanityTestState.historyStore,
    useUserStore: () => sanityTestState.userStore,
  }
})

vi.mock('sanity/router', async () => {
  const {Primitive} = await import('./mocks')
  return {
    IntentLink: (props: Record<string, unknown>) =>
      createElement(Primitive, {...props, as: 'a'}),
  }
})

vi.mock('sanity/structure', async () => {
  const {sanityTestState} = await import('./mocks')
  return {useDocumentPane: () => sanityTestState.documentPane}
})

vi.mock('styled-components', () => ({
  createGlobalStyle: () => () => null,
}))

afterEach(async () => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllMocks()
  const {resetSanityTestState} = await import('./mocks')
  resetSanityTestState()
})
