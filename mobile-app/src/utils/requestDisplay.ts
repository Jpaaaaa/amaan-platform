export function formatRelativeAge(updatedAtMs: number): string {
  const diff = Date.now() - updatedAtMs
  if (diff < 0) return 'just now'
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return sec <= 1 ? 'just now' : `${sec} sec ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return min === 1 ? '1 min ago' : `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr === 1 ? '1 hr ago' : `${hr} hr ago`
  const day = Math.floor(hr / 24)
  return day === 1 ? '1 day ago' : `${day} days ago`
}

export function truncateMachineId(machineId: string): string {
  if (machineId.length <= 16) return machineId
  return `${machineId.slice(0, 8)}…${machineId.slice(-8)}`
}

export function formatStoreType(
  storeType: string | null,
  storeTypeOther: string | null,
): string | null {
  if (!storeType) return null
  if (storeType === 'other') {
    const other = storeTypeOther?.trim()
    return other || 'other'
  }
  return storeType.replace(/_/g, ' ')
}
