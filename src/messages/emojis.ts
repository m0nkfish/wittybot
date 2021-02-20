import { Values } from "../util"

export type Emoji = Values<typeof Emojis>
export const Emojis = {
  day: '☀️',
  night: '🌙',
  sunrise: '🌅',
  sunset: '🌇',
  fullMoon: '🌕',
  villager: '🙂',
  detective: '🕵️',
  shield: '🛡️',
  kiss: '💋',
  dagger: '🗡️',
  wolf: '🐺',
  tada: '🎉',
  rofl: '🤣',
  dragon: '🐉',
  tick: '✅',
  skull: '💀',
  relieved: '😌',
  homes: '🏘️',
  cool: '🆒',

  bell: '🔔',
  noBell: '🔕',
  pointLeft: '👈',

  zero: '0️⃣',
  one: '1️⃣',
  two: '2️⃣',
  three: '3️⃣',
  four: '4️⃣',
  five: '5️⃣',
  six: '6️⃣',
  seven: '7️⃣',
  eight: '8️⃣',
  nine: '9️⃣',
  ten: '🔟',
  square: '⏹',
  circle: '⏺',
}

export const CommandReacts = [
  Emojis.zero,
  Emojis.one,
  Emojis.two,
  Emojis.three,
  Emojis.four,
  Emojis.five,
  Emojis.six,
  Emojis.seven,
  Emojis.eight,
  Emojis.nine,
  Emojis.ten,
  Emojis.square,
  Emojis.circle
]