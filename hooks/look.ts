import type { ThemeColors, ThemeMessageRule, ThemeSound, ThemeStyle, ThemeToolRule } from 'claude-code'

import { makeColors } from './make-colors.js'

// Digital Rain. Dark: a phosphor-green operator's console, green light on
// black glass. Light: the white room, a bright empty space where the same
// rain falls softly in grey-green, its leading glyphs a deep green.
const made = makeColors({
  label: 'Digital Rain',
  // Green for the accent; a red and a blue for danger and the special
  // "pro" color; a teal for strings so code doesn't read as one green.
  roles: { accent: '#22e05a', danger: '#ff3b3b', success: '#2fd3b0', warning: '#e8c000', pro: '#3a7bff' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e9eeea',
        'surface-1': '#f1f5f2',
        'surface-2': '#f8faf8',
        'text-primary': '#0b1a10',
        'text-secondary': '#2c4634',
        'text-muted': '#4c6555',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#020604',
        'surface-1': '#06100a',
        'surface-2': '#09160e',
        'surface-3': '#0c1c12',
        'text-primary': '#d2f7da',
        'text-secondary': '#9fdcb0',
        'text-muted': '#71b886',
      },
    },
    git: { added: '#2fe06a', removed: '#ff4f4f', modified: '#e8c000' },
  },
})

export const COLORS: ThemeColors = {
  ...made.theme,
  inputs: {
    light: {
      ...made.theme.inputs.light,
      'bg-user-message': '#e3f3e8',
      'text-user-message': '#0b2a15',
      'bg-assistant-message': '#fdfefd',
      'text-assistant-message': '#0b1a10',
    },
    dark: {
      ...made.theme.inputs.dark,
      'bg-user-message': '#062010',
      'text-user-message': '#b4ffc8',
      'bg-assistant-message': '#030a05',
      'text-assistant-message': '#cdf5d6',
    },
  },
}

export const PROBLEMS = made.problems

// Claude's replies are terminal output: black glass (white in the white
// room), a faint rule around it and bright corner brackets, like a readout.
// Named colors, so each follows the mode.
const READOUT: ThemeMessageRule = {
  color: 'text-assistant-message',
  backgroundColor: 'bg-assistant-message',
  fill: {
    vector: {
      viewBox: 48,
      slice: 14,
      paths: [
        { d: 'M0 0H48V48H0Z', color: 'bg-assistant-message' },
        { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: 'border', strokeWidth: 1 },
        { d: 'M1 13V1H13', color: 'text-accent', strokeWidth: 1.5 },
        { d: 'M47 35V47H35', color: 'text-accent', strokeWidth: 1.5 },
        { d: 'M35 1H47V5', color: 'border-accent', strokeWidth: 1 },
        { d: 'M1 43V47H13', color: 'border-accent', strokeWidth: 1 },
      ],
    },
  },
  shadow: { x: 0, y: 0, blur: 18, color: '#00ff5522' },
  paddingY: 14,
  paddingX: 18,
}

// The person's messages are operator input: a green-lit line with a prompt
// caret drawn in the margin before the words.
const INPUT: ThemeMessageRule = {
  color: 'text-user-message',
  backgroundColor: 'bg-user-message',
  fill: {
    vector: {
      viewBox: 48,
      slice: [24, 12, 12, 26],
      paths: [
        { d: 'M0 0H48V48H0Z', color: 'bg-user-message' },
        { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: 'border-accent', strokeWidth: 1 },
        { d: 'M9 11L14 15.5L9 20', color: 'text-accent', strokeWidth: 1.8 },
      ],
    },
  },
  shadow: { x: 0, y: 0, blur: 14, color: '#00ff5530' },
  paddingY: 11,
  paddingLeft: 26,
  paddingRight: 16,
}

const TOOL: ThemeToolRule = {
  color: 'text-secondary',
  fontFamily: ['code'],
  backgroundColor: 'surface-1',
  borderColor: 'border-strong',
  borderWidth: 1,
  radius: 0,
  paddingX: 10,
  paddingY: 4,
}

