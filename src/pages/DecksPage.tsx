import styles from './ComingSoon.module.css'

export function DecksPage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon}>🃏</div>
      <h1 className={styles.title}>Decks</h1>
      <p className={styles.description}>
        Build and manage your decks. Link combos, track card counts, and check format legality.
      </p>
      <div className={styles.badge}>Coming soon</div>
      <ul className={styles.features}>
        <li>Mainboard / sideboard / maybeboard</li>
        <li>Commander &amp; companion support</li>
        <li>Format legality checking</li>
        <li>Link combos to your deck</li>
        <li>Import from Moxfield, Archidekt, EDHREC</li>
      </ul>
    </div>
  )
}
