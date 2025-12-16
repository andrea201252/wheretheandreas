import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, update, remove, get } from 'firebase/database'
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

// Genera ID partita casuale
export const generateGameId = () => {
  return Math.random().toString(36).substring(2, 11).toUpperCase()
}

// Crea nuova stanza di gioco
export const createGameRoom = async (gameId: string, players: Player[]) => {
  const gameData = {
    gameId,
    players: {},
    level: 1,
    timeLeft: 30,
    status: 'waiting',
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

  await set(ref(db, \games/\\), gameData)
  return gameId
}

// Unisciti a una partita esistente
export const joinGameRoom = async (gameId: string, player: Player) => {
  await set(ref(db, \games/\/players/\\), {
    id: player.id,
    name: player.name,
    cursorColor: player.cursorColor,
    score: player.score
  })
}

// Ascolta gli aggiornamenti della partita in tempo reale
export const onGameUpdates = (gameId: string, callback: (data: any) => void) => {
  return onValue(ref(db, \games/\\), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  }, (error) => {
    console.error('Errore lettura gioco:', error)
  })
}

// Aggiorna il punteggio di un giocatore
export const updatePlayerScore = async (gameId: string, playerId: string, newScore: number) => {
  await update(ref(db, \games/\/players/\\), { score: newScore })
}

// Aggiorna il livello della partita
export const updateGameLevel = async (gameId: string, level: number) => {
  await update(ref(db, \games/\\), {
    level,
    timeLeft: 30,
    winnerId: null
  })
}

// Aggiorna il tempo rimanente
export const updateGameTime = async (gameId: string, timeLeft: number) => {
  await update(ref(db, \games/\\), { timeLeft })
}

// Imposta il vincitore
export const setGameWinner = async (gameId: string, playerId: string) => {
  await update(ref(db, \games/\\), { winnerId: playerId })
}

// Cambia lo stato della partita
export const updateGameStatus = async (gameId: string, status: 'waiting' | 'playing' | 'completed') => {
  await update(ref(db, \games/\\), { status })
}

// Ottieni una partita specifica
export const getGameRoom = async (gameId: string) => {
  try {
    const snapshot = await get(ref(db, \games/\\))
    return snapshot.exists() ? snapshot.val() : null
  } catch (error) {
    console.error('Errore nel caricamento della partita:', error)
    return null
  }
}

// Elimina una partita (quando finita)
export const deleteGameRoom = async (gameId: string) => {
  await remove(ref(db, \games/\\))
}

// Ascolta cambiamenti su tutti i giocatori
export const onPlayersUpdate = (gameId: string, callback: (players: any) => void) => {
  return onValue(ref(db, \games/\/players\), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    }
  })
}