export const STYLE: ThemeStyle = {
  Text: { fontFamily: ['mono'], fontSize: 14, lineHeight: 22 },
  Heading: { fontFamily: ['mono'], fontWeight: 'bold', letterSpacing: 1.5, color: 'text-accent' },
  UserMessage: INPUT,
  AssistantMessage: READOUT,
  ToolUse: TOOL,
}

// A machine room heard through a wall: a low filtered hum, a faint high
// whine, a sparse patter of data ticks and the odd far-off blip.
export const SOUND: ThemeSound = {
  ambience: {
    layers: [
      {
        wave: 'saw',
        notes: ['A1', 'E2'],
        drone: true,
        gain: 0.06,
        filter: { type: 'lowpass', hz: 200, to: 420 },
        tremolo: { hz: 0.07, depth: 0.25 },
      },
      { wave: 'sine', notes: ['E6'], drone: true, gain: 0.008, tremolo: { hz: 0.2, depth: 0.5 } },
      { wave: 'crackle', scatter: 2, gain: 0.03, filter: { type: 'highpass', hz: 4000 }, attack: 0.003, release: 0.03 },
      {
        wave: 'square',
        notes: ['A5', 'C6', 'E6', 'G5'],
        scatter: 0.15,
        gain: 0.025,
        filter: { type: 'lowpass', hz: 2500 },
        attack: 0.003,
        release: 0.06,
      },
    ],
    reverb: 0.4,
  },
  cues: {
    // A short chirp down, as a line is sent.
    send: {
      layers: [
        { wave: 'square', notes: ['E6'], filter: { type: 'lowpass', hz: 3000 }, attack: 0.003, release: 0.05, gain: 0.12 },
        { wave: 'sine', notes: ['A6'], glide: -12, attack: 0.003, release: 0.08, gain: 0.1 },
      ],
    },
    tool: { layers: [{ wave: 'white', filter: { type: 'highpass', hz: 5000 }, attack: 0.003, release: 0.02, gain: 0.06 }] },
    // Data rushing down into a smaller space.
    compact: { layers: [{ wave: 'pink', filter: { type: 'bandpass', hz: 2400, to: 200 }, attack: 0.05, release: 0.7, gain: 0.15 }] },
    // A quick minor arpeggio: the readout is complete.
    done: {
      layers: [
        { wave: 'square', notes: ['A4', 'C5', 'E5', 'A5'], step: 0.05, filter: { type: 'lowpass', hz: 2400 }, release: 0.18, gain: 0.12 },
      ],
      reverb: 0.35,
    },
    ask: { layers: [{ wave: 'square', notes: ['E5', 'E5'], step: 0.12, filter: { type: 'lowpass', hz: 2600 }, release: 0.07, gain: 0.14 }] },
    error: { layers: [{ wave: 'saw', notes: ['A2', 'G#2'], step: 0.15, filter: { type: 'lowpass', hz: 600 }, release: 0.35, gain: 0.2 }] },
    click: {
      layers: [
        { wave: 'sine', notes: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'], glide: -5, filter: { type: 'lowpass', hz: 3000 }, attack: 0.003, release: 0.09, gain: 0.16 },
      ],
    },
  },
}

// Paper: the rain printed on e-ink. A warm grey page, charcoal ink, the
// leading glyphs in the muted green a color e-ink screen gives, and nothing
// that glows. It is a look of its own, always light, with its own palette.
const paper = makeColors({
  label: 'Digital Rain Paper',
  only: 'light',
  roles: { accent: '#3f7a55', danger: '#a8453b', success: '#3d7f74', warning: '#9a7420', pro: '#4d5f9a' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e4e0d6',
        'surface-1': '#ebe8df',
        'surface-2': '#f3f1ea',
        'text-primary': '#1f2622',
        'text-secondary': '#434b45',
        'text-muted': '#5c645e',
      },
    },
  },
})

