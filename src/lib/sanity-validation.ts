import type {
  AboutPage,
  ContactPage,
  Edition,
  EditionsPage,
  Gallery,
  GalleryImage,
  HomePage,
  LocaleString,
  SanityImage,
  SeoSettings,
  SiteSettings,
} from './sanity'

export interface ValidationIssue {
  code: string
  id?: string
  slug?: string
}

export interface SanitizationResult<T> {
  value: T
  issues: ValidationIssue[]
}

type UnknownRecord = Record<string, unknown>

const PUBLICATION_STATUSES = new Set(['preparation', 'published', 'archived'])
const RIGHTS_USAGES = new Set([
  'allRightsReserved',
  'editorialOnly',
  'licensed',
  'publicDomain',
])

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function positiveNumber(value: unknown): number | undefined {
  const number = finiteNumber(value)
  return number !== undefined && number > 0 ? number : undefined
}

function sanitizePartialLocale(value: unknown): Partial<LocaleString> | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const fr = nonEmptyString(record.fr)
  const en = nonEmptyString(record.en)
  if (!fr && !en) return undefined
  return {...(fr ? {fr} : {}), ...(en ? {en} : {})}
}

function sanitizeCompleteLocale(value: unknown): LocaleString | undefined {
  const partial = sanitizePartialLocale(value)
  return partial?.fr && partial.en ? {fr: partial.fr, en: partial.en} : undefined
}

function localeNeedsCleaning(value: unknown): boolean {
  if (value === undefined) return false
  const record = asRecord(value)
  if (!record) return true
  return (record.fr !== undefined && !nonEmptyString(record.fr)) ||
    (record.en !== undefined && !nonEmptyString(record.en))
}

function sanitizeHotspot(value: unknown): SanityImage['hotspot'] | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  const x = finiteNumber(record.x)
  const y = finiteNumber(record.y)
  const height = finiteNumber(record.height)
  const width = finiteNumber(record.width)
  return x !== undefined && y !== undefined && height !== undefined && width !== undefined
    ? {x, y, height, width}
    : undefined
}

function sanitizeCrop(value: unknown): SanityImage['crop'] | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  const top = finiteNumber(record.top)
  const bottom = finiteNumber(record.bottom)
  const left = finiteNumber(record.left)
  const right = finiteNumber(record.right)
  return top !== undefined && bottom !== undefined && left !== undefined && right !== undefined
    ? {top, bottom, left, right}
    : undefined
}

function sanitizeImage(value: unknown): SanityImage | undefined {
  const record = asRecord(value)
  const asset = asRecord(record?.asset)
  const reference = nonEmptyString(asset?._ref)
  if (!record || !reference) return undefined

  const hotspot = sanitizeHotspot(record.hotspot)
  const crop = sanitizeCrop(record.crop)
  return {
    asset: {_ref: reference},
    ...(crop ? {crop} : {}),
    ...(hotspot ? {hotspot} : {}),
  }
}

function sanitizeSeo(value: unknown): SeoSettings | undefined {
  const record = asRecord(value)
  if (!record) return undefined

  const title = sanitizePartialLocale(record.title)
  const description = sanitizePartialLocale(record.description)
  const image = sanitizeImage(record.image)
  const noIndex = typeof record.noIndex === 'boolean' ? record.noIndex : undefined
  if (!title && !description && !image && noIndex === undefined) return undefined

  return {
    ...(title ? {title} : {}),
    ...(description ? {description} : {}),
    ...(image ? {image} : {}),
    ...(noIndex !== undefined ? {noIndex} : {}),
  }
}

function seoNeedsCleaning(value: unknown): boolean {
  if (value === undefined) return false
  const record = asRecord(value)
  if (!record) return true
  return (
    localeNeedsCleaning(record.title) ||
    localeNeedsCleaning(record.description) ||
    (record.image !== undefined && !sanitizeImage(record.image)) ||
    (record.noIndex !== undefined && typeof record.noIndex !== 'boolean')
  )
}

