export interface TagColor {
  name: string
  bg: string
  text: string
}

export const TAG_COLOR_PALETTE: TagColor[] = [
  { name: "blue", bg: "#dbeafe", text: "#1d4ed8" },
  { name: "green", bg: "#dcfce7", text: "#15803d" },
  { name: "red", bg: "#fee2e2", text: "#b91c1c" },
  { name: "purple", bg: "#f3e8ff", text: "#7c3aed" },
  { name: "orange", bg: "#ffedd5", text: "#c2410c" },
  { name: "teal", bg: "#ccfbf1", text: "#0f766e" },
  { name: "pink", bg: "#fce7f3", text: "#be185d" },
  { name: "yellow", bg: "#fef9c3", text: "#a16207" },
  { name: "indigo", bg: "#e0e7ff", text: "#4338ca" },
  { name: "lime", bg: "#ecfccb", text: "#4d7c0f" },
  { name: "rose", bg: "#ffe4e6", text: "#be123c" },
  { name: "cyan", bg: "#cffafe", text: "#0e7490" },
  { name: "amber", bg: "#fef3c7", text: "#b45309" },
  { name: "violet", bg: "#ede9fe", text: "#6d28d9" },
  { name: "emerald", bg: "#d1fae5", text: "#047857" },
  { name: "slate", bg: "#f1f5f9", text: "#475569" },
]

export function getNextTagColor(existingColors: string[]): string {
  const used = new Set(existingColors)
  const available = TAG_COLOR_PALETTE.find((c) => !used.has(c.name))
  return (
    available?.name ??
    TAG_COLOR_PALETTE[existingColors.length % TAG_COLOR_PALETTE.length].name
  )
}

export function getTagStyle(colorName: string): { bg: string; text: string } {
  const color = TAG_COLOR_PALETTE.find((c) => c.name === colorName)
  return color ?? TAG_COLOR_PALETTE[0]
}
