import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { pick, integer } from 'random-js';
import { mt } from './random';

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
    .map(s => s.replace(/\r/g, '')) // some of the resources originated in windows...
    .map(s => s.replace(/\\n/g, '\n')) // allow multiline prompts
    .filter(s => s !== '')
}

function loadPrompts(file: string, format: (base: string) => string) {
  return {
    prompts: resourceLines('prompts', file),
    format
  }
}

const misc = loadPrompts('Misc.txt', line => `:arrow_forward: ${line}`)
const quotes = loadPrompts('Quotes.txt', line => `:speech_balloon: “${line}”`)
const proverbs = loadPrompts('Proverbs.txt', line => `:older_man: As the proverb goes, “${line}”`)
const lyrics = loadPrompts('Lyrics.txt', line => `:notes: ${line} :notes:`)
const headlines = loadPrompts('Headlines.txt', line => `:newspaper2: Breaking News: ${line}`)

const allPrompts = [
  misc,
  quotes,
  proverbs,
  lyrics,
  headlines
]

export const promptsCount = allPrompts.reduce((acc, p) => acc + p.prompts.length, 0)

const globalReplace = new Map(
  readdirSync(resourcePath('replace'))
    .map(f => [path.basename(f, '.txt'), resourceLines('replace', f)]))

function pickWeighted<T>(list: Array<[T, number]>): T {
  const total = list.map(x => x[1]).reduce((a, b) => a + b, 0)
  let n = integer(1, total)(mt)
  for (const [x,w] of list) {
    if (n <= w) {
      return x
    } else {
      n -= w
    }
  }
  throw new Error('Weighted random went wrong!')
}

export function choosePrompt(users: string[]) {
  const {prompts, format} = pickWeighted(allPrompts.map(item => [item, item.prompts.length]))

  const prompt = pick(mt, prompts)
  
  const replacements = new Map(globalReplace)
    .set('user', users)

  const regex = new RegExp(`{(${Array.from(replacements.keys()).join('|')})}`, "g")
  const replaced = prompt
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

    return format(replaced)
}