function sanitizeGalleryImage(value: unknown): GalleryImage | undefined {
  const record = asRecord(value)
  const base = sanitizeImage(value)
  if (!record || !base) return undefined

  const partialAlt = sanitizePartialLocale(record.alt)
  const alt = {fr: partialAlt?.fr ?? '', en: partialAlt?.en ?? ''}
  const dimensionsRecord = asRecord(record.dimensions)
  const width = positiveNumber(dimensionsRecord?.width)
  const height = positiveNumber(dimensionsRecord?.height)
  const aspectRatio = positiveNumber(dimensionsRecord?.aspectRatio)
  const dimensions =
    width && height ? {width, height, ...(aspectRatio ? {aspectRatio} : {})} : undefined

  const rightsRecord = asRecord(record.rights)
  const credit = nonEmptyString(rightsRecord?.credit)
  const copyrightNotice = nonEmptyString(rightsRecord?.copyrightNotice)
  const year = finiteNumber(rightsRecord?.year)
  const rawUsage = nonEmptyString(rightsRecord?.usage)
  const usage = rawUsage && RIGHTS_USAGES.has(rawUsage) ? rawUsage : undefined
  const licenseDetails = nonEmptyString(rightsRecord?.licenseDetails)
  const displayCredit =
    typeof rightsRecord?.displayCredit === 'boolean' ? rightsRecord.displayCredit : undefined
  const rights =
    credit || copyrightNotice || year !== undefined || usage || licenseDetails || displayCredit !== undefined
      ? {
          ...(credit ? {credit} : {}),
          ...(copyrightNotice ? {copyrightNotice} : {}),
          ...(year !== undefined ? {year} : {}),
          ...(usage
            ? {usage: usage as NonNullable<GalleryImage['rights']>['usage']}
            : {}),
          ...(licenseDetails ? {licenseDetails} : {}),
          ...(displayCredit !== undefined ? {displayCredit} : {}),
        }
      : undefined

  return {...base, alt, ...(rights ? {rights} : {}), ...(dimensions ? {dimensions} : {})}
}

function safeIdentity(value: unknown): Pick<ValidationIssue, 'id' | 'slug'> {
  const record = asRecord(value)
  return {
    ...(nonEmptyString(record?._id) ? {id: nonEmptyString(record?._id)} : {}),
    ...(nonEmptyString(record?.slug) ? {slug: nonEmptyString(record?.slug)} : {}),
  }
}

function issue(code: string, value?: unknown): ValidationIssue {
  return {code, ...safeIdentity(value)}
}

function sanitizeGalleryDocument(value: unknown): SanitizationResult<Gallery | null> {
  const record = asRecord(value)
  if (!record) return {value: null, issues: [issue('root.not_object', value)]}

  const title = nonEmptyString(record.title)
  const slug = nonEmptyString(record.slug)
  const rawImages = Array.isArray(record.images) ? record.images : []
  const images = rawImages.flatMap((image) => {
    const sanitized = sanitizeGalleryImage(image)
    return sanitized ? [sanitized] : []
  })
  const issues: ValidationIssue[] = []
  if (!title) issues.push(issue('title.missing', value))
  if (!slug) issues.push(issue('slug.missing', value))
  if (images.length !== rawImages.length) issues.push(issue('images.invalid_removed', value))
  if (images.length === 0) issues.push(issue('images.none_renderable', value))
  if (!title || !slug || images.length === 0) return {value: null, issues}

  const statement = sanitizeCompleteLocale(record.statement) ?? {fr: '', en: ''}
  if (!sanitizeCompleteLocale(record.statement)) issues.push(issue('statement.fallback', value))
  if (
    rawImages.some((image) => {
      const imageRecord = asRecord(image)
      return sanitizeImage(image) && !sanitizeCompleteLocale(imageRecord?.alt)
    })
  ) {
    issues.push(issue('images.alt_fallback', value))
  }
  const heroColor = nonEmptyString(record.heroColor)
  const publicationStatus = nonEmptyString(record.publicationStatus)
  const seo = sanitizeSeo(record.seo)
  if (record.seo !== undefined && (!seo || seoNeedsCleaning(record.seo))) {
    issues.push(issue('seo.cleaned', value))
  }

  return {
    value: {
      title,
      slug,
      statement,
      images,
      ...(heroColor ? {heroColor} : {}),
      ...(typeof record.isVisible === 'boolean' ? {isVisible: record.isVisible} : {}),
      ...(PUBLICATION_STATUSES.has(publicationStatus ?? '')
        ? {publicationStatus: publicationStatus as Gallery['publicationStatus']}
        : {}),
      ...(typeof record.showOnHomePage === 'boolean'
        ? {showOnHomePage: record.showOnHomePage}
        : {}),
      ...(seo ? {seo} : {}),
    },
    issues,
  }
}

