// @ts-check
// Pure logic for scripts/sanity-downsize-images.mjs. Everything here is
// side-effect-free (no process access, no sharp, no Sanity client, no global
// fetch: network and image decoding are injected) so it can be unit-tested
// exhaustively; the CLI wires it to the outside world.

import { parseArgs } from 'node:util';

export const DEFAULT_THRESHOLD = 2400;
export const MIN_THRESHOLD = 800;
export const RESIZABLE_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
// Quality value sent to the Sanity CDN for JPEG and WebP (PNG is lossless).
export const OUTPUT_QUALITY = 90;
// The reduced height may differ from the one computed from the recorded size
// by at most this many pixels (rounding differences).
export const HEIGHT_TOLERANCE_PX = 1;
export const REDACTED = '[REDACTED]';

/**
 * Shape of the GROQ projection used by the CLI. Every field is optional so
 * callers (and tests) can pass partial fixtures.
 * @typedef {object} ImageAsset
 * @property {string} _id
 * @property {string} [originalFilename]
 * @property {string} [mimeType]
 * @property {string} [extension]
 * @property {number} [size]
 * @property {string} [url]
 * @property {number | null} [width]
 * @property {number | null} [height]
 */

/**
 * @typedef {object} SkippedAsset
 * @property {ImageAsset} asset
 * @property {'UNSUPPORTED_FORMAT' | 'UNKNOWN_DIMENSIONS'} reason
 */

/**
 * @typedef {{ _id: string, _type?: string, _rev?: string, [key: string]: unknown }} SanityDocument
 */

/**
 * @typedef {object} ReferencePatch
 * @property {string} documentId
 * @property {string} ifRevisionID
 * @property {Record<string, string>} set
 */

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isPositiveFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Pick the assets that are wider than the threshold. Selection depends ONLY
 * on width and mime type, never on references: after a successful --apply the
 * old assets are still "oversized", which is exactly what a later
 * --delete-originals run needs to find.
 *
 * @param {readonly ImageAsset[]} assets
 * @param {number} [threshold]
 * @returns {{ oversized: ImageAsset[], skipped: SkippedAsset[] }}
 */
export function selectOversizedAssets(assets, threshold = DEFAULT_THRESHOLD) {
  /** @type {ImageAsset[]} */
  const oversized = [];
  /** @type {SkippedAsset[]} */
  const skipped = [];
  for (const asset of assets) {
    if (!isPositiveFiniteNumber(asset.width)) {
      skipped.push({ asset, reason: 'UNKNOWN_DIMENSIONS' });
      continue;
    }
    if (asset.width <= threshold) continue;
    if (!asset.mimeType || !RESIZABLE_MIME_TYPES.includes(asset.mimeType)) {
      skipped.push({ asset, reason: 'UNSUPPORTED_FORMAT' });
      continue;
    }
    oversized.push(asset);
  }
  /** @type {(a: ImageAsset, b: ImageAsset) => number} */
  const byWidthThenId = (a, b) => (b.width ?? 0) - (a.width ?? 0) || (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
  oversized.sort(byWidthThenId);
  skipped.sort((a, b) => (a.asset._id < b.asset._id ? -1 : a.asset._id > b.asset._id ? 1 : 0));
  return { oversized, skipped };
}

/**
 * Width-driven target size: never upscales, keeps the aspect ratio.
 *
 * @param {{ width: number, height: number }} dimensions
 * @param {number} [maxWidth]
 * @returns {{ width: number, height: number }}
 */
export function computeTargetDimensions(dimensions, maxWidth = DEFAULT_THRESHOLD) {
  const { width, height } = dimensions ?? {};
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height) || !isPositiveFiniteNumber(maxWidth)) {
    throw new RangeError('Dimensions invalides : largeur, hauteur et largeur maximale doivent être des nombres > 0.');
  }
  if (width <= maxWidth) return { width, height };
  const targetWidth = Math.round(maxWidth);
  return { width: targetWidth, height: Math.max(1, Math.round((height * targetWidth) / width)) };
}

