/// <reference lib="webworker" />

import { clientsClaim, setCacheNameDetails } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

setCacheNameDetails({
  prefix: 'quickspend',
  suffix: `v${__APP_VERSION__}`,
})

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})
