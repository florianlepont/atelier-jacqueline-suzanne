import type {ImageUploadConfig} from './imageUploadLogic'

/*
 * Réglages de la réduction et de la signature automatiques des images
 * téléversées dans le Studio (JPEG, PNG, WebP ; GIF, SVG et le reste passent tels quels).
 *  - enabled : false désactive TOUT le traitement (les originaux sont envoyés tels quels).
 *  - maxDimension : côté le plus long maximal en pixels (800 à 8000, entier). Jamais agrandi.
 *  - quality : qualité JPEG et WebP (0,5 à 1). Le PNG reste sans perte.
 *  - signature.enabled : false garde la réduction mais retire la signature.
 *  - signature.text / opacity / sizeRatio / marginRatio / position : texte (1 à 60 caractères),
 *    opacité (0,1 à 1), taille et marge en part du côté le plus long (0,005 à 0,1 et 0 à 0,1),
 *    coin (bottom-right, bottom-left, top-right, top-left).
 * Une valeur invalide ne bloque jamais un envoi : l'original est envoyé avec un avertissement.
 * Après un changement, le Studio doit être redéployé pour que la modification s'applique.
 */
export const IMAGE_UPLOAD_CONFIG: ImageUploadConfig = {
  enabled: true,
  maxDimension: 2400,
  quality: 0.9,
  signature: {
    enabled: true,
    text: '© Romane Lepont',
    opacity: 0.55,
    sizeRatio: 0.022,
    marginRatio: 0.02,
    position: 'bottom-right',
  },
}
