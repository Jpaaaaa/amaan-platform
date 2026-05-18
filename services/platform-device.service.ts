export { ROLLING_SYNC_MAX_MS, clampRollingOfflineWindowMs, effectiveRollingSyncMaxMs } from './platform-device-rolling.js'
export {
  CUSTOM_VALID_FOR_MS_MIN,
  CUSTOM_VALID_FOR_MS_MAX,
  clampCustomValidForMs,
  assertTier,
  computeExpiryFromTier,
} from './platform-device-tier.js'
export {
  listDevices,
  findDevice,
  upsertDevice,
  setRevoked,
  updateDeviceAdmin,
  deleteDevice,
  recordSync,
  type UpsertDeviceInput,
  type AdminDevicePatch,
} from './platform-device.repository.js'
export { evaluateDevice, buildPingResponse } from './platform-device.license.js'
