// @ts-check
// Réduit les images Sanity plus larges que le seuil (2400 px par défaut).
//
// Sûr par défaut : sans option, c'est un RAPPORT en lecture seule. Voir
// docs/reduction-images-sanity.md pour la procédure complète. Toute la
// logique testable vit dans scripts/lib/sanity-image-downsize.mjs ; ce fichier
// ne fait que relier arguments/environnement, @sanity/client et sharp.
//
// Principe : pour chaque image trop large, le script demande au CDN de Sanity la
// version déjà réduite (redimensionnement côté serveur), vérifie ce qu'il a
// reçu, puis téléverse ces octets tels quels. L'original n'est jamais
// téléchargé et rien n'est recompressé localement : sharp sert uniquement à
// LIRE l'image reçue (validation), jamais à la redimensionner ni à l'encoder.
//
// Ordre voulu : les options sont validées (et le script quitte avec le code 2
// en cas d'erreur) AVANT d'importer @sanity/client ou sharp et avant de créer
// un client. Ainsi un refus d'usage ne touche jamais le réseau.

import {
  USAGE_TEXT,
  assessDeletionSafety,
  computeTargetDimensions,
  deriveFilename,
  describeError,
  fetchReducedImage,
  formatDryRunReport,
  parseImageAssetId,
  planReferencePatches,
  resolveCliOptions,
  selectOversizedAssets,
} from './lib/sanity-image-downsize.mjs';

const API_VERSION = '2024-01-01'; // same as src/lib/sanity.ts
const CDN_REQUEST_TIMEOUT_MS = 120_000;

const ASSETS_QUERY = `*[_type == "sanity.imageAsset"]{
  _id, originalFilename, mimeType, extension, size, url,
  "width": metadata.dimensions.width,
  "height": metadata.dimensions.height
}`;
const REFERENCING_SUMMARY_QUERY = `*[references($assetId)]{_id, _type}`;
const REFERENCING_FULL_QUERY = `*[references($assetId)]`;
const REFERENCE_COUNT_QUERY = `count(*[references($assetId)])`;

/**
 * @typedef {import('@sanity/client').SanityClient} SanityClient
 * @typedef {(data: Buffer) => Promise<import('./lib/sanity-image-downsize.mjs').DecodedImage>} DecodeImage
 */

/**
 * Read-only view handed to the dry-run: only `fetch`, never the client, so
 * write capability is absent by construction.
 * @typedef {{ fetch: (query: string, params?: Record<string, unknown>) => Promise<any> }} Reader
 */

/** @param {string[]} lines */
function printLines(lines) {
  for (const line of lines) console.log(line);
}

/**
 * @param {Reader} reader
 * @param {number} threshold
 */
async function loadCandidates(reader, threshold) {
  /** @type {import('./lib/sanity-image-downsize.mjs').ImageAsset[]} */
  const assets = await reader.fetch(ASSETS_QUERY);
  const { oversized, skipped } = selectOversizedAssets(assets, threshold);
  /** @type {import('./lib/sanity-image-downsize.mjs').ImageAsset[]} */
  const usable = [];
  for (const asset of oversized) {
    try {
      computeTargetDimensions(/** @type {{width: number, height: number}} */ (asset), threshold);
      usable.push(asset);
    } catch {
      skipped.push({ asset, reason: 'UNKNOWN_DIMENSIONS' });
    }
  }
  return { oversized: usable, skipped };
}

/**
 * @param {Reader} reader read-only facade (fetch only)
 * @param {import('./lib/sanity-image-downsize.mjs').CliOptions} options
 */
async function runDryRun(reader, options) {
  const { oversized, skipped } = await loadCandidates(reader, options.threshold);
  const rows = [];
  for (const asset of oversized) {
    const documents = await reader.fetch(REFERENCING_SUMMARY_QUERY, { assetId: asset._id });
    rows.push({
      asset,
      target: computeTargetDimensions(
        /** @type {{width: number, height: number}} */ (asset),
        options.threshold,
      ),
      documents,
    });
  }
  printLines(formatDryRunReport({ rows, skipped, threshold: options.threshold }));
  console.log('');
  console.log("Mode lecture seule : rien n'a été modifié.");
  console.log(
    "Étapes suivantes : voir docs/reduction-images-sanity.md (sauvegarde d'abord, puis --apply --i-have-a-backup).",
  );
  return 0;
}

