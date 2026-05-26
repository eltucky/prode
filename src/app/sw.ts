import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope & typeof globalThis & { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined }

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API routes must never be cached — data must always come from the server
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    // All other requests use the default Next.js cache strategy
    ...defaultCache,
  ],
})

serwist.addEventListeners()
