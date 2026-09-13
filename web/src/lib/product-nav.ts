import {
  PLATFORM_LICENSE_PRODUCT_KEYS,
  PLATFORM_PRODUCT_AMANAT,
  type PlatformLicenseProductKey,
  type PlatformProductKey,
} from '@shared/platform-product'
import type { ShellTabId, TabId } from '../types/device'

export const SHELL_TAB_IDS = ['deck', 'workspaces', 'more'] as const satisfies readonly ShellTabId[]

export function isShellTab(tab: TabId): tab is ShellTabId {
  return (SHELL_TAB_IDS as readonly string[]).includes(tab)
}

export const LICENSE_TAB_IDS = [
  'devices',
  'requests',
  'releases',
  'settings',
] as const satisfies readonly TabId[]

export const AMANAT_PRODUCT_TAB_IDS = [
  'subscriptions',
  'zones',
  'settings',
] as const satisfies readonly TabId[]

export const MORE_MODULE_TAB_IDS = ['releases', 'zones', 'settings'] as const satisfies readonly TabId[]

export function isMoreModuleTab(tab: TabId): boolean {
  return (MORE_MODULE_TAB_IDS as readonly string[]).includes(tab)
}

export function isLicenseProduct(product: PlatformProductKey): product is PlatformLicenseProductKey {
  return (PLATFORM_LICENSE_PRODUCT_KEYS as readonly string[]).includes(product)
}

export function isAmanatProduct(product: PlatformProductKey): boolean {
  return product === PLATFORM_PRODUCT_AMANAT
}

export function defaultTabForProduct(product: PlatformProductKey): TabId {
  if (isAmanatProduct(product)) return 'subscriptions'
  return 'devices'
}

export function defaultShellTab(): ShellTabId {
  return 'workspaces'
}

export function tabBelongsToProduct(tab: TabId, product: PlatformProductKey): boolean {
  if (isShellTab(tab)) return true
  if (isAmanatProduct(product)) {
    return (AMANAT_PRODUCT_TAB_IDS as readonly string[]).includes(tab)
  }
  return (LICENSE_TAB_IDS as readonly string[]).includes(tab)
}

export function resolveTabForProduct(tab: TabId, product: PlatformProductKey): TabId {
  return tabBelongsToProduct(tab, product) ? tab : defaultTabForProduct(product)
}

export const TAB_LABELS: Record<TabId, string> = {
  deck: 'Deck',
  workspaces: 'Workspaces',
  more: 'More',
  devices: 'Devices',
  requests: 'Requests',
  releases: 'Releases',
  subscriptions: 'Subscriptions',
  zones: 'Zones',
  settings: 'Settings',
}