/**
 * @param {string} assetId e.g. `image-<sha1>-2400x1600-jpg`
 * @returns {{ hash: string, width: number, height: number, extension: string } | null}
 */
export function parseImageAssetId(assetId) {
  if (typeof assetId !== 'string') return null;
  const match = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-([A-Za-z0-9]+)$/.exec(assetId);
  if (!match) return null;
  return { hash: match[1], width: Number(match[2]), height: Number(match[3]), extension: match[4] };
}

/**
 * File name to give the reduced upload: the original one, or one derived from
 * the asset id when Sanity never recorded it.
 *
 * @param {ImageAsset} asset
 * @returns {string}
 */
export function deriveFilename(asset) {
  if (asset.originalFilename) return asset.originalFilename;
  const parsed = parseImageAssetId(asset._id);
  return parsed ? `${parsed.hash}.${parsed.extension}` : 'image';
}

/**
 * Error raised when the reduced image cannot be requested or does not pass
 * validation. Nothing may be uploaded for the image concerned.
 */
export class ReducedImageError extends Error {
  /**
   * @param {'UNSUPPORTED_FORMAT' | 'MISSING_URL' | 'HTTP_ERROR' | 'CONTENT_TYPE_MISMATCH' | 'UNDECODABLE' | 'FORMAT_MISMATCH' | 'DIMENSIONS_MISMATCH'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'ReducedImageError';
    this.code = code;
  }
}

/**
 * @typedef {object} FetchLikeResponse
 * @property {boolean} ok
 * @property {number} status
 * @property {{ get: (name: string) => string | null }} headers
 * @property {() => Promise<ArrayBuffer>} arrayBuffer
 */

/**
 * @typedef {object} DecodedImage
 * @property {string} [format]
 * @property {number} [width]
 * @property {number} [height]
 */

/** @type {Readonly<Record<string, { mimeType: string, fm: string, sharpFormat: string }>>} */
const OUTPUT_FORMATS = Object.freeze({
  'image/jpeg': { mimeType: 'image/jpeg', fm: 'jpg', sharpFormat: 'jpeg' },
  'image/png': { mimeType: 'image/png', fm: 'png', sharpFormat: 'png' },
  'image/webp': { mimeType: 'image/webp', fm: 'webp', sharpFormat: 'webp' },
});

/** @type {Readonly<Record<string, string>>} */
const MIME_BY_EXTENSION = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
});

/**
 * Output format to request from the CDN. The mime type is authoritative; the
 * extension is only used when the mime type is missing, and a conflict between
 * the two is refused (fail closed).
 *
 * @param {ImageAsset} asset
 * @returns {{ mimeType: string, fm: string, sharpFormat: string }}
 * @throws {ReducedImageError} UNSUPPORTED_FORMAT
 */
export function resolveOutputFormat(asset) {
  const mime = typeof asset.mimeType === 'string' ? asset.mimeType.trim().toLowerCase() : '';
  const extension = typeof asset.extension === 'string' ? asset.extension.trim().toLowerCase().replace(/^\./, '') : '';
  const fromExtension = Object.hasOwn(MIME_BY_EXTENSION, extension) ? MIME_BY_EXTENSION[extension] : undefined;

  let mimeType;
  if (mime !== '') {
    if (fromExtension !== undefined && fromExtension !== mime) {
      throw new ReducedImageError(
        'UNSUPPORTED_FORMAT',
        `Type de fichier ambigu : ${mime} d'après le type MIME, ${fromExtension} d'après l'extension.`,
      );
    }
    mimeType = mime;
  } else {
    mimeType = fromExtension;
  }
  if (mimeType === undefined || !Object.hasOwn(OUTPUT_FORMATS, mimeType)) {
    throw new ReducedImageError('UNSUPPORTED_FORMAT', `Format non géré : ${mime || extension || 'inconnu'}.`);
  }
  return { ...OUTPUT_FORMATS[mimeType] };
}

