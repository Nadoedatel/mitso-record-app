import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * WCAG AA contrast of the design tokens (4.5:1 for normal text). Reads app/shared/styles/_tokens.scss,
 * resolves var() chains and checks the pairs components really use, in both themes.
 * Tokens built with color-mix()/rgba() (tints over the surface in the dark theme) cannot be resolved to one
 * color and are skipped.
 */
const source = readFileSync('app/shared/styles/_tokens.scss', 'utf8')
const [lightPart, darkPart] = source.split(":root[data-theme='dark']")

function parseDeclarations(css: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const match of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    const name = match[1]!
    const value = match[2]!.replace(/\/\*.*?\*\//g, '').trim()
    map.set(name, value)
  }
  return map
}

const light = parseDeclarations(lightPart!)
const dark = new Map([...light, ...parseDeclarations(darkPart!)])

function resolve(theme: Map<string, string>, name: string, depth = 0): string | null {
  const value = theme.get(name)
  if (!value || depth > 8) return null
  const ref = value.match(/^var\((--[a-z0-9-]+)\)$/)
  if (ref) return resolve(theme, ref[1]!, depth + 1)
  return /^#[0-9a-f]{6}$/i.test(value) ? value : null
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function ratio(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x)
  return (a! + 0.05) / (b! + 0.05)
}

const textOnSurface = ['text-primary', 'text-secondary', 'text-tertiary', 'primary', 'danger', 'success']
const onSolid = ['primary', 'success', 'danger', 'warning', 'info', 'neutral']
const statusPairs = ['success', 'danger', 'warning', 'info'].map((s) => [`${s}-dark`, `${s}-light`] as const)
const gradePairs = [
  ...['exam', 'credit', 'coursework', 'lab', 'test'].map((g) => [`grade-${g}-text`, `grade-${g}-bg`] as const),
  ...['excellent', 'good', 'satisfactory', 'poor'].map((g) => [`grade-${g}-text`, `grade-${g}-bg`] as const),
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (_themeName, theme) => {
  function check(foreground: string, background: string) {
    const fg = resolve(theme, `--color-${foreground}`)
    const bg = resolve(theme, `--color-${background}`)
    if (!fg || !bg) return // not a plain color (color-mix/rgba): cannot be measured here
    expect(ratio(fg, bg), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5)
  }

  it.each(textOnSurface)('%s is readable on the surface and the page', (token) => {
    check(token, 'surface')
    check(token, 'bg-page')
  })

  it.each(onSolid)('text on a solid %s fill is readable', (token) => {
    check('on-solid', token)
  })

  it.each(statusPairs)('%s on %s', (foreground, background) => check(foreground, background))
  it.each(gradePairs)('%s on %s', (foreground, background) => check(foreground, background))
})
