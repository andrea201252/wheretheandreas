import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, update, remove, get, onDisconnect, runTransaction } from 'firebase/database'
import { Player } from '../App'

const firebaseConfig = {
  apiKey: "AIzaSyApDiI0tezQc2AZv7lZJznz87nStuMxapQ",
  authDomain: "where-are-the-andreas.firebaseapp.com",
  databaseURL: "https://where-are-the-andreas-default-rtdb.firebaseio.com",
  projectId: "where-are-the-andreas",
  storageBucket: "where-are-the-andreas.firebasestorage.app",
  messagingSenderId: "979901597034",
  appId: "1:979901597034:web:64bfa220b416c2b38d5113",
  measurementId: "G-GNNXPQXY87"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)


// =========================
// CLIENT ID (persistente per browser)
// =========================
const CLIENT_ID_KEY = 'wataa_client_id'

export const getClientId = (): string => {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY)
    if (existing) return existing
    const id =
      Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36).slice(2, 8)
    localStorage.setItem(CLIENT_ID_KEY, id)
    return id
  } catch {
    // fallback senza storage
    return Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36).slice(2, 8)
  }
}

// =========================
// PLAYER SLOT CLAIM (anti-duplica online)
// games/{gameId}/claims/{playerId} = clientId
// =========================
export const claimPlayerSlot = async (gameId: string, playerId: string, clientId: string): Promise<boolean> => {
  const claimRef = ref(db, `games/${gameId}/claims/${playerId}`)
  const result = await runTransaction(
    claimRef,
    (current) => {
      if (current === null) return clientId
      if (current === clientId) return current
      // slot già preso
      return
    },
    { applyLocally: false }
  )

  if (!result.committed) return false

  // Rilascia automaticamente se il client si disconnette
  try {
    await onDisconnect(claimRef).remove()
  } catch {
    // ignora
  }
  return true
}

export const releasePlayerSlot = async (gameId: string, playerId: string, clientId: string): Promise<void> => {
  const claimRef = ref(db, `games/${gameId}/claims/${playerId}`)
  await runTransaction(
    claimRef,
    (current) => {
      if (current === clientId) return null
      return current
    },
    { applyLocally: false }
  )
}


// Genera ID partita casuale
export const generateGameId = () => {
  return Math.random().toString(36).substring(2, 11).toUpperCase()
}

// Crea nuova stanza di gioco
export const createGameRoom = async (gameId: string, players: Player[], hostClientId?: string) => {
  const gameData = {
    gameId,
    hostId: players[0]?.id || null,
    hostClientId: hostClientId || null,
    players: {},
    level: 1,
    timeLeft: 30,
    status: 'waiting',
    phase: 'levelIntro',
    createdAt: Date.now(),
    winnerId: null
  }

  players.forEach(p => {
    (gameData.players as any)[p.id] = {
      id: p.id,
      name: p.name,
      cursorColor: p.cursorColor,
      score: p.score
    }
  })

  await set(ref(db, `games/${gameId}`), gameData)
  return gameId
}

// Unisciti a una partita esistente
export const joinGameRoom = async (gameId: string, player: Player) => {
  await set(ref(db, `games/${gameId}/players/${player.id}`), {
    id: player.id,
    name: player.name,
    cursorColor: player.cursorColor,
    score: player.score
  })
}

// Ascolta gli aggiornamenti della partita in tempo reale
export const onGameUpdates = (gameId: string, callback: (data: any) => void) => {
  return onValue(ref(db, `games/${gameId}`), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  }, (error) => {
    console.error('Errore lettura gioco:', error)
  })
}

// Aggiorna il punteggio di un giocatore
export const updatePlayerScore = async (gameId: string, playerId: string, newScore: number) => {
  await update(ref(db, `games/${gameId}/players/${playerId}`), { score: newScore })
}

// Aggiorna il livello della partita
export const updateGameLevel = async (gameId: string, level: number) => {
  await update(ref(db, `games/${gameId}`), {
    level,
    timeLeft: 30,
    winnerId: null
  })
}

// Aggiorna il tempo rimanente
export const updateGameTime = async (gameId: string, timeLeft: number) => {
  await update(ref(db, `games/${gameId}`), { timeLeft })
}