/**
 * URL of the already-reduced version of an asset, served by the Sanity CDN.
 * Any query string or fragment on the stored URL is dropped.
 *
 * @param {ImageAsset} asset
 * @param {number} targetWidth
 * @returns {string}
 * @throws {RangeError} when targetWidth is not a positive integer
 * @throws {ReducedImageError} UNSUPPORTED_FORMAT or MISSING_URL
 */
export function buildReducedImageUrl(asset, targetWidth) {
  if (!Number.isInteger(targetWidth) || targetWidth <= 0) {
    throw new RangeError('Largeur cible invalide : un entier > 0 est attendu.');
  }
  const { fm } = resolveOutputFormat(asset);
  /** @type {URL} */
  let url;
  try {
    if (typeof asset.url !== 'string' || asset.url.trim() === '') throw new Error('empty');
    url = new URL(asset.url.trim());
  } catch {
    throw new ReducedImageError('MISSING_URL', "URL de l'image inconnue ou illisible.");
  }
  url.search = '';
  url.hash = '';
  url.searchParams.set('w', String(targetWidth));
  if (fm === 'jpg') {
    url.searchParams.set('q', String(OUTPUT_QUALITY));
    url.searchParams.set('fm', fm);
  } else if (fm === 'webp') {
    url.searchParams.set('fm', fm);
    url.searchParams.set('q', String(OUTPUT_QUALITY));
  } else {
    url.searchParams.set('fm', fm);
  }
  return url.toString();
}

/**
 * Decide whether what the CDN returned may be uploaded. Never throws. The
 * content type is checked first so an error page is reported as such.
 *
 * @param {object} input
 * @param {string} input.expectedMimeType
 * @param {string | null | undefined} input.contentType
 * @param {DecodedImage | null | undefined} input.decoded
 * @param {{ width: number, height: number }} input.target
 * @returns {{ ok: true } | { ok: false, code: 'CONTENT_TYPE_MISMATCH' | 'UNDECODABLE' | 'FORMAT_MISMATCH' | 'DIMENSIONS_MISMATCH', message: string }}
 */
export function validateReducedImage({ expectedMimeType, contentType, decoded, target }) {
  const received = typeof contentType === 'string' ? contentType.split(';')[0].trim().toLowerCase() : '';
  if (received !== expectedMimeType) {
    return {
      ok: false,
      code: 'CONTENT_TYPE_MISMATCH',
      message: `Type de contenu inattendu : ${received || 'absent'} au lieu de ${expectedMimeType}.`,
    };
  }
  if (!decoded || !isPositiveFiniteNumber(decoded.width) || !isPositiveFiniteNumber(decoded.height)) {
    return { ok: false, code: 'UNDECODABLE', message: "L'image reçue est illisible ou incomplète." };
  }
  const expectedFormat = Object.hasOwn(OUTPUT_FORMATS, expectedMimeType)
    ? OUTPUT_FORMATS[expectedMimeType].sharpFormat
    : undefined;
  if (expectedFormat === undefined || decoded.format !== expectedFormat) {
    return {
      ok: false,
      code: 'FORMAT_MISMATCH',
      message: `Format décodé inattendu : ${decoded.format ?? 'inconnu'} au lieu de ${expectedFormat ?? expectedMimeType}.`,
    };
  }
  if (decoded.width !== target.width || Math.abs(decoded.height - target.height) > HEIGHT_TOLERANCE_PX) {
    return {
      ok: false,
      code: 'DIMENSIONS_MISMATCH',
      message: `Dimensions inattendues : ${decoded.width}x${decoded.height} reçues, ${target.width}x${target.height} attendues.`,
    };
  }
  return { ok: true };
}

