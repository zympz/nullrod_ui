import { NavLink } from 'react-router-dom'
import styles from './Nav.module.css'

const LINKS = [
  { to: '/decks', label: 'Decks' },
  { to: '/combos', label: 'Combos' },
  { to: '/cards', label: 'Cards' },
]

export function Nav() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandName}>Null Rod</span>
        </NavLink>
        <nav className={styles.nav}>
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
