// Digital rain, played on the GPU behind the conversation.
//
// Two rooms, one rain. In dark mode it is green light on black glass; in
// light mode it is the white room, a bright empty space where the same rain
// falls softly in grey-green with deep-green leading glyphs. The shader can't
// ask which mode the app shows, so it reads it from the still scene under it,
// which paints itself white or black by the mode.
//
// One flat grid of glyph columns, as the classic look has it. Each column
// carries two drops at its own speed. A drop's head lights the cell it reaches
// in white-green with a bloom, and the cells behind it stay lit in green,
// fading over the drop's length. The glyphs stand still in their cells while
// the light runs down them; about a quarter of them change now and then,
// never faster than about once a second, so nothing flickers. Behind the grid,
// a soft haze of out-of-focus streaks falls more slowly, for depth.
//
// The pointer: where it rests, the dark glyphs between the drops come up out
// of the black, as if the code were showing through, and they sink back once
// it moves on. A press sends one ripple through the rain, bending the columns
// as its crest passes, and starts a burst of fast drops falling from the
// point that was pressed. Both are gone within a second.
import {
  abs,
  buffer,
  clamp,
  dot,
  dt,
  exp,
  floor,
  fract,
  int,
  length,
  max,
  min,
  mix,
  mod,
  picture,
  pointers,
  px,
  range,
  scene,
  shader,
  size,
  smoothstep,
  step,
  table,
  time,
  unsigned,
  vec2,
  vec3,
  vec4,
} from 'claude-code/shader'
import type { Buffer, vec2 as Vec2 } from 'claude-code/shader'

