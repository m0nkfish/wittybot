import { readFileSync } from 'fs'
import path from 'path'
import { pick } from 'random-js';
import { mt } from './random';

function resource(name: string) {
  return readFileSync(path.resolve(process.cwd(), 'resources', name), 'utf8')
    .replace(/_____/g, '\\_\\_\\_\\_\\_')
    .split('\n')
    .map(s => s.replace(/\n|\r/g, '')) // some of the resources originated in windows...
    .filter(s => s !== '')
}

const misc = resource('MiscPrompts.txt').map(line => `:arrow_forward: ${line}`)
const quotes = resource('Quotes.txt').map(line => `:speech_balloon: “${line}”`)
const proverbs = resource('Proverbs.txt').map(line => `:older_man: As the proverb goes, “${line}”`)
const lyrics = resource('Lyrics.txt').map(line => `:notes: ${line} :notes:`)

export const prompts = [
  ...misc,
  ...quotes,
  ...proverbs,
  ...lyrics
]

const globalReplace = {
  celeb: resource('People.txt'),
  language: resource('Languages.txt'),
  country: resource('Countries.txt'),
  nationality: resource('Nationalities.txt')
}

export function choosePrompt(users: string[]) {
  function template(str: string) {
    const replace = {
      ...globalReplace,
      user: users
    }

    const regex = new RegExp(`{(${Object.keys(replace).join('|')})}`, "g")
    return str
      .replace(/{choose:(.+)}/g, (_, options) => pick(mt, options.split('|')))
      .replace(regex, str => {
        const type = str.substring(1, str.length - 1) as keyof typeof replace
        const choices = replace[type]
        const choice = pick(mt, choices)
        const remaining = choices.length > 1 ? choices.filter(x => x != choice) : choices
        replace[type] = remaining
        return choice
      })
  }
  
  return template(pick(mt, prompts))
}