import { describe, expect, it, vi } from 'vitest'
import {
  checkStoragePersistence,
  requestPersistentStorage,
  type PersistenceManager,
} from '../storagePersistence'

describe('storage persistence', () => {
  it('reports unsupported browsers without throwing', async () => {
    await expect(checkStoragePersistence(undefined)).resolves.toBe('unsupported')
    await expect(requestPersistentStorage(undefined)).resolves.toBe('unsupported')
  })

  it('reports an existing persistent grant without requesting it again', async () => {
    const manager: PersistenceManager = {
      persisted: vi.fn().mockResolvedValue(true),
      persist: vi.fn().mockResolvedValue(true),
    }

    await expect(requestPersistentStorage(manager)).resolves.toBe('persistent')
    expect(manager.persist).not.toHaveBeenCalled()
  })

  it('requests and reports persistent storage', async () => {
    const manager: PersistenceManager = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    }

    await expect(checkStoragePersistence(manager)).resolves.toBe('best-effort')
    await expect(requestPersistentStorage(manager)).resolves.toBe('persistent')
    expect(manager.persist).toHaveBeenCalledOnce()
  })

  it('keeps working when the browser denies or fails the request', async () => {
    const denied: PersistenceManager = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    }
    const failed: PersistenceManager = {
      persisted: vi.fn().mockRejectedValue(new Error('unavailable')),
      persist: vi.fn(),
    }

    await expect(requestPersistentStorage(denied)).resolves.toBe('best-effort')
    await expect(requestPersistentStorage(failed)).resolves.toBe('best-effort')
  })
})
