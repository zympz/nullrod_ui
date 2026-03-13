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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
