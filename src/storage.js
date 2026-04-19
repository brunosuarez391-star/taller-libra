import { buildInitialRooms, SEED_GUESTS } from './data.js'

const STORAGE_KEY = 'hotel-luque:v1'

const DEFAULT_STATE = {
  rooms: [],
  guests: [],
  reservations: [],
  charges: [],
  payments: [],
  housekeepingLog: [],
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = {
        ...DEFAULT_STATE,
        rooms: buildInitialRooms(),
        guests: SEED_GUESTS,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return { ...DEFAULT_STATE, rooms: buildInitialRooms(), guests: SEED_GUESTS }
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('No se pudo guardar el estado', err)
  }
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY)
  return loadState()
}

export function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