export const PAPER_COLORS: ThemeColors = {
  ...paper.theme,
  inputs: {
    light: {
      ...paper.theme.inputs.light,
      'bg-user-message': '#e2e7df',
      'text-user-message': '#1b2a20',
      'bg-assistant-message': '#f5f2eb',
      'text-assistant-message': '#1f2622',
    },
  },
}

export const PAPER_PROBLEMS = paper.problems

// Claude's replies are pages: a paper card with a hairline rule, a whisper of
// shadow and the console's corner brackets in ink, set in a bookish serif.
const PAGE: ThemeMessageRule = {
  color: 'text-assistant-message',
  backgroundColor: 'bg-assistant-message',
  fill: {
    vector: {
      viewBox: 48,
      slice: 14,
      paths: [
        { d: 'M0 0H48V48H0Z', color: 'bg-assistant-message' },
        { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: 'border', strokeWidth: 1 },
        { d: 'M1 11V1H11', color: 'text-accent', strokeWidth: 1.2 },
        { d: 'M47 37V47H37', color: 'text-accent', strokeWidth: 1.2 },
      ],
    },
  },
  shadow: { x: 0, y: 1, blur: 3, color: '#2a221418' },
  paddingY: 16,
  paddingX: 20,
}

// The person's messages stay operator input, in monospace with the caret,
// on a faintly green-grey slip of paper.
const SLIP: ThemeMessageRule = {
  ...INPUT,
  fontFamily: ['mono'],
  fontSize: 14,
  lineHeight: 22,
  shadow: { x: 0, y: 1, blur: 2, color: '#2a221414' },
}

export const PAPER_STYLE: ThemeStyle = {
  Text: { fontFamily: ['serif'], fontSize: 16, lineHeight: 25 },
  Heading: { fontFamily: ['mono'], fontWeight: 'bold', letterSpacing: 1.2, color: 'text-accent' },
  UserMessage: SLIP,
  AssistantMessage: PAGE,
  ToolUse: { ...TOOL, radius: 2 },
}

// Softer than the console: a hush of room tone, the odd soft tick, and cues
// played on rounded tones instead of square ones.
export const PAPER_SOUND: ThemeSound = {
  ambience: {
    layers: [
      { wave: 'pink', drone: true, gain: 0.02, filter: { type: 'lowpass', hz: 900 } },
      { wave: 'crackle', scatter: 0.6, gain: 0.02, filter: { type: 'bandpass', hz: 2500 }, attack: 0.003, release: 0.03 },
      { wave: 'sine', notes: ['A4', 'C5', 'E5', 'G5'], scatter: 0.05, gain: 0.03, attack: 0.02, release: 0.8 },
    ],
    reverb: 0.3,
  },
  cues: {
    send: { layers: [{ wave: 'sine', notes: ['E5'], glide: -2, attack: 0.004, release: 0.08, gain: 0.12 }] },
    tool: { layers: [{ wave: 'pink', filter: { type: 'bandpass', hz: 3000 }, attack: 0.003, release: 0.02, gain: 0.05 }] },
    compact: { layers: [{ wave: 'pink', filter: { type: 'lowpass', hz: 1800, to: 400 }, attack: 0.08, release: 0.6, gain: 0.12 }] },
    done: { layers: [{ wave: 'triangle', notes: ['A4', 'C5', 'E5'], step: 0.07, release: 0.35, gain: 0.12 }], reverb: 0.3 },
    ask: { layers: [{ wave: 'triangle', notes: ['E5', 'A5'], step: 0.12, release: 0.15, gain: 0.12 }] },
    error: { layers: [{ wave: 'triangle', notes: ['A3', 'G#3'], step: 0.15, filter: { type: 'lowpass', hz: 900 }, release: 0.3, gain: 0.15 }] },
    click: { layers: [{ wave: 'sine', notes: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'], attack: 0.004, release: 0.1, gain: 0.12 }] },
  },
}
