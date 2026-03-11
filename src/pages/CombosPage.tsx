import styles from './ComingSoon.module.css'

export function CombosPage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon}>⚡</div>
      <h1 className={styles.title}>Combos</h1>
      <p className={styles.description}>
        Discover, create, and save combos. Import from Commander Spellbook or build your own step-by-step sequences.
      </p>
      <div className={styles.badge}>Coming soon</div>
      <ul className={styles.features}>
        <li>Import from Commander Spellbook</li>
        <li>Step-by-step combo breakdowns</li>
        <li>Prerequisite and result tagging</li>
        <li>Link combos to decks</li>
        <li>Search by card, result, or tag</li>
      </ul>
    </div>
  )
}
