import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'gwz8iug4',
    dataset: 'production'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    // Deployed to https://atelier-jacqueline-suzanne.sanity.studio/ — appId
    // pins future `sanity deploy` runs to that same hosted studio instead of
    // prompting for one.
    appId: 'y1g7kkfc0x3vjg52pfjjvr56',
  },
})