/**
 * @param {SanityClient} client
 * @param {string} assetId
 * @returns {Promise<number>}
 */
async function countReferences(client, assetId) {
  const count = await client.fetch(REFERENCE_COUNT_QUERY, { assetId });
  if (typeof count !== 'number') throw new Error('Décompte de références illisible.');
  return count;
}

/**
 * Plain GET on the public CDN. It sends NO headers and NO token: the write
 * token must only ever reach the Sanity API.
 *
 * @param {string} url
 * @returns {Promise<Response>}
 */
function requestFromCdn(url) {
  return fetch(url, { signal: AbortSignal.timeout(CDN_REQUEST_TIMEOUT_MS) });
}

/**
 * Build the decoding helper used to validate what the CDN returned. It reads
 * the header (metadata), then forces a full decode (stats) so truncated or
 * corrupt data throws. Nothing is encoded and the decoded output is discarded.
 *
 * @param {import('sharp').default} sharp
 * @returns {DecodeImage}
 */
function createDecoder(sharp) {
  return async (data) => {
    const image = sharp(data);
    const { format, width, height } = await image.metadata();
    await image.stats();
    return { format, width, height };
  };
}

/**
 * Replace one oversized asset: request the reduced version from the CDN,
 * validate it, upload it as received, then repoint every reference in one
 * revision-guarded transaction. Deletes nothing.
 *
 * @param {object} ctx
 * @param {SanityClient} ctx.client
 * @param {DecodeImage} ctx.decodeImage
 * @param {import('./lib/sanity-image-downsize.mjs').ImageAsset} ctx.asset
 * @param {number} ctx.threshold
 * @returns {Promise<{ status: 'replaced' | 'ignored', newId?: string, patched: number }>}
 */
async function replaceAsset({ client, decodeImage, asset, threshold }) {
  const before = await client.fetch(REFERENCING_FULL_QUERY, { assetId: asset._id });
  if (!Array.isArray(before) || before.length === 0) {
    return { status: 'ignored', patched: 0 };
  }

  const target = computeTargetDimensions(
    /** @type {{width: number, height: number}} */ (asset),
    threshold,
  );

  // Validated BEFORE anything is uploaded: any failure throws and leaves the
  // image untouched.
  const reduced = await fetchReducedImage({
    asset,
    target,
    fetchImpl: requestFromCdn,
    decodeImage,
  });

  const uploaded = await client.assets.upload('image', reduced.data, {
    filename: deriveFilename(asset),
    contentType: reduced.mimeType,
  });
  const newId = uploaded._id;
  const parsed = parseImageAssetId(newId);
  if (
    newId === asset._id ||
    !parsed ||
    parsed.width !== reduced.width ||
    parsed.height !== reduced.height
  ) {
    throw new Error(`Image téléversée inattendue (${newId}).`);
  }

  // Fresh revisions: the upload took time and the Studio may have been used.
  const documents = await client.fetch(REFERENCING_FULL_QUERY, { assetId: asset._id });
  const { patches, unpatchable } = planReferencePatches(documents, asset._id, newId);
  if (unpatchable.length > 0) {
    throw new Error(`Documents impossibles à modifier sans risque : ${unpatchable.join(', ')}.`);
  }
  if (patches.length === 0)
    throw new Error('Plus aucun document à mettre à jour (modifié entre-temps ?).');

  const transaction = client.transaction();
  for (const patch of patches) {
    transaction.patch(patch.documentId, { set: patch.set, ifRevisionID: patch.ifRevisionID });
  }
  await transaction.commit();

  const remaining = await countReferences(client, asset._id);
  if (remaining !== 0)
    throw new Error(`${remaining} référence(s) subsistent après la mise à jour.`);
  return { status: 'replaced', newId, patched: patches.length };
}

/**
 * @param {SanityClient} client
 * @param {import('./lib/sanity-image-downsize.mjs').CliOptions} options
 * @param {Array<string | undefined>} secrets
 */
