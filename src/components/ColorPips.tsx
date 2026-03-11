import styles from './ColorPips.module.css'

const COLOR_LABEL: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
}

interface ColorPipsProps {
  colors: string[]
  size?: number
}

export function ColorPips({ colors, size = 10 }: ColorPipsProps) {
  if (colors.length === 0) return <span className={styles.colorless} style={{ width: size, height: size }} title="Colorless" />
  return (
    <span className={styles.pips}>
      {colors.map((c) => (
        <span
          key={c}
          className={`${styles.pip} ${styles[`pip_${c}`]}`}
          style={{ width: size, height: size }}
          title={COLOR_LABEL[c] ?? c}
        />
      ))}
    </span>
  )
}
