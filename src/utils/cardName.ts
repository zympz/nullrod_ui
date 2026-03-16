export function frontFace(value: string): string {
  const idx = value.indexOf(' // ')
  return idx === -1 ? value : value.slice(0, idx)
}

export function backFace(value: string): string | null {
  const idx = value.indexOf(' // ')
  return idx === -1 ? null : value.slice(idx + 4)
}
