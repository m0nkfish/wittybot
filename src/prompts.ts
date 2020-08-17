import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { pick, integer } from 'random-js';
import { mt } from './random';
import * as db from './db'

function resourcePath(...name: string[]) {
  return path.resolve(process.cwd(), 'resources', ...name)
}

function resourceLines(...name: string[]) {
  return lines(resourcePath(...name))
}

function lines(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/_____/g, '\\_\\_\\_\\_\\_')
    .split('\n')
    .filter(s => s !== '')
}

const allPrompts =
  readdirSync(resourcePath('prompts'))
    .map(f => ({
      type: path.basename(f, '.txt'),
      prompts: resourceLines('prompts', f)
    }))

export const promptsCount = allPrompts.reduce((acc, p) => acc + p.prompts.length, 0)

const globalReplace = new Map(
  readdirSync(resourcePath('replace'))
    .map(f => [path.basename(f, '.txt'), resourceLines('replace', f)]))

const format: Record<string, (line: string) => string> = {
  misc: line => `:arrow_forward: ${line}`,
  quote: line => `:speech_balloon: “${line}”`,
  proverb: line => `:older_man: As the proverb goes, “${line}”`,
  lyric: line => `:notes: ${line} :notes:`,
  headline: line => `:newspaper2: Breaking News: ${line}`
}

export class Prompt {
  constructor(readonly type: string, readonly baseText: string, readonly prompt: string) { }

  get formatted() {
    const formatter = format[this.type] ?? (x => x)
    return formatter(this.prompt)
  }
}

export async function choosePrompt(users: string[]) {
  const prompts = await db.allPrompts()

  const prompt = pick(mt, prompts)
  const baseText = prompt.text as string
  const type = prompt.type as string
  if (!baseText) {
    throw new Error(`No text property found on ${JSON.stringify(prompt)}`)
  }
  
  const replacements = new Map(globalReplace)
    .set('user', users)

  const regex = new RegExp(`{(${Array.from(replacements.keys()).join('|')})}`, "g")
  const replaced = baseText
    .replace(/\r/g, '') // some of the resources originated in windows...
    .replace(/\\n/g, '\n') // allow multiline prompts
    .replace(/{choose:(.+)}/g, (_, options) => pick(mt, options.split('|')))
    .replace(regex, str => {
      const type = str.substring(1, str.length - 1)
      const choices = replacements.get(type)
      if (!choices) { // this should never happen given the regex construction!
        return str
      }
      const choice = pick(mt, choices)
      if (choices.length > 1) { // don't use the same choice twice in the same prompt if we can help it
        replacements.set(type, choices.filter(x => x != choice))
      }
      return choice
    })

    return new Prompt(type, baseText, replaced)
}