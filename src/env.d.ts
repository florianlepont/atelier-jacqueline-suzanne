/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Required at build time (src/lib/sanity.ts throws if either is missing);
  // typed as possibly-undefined here since Vite can't guarantee an env var
  // is actually set -- that guarantee is the runtime check's job, not the
  // type's.
  readonly SANITY_PROJECT_ID: string | undefined;
  readonly SANITY_DATASET: string | undefined;
  // Server/build-time only -- must never reach the browser bundle (see
  // src/lib/sanity.ts's own module-level warning comment).
  readonly SANITY_API_READ_TOKEN: string | undefined;
  // Optional: defaults to the same-origin /contact.php path when unset (see
  // src/components/ContactForm.astro's resolveContactEndpoint()).
  readonly PUBLIC_CONTACT_ENDPOINT: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
