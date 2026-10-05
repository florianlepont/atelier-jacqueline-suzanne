import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'gwz8iug4',
    dataset: 'production',
  },
  deployment: {
    // DIAGNOSTIC-06 (quick-260811-kog-06): disabled so the deployed Studio
    // always serves the exact `sanity` version pinned in package.json/
    // package-lock.json, never a silently newer one auto-fetched at
    // runtime that was never tested locally or in CI.
    // Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
    autoUpdates: false,
    // The Studio is no longer deployed to *.sanity.studio: it is built with
    // `sanity build` and uploaded to OVH under /studio by deploy-ovh.yml.
  },
})
