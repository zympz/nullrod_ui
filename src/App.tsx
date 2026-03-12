import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Nav } from './components/Nav'
import { CardsPage } from './pages/CardsPage'
import { CardPage } from './pages/CardPage'
import { DecksPage } from './pages/DecksPage'
import { DeckPage } from './pages/DeckPage'
import { CombosPage } from './pages/CombosPage'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/decks" replace />} />
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/decks/:deckId" element={<DeckPage />} />
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/cards/:oracleId" element={<CardPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
