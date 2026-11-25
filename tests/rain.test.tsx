import { expect, test } from 'claude-code/testing'

import { GLYPHS, strokeTable } from '../hooks/glyphs'
import { COLORS, PAPER_COLORS } from '../hooks/look'
import { checkColors } from '../hooks/make-colors.js'
import { PAPER_SCENE, SCENE } from '../hooks/scene'

const BACKDROP = { plugin: 'digital-rain', surface: 'desktop', component: 'Backdrop' } as const
const GLASS = { blur: 10, tint: '#010402', opacity: 0.74 }

test('every color is one the design system knows, and Desktop will paint it', () => {
  for (const palette of [COLORS, PAPER_COLORS]) {
    const lines = checkColors(palette)

    // What's left are contrast notes under the design system's own bar.
    expect(lines.filter(line => !/ is [0-9.]+:1 in /.test(line))).toEqual([])
    expect(lines.filter(line => line.startsWith("Desktop won't paint"))).toEqual([])
  }
})

test('every glyph fits its box in four strokes or fewer', () => {
  expect(strokeTable().length).toBe(GLYPHS.length * 4)

  for (const glyph of GLYPHS) {
    expect(glyph.length).toBeGreaterThan(0)
    expect(glyph.length).toBeLessThanOrEqual(4)

    for (const stroke of glyph) {
      for (const value of stroke) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  }
})

test('both still scenes stay pure vector and under the size limit', () => {
  for (const scene of [SCENE, PAPER_SCENE]) {
    expect(scene.length).toBeLessThan(131072)

    for (const banned of ['<image', 'data:', '@import', '@font-face', 'CDATA', '<!--', '&#', 'foreignObject', 'feImage']) {
      expect(scene.includes(banned)).toBe(false)
    }
    // The only links are to the scene's own glyphs and filters.
    expect(scene.match(/href="(?!#)/g)).toBeNull()
  }
})

test('the desktop backdrop plays the shader over the still scene', async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, props: { plugin: 'digital-rain', scene: 'rain', glass: GLASS } })

  expect(await ui.find({ type: 'Shader' })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test('the paper backdrop plays the shader over the paper scene', async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, props: { plugin: 'digital-rain', scene: 'paper', glass: { blur: 6, opacity: 0.8 } } })

  expect(await ui.find({ type: 'Shader' })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test("another mod's scene is left alone", async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, props: { plugin: 'someone-else', scene: 'rain', glass: false } })

  expect(await ui.find({ type: 'Shader' })).toBeUndefined()
  await ui.unmount()
})
