import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Nav } from './components/Nav'
import styles from './App.module.css'

const DecksPage = lazy(() => import('./pages/DecksPage').then((m) => ({ default: m.DecksPage })))
const DeckPage = lazy(() => import('./pages/DeckPage').then((m) => ({ default: m.DeckPage })))
const CombosPage = lazy(() => import('./pages/CombosPage').then((m) => ({ default: m.CombosPage })))
const ComboPage = lazy(() => import('./pages/ComboPage').then((m) => ({ default: m.ComboPage })))
const CardsPage = lazy(() => import('./pages/CardsPage').then((m) => ({ default: m.CardsPage })))
const CardPage = lazy(() => import('./pages/CardPage').then((m) => ({ default: m.CardPage })))

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Nav />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.pageLoading}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/decks" replace />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/decks/:deckId" element={<DeckPage />} />
            <Route path="/combos" element={<CombosPage />} />
            <Route path="/combos/:comboId" element={<ComboPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/cards/:oracleId" element={<CardPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer className={styles.footer}>
        <p>
          Card data and images provided by <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">Scryfall</a>.
          Scryfall is not affiliated with nullrod.com.
        </p>
        <p>
          Nullrod is unofficial Fan Content permitted under the <a href="https://company.wizards.com/en/legal/fancontentpolicy" target="_blank" rel="noopener noreferrer">Wizards of the Coast Fan Content Policy</a>.
          Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast.
          &copy; Wizards of the Coast LLC.
        </p>
      </footer>
    </BrowserRouter>
  )
}
