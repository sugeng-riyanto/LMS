export function parseScale(scale: string): { min: number; max: number; values: number[] } {
  const parts = scale.split("-").map(Number)
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return { min: 0, max: 4, values: [0, 1, 2, 3, 4] }
  const [min, max] = parts
  const values: number[] = []
  for (let i = min; i <= max; i++) values.push(i)
  return { min, max, values }
}
