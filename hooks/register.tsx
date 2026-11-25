import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { COLORS, PROBLEMS, SOUND, STYLE } from './look'
import { SCENE } from './scene'

const PLUGIN = 'digital-rain'
const SCENE_NAME = 'rain'
const COMMAND = 'digital-rain'

// Which room shows: the green rain, the white room, or whichever the
// person's own system setting picks. Kept between sessions.
type Room = 'dark' | 'light' | 'auto'

const ROOMS: Record<string, Room> = {
  dark: 'dark',
  green: 'dark',
  rain: 'dark',
  light: 'light',
  white: 'light',
  room: 'light',
  auto: 'auto',
  system: 'auto',
}

const SAYS: Record<Room, string> = {
  dark: 'Green rain on black glass, whatever your system is set to.',
  light: 'The white room, whatever your system is set to.',
  auto: 'Following your system: green rain in dark mode, the white room in light mode.',
}

// Panels over the rain are frosted in their own color, which follows the
// mode: smoked black glass over the rain, white over the white room.
const BACKDROP: ThemeSetArgs['backdrop'] = { scene: SCENE_NAME, glass: { blur: 10, opacity: 0.74 } }

async function roomNow($: EngineInterface): Promise<Room> {
  const kept = await $.store.get('room')

  return kept === 'light' || kept === 'auto' ? kept : 'dark'
}

// The whole look first. A build that refuses `sound` or `style` refuses the
// whole set, so fall back step by step to what it does take.
async function setLook($: EngineInterface, room: Room): Promise<void> {
  const mode: Pick<ThemeSetArgs, 'overrideColorScheme'> = room === 'auto' ? {} : { overrideColorScheme: room }
  const looks: readonly ThemeSetArgs[] = [
    { colors: COLORS, backdrop: BACKDROP, style: STYLE, sound: SOUND, ...mode },
    { colors: COLORS, backdrop: BACKDROP, style: STYLE, ...mode },
    { colors: COLORS, backdrop: BACKDROP, sound: SOUND, ...mode },
    { colors: COLORS, backdrop: BACKDROP, ...mode },
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
    const unpainted = PROBLEMS.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    await $.command.register({
      name: COMMAND,
      description: 'Digital Rain: dark (green rain), light (the white room) or auto (follow your system)',
    })
    await setLook($, await roomNow($))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    const room = ROOMS[word]

    if (room === undefined) {
      const now = await roomNow($)
      const usage = 'Use /digital-rain dark, /digital-rain light or /digital-rain auto.'

      return { text: word === '' ? `${SAYS[now]}\n${usage}` : `"${word}" isn't a room. ${usage}` }
    }

    await $.store.set('room', room)
    await setLook($, room)

    return { text: SAYS[room] }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== PLUGIN || e.props.scene !== SCENE_NAME) {
      return next(e)
    }

    const { Shader, Svg } = $.ui.resolve(e)

    return (
      <Shader module="./rain.ts">
        <Svg
          source={SCENE}
          alt="Columns of glyphs raining down the screen, each led by a bright glyph and fading behind it"
        />
      </Shader>
    )
  })
}