/**
 * Request the reduced image from the CDN and validate it. Network and
 * decoding are injected. The bytes are returned exactly as received.
 *
 * @param {object} input
 * @param {ImageAsset} input.asset
 * @param {{ width: number, height: number }} input.target
 * @param {(url: string) => Promise<FetchLikeResponse>} input.fetchImpl
 * @param {(data: Buffer) => Promise<DecodedImage>} input.decodeImage
 * @returns {Promise<{ data: Buffer, mimeType: string, width: number, height: number }>}
 * @throws {ReducedImageError}
 */
export async function fetchReducedImage({ asset, target, fetchImpl, decodeImage }) {
  const format = resolveOutputFormat(asset);
  const url = buildReducedImageUrl(asset, target.width);

  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new ReducedImageError('HTTP_ERROR', `Réponse HTTP ${response.status} du CDN.`);
  }
  const data = Buffer.from(await response.arrayBuffer());

  /** @type {DecodedImage | null} */
  let decoded;
  try {
    decoded = await decodeImage(data);
  } catch {
    decoded = null;
  }

  const verdict = validateReducedImage({
    expectedMimeType: format.mimeType,
    contentType: response.headers.get('content-type'),
    decoded,
    target,
  });
  if (!verdict.ok) throw new ReducedImageError(verdict.code, verdict.message);
  const checked = /** @type {{ width: number, height: number }} */ (decoded);
  return { data, mimeType: format.mimeType, width: checked.width, height: checked.height };
}

const SIMPLE_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Error thrown when a reference sits on a path that cannot be expressed
 * safely as a Sanity patch path. Callers must treat the document as
 * unpatchable (fail closed).
 */
export class UnsupportedPathError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'UnsupportedPathError';
    this.code = 'UNSUPPORTED_KEY_SHAPE';
  }
}

/**
 * Walk arbitrary JSON and return the Sanity patch-path of every
 * `{_type: 'reference', _ref: assetId}` object (path ends in `._ref`). Field
 * names are deliberately not hardcoded: this works for any schema.
 *
 * @param {unknown} value
 * @param {string} assetId
 * @returns {string[]}
 * @throws {UnsupportedPathError} when a matching reference sits behind a key that is not a plain identifier
 */
export function findReferencePaths(value, assetId) {
  /** @type {string[]} */
  const found = [];

  /**
   * @param {unknown} node
   * @param {string} path
   * @param {boolean} unsafe true once an ancestor key could not be expressed safely
   */
  const walk = (node, path, unsafe) => {
    if (Array.isArray(node)) {
      node.forEach((member, index) => {
        const key =
          member && typeof member === 'object' && !Array.isArray(member) && typeof member._key === 'string'
            ? member._key
            : null;
        const segment = key !== null ? `[_key==${JSON.stringify(key)}]` : `[${index}]`;
        walk(member, `${path}${segment}`, unsafe);
      });
      return;
    }
    if (node && typeof node === 'object') {
      const record = /** @type {Record<string, unknown>} */ (node);
      if (record._type === 'reference' && record._ref === assetId) {
        if (unsafe) {
          throw new UnsupportedPathError('Référence derrière une clé non prise en charge.');
        }
        found.push(`${path}._ref`);
        return;
      }
      for (const [key, child] of Object.entries(record)) {
        walk(child, path ? `${path}.${key}` : key, unsafe || !SIMPLE_KEY.test(key));
      }
    }
  };

  walk(value, '', false);
  return found;
}

/**
 * Plan one revision-guarded patch per document that references `oldAssetId`.
 * Documents that cannot be patched safely are reported, never patched.
 *
 * @param {readonly SanityDocument[]} documents
 * @param {string} oldAssetId
 * @param {string} newAssetId
 * @returns {{ patches: ReferencePatch[], unpatchable: string[] }}
 */
