export function birr(value, options = { maximumFractionDigits: 2 }) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString(undefined, options)} Birr`
}