function sanitizeEditionDocument(value: unknown): SanitizationResult<Edition | null> {
  const base = sanitizeGalleryDocument(value)
  const record = asRecord(value)
  if (!base.value || !record) return base as SanitizationResult<Edition | null>

  const pageCount = positiveNumber(record.pageCount) ?? 0
  const printRun = positiveNumber(record.printRun) ?? 0
  const dimensionsRecord = asRecord(record.dimensions)
  const unit: Edition['dimensions']['unit'] = dimensionsRecord?.unit === 'in' ? 'in' : 'cm'
  const dimensions = {
    width: positiveNumber(dimensionsRecord?.width) ?? 0,
    height: positiveNumber(dimensionsRecord?.height) ?? 0,
    unit,
  }
  const relatedRecord = asRecord(record.relatedGallery)
  const relatedTitle = nonEmptyString(relatedRecord?.title)
  const relatedSlug = nonEmptyString(relatedRecord?.slug)
  const relatedGallery =
    relatedTitle && relatedSlug
      ? {title: relatedTitle, slug: relatedSlug}
      : record.relatedGallery === null
        ? null
        : undefined
  if (!positiveNumber(record.pageCount)) base.issues.push(issue('pageCount.fallback', value))
  if (!positiveNumber(record.printRun)) base.issues.push(issue('printRun.fallback', value))
  if (
    !positiveNumber(dimensionsRecord?.width) ||
    !positiveNumber(dimensionsRecord?.height) ||
    (dimensionsRecord?.unit !== 'cm' && dimensionsRecord?.unit !== 'in')
  ) {
    base.issues.push(issue('dimensions.fallback', value))
  }
  if (record.relatedGallery !== undefined && record.relatedGallery !== null && !relatedGallery) {
    base.issues.push(issue('relatedGallery.removed', value))
  }

  const {heroColor: _heroColor, isVisible: _isVisible, showOnHomePage: _showOnHomePage, seo: _seo, ...shared} =
    base.value
  void _heroColor
  void _isVisible
  void _showOnHomePage
  void _seo

  return {
    value: {
      ...shared,
      pageCount,
      printRun,
      dimensions,
      ...(relatedGallery !== undefined ? {relatedGallery} : {}),
    },
    issues: base.issues,
  }
}

function sanitizeCollection<T>(
  value: unknown,
  documentSanitizer: (document: unknown) => SanitizationResult<T | null>,
): SanitizationResult<T[]> {
  if (!Array.isArray(value)) return {value: [], issues: [issue('root.not_array', value)]}

  const results = value.map(documentSanitizer)
  return {
    value: results.flatMap((result) => (result.value ? [result.value] : [])),
    issues: results.flatMap((result) => result.issues),
  }
}