// Four strokes a glyph, x1 y1 x2 y2 in the glyph's unit box, y down. The same
// strokes as hooks/glyphs.ts, which draws the still scene from them.
const COUNT = 24
const STROKES = table([
  [0.2, 0.12, 0.8, 0.12],
  [0.25, 0.5, 0.8, 0.5],
  [0.2, 0.88, 0.8, 0.88],
  [0.8, 0.12, 0.8, 0.88],
  [0.4, 0.18, 0.14, 0.82],
  [0.6, 0.18, 0.88, 0.82],
  [-9, -9, -9, -9],
  [-9, -9, -9, -9],
  [0.26, 0.26, 0.74, 0.26],
  [0.12, 0.78, 0.88, 0.78],
  [-9, -9, -9, -9],
  [-9, -9, -9, -9],
  [0.15, 0.32, 0.85, 0.27],
  [0.12, 0.63, 0.88, 0.58],
  [0.44, 0.08, 0.58, 0.94],
  [-9, -9, -9, -9],
  [0.14, 0.24, 0.26, 0.46],
  [0.42, 0.2, 0.5, 0.4],
  [0.86, 0.2, 0.36, 0.92],
  [-9, -9, -9, -9],
  [0.15, 0.12, 0.85, 0.12],
  [0.85, 0.12, 0.4, 0.9],
  [-9, -9, -9, -9],
  [-9, -9, -9, -9],
  [0.15, 0.12, 0.85, 0.12],
  [0.85, 0.12, 0.15, 0.88],
  [0.15, 0.88, 0.85, 0.88],
  [-9, -9, -9, -9],
  [0.2, 0.1, 0.2, 0.9],
  [0.8, 0.1, 0.8, 0.9],
  [0.2, 0.1, 0.8, 0.1],
  [0.2, 0.9, 0.8, 0.9],
  [0.18, 0.15, 0.82, 0.15],
  [0.82, 0.15, 0.82, 0.85],
  [0.18, 0.85, 0.82, 0.85],
  [-9, -9, -9, -9],
  [0.1, 0.36, 0.9, 0.36],
  [0.6, 0.08, 0.42, 0.92],
  [-9, -9, -9, -9],
  [-9, -9, -9, -9],
  [0.76, 0.1, 0.2, 0.92],
  [0.3, 0.4, 0.86, 0.86],
  [-9, -9, -9, -9],
  [-9, -9, -9, -9],
  [0.55, 0.08, 0.55, 0.92],
  [0.55, 0.08, 0.3, 0.3],
  [0.32, 0.92, 0.78, 0.92],
  [-9, -9, -9, -9],
  [0.3, 0.15, 0.3, 0.6],
  [0.72, 0.1, 0.68, 0.6],
  [0.68, 0.6, 0.4, 0.92],
  [-9, -9, -9, -9],
  [0.15, 0.15, 0.35, 0.28],
  [0.12, 0.45, 0.32, 0.58],
  [0.2, 0.9, 0.88, 0.34],
  [-9, -9, -9, -9],
  [0.46, 0.08, 0.15, 0.45],
  [0.4, 0.22, 0.85, 0.22],
  [0.85, 0.22, 0.35, 0.92],
  [-9, -9, -9, -9],
  [0.2, 0.15, 0.8, 0.15],
  [0.5, 0.15, 0.5, 0.85],
  [0.12, 0.85, 0.88, 0.85],
  [-9, -9, -9, -9],
  [0.12, 0.38, 0.88, 0.28],
  [0.88, 0.28, 0.7, 0.55],
  [0.3, 0.08, 0.55, 0.92],
  [-9, -9, -9, -9],
  [0.2, 0.12, 0.8, 0.12],
  [0.2, 0.12, 0.2, 0.5],
  [0.2, 0.5, 0.8, 0.5],
  [0.8, 0.12, 0.8, 0.9],
  [0.25, 0.1, 0.25, 0.88],
  [0.25, 0.46, 0.8, 0.32],
  [0.25, 0.88, 0.85, 0.88],
  [-9, -9, -9, -9],
  [0.12, 0.3, 0.88, 0.3],
  [0.5, 0.08, 0.5, 0.92],
  [0.3, 0.55, 0.12, 0.82],
  [0.7, 0.55, 0.88, 0.82],
  [0.2, 0.15, 0.8, 0.15],
  [0.1, 0.48, 0.9, 0.48],
  [0.4, 0.15, 0.4, 0.85],
  [0.4, 0.85, 0.88, 0.85],
  [0.25, 0.12, 0.75, 0.12],
  [0.15, 0.38, 0.85, 0.38],
  [0.85, 0.38, 0.4, 0.92],
  [-9, -9, -9, -9],
  [0.5, 0.1, 0.5, 0.9],
  [0.2, 0.35, 0.8, 0.35],
  [0.3, 0.7, 0.7, 0.7],
  [-9, -9, -9, -9],
  [0.5, 0.22, 0.5, 0.3],
  [0.16, 0.5, 0.84, 0.5],
  [0.5, 0.7, 0.5, 0.78],
  [-9, -9, -9, -9],
])

// The grid: cell width in points, and its height.
const W = 15
const H = 19.2

const DARK = vec3(0.0, 0.012, 0.006)
const DEEP = vec3(0.0, 0.3, 0.1)
const GREEN = vec3(0.12, 0.96, 0.42)
const HEAD = vec3(0.8, 1.0, 0.88)

// The white room: near-white air, grey-green trails, deep-green heads.
const AIR = vec3(0.955, 0.965, 0.958)
const MIST = vec3(0.56, 0.67, 0.6)
const INK = vec3(0.04, 0.46, 0.2)

// A whole-number hash of three numbers, from 0 to 1.
function hash(a: number, b: number, c: number): number {
  let h = int(int(a) * 374761393 + int(b) * 668265263 + int(c) * 1440662683)
  h = int((h ^ (h >>> 13)) * 1274126177)
  return unsigned(int(h ^ (h >>> 16))) / 4294967296
}

// How far q is from the stroke a to b.
function stroke(q: Vec2, a: Vec2, b: Vec2): number {
  const pa = vec2(q - a)
  const ba = vec2(b - a)
  const t = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0, 1)
  return length(pa - ba * t)
}

