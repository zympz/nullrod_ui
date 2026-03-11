import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Nav } from './components/Nav'
import { CardsPage } from './pages/CardsPage'
import { DecksPage } from './pages/DecksPage'
import { CombosPage } from './pages/CombosPage'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/cards" replace />} />
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/combos" element={<CombosPage />} />
          <Route path="/cards" element={<CardsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
