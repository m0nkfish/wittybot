import { pick } from 'random-js';
import { mt } from './random';
import * as db from './db'

const format: Record<string, (line: string) => string> = {
  misc: line => `:arrow_forward: ${line}`,
  quote: line => `:speech_balloon: “${line}”`,
  proverb: line => `:older_man: As the proverb goes, “${line}”`,
  lyric: line => `:notes: ${line} :notes:`,
  headline: line => `:newspaper2: Breaking News: ${line}`
}

export class Prompt {
  constructor(readonly id: number, readonly type: string, readonly prompt: string) { }

  get formatted() {
    const formatter = format[this.type] ?? (x => x)
    return formatter(this.prompt)
  }
}

const cachedPrompts = db.allPrompts()
const cachedReplacements = db.allReplacements()
  .then(rs => {
    const map = new Map<string, string[]>()
    rs.forEach(({type, replacement}) => {
      const list = map.get(type) ?? []
      map.set(type, [...list, replacement])
    })
    return map
  })

export async function choosePrompt(users: string[]) {
  const prompts = await cachedPrompts

  const {id, text, type} = pick(mt, prompts)

  const globalReplace = await cachedReplacements
  const replacements = new Map(globalReplace)
    .set('user', users)

  const regex = new RegExp(`{(${Array.from(replacements.keys()).join('|')})}`, "g")
  const replaced = text
    .replace(/_____/g, '\\_\\_\\_\\_\\_')
    .replace(/\r/g, '') // some of the resources originated in windows...
    .replace(/\\n/g, '\n') // allow multiline prompts
    .replace(/{choose:(.+)}/g, (_, options) => pick(mt, options.split('|')))
    .replace(regex, str => {
      const type = str.substring(1, str.length - 1)
      const choices = replacements.get(type)
      if (!choices) {
        return str
      }
      const choice = pick(mt, choices)
      if (choices.length > 1) { // don't use the same choice twice in the same prompt if we can help it
        replacements.set(type, choices.filter(x => x != choice))
      }
      return choice
    })

    return new Prompt(id, type, replaced)
}