async function runApply(client, options, secrets) {
  const { oversized, skipped } = await loadCandidates(client, options.threshold);
  console.log(
    `Images à traiter (> ${options.threshold} px) : ${oversized.length} (${skipped.length} ignorée(s) : format ou dimensions non gérés).`,
  );

  const { default: sharp } = await import('sharp');
  const decodeImage = createDecoder(sharp);

  /** @type {string[]} */
  const failedIds = [];
  /** @type {string[][]} */
  const results = [];
  for (const asset of oversized) {
    try {
      const outcome = await replaceAsset({
        client,
        decodeImage,
        asset,
        threshold: options.threshold,
      });
      if (outcome.status === 'ignored') {
        results.push([asset._id, '-', '0', 'ignorée (aucun document ne la référence)']);
      } else {
        results.push([asset._id, outcome.newId ?? '?', String(outcome.patched), 'remplacée']);
      }
    } catch (error) {
      failedIds.push(asset._id);
      results.push([asset._id, '-', '0', `ÉCHEC : ${describeError(error, secrets)}`]);
    }
  }

  console.log('');
  console.log('Résultat par image (ancienne -> nouvelle, documents modifiés, statut) :');
  for (const row of results) console.log(`  ${row[0]} -> ${row[1]}  [${row[2]} doc.]  ${row[3]}`);
  console.log('');

  let exitCode = failedIds.length > 0 ? 1 : 0;
  if (failedIds.length > 0)
    console.error(`${failedIds.length} image(s) en échec : voir ci-dessus. Rien n'a été supprimé.`);

  if (!options.deleteOriginals) {
    console.log(
      "Aucune ancienne image n'a été supprimée. Vérifiez le site, puis relancez avec --delete-originals.",
    );
    return exitCode;
  }

  // Deletion: candidates are ALL oversized assets (including those orphaned by
  // an earlier run), re-counted right now, and everything aborts on any doubt.
  const candidateIds = oversized.map((asset) => asset._id);
  console.log(`Suppression demandée pour ${candidateIds.length} ancienne(s) image(s) :`);
  for (const id of candidateIds) console.log(`  ${id}`);

  /** @type {Record<string, number | undefined>} */
  const counts = {};
  for (const id of candidateIds) {
    try {
      counts[id] = await countReferences(client, id);
    } catch {
      counts[id] = undefined;
    }
  }
  const verdict = assessDeletionSafety({
    assetIds: candidateIds,
    remainingReferenceCounts: counts,
    failedAssetIds: failedIds,
  });
  if (!verdict.safe) {
    console.error("Suppression ANNULÉE (rien n'a été supprimé) :");
    for (const blocker of verdict.blockers)
      console.error(`  ${blocker.assetId} : ${blocker.message}`);
    return 1;
  }

  for (const id of candidateIds) {
    try {
      await client.delete(id);
      console.log(`  supprimée : ${id}`);
    } catch (error) {
      exitCode = 1;
      console.error(`  suppression impossible : ${id} : ${describeError(error, secrets)}`);
    }
  }
  return exitCode;
}

async function importClient() {
  const { createClient } = await import('@sanity/client');
  return createClient;
}

async function main() {
  try {
    // Reads the repo's .env like the Astro build does; never overrides
    // variables that are already set. A missing .env is fine.
    process.loadEnvFile();
  } catch {
    // no .env file: rely on the real environment
  }

  const parsed = resolveCliOptions(process.argv.slice(2), process.env);
  if (!parsed.ok) {
    for (const error of parsed.errors) console.error(error.message);
    console.error('');
    console.error(USAGE_TEXT);
    return 2;
  }
  if ('help' in parsed && parsed.help) {
    console.log(USAGE_TEXT);
    return 0;
  }
  const { options } = /** @type {import('./lib/sanity-image-downsize.mjs').OptionsResult} */ (
    parsed
  );
  const secrets = [options.writeToken, options.readToken];

  try {
    const createClient = await importClient();
    const token = options.apply ? options.writeToken : options.readToken;
    const client = createClient({
      projectId: options.projectId,
      dataset: options.dataset,
      apiVersion: API_VERSION,
      useCdn: false,
      perspective: 'raw', // return drafts too when the token can see them
      ...(token ? { token } : {}),
    });

    if (!options.apply) {
      /** @type {Reader} */
      const readOnly = { fetch: (query, params) => client.fetch(query, params) };
      return await runDryRun(readOnly, options);
    }
    return await runApply(client, options, secrets);
  } catch (error) {
    console.error(`Erreur : ${describeError(error, secrets)}`);
    return 1;
  }
}

process.exitCode = await main();
