# Where are the Andrea's 🎮

Un gioco hidden objects interattivo costruito con **React + TypeScript + Vite**.

## 🎯 Caratteristiche

- **🎮 Gioco Multi-Livello**: Diversi livelli di difficoltà
- **⏱️ Timer**: 30 secondi per trovare i due Andrea
- **🎨 Interfaccia Festiva**: Introduzione con titolo arcobaleno e decorazioni blu
- **🖱️ Meccanica Interattiva**: Clicca sulla foto per trovare gli Andrea
- **🏆 Sistema di Punti**: Tracciamento del progresso

## 📁 Struttura del Progetto

```
src/
├── components/
│   ├── GameTimer.tsx         # Componente timer
│   ├── PhotoBoard.tsx        # Componente board di gioco
│   ├── GameTimer.css
│   └── PhotoBoard.css
├── pages/
│   ├── IntroScreen.tsx       # Schermata introduttiva
│   ├── GameScreen.tsx        # Schermata di gioco
│   ├── IntroScreen.css
│   └── GameScreen.css
├── hooks/                    # Custom hooks
├── types/                    # Tipi TypeScript
├── App.tsx                   # Componente principale
├── App.css
├── main.tsx                  # Entry point
└── index.css                 # Stili globali
```

## 🚀 Come Avviare

### Prerequisiti
- Node.js 16+ installato

### Installazione

```bash
npm install
```

### Sviluppo

```bash
npm run dev
```

L'app si aprirà automaticamente su `http://localhost:3000`

### Build

```bash
npm run build
```

## 🎮 Come Giocare

1. **Introduzione**: Clicca "Inizia il Gioco" sulla schermata introduttiva
2. **Ricerca**: Hai 30 secondi per trovare i due Andrea nascosti nella foto
3. **Clicca**: Clicca sulla foto per posizionare un marker
4. **Frecce**: Le frecce rosse appariranno per indicare i nascondigli degli Andrea
5. **Completa**: Una volta trovati entrambi, accedi al prossimo livello

## 🎨 Personalizzazione

### Aggiungere Foto
Sostituisci il placeholder in `PhotoBoard.tsx` con le tue foto:

```tsx
<img src="/path/to/photo.jpg" alt="Game photo" />
```

### Aggiungere Livelli
Modifica `andreasConfig` in `GameScreen.tsx` per aggiungere nuovi livelli con coordinate diverse.

### Modificare Tempo
Cambia il valore iniziale in `GameScreen.tsx`:
```tsx
const [timeLeft, setTimeLeft] = useState(30) // Cambia il numero
```

## 🎨 Colori Utilizzati

- **Blu Primario**: #4a90e2
- **Blu Chiaro**: #7cb3f0
- **Blu Scuro**: #2c5aa0
- **Bianco**: #ffffff
- **Grigio Chiaro**: #f5f5f5

## 📝 Note Importanti

- ⚠️ **Locale Only**: Questa app è progettata solo per l'esecuzione locale
- 📸 **Foto**: Aggiungi le foto nel cartello `public/` e referenzia nel codice
- 🎯 **Coordinate**: Le coordinate degli Andrea vanno inserite manualmente in `GameScreen.tsx`

## 🔧 Dipendenze Principali

- `react@^18.2.0` - Framework UI
- `vite@^5.0.8` - Build tool
- `typescript@^5.2.2` - Type checking

## 📄 Licenza

Progetto locale - Non distribuire

---

Fatto! Lo scheletro dell'app è pronto. 🚀