// The grid at q (points, y up): how bright the glyph light is there, with
// heads counted double. `reveal` is how hard the pointer is lighting this spot.
function rain(q: Vec2, reveal: number): number {
  const top = size.y - q.y
  const col = floor(q.x / W)
  const row = floor(top / H)
  const fx = q.x / W - col
  const fy = top / H - row
  const rows = size.y / H

  // The column's two drops, half a period apart. One hash gives the column
  // its speed, gap and start; each pass of a drop picks a new length.
  const column = hash(col, 7, 1)
  const speed = mix(5, 13, column)
  const period = rows + mix(10, 48, fract(column * 7.31))
  const run = time * speed + fract(column * 13.7) * period
  let lit = 0
  let lead = 0

  for (const k of range(2)) {
    const along = run + k * period * 0.5
    const pass = floor(along / period)
    const headRow = floor(along - pass * period) - 3
    const span = mix(6, 26, hash(col + 97 * k, pass, 4))
    const d = headRow - row
    const on = step(0, d) * step(d, span)
    const fade = max(1 - d / span, 0)

    lit = max(lit, on * fade * fade)
    lead = max(lead, on * step(d, 0.5))
  }

  // A press starts fast drops in the five columns around it.
  const pace = 16 + 14 * fract(column * 5.13)

  for (const ptr of pointers) {
    const pressCol = floor(ptr.at.x / W)
    const pressRow = floor((size.y - ptr.at.y) / H)
    const near = step(abs(col - pressCol), 2.5) * ptr.down * (1 - smoothstep(0.5, 1, ptr.gone))
    const d = pressRow + floor(ptr.age * pace) - row
    const on = step(0, d) * step(d, 12) * near
    const fade = max(1 - d / 12, 0)

    lit = max(lit, on * fade * fade)
    lead = max(lead, on * step(d, 0.5))
  }

  // The cell's glyph: most stand still; about a quarter change, each at its
  // own rate, at most a little over once a second. One hash gives the cell
  // all of that, its mirroring and its brightness.
  const cellHash = hash(col, row, 5)
  const changes = step(0.74, cellHash)
  const rate = mix(0.25, 1.1, fract(cellHash * 9.31))
  const era = floor(time * rate * changes + fract(cellHash * 17.7) * 64)
  const g = floor(hash(col * 31 + row, era, 8) * COUNT)
  const mirror = step(0.5, fract(cellHash * 29.3))
  const gx = mix(fx, 1 - fx, mirror)

  // Distance to the glyph's nearest stroke, in points.
  const cell = vec2((gx - 0.5) * W, (fy - 0.5) * H)
  const gw = W * 0.68
  const gh = H * 0.76
  let near = 99

  for (const s of range(4)) {
    const r = STROKES.at(g * 4 + s)
    const a = vec2((r.x - 0.5) * gw, (r.y - 0.5) * gh)
    const b = vec2((r.z - 0.5) * gw, (r.w - 0.5) * gh)

    near = min(near, stroke(cell, a, b))
  }

  const half = W * 0.072
  const soft = px * 0.75 + W * 0.012
  const ink = smoothstep(half + soft, half - soft, near)
  const hold = smoothstep(0.5, 0.3, abs(fx - 0.5)) * smoothstep(0.5, 0.33, abs(fy - 0.5))
  const bloom = exp(-near / (W * 0.16)) * hold

  // Each glyph keeps its own brightness, as the grain of a screen would.
  const tone = mix(0.68, 1.0, fract(cellHash * 41.9))
  const level = max(lit * tone, reveal * 0.34)

  return (ink * level + bloom * level * 0.5) * (1 - lead) + (ink * 1.35 + bloom * 1.1) * lead * 2
}

// Far behind the grid: soft out-of-focus streaks in narrower columns,
// falling smoothly and more slowly. No glyphs, so it costs little.
function haze(q: Vec2): number {
  const w = 9
  const top = size.y - q.y
  const col = floor(q.x / w)
  const fx = q.x / w - col - 0.5
  const column = hash(col, 3, 2)
  const period = size.y / w + mix(10, 60, fract(column * 7.31))
  const head = mod(time * mix(2.5, 6, column) + fract(column * 13.7) * period, period) - 4
  const span = mix(10, 34, fract(column * 3.17))
  const d = head - top / w
  const trail = smoothstep(-0.8, 0.4, d) * smoothstep(span, 0, d)

  return trail * trail * exp(-fx * fx * 10) * step(0.45, fract(column * 5.71))
}