export function sanitizeSiteSettings(value: unknown): SanitizationResult<SiteSettings | null> {
  const record = asRecord(value)
  if (!record) return {value: null, issues: [issue('root.not_object', value)]}

  const siteTitle = sanitizeCompleteLocale(record.siteTitle)
  const footerText = sanitizeCompleteLocale(record.footerText)
  const navRecord = asRecord(record.navLabels)
  if (!siteTitle || !footerText || !navRecord) {
    const reasons = [
      ...(!siteTitle ? ['siteTitle.invalid'] : []),
      ...(!navRecord ? ['navLabels.invalid'] : []),
      ...(!footerText ? ['footerText.invalid'] : []),
    ]
    return {value: null, issues: reasons.map((reason) => issue(reason, value))}
  }

  const navLabels = {
    ...(sanitizePartialLocale(navRecord.about)
      ? {about: sanitizePartialLocale(navRecord.about)}
      : {}),
    ...(sanitizePartialLocale(navRecord.contact)
      ? {contact: sanitizePartialLocale(navRecord.contact)}
      : {}),
    ...(sanitizePartialLocale(navRecord.editions)
      ? {editions: sanitizePartialLocale(navRecord.editions)}
      : {}),
  }
  const defaultSeo = sanitizeSeo(record.defaultSeo)
  const issues: ValidationIssue[] = []
  if (record.defaultSeo !== undefined && (!defaultSeo || seoNeedsCleaning(record.defaultSeo))) {
    issues.push(issue('defaultSeo.cleaned', value))
  }
  if (['about', 'contact', 'editions'].some((key) => localeNeedsCleaning(navRecord[key]))) {
    issues.push(issue('navLabels.invalid_removed', value))
  }

  return {
    value: {siteTitle, navLabels, footerText, ...(defaultSeo ? {defaultSeo} : {})},
    issues,
  }
}

export function sanitizeAboutPage(value: unknown): SanitizationResult<AboutPage | null> {
  const record = asRecord(value)
  if (!record) return {value: null, issues: [issue('root.not_object', value)]}

  const biography = sanitizePartialLocale(record.biography)
  const practice = sanitizePartialLocale(record.practice)
  const medium = sanitizePartialLocale(record.medium)
  const sanitizeAboutImage = (candidate: unknown) => {
    const candidateRecord = asRecord(candidate)
    const image = sanitizeImage(candidate)
    if (!candidateRecord || !image) return undefined
    const alt = sanitizePartialLocale(candidateRecord.alt)
    return {...image, ...(alt ? {alt} : {})}
  }
  const image = sanitizeAboutImage(record.image)
  const exhibitionImage = sanitizeAboutImage(record.exhibitionImage)
  const seo = sanitizeSeo(record.seo)
  const issues: ValidationIssue[] = []
  for (const [field, sanitized] of [
    ['biography', biography],
    ['practice', practice],
    ['medium', medium],
    ['image', image],
    ['exhibitionImage', exhibitionImage],
    ['seo', seo],
  ] as const) {
    const isLocaleField = field === 'biography' || field === 'practice' || field === 'medium'
    const nestedAlt =
      field === 'image' || field === 'exhibitionImage'
        ? asRecord(record[field])?.alt
        : undefined
    const cleaned =
      !sanitized ||
      (isLocaleField && localeNeedsCleaning(record[field])) ||
      (nestedAlt !== undefined && localeNeedsCleaning(nestedAlt)) ||
      (field === 'seo' && seoNeedsCleaning(record[field]))
    if (record[field] !== undefined && cleaned) issues.push(issue(`${field}.cleaned`, value))
  }

  return {
    value: {
      ...(biography ? {biography} : {}),
      ...(practice ? {practice} : {}),
      ...(medium ? {medium} : {}),
      ...(image ? {image} : {}),
      ...(exhibitionImage ? {exhibitionImage} : {}),
      ...(seo ? {seo} : {}),
    },
    issues,
  }
}

function sanitizeIntroPage<T extends HomePage | EditionsPage>(
  value: unknown,
  includeSeo: boolean,
): SanitizationResult<T | null> {
  const record = asRecord(value)
  if (!record) return {value: null, issues: [issue('root.not_object', value)]}
  const intro = sanitizePartialLocale(record.intro)
  const seo = includeSeo ? sanitizeSeo(record.seo) : undefined
  const issues: ValidationIssue[] = []
  if (record.intro !== undefined && (!intro || localeNeedsCleaning(record.intro))) {
    issues.push(issue('intro.cleaned', value))
  }
  if (includeSeo && record.seo !== undefined && (!seo || seoNeedsCleaning(record.seo))) {
    issues.push(issue('seo.cleaned', value))
  }
  return {
    value: {...(intro ? {intro} : {}), ...(seo ? {seo} : {})} as T,
    issues,
  }
}

