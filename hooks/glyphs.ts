// The rain's own alphabet: 24 glyphs drawn for this theme, each one to four
// straight strokes in a unit box (x right, y down). They borrow the feel of
// angular katakana-like strokes and terminal numerals without copying any
// typeface. The rain also shows each glyph mirrored about half the time.
//
// The shader (rain.ts) can't import, so it holds the same strokes as a literal
// table, four rows a glyph as strokeTable() lays them out. Change both together.

export type Stroke = readonly [x1: number, y1: number, x2: number, y2: number]
export type Glyph = readonly Stroke[]

export const GLYPHS: readonly Glyph[] = [
  // three bars on a spine
  [[0.2, 0.12, 0.8, 0.12], [0.25, 0.5, 0.8, 0.5], [0.2, 0.88, 0.8, 0.88], [0.8, 0.12, 0.8, 0.88]],
  // two legs
  [[0.4, 0.18, 0.14, 0.82], [0.6, 0.18, 0.88, 0.82]],
  // two rails
  [[0.26, 0.26, 0.74, 0.26], [0.12, 0.78, 0.88, 0.78]],
  // twin crossbars on a slanted post
  [[0.15, 0.32, 0.85, 0.27], [0.12, 0.63, 0.88, 0.58], [0.44, 0.08, 0.58, 0.94]],
  // two ticks and a sweep
  [[0.14, 0.24, 0.26, 0.46], [0.42, 0.2, 0.5, 0.4], [0.86, 0.2, 0.36, 0.92]],
  // seven
  [[0.15, 0.12, 0.85, 0.12], [0.85, 0.12, 0.4, 0.9]],
  // zed
  [[0.15, 0.12, 0.85, 0.12], [0.85, 0.12, 0.15, 0.88], [0.15, 0.88, 0.85, 0.88]],
  // open frame
  [[0.2, 0.1, 0.2, 0.9], [0.8, 0.1, 0.8, 0.9], [0.2, 0.1, 0.8, 0.1], [0.2, 0.9, 0.8, 0.9]],
  // bracket
  [[0.18, 0.15, 0.82, 0.15], [0.82, 0.15, 0.82, 0.85], [0.18, 0.85, 0.82, 0.85]],
  // cross with a lean
  [[0.1, 0.36, 0.9, 0.36], [0.6, 0.08, 0.42, 0.92]],
  // crossed slash
  [[0.76, 0.1, 0.2, 0.92], [0.3, 0.4, 0.86, 0.86]],
  // one
  [[0.55, 0.08, 0.55, 0.92], [0.55, 0.08, 0.3, 0.3], [0.32, 0.92, 0.78, 0.92]],
  // short post and a hook
  [[0.3, 0.15, 0.3, 0.6], [0.72, 0.1, 0.68, 0.6], [0.68, 0.6, 0.4, 0.92]],
  // two dashes and a rise
  [[0.15, 0.15, 0.35, 0.28], [0.12, 0.45, 0.32, 0.58], [0.2, 0.9, 0.88, 0.34]],
  // folded arm
  [[0.46, 0.08, 0.15, 0.45], [0.4, 0.22, 0.85, 0.22], [0.85, 0.22, 0.35, 0.92]],
  // girder
  [[0.2, 0.15, 0.8, 0.15], [0.5, 0.15, 0.5, 0.85], [0.12, 0.85, 0.88, 0.85]],
  // flag
  [[0.12, 0.38, 0.88, 0.28], [0.88, 0.28, 0.7, 0.55], [0.3, 0.08, 0.55, 0.92]],
  // nine
  [[0.2, 0.12, 0.8, 0.12], [0.2, 0.12, 0.2, 0.5], [0.2, 0.5, 0.8, 0.5], [0.8, 0.12, 0.8, 0.9]],
  // chair
  [[0.25, 0.1, 0.25, 0.88], [0.25, 0.46, 0.8, 0.32], [0.25, 0.88, 0.85, 0.88]],
  // tree
  [[0.12, 0.3, 0.88, 0.3], [0.5, 0.08, 0.5, 0.92], [0.3, 0.55, 0.12, 0.82], [0.7, 0.55, 0.88, 0.82]],
  // ladder step
  [[0.2, 0.15, 0.8, 0.15], [0.1, 0.48, 0.9, 0.48], [0.4, 0.15, 0.4, 0.85], [0.4, 0.85, 0.88, 0.85]],
  // lid and slide
  [[0.25, 0.12, 0.75, 0.12], [0.15, 0.38, 0.85, 0.38], [0.85, 0.38, 0.4, 0.92]],
  // dagger
  [[0.5, 0.1, 0.5, 0.9], [0.2, 0.35, 0.8, 0.35], [0.3, 0.7, 0.7, 0.7]],
  // divide
  [[0.5, 0.22, 0.5, 0.3], [0.16, 0.5, 0.84, 0.5], [0.5, 0.7, 0.5, 0.78]],
]

// Four strokes a glyph in the shader's table; a glyph with fewer is padded
// with a point far outside the cell, which draws nothing.
export const PAD: Stroke = [-9, -9, -9, -9]

export function strokeTable(): Stroke[] {
  return GLYPHS.flatMap(glyph => [0, 1, 2, 3].map(i => glyph[i] ?? PAD))
}
