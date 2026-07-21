import type {ComponentType, SVGProps} from 'react'
import {BulbOutlineIcon, ErrorOutlineIcon, PublishIcon, TaskIcon} from '@sanity/icons'
import type {TransactionLogEventWithMutations, TransactionLogMutation, User} from '@sanity/types'
import {summarizeChecks} from './checks'
import type {CheckItem} from './checks'

export interface DashboardDocument extends Record<string, unknown> {
  _id: string
  _type: string
  _updatedAt: string
  title?: string
  isVisible?: boolean
  publicationStatus?: string
  images?: unknown[]
}

export interface DashboardRow {
  id: string
  current: DashboardDocument
  hasDraft: boolean
  isPublished: boolean
  lastUpdatedAt: string
  checks: CheckItem[]
  summary: ReturnType<typeof summarizeChecks>
}

export interface DashboardActivity {
  authorName: string
  authorImageUrl?: string
  description: string
  action: ActivityAction
  timestamp: string
}

export type ActivityAction = 'created' | 'modified' | 'published' | 'unpublished'

export type DashboardTone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

export type Severity = 'Bloquant' | 'Important' | 'Suggestion'

export interface AttentionGroup {
  id: string
  severity: Severity
  title: string
  description: string
  actionVerb: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: DashboardTone
  rows: DashboardRow[]
}

export const typeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  homePage: "Page d'accueil",
  aboutPage: 'Page À propos',
  contactPage: 'Page Contact',
  siteSettings: 'Réglages du site',
  exhibition: 'Exposition',
}

export const rowTypeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  homePage: 'Page',
  aboutPage: 'Page',
  contactPage: 'Page',
  siteSettings: 'Réglages',
  exhibition: 'Exposition',
}

export const fieldLabels: Record<string, string> = {
  title: 'le titre',
  slug: 'l’adresse',
  statement: 'la présentation',
  images: 'les photos',
  seo: 'le SEO',
  publicationStatus: 'la visibilité',
  isVisible: 'la visibilité',
  intro: 'l’introduction',
  biography: 'la biographie',
  practice: 'la pratique',
  medium: 'les techniques',
  publicEmail: 'l’adresse e-mail',
  professionalLinks: 'les liens',
  siteTitle: 'le nom du site',
  navLabels: 'la navigation',
  footerText: 'le pied de page',
  defaultSeo: 'le SEO global',
  startDate: 'la date',
  venue: 'le lieu',
  city: 'la ville',
  description: 'la description',
  image: 'l’image',
}