export function planReferencePatches(documents, oldAssetId, newAssetId) {
  /** @type {ReferencePatch[]} */
  const patches = [];
  /** @type {string[]} */
  const unpatchable = [];
  for (const doc of documents) {
    const id = String(doc._id);
    if (typeof doc._rev !== 'string' || doc._rev === '') {
      unpatchable.push(id);
      continue;
    }
    /** @type {string[]} */
    let paths;
    try {
      paths = findReferencePaths(doc, oldAssetId);
    } catch (error) {
      if (error instanceof UnsupportedPathError) {
        unpatchable.push(id);
        continue;
      }
      throw error;
    }
    if (paths.length === 0) {
      unpatchable.push(id);
      continue;
    }
    /** @type {Record<string, string>} */
    const set = {};
    for (const path of paths) set[path] = newAssetId;
    patches.push({ documentId: id, ifRevisionID: doc._rev, set });
  }
  return { patches, unpatchable };
}

export const USAGE_TEXT = `Usage : npm run sanity:downsize-images -- [options]

Réduit les images Sanity plus larges que le seuil (2400 px par défaut).
Sans option, le script est un simple RAPPORT en lecture seule : il ne modifie rien.

Options :
  --threshold <px>        Largeur maximale conservée (entier >= ${MIN_THRESHOLD}, défaut ${DEFAULT_THRESHOLD}).
  --project-id <id>       Projet Sanity (défaut : variable SANITY_PROJECT_ID).
  --dataset <nom>         Dataset Sanity (défaut : variable SANITY_DATASET).
  --apply                 Remplace réellement les images (exige --i-have-a-backup et SANITY_WRITE_TOKEN).
  --i-have-a-backup       Confirme qu'une sauvegarde (sanity dataset export) existe.
  --delete-originals      Avec --apply : supprime les anciennes images, après vérification
                          qu'aucun document ne les référence plus.
  --help                  Affiche cette aide.

Variables d'environnement : SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN (optionnel,
pour voir les brouillons), SANITY_WRITE_TOKEN (uniquement pour --apply).

Procédure complète : docs/reduction-images-sanity.md`;

/**
 * @typedef {object} CliOptions
 * @property {boolean} apply
 * @property {boolean} deleteOriginals
 * @property {number} threshold
 * @property {string} projectId
 * @property {string} dataset
 * @property {string | undefined} writeToken only ever set when `apply` is true
 * @property {string | undefined} readToken
 */

/**
 * @typedef {{ code: string, message: string }} CliError
 * @typedef {{ ok: true, help: true }} HelpResult
 * @typedef {{ ok: true, help?: false, options: CliOptions }} OptionsResult
 * @typedef {{ ok: false, errors: CliError[] }} ErrorResult
 */

/**
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
function cleanEnvValue(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Pure argv/env -> options resolution. Touches nothing global. Error
 * messages are in French and never echo a token value.
 *
 * @param {readonly string[]} argv arguments after the script name
 * @param {Record<string, string | undefined>} env
 * @returns {HelpResult | OptionsResult | ErrorResult}
 */
