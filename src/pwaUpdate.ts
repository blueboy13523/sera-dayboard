import { registerSW } from 'virtual:pwa-register'

let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined
export function initializePWAUpdates() {
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh: () => window.dispatchEvent(new Event('sera-update-available'))
  })
}
export const installAvailableUpdate = () => applyUpdate?.(true)
