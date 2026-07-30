import { reactive, watch } from 'vue'
import type {
  AppData,
  Contract,
  Concert,
  Release,
  RoyaltyEntry,
  StudioSession,
  Contact,
} from './types'
import { seedData } from './seed'

const STORAGE_KEY = 'rapidmusic:data:v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    /* ignore corrupted storage */
  }
  return seedData()
}

export const store = reactive<AppData>(load())

watch(
  () => store,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      /* storage full or unavailable */
    }
  },
  { deep: true },
)

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function resetData(): void {
  const fresh = seedData()
  Object.assign(store, fresh)
}

/* -------------------------------------------------------------------------- */
/*  Generic CRUD helpers                                                      */
/* -------------------------------------------------------------------------- */

type Collections = {
  contracts: Contract
  concerts: Concert
  releases: Release
  royalties: RoyaltyEntry
  studio: StudioSession
  contacts: Contact
}

export function upsert<K extends keyof Collections>(key: K, item: Collections[K]): void {
  const list = store[key] as unknown as { id: string }[]
  const idx = list.findIndex((x) => x.id === (item as { id: string }).id)
  if (idx >= 0) list.splice(idx, 1, item as never)
  else list.unshift(item as never)
}

export function remove<K extends keyof Collections>(key: K, id: string): void {
  const list = store[key] as unknown as { id: string }[]
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) list.splice(idx, 1)
}