// Imposta il vincitore
export const setGameWinner = async (gameId: string, playerId: string) => {
  await update(ref(db, `games/${gameId}`), { winnerId: playerId })
}

// Cambia lo stato della partita
export const updateGameStatus = async (gameId: string, status: 'waiting' | 'playing' | 'completed') => {
  await update(ref(db, `games/${gameId}`), { status })
}

// Aggiorna la fase (screen) condivisa della partita
export const updateGamePhase = async (
  gameId: string,
  phase: 'levelIntro' | 'playing' | 'gameEnd'
) => {
  await update(ref(db, `games/${gameId}`), { phase })
}

// Ottieni una partita specifica
export const getGameRoom = async (gameId: string) => {
  try {
    const snapshot = await get(ref(db, `games/${gameId}`))
    return snapshot.exists() ? snapshot.val() : null
  } catch (error) {
    console.error('Errore nel caricamento della partita:', error)
    return null
  }
}

// Elimina una partita (quando finita)
export const deleteGameRoom = async (gameId: string) => {
  await remove(ref(db, `games/${gameId}`))
}

// Ascolta cambiamenti su tutti i giocatori
export const onPlayersUpdate = (gameId: string, callback: (players: any) => void) => {
  return onValue(ref(db, `games/${gameId}/players`), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}

// =========================
// CURSORI MULTI-PLAYER
// =========================

export type CursorPayload = {
  // coordinate normalizzate (0-1) sul viewport locale
  x: number
  y: number
  ts: number
}

export const updatePlayerCursor = async (gameId: string, playerId: string, cursor: CursorPayload) => {
  await set(ref(db, `games/${gameId}/cursors/${playerId}`), cursor)
}

export const removePlayerCursor = async (gameId: string, playerId: string) => {
  await remove(ref(db, `games/${gameId}/cursors/${playerId}`))
}

export const attachCursorDisconnectCleanup = async (gameId: string, playerId: string) => {
  // Quando la connessione cade, rimuove il cursore
  try {
    await onDisconnect(ref(db, `games/${gameId}/cursors/${playerId}`)).remove()
  } catch (e) {
    // Non bloccare l'app se onDisconnect fallisce (capita su alcuni browser)
    console.warn('onDisconnect cursor cleanup failed:', e)
  }
}

export const onCursorsUpdate = (gameId: string, callback: (cursors: any) => void) => {
  return onValue(ref(db, `games/${gameId}/cursors`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

// =========================
// RISULTATI PER LIVELLO + PUNTEGGI
// =========================

export type LevelResult = {
  time: number // secondi impiegati (o 30 se non trovato)
  found: boolean
  submittedAt: number
}

export const submitLevelResult = async (
  gameId: string,
  level: number,
  playerId: string,
  result: LevelResult
) => {
  await set(ref(db, `games/${gameId}/levelResults/${level}/${playerId}`), result)
}

export const onLevelResultsUpdate = (
  gameId: string,
  level: number,
  callback: (results: any) => void
) => {
  return onValue(ref(db, `games/${gameId}/levelResults/${level}`), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {})
  })
}

export const isLevelProcessed = async (gameId: string, level: number) => {
  const snap = await get(ref(db, `games/${gameId}/processedLevels/${level}`))
  return snap.exists()
}

export type PlacementRow = {
  playerId: string
  playerName: string
  rank: number
  time: number
  found: boolean
  points: number
}

export const finalizeLevel = async (
  gameId: string,
  level: number,
  placements: PlacementRow[],
  scoreUpdates: Record<string, number>,
  next: { phase: 'levelIntro' | 'gameEnd'; level?: number; status: 'waiting' | 'playing' | 'completed' }
) => {
  const updates: any = {}

  // guard idempotenza
  updates[`processedLevels/${level}`] = Date.now()

  // salva piazzamenti
  updates[`levelPlacements/${level}`] = {
    processedAt: Date.now(),
    placements
  }

  // aggiorna punteggi
  Object.entries(scoreUpdates).forEach(([playerId, newScore]) => {
    updates[`players/${playerId}/score`] = newScore
  })

  // avanzamento partita
  updates['phase'] = next.phase
  updates['status'] = next.status
  if (typeof next.level === 'number') {
    updates['level'] = next.level
    updates['timeLeft'] = 30
    updates['winnerId'] = null
  }

  await update(ref(db, `games/${gameId}`), updates)
}
