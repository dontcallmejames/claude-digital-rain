import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { COLORS, PAPER_COLORS, PAPER_PROBLEMS, PAPER_SOUND, PAPER_STYLE, PROBLEMS, SOUND, STYLE, TONES } from './look'
import type { Tone } from './look'
import { PAPER_SCENES, SCENE } from './scene'

const PLUGIN = 'digital-rain'
const SCENE_NAME = 'rain'
const COMMAND = 'digital-rain'

// Which room shows, kept between sessions:
// - dark, light: the green rain, the white room
// - auto: one of those two, as the person's system setting picks
// - paper, night: paper in its tone by day, or night paper
// - paper-auto: paper or night paper, as the system setting picks
type Room = 'dark' | 'light' | 'auto' | 'paper' | 'night' | 'paper-auto'

// What a word after /digital-rain asks for: a room, a tone, or both.
const WORDS: Record<string, { room: Room; tone?: Tone }> = {
  dark: { room: 'dark' },
  green: { room: 'dark' },
  rain: { room: 'dark' },
  light: { room: 'light' },
  white: { room: 'light' },
  'white room': { room: 'light' },
  auto: { room: 'auto' },
  system: { room: 'auto' },
  paper: { room: 'paper', tone: 'warm' },
  epaper: { room: 'paper', tone: 'warm' },
  'e-paper': { room: 'paper', tone: 'warm' },
  ink: { room: 'paper', tone: 'warm' },
  warm: { room: 'paper', tone: 'warm' },
  sepia: { room: 'paper', tone: 'sepia' },
  slate: { room: 'paper', tone: 'slate' },
  cool: { room: 'paper', tone: 'slate' },
  night: { room: 'night' },
  'night paper': { room: 'night' },
  'paper night': { room: 'night' },
  'paper auto': { room: 'paper-auto' },
  'paper-auto': { room: 'paper-auto' },
  'auto paper': { room: 'paper-auto' },
}

const TONE_NAMES: Record<Tone, string> = { warm: 'warm grey', sepia: 'sepia', slate: 'slate' }

function says(room: Room, tone: Tone): string {
  switch (room) {
    case 'dark':
      return 'Green rain on black glass, whatever your system is set to.'
    case 'light':
      return 'The white room, whatever your system is set to.'
    case 'auto':
      return 'Following your system: green rain in dark mode, the white room in light mode.'
    case 'paper':
      return `Paper, ${TONE_NAMES[tone]}, whatever your system is set to.`
    case 'night':
      return `Night paper (${TONE_NAMES[tone]}), whatever your system is set to.`
    case 'paper-auto':
      return `Following your system: ${TONE_NAMES[tone]} paper in light mode, night paper in dark mode.`
  }
}

const USAGE = [
  'Looks: /digital-rain dark (green rain), light (the white room), paper, sepia, slate (paper tones), night (night paper).',
  'To follow your system: /digital-rain auto (green rain or white room) or /digital-rain paper auto (paper or night paper).',
].join('\n')

// Panels over the backdrop are frosted in their own color, which follows the
// palette: smoked black glass over the rain, white over the white room,
// paper over paper.
const BACKDROP: ThemeSetArgs['backdrop'] = { scene: SCENE_NAME, glass: { blur: 10, opacity: 0.74 } }

const paperScene = (tone: Tone) => `paper-${tone}`

const paperBackdrop = (tone: Tone): ThemeSetArgs['backdrop'] => ({ scene: paperScene(tone), glass: { blur: 6, opacity: 0.8 } })

async function kept($: EngineInterface): Promise<{ room: Room; tone: Tone }> {
  const room = await $.store.get('room')
  const tone = await $.store.get('tone')

  return {
    room: room === 'light' || room === 'auto' || room === 'paper' || room === 'night' || room === 'paper-auto' ? room : 'dark',
    tone: tone === 'sepia' || tone === 'slate' ? tone : 'warm',
  }
}

// The whole look first. A build that refuses `sound` or `style` refuses the
// whole set, so fall back step by step to what it does take.
async function setLook($: EngineInterface, room: Room, tone: Tone): Promise<void> {
  const onPaper = room === 'paper' || room === 'night' || room === 'paper-auto'
  const colors = onPaper ? PAPER_COLORS[tone] : COLORS
  const backdrop = onPaper ? paperBackdrop(tone) : BACKDROP
  const style = onPaper ? PAPER_STYLE : STYLE
  const sound = onPaper ? PAPER_SOUND : SOUND
  const scheme: Record<Room, ThemeSetArgs['overrideColorScheme']> = {
    dark: 'dark',
    light: 'light',
    auto: undefined,
    paper: 'light',
    night: 'dark',
    'paper-auto': undefined,
  }
  const mode: Pick<ThemeSetArgs, 'overrideColorScheme'> = scheme[room] === undefined ? {} : { overrideColorScheme: scheme[room] }
  const looks: readonly ThemeSetArgs[] = [
    { colors, backdrop, style, sound, ...mode },
    { colors, backdrop, style, ...mode },
    { colors, backdrop, sound, ...mode },
    { colors, backdrop, ...mode },
  ]

  for (const look of looks) {
    try {
      const set = await $.theme.set(look)

      if (!set.isDrawn) {
        $.ui.status(set.reason)
      }

      return
    } catch (error) {
      $.ui.log(`${PLUGIN}: ${String(error)}`)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = [...PROBLEMS, ...PAPER_PROBLEMS].find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    await $.command.register({
      name: COMMAND,
      description: 'Digital Rain: dark, light, paper, sepia, slate, night, auto or paper auto',
    })

    const now = await kept($)
    await setLook($, now.room, now.tone)

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const words = e.args.trim().toLowerCase().replace(/\s+/g, ' ')
    const asked = WORDS[words]
    const now = await kept($)

    if (asked === undefined) {
      return { text: words === '' ? `${says(now.room, now.tone)}\n${USAGE}` : `"${words}" isn't a look.\n${USAGE}` }
    }

    const tone = asked.tone ?? now.tone

    await $.store.set('room', asked.room)
    await $.store.set('tone', tone)
    await setLook($, asked.room, tone)

    return { text: says(asked.room, tone) }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== PLUGIN) {
      return next(e)
    }

    const tone = TONES.find(one => e.props.scene === paperScene(one))

    if (e.props.scene !== SCENE_NAME && tone === undefined) {
      return next(e)
    }

    const { Shader, Svg } = $.ui.resolve(e)

    return (
      <Shader module="./rain.ts" values={{ paper: tone === undefined ? 0 : 1, tone: tone === undefined ? 0 : TONES.indexOf(tone) }}>
        <Svg
          source={tone === undefined ? SCENE : PAPER_SCENES[tone]}
          alt={
            tone === undefined
              ? 'Columns of glyphs raining down the screen, each led by a bright glyph and fading behind it'
              : 'Columns of ink glyphs falling down an e-ink page, each led by a muted green glyph'
          }
        />
      </Shader>
    )
  })
}
