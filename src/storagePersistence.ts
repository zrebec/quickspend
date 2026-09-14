export type StoragePersistenceStatus = 'persistent' | 'best-effort' | 'unsupported'

export interface PersistenceManager {
  persisted?: () => Promise<boolean>
  persist?: () => Promise<boolean>
}

const currentManager = (): PersistenceManager | undefined =>
  typeof navigator === 'undefined' ? undefined : navigator.storage

const isSupported = (manager: PersistenceManager | undefined): manager is Required<PersistenceManager> =>
  typeof manager?.persisted === 'function' && typeof manager.persist === 'function'

export async function checkStoragePersistence(
  manager: PersistenceManager | undefined = currentManager(),
): Promise<StoragePersistenceStatus> {
  if (!isSupported(manager)) return 'unsupported'

  try {
    return (await manager.persisted()) ? 'persistent' : 'best-effort'
  } catch {
    return 'best-effort'
  }
}

export async function requestPersistentStorage(
  manager: PersistenceManager | undefined = currentManager(),
): Promise<StoragePersistenceStatus> {
  if (!isSupported(manager)) return 'unsupported'

  try {
    if (await manager.persisted()) return 'persistent'
    return (await manager.persist()) ? 'persistent' : 'best-effort'
  } catch {
    return 'best-effort'
  }
}
