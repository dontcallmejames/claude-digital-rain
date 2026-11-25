// The still frame of the rain, drawn as vectors from the same glyphs as the
// shader. It shows wherever the shader doesn't play: on a phone, under Reduce
// Motion, or if the GPU can't keep up, so it is a finished picture on its own.
// Each glyph is defined once and placed with <use>, which keeps the file small.

import { GLYPHS } from './glyphs'

const n = (x: number) => Math.round(x * 10) / 10

// A small deterministic random, so the picture is the same every time.
function seeded(seed: number) {
  let s = seed >>> 0

  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0
    s ^= s >>> 13

    return (s >>> 0) / 4294967296
  }
}

// One glyph as path data in a w by h cell, optionally mirrored.
function glyphPath(index: number, w: number, h: number, mirror: boolean): string {
  const gw = w * 0.68
  const gh = h * 0.76
  const ox = (w - gw) / 2
  const oy = (h - gh) / 2
  const x = (u: number) => n(ox + (mirror ? 1 - u : u) * gw)
  const y = (v: number) => n(oy + v * gh)

  return (GLYPHS[index] ?? [])
    .map(([x1, y1, x2, y2]) => `M${x(x1)} ${y(y1)}L${x(x2)} ${y(y2)}`)
    .join('')
}

// A depth of rain: glyph defs for its cell size, then columns of trails.
function depth(id: string, w: number, width: number, height: number, columnsLit: number, seed: number): { defs: string; body: string } {
  const h = w * 1.28
  const rand = seeded(seed)
  let defs = ''

  for (let i = 0; i < GLYPHS.length; i++) {
    defs += `<path id="${id}${i}" d="${glyphPath(i, w, h, false)}"/>`
    defs += `<path id="${id}m${i}" d="${glyphPath(i, w, h, true)}"/>`
  }

  const cols = Math.ceil(width / w)
  const rows = Math.ceil(height / h)
  let body = ''

  for (let c = 0; c < cols; c++) {
    if (rand() > columnsLit) {
      continue
    }

    const drops = rand() < 0.35 ? 2 : 1
    let cells = ''

    for (let k = 0; k < drops; k++) {
      const head = Math.floor(rand() * (rows + 12)) - 2
      const span = 6 + Math.floor(rand() * 20)

      for (let d = 0; d <= span; d++) {
        const r = head - d

        if (r < 0 || r >= rows) {
          continue
        }

        const fade = 1 - d / span
        const level = Math.max(1, Math.round(fade * fade * 9 * (0.7 + 0.3 * rand())))
        const glyph = Math.floor(rand() * GLYPHS.length)
        const ref = `${id}${rand() < 0.5 ? 'm' : ''}${glyph}`
        const cls = d === 0 ? 'hd' : `o${level}`

        cells += `<use href="#${ref}" y="${n(r * h)}" class="${cls}"/>`
      }
    }

    if (cells !== '') {
      body += `<g transform="translate(${n(c * w)})">${cells}</g>`
    }
  }

  return { defs, body }
}

const WIDTH = 1600
const HEIGHT = 1000

const far = depth('f', 9, WIDTH, HEIGHT, 0.22, 7)
const near = depth('n', 15, WIDTH, HEIGHT, 0.5, 19)

// Trail levels 1 to 9, dim green to bright; heads white-green with a bloom.
const levels = Array.from({ length: 9 }, (_, i) => {
  const t = (i + 1) / 9

  return `.o${i + 1} { stroke-opacity: ${Math.round((0.12 + 0.88 * t * t) * 100) / 100}; }`
}).join('\n')

// Dark by default; the white room in light mode. The shader reads which one
// shows from this picture, so the ground must stay the darkest thing in dark
// mode and the glyphs lighter than black in light mode.
const STYLE = `
.bg { fill: #010603; }
.edge { stop-color: #000000; stop-opacity: 0.6; }
.calm { stop-color: #010603; }
.far { fill: none; stroke: #1a9e48; stroke-width: 1.2; stroke-linecap: round; opacity: 0.3; filter: url(#soft); }
.near { fill: none; stroke: #27e863; stroke-width: 2.1; stroke-linecap: round; }
.hd { stroke: #d8ffe4; stroke-opacity: 1; filter: url(#bloom); }
${levels}
@media (prefers-color-scheme: light) {
  .bg { fill: #f3f6f4; }
  .edge { stop-color: #8a9a90; stop-opacity: 0.16; }
  .calm { stop-color: #f3f6f4; }
  .far { stroke: #a9bcb0; opacity: 0.55; }
  .near { stroke: #93aa9b; }
  .hd { stroke: #0b7a35; filter: none; }
}
`

export const SCENE = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">`,
  `<style>${STYLE}</style>`,
  '<defs>',
  '<filter id="bloom" x="-1" y="-1" width="3" height="3">',
  '<feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b"/>',
  '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
  '</filter>',
  '<filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>',
  '<radialGradient id="shade" cx="0.5" cy="0.5" r="0.75">',
  '<stop offset="0.45" stop-color="#000" stop-opacity="0"/>',
  '<stop class="edge" offset="1"/>',
  '</radialGradient>',
  '<linearGradient id="calm" x1="0" x2="1" y1="0" y2="0">',
  '<stop class="calm" offset="0.28" stop-opacity="0"/>',
  '<stop class="calm" offset="0.5" stop-opacity="0.4"/>',
  '<stop class="calm" offset="0.72" stop-opacity="0"/>',
  '</linearGradient>',
  far.defs,
  near.defs,
  '</defs>',
  `<rect class="bg" width="${WIDTH}" height="${HEIGHT}"/>`,
  `<g class="far">${far.body}</g>`,
  `<g class="near">${near.body}</g>`,
  `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#calm)"/>`,
  `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>`,
  '</svg>',
].join('')