export function resolveCliOptions(argv, env) {
  /** @type {Record<string, string | boolean | undefined>} */
  let values;
  try {
    ({ values } = parseArgs({
      args: [...argv],
      strict: true,
      allowPositionals: false,
      options: {
        apply: { type: 'boolean' },
        'i-have-a-backup': { type: 'boolean' },
        'delete-originals': { type: 'boolean' },
        threshold: { type: 'string' },
        dataset: { type: 'string' },
        'project-id': { type: 'string' },
        help: { type: 'boolean' },
      },
    }));
  } catch (error) {
    const raw = error instanceof Error ? error.message : '';
    const code = /** @type {{ code?: string }} */ (error).code ?? '';
    if (code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      // Name only, never the `=value` part: a mistyped flag could carry a secret.
      const name = /'(--?[^'=\s]+)/.exec(raw)?.[1] ?? 'inconnue';
      return {
        ok: false,
        errors: [{ code: 'UNKNOWN_OPTION', message: `Option inconnue : ${name}. Voir --help.` }],
      };
    }
    return {
      ok: false,
      errors: [{ code: 'INVALID_ARGUMENTS', message: 'Arguments invalides. Voir --help.' }],
    };
  }

  if (values.help === true) return { ok: true, help: true };

  /** @type {CliError[]} */
  const errors = [];
  const projectId = cleanEnvValue(/** @type {string | undefined} */ (values['project-id'])) ?? cleanEnvValue(env.SANITY_PROJECT_ID);
  const dataset = cleanEnvValue(/** @type {string | undefined} */ (values.dataset)) ?? cleanEnvValue(env.SANITY_DATASET);
  if (!projectId) {
    errors.push({
      code: 'MISSING_PROJECT_ID',
      message: 'Identifiant de projet manquant : utilisez --project-id ou la variable SANITY_PROJECT_ID.',
    });
  }
  if (!dataset) {
    errors.push({
      code: 'MISSING_DATASET',
      message: 'Dataset manquant : utilisez --dataset ou la variable SANITY_DATASET.',
    });
  }

  let threshold = DEFAULT_THRESHOLD;
  if (values.threshold !== undefined) {
    const raw = String(values.threshold).trim();
    const parsed = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
    if (!Number.isInteger(parsed) || parsed < MIN_THRESHOLD) {
      errors.push({
        code: 'INVALID_THRESHOLD',
        message: `--threshold doit être un entier supérieur ou égal à ${MIN_THRESHOLD} (pixels).`,
      });
    } else {
      threshold = parsed;
    }
  }

  const apply = values.apply === true;
  const deleteOriginals = values['delete-originals'] === true;
  const envWriteToken = cleanEnvValue(env.SANITY_WRITE_TOKEN);

  if (apply && values['i-have-a-backup'] !== true) {
    errors.push({
      code: 'APPLY_REQUIRES_BACKUP_FLAG',
      message:
        '--apply exige --i-have-a-backup : faites d\'abord une sauvegarde (sanity dataset export) puis confirmez-le avec ce drapeau.',
    });
  }
  if (apply && !envWriteToken) {
    errors.push({
      code: 'APPLY_REQUIRES_WRITE_TOKEN',
      message: '--apply exige la variable d\'environnement SANITY_WRITE_TOKEN (jeton temporaire avec droits Éditeur).',
    });
  }
  if (deleteOriginals && !apply) {
    errors.push({
      code: 'DELETE_REQUIRES_APPLY',
      message: '--delete-originals exige --apply (avec --i-have-a-backup).',
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    options: {
      apply,
      deleteOriginals,
      threshold,
      projectId: /** @type {string} */ (projectId),
      dataset: /** @type {string} */ (dataset),
      writeToken: apply ? envWriteToken : undefined,
      readToken: cleanEnvValue(env.SANITY_API_READ_TOKEN),
    },
  };
}

/**
 * @typedef {object} DeletionBlocker
 * @property {string} assetId
 * @property {'UNKNOWN_REFERENCE_COUNT' | 'STILL_REFERENCED' | 'REPLACEMENT_FAILED'} code
 * @property {string} message
 */

/**
 * Fail-closed gate in front of the irreversible delete step: it is safe only
 * if EVERY candidate has a freshly counted reference total of exactly 0 and
 * no replacement failed. Anything unknown is a blocker.
 *
 * @param {object} input
 * @param {readonly string[]} input.assetIds
 * @param {Record<string, number | undefined>} input.remainingReferenceCounts
 * @param {readonly string[]} input.failedAssetIds
 * @returns {{ safe: boolean, blockers: DeletionBlocker[] }}
 */
export function assessDeletionSafety({ assetIds, remainingReferenceCounts, failedAssetIds }) {
  /** @type {DeletionBlocker[]} */
  const blockers = [];
  for (const assetId of assetIds) {
    const count = Object.hasOwn(remainingReferenceCounts, assetId) ? remainingReferenceCounts[assetId] : undefined;
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      blockers.push({
        assetId,
        code: 'UNKNOWN_REFERENCE_COUNT',
        message: 'Nombre de références impossible à vérifier : suppression refusée.',
      });
    } else if (count > 0) {
      blockers.push({
        assetId,
        code: 'STILL_REFERENCED',
        message: `Encore ${count} référence(s) : suppression refusée.`,
      });
    }
  }
  for (const assetId of failedAssetIds) {
    blockers.push({
      assetId,
      code: 'REPLACEMENT_FAILED',
      message: 'Le remplacement de cette image a échoué dans cette exécution : suppression refusée.',
    });
  }
  return { safe: blockers.length === 0, blockers };
}