export function sanitizeHomePage(value: unknown): SanitizationResult<HomePage | null> {
  return sanitizeIntroPage<HomePage>(value, true)
}

export function sanitizeEditionsPage(value: unknown): SanitizationResult<EditionsPage | null> {
  return sanitizeIntroPage<EditionsPage>(value, false)
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function sanitizeContactPage(value: unknown): SanitizationResult<ContactPage | null> {
  const record = asRecord(value)
  if (!record) return {value: null, issues: [issue('root.not_object', value)]}

  const intro = sanitizePartialLocale(record.intro)
  const location = sanitizePartialLocale(record.location)
  const availability = sanitizePartialLocale(record.availability)
  const publicEmail = isEmail(record.publicEmail) ? record.publicEmail : undefined
  const seo = sanitizeSeo(record.seo)
  const rawLinks = Array.isArray(record.professionalLinks) ? record.professionalLinks : []
  const professionalLinks = rawLinks.flatMap((link) => {
    const linkRecord = asRecord(link)
    const label = sanitizePartialLocale(linkRecord?.label)
    if (!linkRecord || !label || !isHttpUrl(linkRecord.url)) return []
    const key = nonEmptyString(linkRecord._key)
    return [{...(key ? {_key: key} : {}), label, url: linkRecord.url}]
  })
  const issues: ValidationIssue[] = []
  for (const [field, sanitized] of [
    ['intro', intro],
    ['location', location],
    ['availability', availability],
    ['seo', seo],
  ] as const) {
    const cleaned =
      !sanitized ||
      (field === 'seo' ? seoNeedsCleaning(record[field]) : localeNeedsCleaning(record[field]))
    if (record[field] !== undefined && cleaned) issues.push(issue(`${field}.cleaned`, value))
  }
  if (record.publicEmail !== undefined && !publicEmail) issues.push(issue('publicEmail.removed', value))
  if (professionalLinks.length !== rawLinks.length) {
    issues.push(issue('professionalLinks.invalid_removed', value))
  }

  return {
    value: {
      ...(intro ? {intro} : {}),
      ...(publicEmail ? {publicEmail} : {}),
      ...(location ? {location} : {}),
      ...(availability ? {availability} : {}),
      ...(professionalLinks.length > 0 ? {professionalLinks} : {}),
      ...(seo ? {seo} : {}),
    },
    issues,
  }
}

export function sanitizeGalleries(value: unknown): SanitizationResult<Gallery[]> {
  return sanitizeCollection(value, sanitizeGalleryDocument)
}

export function sanitizeGallery(value: unknown): SanitizationResult<Gallery | null> {
  return sanitizeGalleryDocument(value)
}

export function sanitizeEditions(value: unknown): SanitizationResult<Edition[]> {
  return sanitizeCollection(value, sanitizeEditionDocument)
}

export function sanitizeEdition(value: unknown): SanitizationResult<Edition | null> {
  return sanitizeEditionDocument(value)
}

export function warnForSanityIssues(documentType: string, issues: ValidationIssue[]): void {
  const grouped = new Map<string, {id?: string; slug?: string; reasons: string[]}>()
  for (const current of issues) {
    const key = `${current.id ?? ''}\u0000${current.slug ?? ''}`
    const group = grouped.get(key) ?? {
      ...(current.id ? {id: current.id} : {}),
      ...(current.slug ? {slug: current.slug} : {}),
      reasons: [],
    }
    group.reasons.push(current.code)
    grouped.set(key, group)
  }

  for (const diagnostic of grouped.values()) {
    console.warn('[sanity-validation]', {documentType, ...diagnostic})
  }
}
