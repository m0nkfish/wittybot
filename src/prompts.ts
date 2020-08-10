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

const all = [
  ...resource('MiscPrompts.txt'),
  ...resource('Proverbs.txt'),
  ...resource('Lyrics.txt')
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
      .replace(regex, str => {
        const type = str.substring(1, str.length - 1) as keyof typeof replace
        return pick(mt, replace[type])
      })
      .replace(/{choose:(.+)}/g, (_, options) => pick(mt, options.split('|')))
  }
  
  return template(pick(mt, all))
}