/**
 * @param {string} text
 * @param {ReadonlyArray<string | null | undefined>} secrets
 * @returns {string}
 */
export function redactSecrets(text, secrets) {
  const usable = secrets
    .filter((secret) => typeof secret === 'string' && secret.length > 0)
    .map((secret) => /** @type {string} */ (secret))
    .sort((a, b) => b.length - a.length);
  let out = String(text);
  for (const secret of usable) out = out.split(secret).join(REDACTED);
  return out;
}

/**
 * The single place every printed error passes through.
 *
 * @param {unknown} error
 * @param {ReadonlyArray<string | null | undefined>} secrets
 * @returns {string}
 */
export function describeError(error, secrets) {
  /** @type {string} */
  let text;
  try {
    text = error instanceof Error ? error.message : String(error);
  } catch {
    text = 'erreur inconnue';
  }
  return redactSecrets(text, secrets);
}

/**
 * @param {number | undefined} bytes
 * @returns {string}
 */
function formatMegabytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return '? Mo';
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * @typedef {object} ReportRow
 * @property {ImageAsset} asset
 * @property {{ width: number, height: number }} target
 * @property {ReadonlyArray<{ _id: string, _type?: string }>} documents
 */

/**
 * @param {object} input
 * @param {readonly ReportRow[]} input.rows
 * @param {readonly SkippedAsset[]} input.skipped
 * @param {number} input.threshold
 * @returns {string[]}
 */
export function formatDryRunReport({ rows, skipped, threshold }) {
  /** @type {string[]} */
  const lines = [];
  if (rows.length === 0) {
    lines.push(`Rien à faire : aucune image Sanity n'est plus large que ${threshold} px.`);
  } else {
    lines.push(`Images Sanity plus larges que ${threshold} px : ${rows.length}`);
    lines.push('');
    rows.forEach((row, index) => {
      const { asset, target, documents } = row;
      const name = asset.originalFilename ?? deriveFilename(asset);
      lines.push(
        `${String(index + 1).padStart(3)}. ${name}  ${asset.width}x${asset.height} -> ${target.width}x${target.height}  (${formatMegabytes(asset.size)})`,
      );
      lines.push(`       ${asset._id}`);
      if (documents.length === 0) {
        lines.push('       aucun document ne la référence : ignorée par --apply');
      } else {
        for (const doc of documents) {
          lines.push(`       - ${doc._type ?? '?'}  ${doc._id}`);
        }
      }
    });
    const totalBytes = rows.reduce((sum, row) => sum + (row.asset.size ?? 0), 0);
    lines.push('');
    lines.push(`Total : ${rows.length} image(s), ${formatMegabytes(totalBytes)} actuellement stockés.`);
  }

  if (skipped.length > 0) {
    const unsupported = skipped.filter((entry) => entry.reason === 'UNSUPPORTED_FORMAT').length;
    const unknown = skipped.filter((entry) => entry.reason === 'UNKNOWN_DIMENSIONS').length;
    lines.push('');
    lines.push('Ignorées par le script :');
    if (unsupported > 0) lines.push(`  ${unsupported} image(s) dans un format non géré (seuls JPEG, PNG et WebP sont réduits)`);
    if (unknown > 0) lines.push(`  ${unknown} image(s) aux dimensions inconnues`);
  }

  lines.push('');
  lines.push(
    'Les brouillons ne sont listés que si SANITY_API_READ_TOKEN est fourni (sinon seuls les documents publiés sont visibles).',
  );
  return lines;
}