// Which room the app shows: the darkest of five spots of the still scene,
// which is black glass in dark mode and white in light. Glyphs there are
// never all darker than the white room's air, so the darkest spot is the
// ground. One texel, worked out once a frame.
const room: Buffer = buffer({ size: [1, 1] }, () => {
  let low = 1

  for (const spot of [vec2(0.08, 0.1), vec2(0.92, 0.12), vec2(0.5, 0.55), vec2(0.1, 0.9), vec2(0.9, 0.88)]) {
    low = min(low, dot(scene.sample(spot).rgb, vec3(0.299, 0.587, 0.114)))
  }

  return vec4(smoothstep(0.3, 0.6, low), 0, 0, 1)
})

// How hard the pointer has lit each spot: rises in about a third of a second,
// falls in about a second, so a quick sweep settles instead of flickering.
const glow: Buffer = buffer({ scale: 0.2, float: 16 }, p => {
  let target = 0

  for (const ptr of pointers) {
    const near = smoothstep(170, 0, length(p.point - ptr.at))
    const there = 1 - min(ptr.gone, 1)

    target = max(target, near * there * (1 - 0.5 * ptr.over))
  }

  const was = glow.sample(p.uv).x
  const rate = mix(1.0, 3.0, step(was, target))

  return vec4(mix(was, target, 1 - exp(-dt * rate)), 0, 0, 1)
})

export default shader({
  fps: 30,
  passes: [
    room,
    glow,
    picture(p => {
      // A press: one ripple, out to 540 points in 0.9 seconds, that bends
      // the rain as its crest passes.
      let q = vec2(p.point)
      let ring = 0

      for (const ptr of pointers) {
        const t = clamp(ptr.age / 0.9, 0, 1)
        const rel = vec2(p.point - ptr.at)
        const d = length(rel)
        const reach = 24 + 520 * (1 - (1 - t) * (1 - t))
        const off = (d - reach) / 16
        const crest = exp(-off * off) * (1 - t) * ptr.down

        q = vec2(q + (rel / max(d, 0.001)) * crest * 12)
        ring = max(ring, crest)
      }

      const day = room.at(vec2(0, 0)).x
      const reveal = glow.sample(p.uv).x
      const light = rain(q, reveal) + haze(q) * 0.3
      const hot = smoothstep(0.8, 1.9, light)
      const uv = vec2(p.uv)
      const middle = 1 - 0.38 * smoothstep(0.3, 0.1, abs(uv.x - 0.5))
      const edge = smoothstep(1.3, 0.3, length(vec2((uv - 0.5) * vec2(1, 1.3))))

      // Dark: green light on black glass, white-green where it's hottest,
      // calmer behind the reading column and darker at the corners.
      let c = vec3(DARK + mix(DEEP, GREEN, smoothstep(0, 0.8, light)) * light)
      c = vec3(mix(c, HEAD * light, hot * 0.85) + GREEN * ring * 0.22)
      c = vec3(c * middle * mix(0.5, 1, edge))
      const night = vec3(1 - exp(-c * 1.2))

      // Light: the white room. The air is brightest high in the middle and
      // greys a touch toward the floor and the edges; the rain is printed
      // into it, softer, and thinner behind the reading column.
      const floorShade = 1 - 0.07 * smoothstep(0.6, 0.0, uv.y) - 0.05 * (1 - edge)
      const air = vec3(AIR * floorShade)
      const print = clamp(light * 0.42 * middle, 0, 0.88)
      const tint = vec3(mix(MIST, INK, hot))
      const white = vec3(mix(mix(air, tint, print), INK, ring * 0.12))

      return vec4(vec3(mix(night, white, day)), 1)
    }),
  ],
})
