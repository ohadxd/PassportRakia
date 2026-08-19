/**
 * WebGL scene background colors, kept in sync with the CSS custom properties
 * in assets/styles/main.css (--bg, --bg-2, --bg-deep). JS numeric literals
 * inside three.js scenes can't reference CSS var(), so this is the single
 * place to update when the palette changes.
 */
export const THEME = {
  bgHex: 0x190c4f, // --bg
  bg2Hex: 0x1d2566, // --bg-2
  bgDeepHex: 0x0a0530 // --bg-deep
} as const
