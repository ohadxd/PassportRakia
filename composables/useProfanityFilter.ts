import { forbiddenWords } from '~/data/forbiddenWords'

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function useProfanityFilter() {
  const words = forbiddenWords.map(normalizeText).filter(Boolean)

  function check(text: string) {
    const normalized = normalizeText(text)
    const found = words.find((word) => normalized.includes(word))
    return {
      approved: !found,
      rejectedReason: found ? 'הטקסט כולל מילה שאינה מתאימה לתצוגה ציבורית.' : undefined
    }
  }

  return { check }
}