export function baseId(id: string) {
  return id.replace(/^drafts\./, '')
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`) {
  return count > 1 ? plural : singular
}

export function documentTitle(document: DashboardDocument) {
  if (document._type === 'gallery' || document._type === 'exhibition') {
    return (
      document.title ||
      (document._type === 'gallery' ? 'Collection sans nom' : 'Événement sans nom')
    )
  }
  return typeLabels[document._type] || document._type
}

export function isGalleryOnline(document: DashboardDocument) {
  return document.publicationStatus
    ? document.publicationStatus === 'published'
    : document.isVisible !== false
}

export function mutationDocumentId(mutation: TransactionLogMutation) {
  if ('patch' in mutation) return 'id' in mutation.patch ? mutation.patch.id : undefined
  if ('delete' in mutation) return 'id' in mutation.delete ? mutation.delete.id : undefined
  if ('create' in mutation) return mutation.create._id
  if ('createOrReplace' in mutation) return mutation.createOrReplace._id
  if ('createIfNotExists' in mutation) return mutation.createIfNotExists._id
  if ('createSquashed' in mutation) return mutation.createSquashed.document._id
  return undefined
}

export function mutationFields(mutation: TransactionLogMutation) {
  if (!('patch' in mutation)) return []

  const patch = mutation.patch as unknown as Record<string, unknown>
  const paths: string[] = []
  for (const operation of ['set', 'setIfMissing', 'merge', 'diffMatchPatch', 'inc', 'dec']) {
    const value = patch[operation]
    if (value && typeof value === 'object') paths.push(...Object.keys(value))
  }
  if (Array.isArray(patch.unset))
    paths.push(...patch.unset.filter((path): path is string => typeof path === 'string'))

  const insert = patch.insert
  if (insert && typeof insert === 'object') {
    const position = insert as Record<string, unknown>
    for (const key of ['before', 'after', 'replace']) {
      if (typeof position[key] === 'string') paths.push(position[key])
    }
  }

  return paths
    .map((path) =>
      path
        .replace(/^\[['"]?/, '')
        .split(/[.[]/, 1)[0]
        .replace(/['"]?\]$/, ''),
    )
    .filter((field) => field && !field.startsWith('_'))
}

export function contentNoun(document: DashboardDocument) {
  if (document._type === 'gallery') return 'cette collection'
  if (document._type === 'exhibition') return 'cette exposition'
  if (document._type === 'siteSettings') return 'les réglages du site'
  return 'cette page'
}

export function describeTransaction(
  document: DashboardDocument,
  mutations: TransactionLogMutation[],
  id: string,
) {
  const relevant = mutations.filter((mutation) => baseId(mutationDocumentId(mutation) || '') === id)
  const publishedWrite = relevant.some(
    (mutation) =>
      mutationDocumentId(mutation) === id &&
      ('create' in mutation || 'createOrReplace' in mutation || 'createIfNotExists' in mutation),
  )
  const draftDeleted = relevant.some(
    (mutation) => 'delete' in mutation && mutationDocumentId(mutation) === `drafts.${id}`,
  )
  const publishedDeleted = relevant.some(
    (mutation) => 'delete' in mutation && mutationDocumentId(mutation) === id,
  )
  const created = relevant.some(
    (mutation) =>
      'create' in mutation || 'createOrReplace' in mutation || 'createIfNotExists' in mutation,
  )

  if (publishedWrite && draftDeleted) {
    return {action: 'published' as const, description: `a publié ${contentNoun(document)}`}
  }
  if (publishedDeleted && !publishedWrite) {
    return {
      action: 'unpublished' as const,
      description: `a retiré ${contentNoun(document)} du site`,
    }
  }
  if (created) return {action: 'created' as const, description: `a créé ${contentNoun(document)}`}

  const labels = Array.from(
    new Set(
      relevant
        .flatMap(mutationFields)
        .map((field) => fieldLabels[field])
        .filter(Boolean),
    ),
  )
  if (labels.length === 1)
    return {action: 'modified' as const, description: `a modifié ${labels[0]}`}
  if (labels.length === 2) {
    return {
      action: 'modified' as const,
      description: `a modifié ${labels[0]} et ${labels[1]}`,
    }
  }
  if (labels.length > 2) {
    return {
      action: 'modified' as const,
      description: `a modifié ${labels[0]}, ${labels[1]} et ${labels.length - 2} autre(s) élément(s)`,
    }
  }
  return {action: 'modified' as const, description: `a modifié ${contentNoun(document)}`}
}

export function buildActivities(
  transactions: TransactionLogEventWithMutations[],
  users: User[],
  documents: DashboardDocument[],
) {
  const usersById = new Map(users.map((user) => [user.id, user]))
  const documentsById = new Map(documents.map((document) => [baseId(document._id), document]))
  const activities: Record<string, DashboardActivity> = {}

  for (const transaction of [...transactions].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )) {
    for (const transactionDocumentId of transaction.documentIDs) {
      const id = baseId(transactionDocumentId)
      const document = documentsById.get(id)
      if (!document || activities[id]) continue

      const user = usersById.get(transaction.author)
      const activity = describeTransaction(document, transaction.mutations, id)
      activities[id] = {
        authorName: user?.displayName || user?.email || 'Un membre de l’équipe',
        authorImageUrl: user?.imageUrl,
        ...activity,
        timestamp: transaction.timestamp,
      }
    }
  }

  return activities
}

export function buildAttentionGroups(rows: DashboardRow[]): AttentionGroup[] {
  const groups: AttentionGroup[] = [
    {
      id: 'blocking',
      severity: 'Bloquant',
      title: 'Informations manquantes',
      description: 'Empêche la publication de ce contenu',
      actionVerb: 'Compléter',
      icon: ErrorOutlineIcon,
      tone: 'critical',
      rows: [],
    },
    {
      id: 'publish',
      severity: 'Important',
      title: 'Modifications à publier',
      description: 'Le site affiche encore l’ancienne version',
      actionVerb: 'Publier',
      icon: PublishIcon,
      tone: 'caution',
      rows: [],
    },
    {
      id: 'finish',
      severity: 'Important',
      title: 'À finaliser',
      description: 'Encore en préparation ou hors ligne',
      actionVerb: 'Finaliser',
      icon: TaskIcon,
      tone: 'primary',
      rows: [],
    },
    {
      id: 'recommended',
      severity: 'Suggestion',
      title: 'Améliorations recommandées',
      description: 'Optionnel — améliore la visibilité sur Google',
      actionVerb: 'Améliorer',
      icon: BulbOutlineIcon,
      tone: 'default',
      rows: [],
    },
  ]

  for (const row of rows) {
    if (!row.summary.requiredComplete) groups[0].rows.push(row)
    else if (row.hasDraft && row.isPublished) groups[1].rows.push(row)
    else if (
      row.current.publicationStatus === 'preparation' ||
      (!row.current.publicationStatus && row.current.isVisible === false) ||
      !row.isPublished
    ) {
      groups[2].rows.push(row)
    } else {
      groups[3].rows.push(row)
    }
  }

  return groups.filter((group) => group.rows.length > 0)
}

export function attentionPriority(row: DashboardRow) {
  if (!row.summary.requiredComplete) return 0
  if (row.hasDraft && row.isPublished) return 1
  if (
    row.current.publicationStatus === 'preparation' ||
    (!row.current.publicationStatus && row.current.isVisible === false) ||
    !row.isPublished
  ) {
    return 2
  }
  return 3
}

export function compactCheckLabel(label: string) {
  return label
    .replace(/français et anglais|française et anglaise|françaises et anglaises/gi, 'FR et EN')
    .replace('Libellés FR et EN des liens professionnels', 'Libellés des liens FR et EN')
    .replace('Descriptions manquantes :', 'Textes alternatifs :')
    .replace('Descriptions accessibles de toutes les photos', 'Textes alternatifs des photos')
    .replace('Titres SEO FR et EN', 'Titre pour Google (FR et EN)')
    .replace('Descriptions SEO FR et EN', 'Description pour Google (FR et EN)')
    .replace('Image de partage', 'Aperçu sur les réseaux sociaux')
}

// Title and description for Google almost always go missing together; naming
// them as two list items doubled the "(FR et EN)" noise on every row.
export function mergePairedCheckLabels(labels: string[]) {
  const title = 'Titre pour Google (FR et EN)'
  const description = 'Description pour Google (FR et EN)'
  if (!labels.includes(title) || !labels.includes(description)) return labels
  return [
    'Titre et description pour Google (FR et EN)',
    ...labels.filter((label) => label !== title && label !== description),
  ]
}

export function attentionRowSummary(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish') return 'Publier les modifications en attente'
  if (group.id === 'finish') return 'Finaliser le contenu et le mettre en ligne'

  const recommended = group.id === 'recommended'
  const missing = mergePairedCheckLabels(
    row.checks
      .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
      .map((check) => compactCheckLabel(check.label)),
  )

  // Naming the first couple of items outright ("Image de couverture,
  // description anglaise et 3 autres informations") lets the user gauge the
  // effort before opening the content -- a bare count ("5 informations à
  // compléter") reads clearer for one item but leaves the rest abstract.
  if (missing.length === 0) return ''
  if (missing.length === 1) return missing[0]
  if (missing.length === 2) return `${missing[0]} et ${missing[1]}`
  const rest = missing.length - 2
  return `${missing[0]}, ${missing[1]} et ${rest} ${pluralize(rest, 'autre information', 'autres informations')} à compléter`
}

export function attentionRowSummaryDetail(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish' || group.id === 'finish') return attentionRowSummary(row, group)
  const recommended = group.id === 'recommended'
  const missing = row.checks
    .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
    .map((check) => compactCheckLabel(check.label))
  // The tooltip keeps the unmerged list: it exists to show the full detail.
  return missing.join(' · ')
}

export function editorialStatus(row: DashboardRow): {label: string; tone: DashboardTone} {
  if (row.current.publicationStatus === 'archived') return {label: 'Archivé', tone: 'default'}
  if (
    row.current.publicationStatus === 'preparation' ||
    (!row.current.publicationStatus && row.current.isVisible === false)
  ) {
    return {label: 'En préparation', tone: 'caution'}
  }
  if (row.hasDraft && row.isPublished) {
    return {label: 'Modifications non publiées', tone: 'primary'}
  }
  if (row.isPublished && (row.current._type !== 'gallery' || isGalleryOnline(row.current))) {
    return {label: 'En ligne', tone: 'positive'}
  }
  return {label: 'En préparation', tone: 'caution'}
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function formatActivityDate(value: string, now: Date = new Date()) {
  const date = new Date(value)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})

  if (sameCalendarDay(date, now)) return `Aujourd’hui à ${time}`
  if (sameCalendarDay(date, yesterday)) return `Hier à ${time}`
  return `${date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} à ${time}`
}

export function formatRelativeDate(value: string, now: Date = new Date()) {
  const date = new Date(value)
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameCalendarDay(date, yesterday)) return 'hier'
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? {year: 'numeric'} : {}),
  })
}
