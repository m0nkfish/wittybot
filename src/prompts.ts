import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { pick } from 'random-js';
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
    .map(s => s.replace(/\n|\r/g, '')) // some of the resources originated in windows...
    .filter(s => s !== '')

}

const misc = resourceLines('MiscPrompts.txt').map(line => `:arrow_forward: ${line}`)
const quotes = resourceLines('Quotes.txt').map(line => `:speech_balloon: “${line}”`)
const proverbs = resourceLines('Proverbs.txt').map(line => `:older_man: As the proverb goes, “${line}”`)
const lyrics = resourceLines('Lyrics.txt').map(line => `:notes: ${line} :notes:`)
const headlines = resourceLines('Headlines.txt').map(line => `:newspaper2: Breaking News: ${line}`)

export const prompts = [
  ...misc,
  ...quotes,
  ...proverbs,
  ...lyrics,
  ...headlines
]

const globalReplace = new Map(
  readdirSync(resourcePath('replace'))
    .map(f => [path.basename(f, '.txt'), lines(f)]))

export function choosePrompt(users: string[]) {
  const prompt = pick(mt, prompts)
  
  const replacements = new Map(globalReplace)
    .set('user', users)

  const regex = new RegExp(`{(${Array.from(replacements.keys()).join('|')})}`, "g")
  return prompt
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
}